import base64
import os
from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from openai import OpenAI
from pydantic import BaseModel, Field
from supabase import Client, create_client

load_dotenv()


def required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


def allowed_origins() -> list[str]:
    raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
    return [origin.strip().rstrip("/") for origin in raw_origins.split(",") if origin.strip()]


app = FastAPI(title="Shayari Image Generator", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

security = HTTPBearer(auto_error=False)


class PromptRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=4000)


class GenerateImageRequest(PromptRequest):
    shayari_id: UUID


class GenerateImageResponse(BaseModel):
    public_url: str
    storage_path: str
    model: str
    quality: str
    image_format: str
    compression: int
    settings_source: str


def get_supabase_clients() -> tuple[Client, Client]:
    url = required_env("SUPABASE_URL")
    auth_client = create_client(url, required_env("SUPABASE_ANON_KEY"))
    service_client = create_client(url, required_env("SUPABASE_SERVICE_ROLE_KEY"))
    return auth_client, service_client


def require_valid_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid Supabase bearer token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Match the working Node /api/auth/session flow: validate the
        # user's access token through the server-only service client.
        _, service_client = get_supabase_clients()
        response = service_client.auth.get_user(credentials.credentials)
        if response.user is None:
            raise ValueError("User not found")
        return str(response.user.id)
    except Exception as exc:
        print(f"[Image API] Token validation failed: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def ensure_bucket(client: Client, bucket_name: str) -> None:
    try:
        client.storage.get_bucket(bucket_name)
    except Exception:
        try:
            client.storage.create_bucket(
                bucket_name,
                options={
                    "public": True,
                    "file_size_limit": 5 * 1024 * 1024,
                    "allowed_mime_types": ["image/png", "image/jpeg", "image/webp"],
                },
            )
        except Exception as exc:
            # A concurrent request may have created it after the first check.
            try:
                client.storage.get_bucket(bucket_name)
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Could not access Supabase Storage bucket '{bucket_name}'",
                ) from exc


def load_image_settings(client: Client) -> tuple[dict[str, str | int], str]:
    fallback: dict[str, str | int] = {
        "model": os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-2").strip() or "gpt-image-2",
        "quality": os.getenv("OPENAI_IMAGE_QUALITY", "high").strip().lower() or "high",
        "compression": int(os.getenv("OPENAI_IMAGE_COMPRESSION", "90")),
    }

    try:
        response = (
            client.table("ai_image_settings")
            .select("model,quality,compression")
            .eq("id", "default")
            .limit(1)
            .execute()
        )
        if response.data:
            return response.data[0], "database"
    except Exception as exc:
        print(
            "[Image API] AI settings table unavailable; using environment fallback: "
            f"{type(exc).__name__}: {exc}"
        )

    return fallback, "environment"


@app.get("/")
def home():
    return {"message": "Shayari image generator is running"}


@app.post("/generate-image", response_model=GenerateImageResponse)
def generate_image(request: GenerateImageRequest, user_id: Annotated[str, Depends(require_valid_user)]):
    prompt = request.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=422, detail="Prompt cannot be empty")

    stage = "initialization"
    try:
        stage = "Supabase shayari lookup"
        _, supabase = get_supabase_clients()
        shayari_id = str(request.shayari_id)

        existing = (
            supabase.table("shayari")
            .select("id")
            .eq("id", shayari_id)
            .limit(1)
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Shayari record not found")

        stage = "AI image settings lookup"
        settings, settings_source = load_image_settings(supabase)
        model = str(settings.get("model", "")).strip()
        if model not in {
            "gpt-image-2",
            "gpt-image-1.5",
            "gpt-image-1-mini",
        }:
            raise RuntimeError("AI image model setting is unsupported")
        output_format = "webp"
        output_compression = int(settings.get("compression", 90))
        if not 0 <= output_compression <= 100:
            raise RuntimeError("AI image compression setting must be between 0 and 100")
        image_quality = str(settings.get("quality", "")).strip().lower()
        if image_quality not in {"low", "medium", "high"}:
            raise RuntimeError("AI image quality setting must be low, medium, or high")

        stage = "OpenAI image generation"
        image_client = OpenAI(api_key=required_env("OPENAI_API_KEY"))
        generation_options = {
            "model": model,
            "prompt": prompt,
            "n": 1,
            "size": "1536x1024",
            "quality": image_quality,
            "output_format": output_format,
            "user": user_id,
        }
        generation_options["output_compression"] = output_compression
        generated = image_client.images.generate(
            **generation_options,
        )

        encoded_image = generated.data[0].b64_json if generated.data else None
        if not encoded_image:
            raise RuntimeError("OpenAI returned no image data")
        image_bytes = base64.b64decode(encoded_image, validate=True)
        if len(image_bytes) > 5 * 1024 * 1024:
            raise RuntimeError("Generated image exceeds the 5 MB storage limit")

        extension = "jpg" if output_format == "jpeg" else output_format
        content_type = "image/jpeg" if output_format == "jpeg" else f"image/{output_format}"
        bucket_name = os.getenv("AI_IMAGE_BUCKET", "media").strip() or "media"
        stage = "Supabase Storage bucket check"
        ensure_bucket(supabase, bucket_name)
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        storage_path = f"shayari/{shayari_id}/generated-{timestamp}.{extension}"
        stage = "Supabase Storage upload"
        supabase.storage.from_(bucket_name).upload(
            path=storage_path,
            file=image_bytes,
            file_options={"content-type": content_type, "upsert": "false"},
        )
        public_url = supabase.storage.from_(bucket_name).get_public_url(storage_path)


        try:
            stage = "shayari featured-image database update"
            updated = (
                supabase.table("shayari")
                .update({"featured_image_url": public_url})
                .eq("id", shayari_id)
                .execute()
            )
            if not updated.data:
                raise RuntimeError("Shayari image URL was not updated")
        except Exception:
            try:
                supabase.storage.from_(bucket_name).remove([storage_path])
            except Exception:
                pass
            raise

        return GenerateImageResponse(
            public_url=public_url,
            storage_path=storage_path,
            model=model,
            quality=image_quality,
            image_format=output_format,
            compression=output_compression,
            settings_source=settings_source,
        )
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[Image API] {stage} failed: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502,
            detail=f"Image generation failed during {stage}: {exc}",
        ) from exc
