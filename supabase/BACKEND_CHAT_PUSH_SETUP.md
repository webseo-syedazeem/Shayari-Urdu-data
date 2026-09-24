# Backend chat push deployment

Chat pushes are sent by the persistent Express backend. No Supabase Edge Function,
Vault secret, `pg_net`, or `pg_cron` configuration is required.

## 1. Apply the database migration

Run the full contents of
`supabase/migrations/20260924090000_add_chat_push_notifications.sql` in the
Supabase SQL Editor. It creates the two token/ticket tables and the
`register_push_token(...)` client RPC.

Confirm that `chat_messages` is enabled for Supabase Realtime. The existing app
foreground listener already depends on this setting.

## 2. Deploy and restart the backend

The backend already has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` configured
in `backend/.env`. Build the TypeScript and restart the PM2 process:

```bash
cd backend
npm run build
pm2 restart shayari-backend
pm2 logs shayari-backend --lines 100
```

After restart, look for:

```text
[chat-push] Listening for chat_messages INSERT events
```

Only PM2 instance `0` runs the push worker, preventing duplicate notifications
when PM2 uses cluster mode. Expo push receipts are checked every 15 minutes by
the backend process.
