export type AppRole = 'admin' | 'team' | 'client';

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  role: AppRole;
  organisation_id: string | null;
}
