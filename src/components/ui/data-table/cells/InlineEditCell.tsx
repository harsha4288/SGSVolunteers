"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type EditValue = string | number;

interface InlineEditCellProps<T extends EditValue> {
  value: T;
  onSave: (newValue: T) => Promise<void>;
  disabled?: boolean;
  className?: string;
  type?: 'text' | 'number' | 'email';
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    required?: boolean;
    custom?: (value: T) => boolean | string;
  };
  renderDisplay?: (value: T) => React.ReactNode;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

/**
 * Reusable inline edit cell component with Excel-like behavior
 * - Click to edit, Enter/blur to save, Escape to cancel
 * - Supports text, number, and email types
 * - Comprehensive validation support
 * - Async save operations with loading states
 * - Custom display rendering
 */
export function InlineEditCell<T extends EditValue>({
  value,
  onSave,
  disabled = false,
  className,
  type = 'text',
  placeholder,
  validation,
  renderDisplay,
  inputProps,
}: InlineEditCellProps<T>) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(String(value));
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Update edit value when prop value changes (but not while editing)
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(String(value));
      setError(null);
    }
  }, [value, isEditing]);

  // Focus and select all text when entering edit mode
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const validateValue = (val: string): boolean | string => {
    if (!validation) return true;

    // Required validation
    if (validation.required && !val.trim()) {
      return "This field is required";
    }

    // Type-specific validation
    if (type === 'number' && val.trim()) {
      const numVal = Number(val);
      if (isNaN(numVal)) return "Must be a valid number";
      if (validation.min !== undefined && numVal < validation.min) {
        return `Must be at least ${validation.min}`;
      }
      if (validation.max !== undefined && numVal > validation.max) {
        return `Must be at most ${validation.max}`;
      }
    }

    // Length validation
    if (validation.minLength !== undefined && val.length < validation.minLength) {
      return `Must be at least ${validation.minLength} characters`;
    }
    if (validation.maxLength !== undefined && val.length > validation.maxLength) {
      return `Must be at most ${validation.maxLength} characters`;
    }

    // Pattern validation
    if (validation.pattern && val.trim() && !validation.pattern.test(val)) {
      return "Invalid format";
    }

    // Custom validation
    if (validation.custom) {
      const customResult = validation.custom(val as T);
      if (typeof customResult === 'string') return customResult;
      if (!customResult) return "Invalid value";
    }

    return true;
  };

  const handleClick = () => {
    if (!disabled && !isSaving) {
      setIsEditing(true);
      setError(null);
    }
  };

  const handleCancel = () => {
    setEditValue(String(value));
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (isSaving) return;

    const trimmedValue = editValue.trim();
    
    // Validate the input
    const validationResult = validateValue(trimmedValue);
    if (validationResult !== true) {
      setError(validationResult);
      return;
    }

    // Convert to appropriate type
    let convertedValue: T;
    if (type === 'number') {
      convertedValue = Number(trimmedValue) as T;
    } else {
      convertedValue = trimmedValue as T;
    }

    // Check if value actually changed
    if (convertedValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);
    
    try {
      await onSave(convertedValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving value:", error);
      setError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Small delay to allow click events to process first
    setTimeout(() => {
      if (isEditing && !error) {
        handleSave();
      }
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setEditValue(inputValue);
    setError(null);

    // For number type, validate on change for better UX
    if (type === 'number' && inputValue.trim()) {
      const numVal = Number(inputValue);
      if (isNaN(numVal)) {
        setError("Must be a valid number");
      }
    }
  };

  if (isEditing) {
    return (
      <div className="relative">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isSaving}
          placeholder={placeholder}
          type={type === 'number' ? 'text' : type}
          inputMode={type === 'number' ? 'numeric' : undefined}
          className={cn(
            "h-7 text-sm border-primary/50 focus:border-primary",
            type === 'number' && "text-center",
            isSaving && "opacity-50",
            error && "border-destructive focus:border-destructive",
            className
          )}
          {...inputProps}
        />
        {error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-destructive bg-background border border-destructive rounded px-2 py-1 shadow-md z-10 whitespace-nowrap">
            {error}
          </div>
        )}
      </div>
    );
  }

  const displayValue = renderDisplay ? renderDisplay(value) : String(value);

  return (
    <span
      onClick={handleClick}
      className={cn(
        "text-sm min-w-[2rem] inline-block px-1 py-0.5 text-foreground cursor-pointer rounded transition-colors",
        "hover:bg-primary/10 hover:text-primary",
        type === 'number' && "text-center",
        disabled && "cursor-not-allowed opacity-50",
        isSaving && "opacity-50",
        className
      )}
      title="Click to edit"
    >
      {displayValue}
    </span>
  );
}