import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const DialogTrigger = forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Trigger
    ref={ref}
    className={cn('inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50', className)}
    {...props}
  />
));
DialogTrigger.displayName = DialogPrimitive.Trigger.displayName;

const DialogContent = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Content
    ref={ref}
    className={cn(
      'fixed left-[50%] top-[50%] z-50 grid w-[90%] max-w-lg -translate-x-[50%] -translate-y-[50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[50%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[50%] sm:rounded-lg',
      className
    )}
    {...props}
  >
    <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[hsl(var(--background)/0.7)]" />
    {children}
    <DialogPrimitive.Close
      className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 disabled:pointer-events-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200"
      aria-label="Close"
    />
  </DialogPrimitive.Content>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2", className)}
    {...props}
  />
));
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<"h2">
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-row-reverse space-x-2", className)}
    {...props}
  />
));
DialogFooter.displayName = "DialogFooter";

const Dialog = ({ children, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) => (
  <DialogPrimitive.Root {...props}>
    {children}
  </DialogPrimitive.Root>
);
Dialog.displayName = DialogPrimitive.Root.displayName;

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogPrimitive as DialogRoot,
};