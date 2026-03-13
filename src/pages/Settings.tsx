import { ThemePicker } from "@/components/settings/ThemePicker";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { profile } = useAuth();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-page-title mb-8">Settings</h1>

      {/* Profile section */}
      <section className="mb-10">
        <h2 className="text-overline text-muted-foreground mb-4">Profile</h2>
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-lg">
              {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-medium text-foreground">{profile?.display_name || "User"}</p>
              <p className="text-sm text-muted-foreground">{profile?.email || ""}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Appearance section */}
      <section>
        <h2 className="text-overline text-muted-foreground mb-4">Appearance</h2>
        <div className="bg-card rounded-lg border border-border p-5">
          <ThemePicker />
        </div>
      </section>
    </div>
  );
}
