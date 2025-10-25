import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const [isFocused, setIsFocused] = React.useState(false)
  const [hasValue, setHasValue] = React.useState(false)

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    props.onFocus?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    setHasValue(e.target.value.length > 0)
    props.onBlur?.(e)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0)
    props.onChange?.(e)
  }

  return (
    <div className="relative w-full">
      <input
        type={type}
        data-slot="input"
        className={cn(
          "peer w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base outline-none transition-all duration-300 ease-in-out",
          "h-9 md:text-sm",
          // Background and border
          "border-input dark:bg-input/30",
          // Focus states with smooth animations
          "focus:border-ring focus:ring-ring/30 focus:ring-2",
          "focus:shadow-[0_0_0_3px_rgba(var(--ring-rgb,59,130,246),0.1)]",
          // Placeholder
          "placeholder:text-muted-foreground placeholder:transition-all placeholder:duration-300",
          "focus:placeholder:translate-x-1 focus:placeholder:opacity-70",
          // Selection
          "selection:bg-primary selection:text-primary-foreground",
          // File input styling
          "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Invalid state
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          // Disabled state
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          // Hover effect
          "hover:border-ring/50 hover:shadow-sm",
          // Smooth shadow transitions
          "shadow-xs transition-[color,box-shadow,border-color,transform] duration-300",
          className
        )}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        {...props}
      />
      {/* Animated border indicator */}
      <div
        className={cn(
          "pointer-events-none absolute bottom-0 left-0 h-[2px] w-full origin-center scale-x-0 bg-gradient-to-r from-ring/50 via-ring to-ring/50 transition-transform duration-300 ease-out",
          isFocused && "scale-x-100"
        )}
      />
    </div>
  )
}

export { Input }
