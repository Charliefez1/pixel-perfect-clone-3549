import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-lg font-bold">{title}</h1>
      <div className="flex items-center gap-3">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
            CW
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
