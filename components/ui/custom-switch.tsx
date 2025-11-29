'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CustomSwitchProps {
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function CustomSwitch({
  id,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  className,
}: CustomSwitchProps) {
  const [isChecked, setIsChecked] = React.useState(defaultChecked || false);

  const handleClick = () => {
    if (disabled) return;
    
    const newChecked = !(checked !== undefined ? checked : isChecked);
    
    if (checked === undefined) {
      setIsChecked(newChecked);
    }
    
    onCheckedChange?.(newChecked);
  };

  const isActuallyChecked = checked !== undefined ? checked : isChecked;

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={isActuallyChecked}
      data-state={isActuallyChecked ? "checked" : "unchecked"}
      data-disabled={disabled ? "" : undefined}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        isActuallyChecked ? "bg-primary" : "bg-input",
        className
      )}
    >
      <span
        data-state={isActuallyChecked ? "checked" : "unchecked"}
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
          isActuallyChecked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}