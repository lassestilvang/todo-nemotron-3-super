import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const Checkbox = forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, onCheckedChange, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    onCheckedChange={onCheckedChange}
    className={cn(
      'h-4 w-4 shrink-0 rounded border-gray-300 bg-[hsl(var(--background))] text-[hsl(var(--foreground))] ring-offset-[hsl(var(--background))] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[hsl(var(--primary))] data-[state=checked]:text-[hsl(var(--primary-foreground))]',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center h-4 w-4 text-current')} />
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export const CheckboxRoot = Checkbox;
export const CheckboxIndicator = CheckboxPrimitive.Indicator;
export { Checkbox };