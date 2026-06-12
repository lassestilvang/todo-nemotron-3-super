"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "h-px -mx-4 bg-slate-200 dark:bg-slate-800",
      className
    )}
    {...props}
  />
))
Separator.displayName = "Separator"

export { Separator }