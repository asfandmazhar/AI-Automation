import { forwardRef } from "react"
import type { InputHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  icon?: ReactNode
  suffix?: ReactNode
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, icon, suffix, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-[color:var(--foreground)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]">
              {icon}
            </span>
          )}
          <input
            id={id}
            type={type}
            ref={ref}
            className={cn(
              "flex h-10 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] disabled:cursor-not-allowed disabled:opacity-50",
              icon && "pl-10",
              suffix && "pr-10",
              error && "border-[color:var(--error)] focus:ring-[color:var(--error)] focus:border-[color:var(--error)]",
              className
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={error && id ? `${id}-error` : undefined}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 pt-1.5 -translate-y-1/2 text-[color:var(--muted-foreground)]">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p
            id={id ? `${id}-error` : undefined}
            className="text-sm text-[color:var(--error)]"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
