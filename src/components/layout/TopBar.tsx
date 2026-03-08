import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="h-14 border-b border-border bg-background-elevated flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-section-title">{title}</h1>
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            CW
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
