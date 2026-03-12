import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Fail fast if required environment variables are missing
const requiredEnvVars = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
] as const;

for (const key of requiredEnvVars) {
  if (!import.meta.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
