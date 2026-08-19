import { forwardRef } from "react"
import type { InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="inline-flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          ref={ref}
          className={cn(
            "h-4 w-4 rounded border border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--primary)] accent-[var(--primary)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={id}
            className="text-sm text-[color:var(--foreground)] select-none cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }
