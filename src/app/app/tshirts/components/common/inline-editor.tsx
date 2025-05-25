"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InlineEditorProps {
  value: string | number;
  onSave: (newValue: string | number) => Promise<void>;
  disabled?: boolean;
  className?: string;
  minValue?: number;
  isText?: boolean;
  maxLength?: number;
}

/**
 * Flexible inline editor component that behaves like Excel cells
 * Supports both text and numeric editing
 * Click to edit, Enter/blur to save, Escape to cancel
 */
export function InlineEditor({
  value,
  onSave,
  disabled = false,
  className,
  minValue = 0,
  isText = false,
  maxLength,
}: InlineEditorProps) {
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

    let newValue: string | number;

    if (isText) {
      newValue = editValue.trim();
      
      // Validate text input
      if (!newValue) {
        handleCancel();
        return;
      }

      // Check if value actually changed
      if (newValue === value.toString()) {
        setIsEditing(false);
        return;
      }
    } else {
      const numericValue = parseInt(editValue, 10);

      // Validate numeric input
      if (isNaN(numericValue) || numericValue < minValue) {
        handleCancel();
        return;
      }

      // Check if value actually changed
      if (numericValue === value) {
        setIsEditing(false);
        return;
      }

      newValue = numericValue;
    }

    setIsSaving(true);
    try {
      await onSave(newValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving value:", error);
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
    
    if (isText) {
      // For text, allow any characters but respect maxLength
      if (!maxLength || inputValue.length <= maxLength) {
        setEditValue(inputValue);
      }
    } else {
      // For numbers, only allow digits and empty string
      if (inputValue === "" || /^\d+$/.test(inputValue)) {
        setEditValue(inputValue);
      }
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
          isText 
            ? "h-6 w-16 text-center text-xs font-semibold border-primary/50 focus:border-primary px-1"
            : "h-4 w-8 text-center text-xs font-semibold border-primary/50 focus:border-primary p-0",
          isSaving && "opacity-50",
          className
        )}
        type="text"
        inputMode={isText ? "text" : "numeric"}
        maxLength={maxLength}
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      className={cn(
        "text-xs font-semibold min-w-[1rem] text-center px-0.5 text-foreground cursor-pointer",
        "hover:bg-primary/10 hover:text-primary rounded transition-colors",
        disabled && "cursor-not-allowed opacity-50",
        isSaving && "opacity-50",
        className
      )}
      title={`Click to edit ${isText ? 'text' : 'quantity'}`}
    >
      {value}
    </span>
  );
}
