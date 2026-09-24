export const CHAT_USER_ID_STORAGE_KEY = 'chat_user_id';

export function getChatUserId(): string {
  const stored = localStorage.getItem(CHAT_USER_ID_STORAGE_KEY);
  if (stored) return stored;

  const created = crypto.randomUUID();
  localStorage.setItem(CHAT_USER_ID_STORAGE_KEY, created);
  return created;
}
