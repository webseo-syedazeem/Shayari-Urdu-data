import { supabase } from './supabase';

export interface RenameChatUsernameResult {
  success: boolean;
  remaining: number;
}

export async function getNameChangesRemaining(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_name_changes_remaining', {
    p_user_id: userId,
  });

  if (error) throw error;
  if (typeof data !== 'number') {
    throw new Error('Invalid name-change count returned by the server.');
  }
  return data;
}

export async function renameChatUsername(
  userId: string,
  newUsername: string,
): Promise<RenameChatUsernameResult> {
  const { data, error } = await supabase.rpc('rename_chat_username', {
    p_user_id: userId,
    p_new_username: newUsername,
  });

  if (error) throw error;
  if (
    !data
    || typeof data !== 'object'
    || typeof data.success !== 'boolean'
    || typeof data.remaining !== 'number'
  ) {
    throw new Error('Invalid username rename result returned by the server.');
  }

  return {
    success: data.success,
    remaining: data.remaining,
  };
}
