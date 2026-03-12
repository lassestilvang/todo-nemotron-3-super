import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import { Checkbox } from './checkbox';
import * as React from 'react';

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
  </DropdownMenuPrimitive.Trigger>
));
DropdownMenuTrigger.displayName = DropdownMenuPrimitive.Trigger.displayName;

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, align = 'start', ...props }, ref) => {
  // We're going to override the default className to use Tailwind CSS
  let classNameValue = 'z-50 min-w-[8rem] overflow-hidden bg-[hsl(var(--background))] px-2 py-1 text-[hsl(var(--foreground))] shadow-md border border-[hsl(var(--border))] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[50%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[50%]';

  if (align === 'start') {
    classNameValue += ' left-[calc(50%-var(--radix-dropdown-menu-trigger-width))]';
  } else if (align === 'end') {
    classNameValue += ' right-[calc(50%-var(--radix-dropdown-menu-trigger-width))]';
  }

  classNameValue += ` translate-y-[${sideOffset}px]`;

  return (
    <DropdownMenuPrimitive.Content
      ref={ref}
      className={cn(classNameValue)}
      {...props}
    >
      <div className={cn('p-1 space-y-1')}>
        <slot />
      </div>
    </DropdownMenuPrimitive.Content>
  );
});
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, disabled, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-[hsl(var(--accent))] focus:text-[hsl(var(--accent-foreground))] data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    disabled={disabled}
    {...props}
  >
    <span className={cn('block truncate')}>
      <slot />
    </span>
  </DropdownMenuPrimitive.Item>
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { checked?: boolean; onCheckedChange?: (checked: boolean) => void }
>(({ className, checked = false, onCheckedChange, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-[hsl(var(--accent))] focus:text-[hsl(var(--accent-foreground))] data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    disabled={props.disabled}
    {...props}
  >
    <span className={cn('block truncate')}>
      <slot />
    </span>
    <Checkbox className={cn('ml-4 h-4 w-4 shrink-0') } 
      checked={checked}
      onCheckedChange={(checkedValue) => {
        if (onCheckedChange && typeof checkedValue === 'boolean') {
          onCheckedChange(checkedValue);
        }
      }}
    />
  </DropdownMenuPrimitive.Item>
));
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

export {
  DropdownMenuTrigger,
  DropdownMenuTrigger as DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuPrimitive as DropdownMenuRoot,
};