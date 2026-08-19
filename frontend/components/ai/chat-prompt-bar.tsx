"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

export type ChatPromptBarProps = {
  value?: string
  onChange?: (value: string) => void
  onSend?: (value: string) => void
  className?: string
  leftAction?: React.ReactNode
}

export function ChatPromptBar({
  value: controlledValue,
  onChange: controlledOnChange,
  onSend,
  className,
  leftAction,
}: ChatPromptBarProps) {
  const [internalValue, setInternalValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue

  function handleChange(next: string) {
    if (isControlled) {
      controlledOnChange?.(next)
    } else {
      setInternalValue(next)
    }
  }

  function handleSend() {
    if (!value.trim()) return
    onSend?.(value)
    if (!isControlled) setInternalValue("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px"
  }, [value])

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {leftAction}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your prompt here..."
          rows={1}
          className="flex-1 resize-none overflow-y-auto bg-transparent text-sm leading-6 text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:outline-none"
          style={{ maxHeight: 200 }}
        />

        <div className="flex shrink-0 items-center pb-0.5">
          <button
            type="button"
            onClick={handleSend}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] transition-colors duration-200 hover:bg-[color:var(--secondary)] cursor-pointer"
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
