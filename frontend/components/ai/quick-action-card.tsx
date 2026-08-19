import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type QuickActionCardProps = {
  icon: LucideIcon
  title: string
  description: string
  onClick?: () => void
  className?: string
}

export function QuickActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  className,
}: QuickActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 text-left cursor-pointer transition-colors duration-200 hover:border-[color:var(--primary)]",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex shrink-0 items-center justify-center rounded-lg bg-[color:var(--muted)] p-2">
          <Icon className="h-[18px] w-[18px] text-[color:var(--primary)]" />
        </div>
        <span className="text-sm font-semibold text-[color:var(--foreground)]">{title}</span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[color:var(--muted-foreground)] md:text-sm">
        {description}
      </p>
    </button>
  )
}
