"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InlineQuantityEditorProps {
  value: number;
  onSave: (newValue: number) => Promise<void>;
  disabled?: boolean;
  className?: string;
  maxValue?: number;
  minValue?: number;
  allowOverride?: boolean;
  onOverrideWarning?: (newValue: number, currentValue: number) => Promise<boolean>;
}

/**
 * Inline quantity editor component that behaves like Excel cells
 * Click to edit, Enter/blur to save, Escape to cancel
 */
export function InlineQuantityEditor({
  value,
  onSave,
  disabled = false,
  className,
  maxValue,
  minValue = 0,
  allowOverride = false,
  onOverrideWarning,
}: InlineQuantityEditorProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value.toString());
  const [isSaving, setIsSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Update edit value when prop value changes
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(value.toString());
    }
  }, [value, isEditing]);

  // Focus and select all text when entering edit mode
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!disabled && !isSaving) {
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (isSaving) return;

    const newValue = parseInt(editValue, 10);
    
    // Validate input
    if (isNaN(newValue) || newValue < minValue) {
      handleCancel();
      return;
    }

    // Check if value actually changed
    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    // Check for max value override
    if (maxValue !== undefined && newValue > maxValue) {
      if (!allowOverride) {
        handleCancel();
        return;
      }

      // Ask for override confirmation if handler provided
      if (onOverrideWarning) {
        const confirmed = await onOverrideWarning(newValue, value);
        if (!confirmed) {
          handleCancel();
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      await onSave(newValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving quantity:", error);
      handleCancel();
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
      if (isEditing) {
        handleSave();
      }
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow empty string for easier editing
    if (inputValue === "" || /^\d+$/.test(inputValue)) {
      setEditValue(inputValue);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={isSaving}
        className={cn(
          "h-6 w-12 text-center text-sm font-semibold border-primary/50 focus:border-primary",
          isSaving && "opacity-50",
          className
        )}
        type="text"
        inputMode="numeric"
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      className={cn(
        "text-sm font-semibold min-w-[1.2rem] text-center px-1 text-foreground cursor-pointer",
        "hover:bg-primary/10 hover:text-primary rounded transition-colors",
        disabled && "cursor-not-allowed opacity-50",
        isSaving && "opacity-50",
        className
      )}
      title="Click to edit quantity"
    >
      {value}
    </span>
  );
}
