import * as React from "react"

export const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`block bg-gray-200 dark:bg-gray-600 animate-pulse ${className}`}
    {...props}
  />
))