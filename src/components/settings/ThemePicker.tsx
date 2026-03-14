import { useTheme, type AccentColor, type ThemeMode } from "@/providers/ThemeProvider";
import { Check, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENT_SWATCHES: { name: AccentColor; label: string; hex: string; lightFg: boolean }[] = [
  { name: "sky",    label: "Sky",    hex: "#a8d4eb", lightFg: true },
  { name: "steel",  label: "Steel",  hex: "#5ea6cc", lightFg: false },
  { name: "mint",   label: "Mint",   hex: "#88d4ab", lightFg: true },
  { name: "amber",  label: "Amber",  hex: "#d4910a", lightFg: false },
  { name: "purple", label: "Purple", hex: "#7f77f1", lightFg: false },
];

const MODE_OPTIONS: { value: ThemeMode; label: string; icon: React.ElementType }[] = [
  { value: "light",  label: "Light",  icon: Sun },
  { value: "dark",   label: "Dark",   icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemePicker() {
  const { accent, mode, setAccent, setMode } = useTheme();

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div>
        <h3 className="text-section-title mb-3">Mode</h3>
        <div className="flex gap-2">
          {MODE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = mode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setMode(opt.value)}
                aria-label={`Set theme mode to ${opt.label}`}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent color picker */}
      <div>
        <h3 className="text-section-title mb-3">Accent Color</h3>
        <div className="flex gap-3">
          {ACCENT_SWATCHES.map((swatch) => {
            const isActive = accent === swatch.name;
            return (
              <button
                key={swatch.name}
                onClick={() => setAccent(swatch.name)}
                className="flex flex-col items-center gap-1.5 group"
                aria-label={`Set accent color to ${swatch.label}`}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150",
                    "ring-2 ring-offset-2 ring-offset-background",
                    isActive ? "ring-foreground scale-110" : "ring-transparent group-hover:ring-border"
                  )}
                  style={{ backgroundColor: swatch.hex }}
                >
                  {isActive && (
                    <Check
                      className={cn(
                        "w-4 h-4",
                        swatch.lightFg ? "text-gray-800" : "text-white"
                      )}
                      strokeWidth={3}
                    />
                  )}
                </div>
                <span className={cn(
                  "text-[11px] font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {swatch.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
