import { forwardRef } from "react"
import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export type CardProps = HTMLAttributes<HTMLDivElement>

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl bg-[color:var(--card)] text-[color:var(--card-foreground)] border border-[color:var(--border)] p-6 shadow-sm",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = "Card"

export { Card }
