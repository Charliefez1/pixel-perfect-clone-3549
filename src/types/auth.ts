export type AppRole = 'admin' | 'user' | 'client';

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: AppRole;
}
