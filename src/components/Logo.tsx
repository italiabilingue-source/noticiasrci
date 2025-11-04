import { Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xl font-bold text-primary dark:text-primary-foreground",
        className
      )}
    >
      <Newspaper className="h-6 w-6" />
      <span className="font-headline">NoticiasdeFuego</span>
    </div>
  );
}
