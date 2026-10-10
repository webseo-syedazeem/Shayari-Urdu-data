const IMAGE_API_BASE_URL =
  (import.meta.env.VITE_IMAGE_API_BASE_URL as string) || 'http://localhost:8000';

export interface GeneratedShayariImage {
  public_url: string;
  storage_path: string;
  model: string;
  quality: string;
  image_format: string;
  compression: number;
  settings_source: 'database' | 'environment';
}

type ImageGenerationTarget =
  | { shayari_id: string; poet_id?: never }
  | { poet_id: string; shayari_id?: never };

async function generateEntityImage(
  target: ImageGenerationTarget,
  prompt: string
): Promise<GeneratedShayariImage> {
  const token = localStorage.getItem('adminAccessToken')?.trim();
  if (!token) throw new Error('Please login to admin before generating an image.');

  const response = await fetch(`${IMAGE_API_BASE_URL}/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ ...target, prompt: prompt.trim() })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || `Image generation failed (HTTP ${response.status})`);
  }

  return response.json();
}

export function generateShayariImage(
  shayariId: string,
  prompt: string
): Promise<GeneratedShayariImage> {
  return generateEntityImage({ shayari_id: shayariId }, prompt);
}

export function generatePoetImage(
  poetId: string,
  prompt: string
): Promise<GeneratedShayariImage> {
  return generateEntityImage({ poet_id: poetId }, prompt);
}
