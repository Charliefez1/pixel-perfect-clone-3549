import { toast } from "sonner";

interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  "23505": "This record already exists.",
  "23503": "This record is referenced by other data and cannot be modified.",
  "42501": "You don't have permission to perform this action.",
  "PGRST301": "You don't have permission to access this data.",
  "PGRST116": "The requested record was not found.",
  "23502": "A required field is missing.",
};

export function getErrorMessage(error: SupabaseError): string {
  if (error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  return "Something went wrong. Please try again.";
}

export function handleSupabaseError(error: SupabaseError, context?: string): void {
  const message = getErrorMessage(error);
  const label = context ? `${context}: ${message}` : message;

  if (import.meta.env.DEV) {
    console.error(`[Supabase Error]`, { context, error });
  }

  toast.error(label);
}
