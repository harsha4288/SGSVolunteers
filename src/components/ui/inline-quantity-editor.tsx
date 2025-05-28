"use client";

import * as React from "react";
import { Input } from "./input";

interface InlineQuantityEditorProps {
    value: number;
    onSave: (newValue: number) => void;
    disabled?: boolean;
    min?: number;
    max?: number;
}

export function InlineQuantityEditor({
    value,
    onSave,
    disabled = false,
    min = 0,
    max = undefined,
}: InlineQuantityEditorProps) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(value.toString());
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleStartEdit = () => {
        if (!disabled) {
            setEditValue(value.toString());
            setIsEditing(true);
        }
    };

    const handleBlur = () => {
        handleSave();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
        }
    };

    const handleSave = () => {
        setIsEditing(false);
        const newValue = parseInt(editValue);
        if (!isNaN(newValue) && newValue !== value) {
            if (min !== undefined && newValue < min) {
                onSave(min);
            } else if (max !== undefined && newValue > max) {
                onSave(max);
            } else {
                onSave(newValue);
            }
        }
    };

    if (isEditing) {
        return (
            <Input
                ref={inputRef}
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="h-6 w-12 text-center text-sm"
                min={min}
                max={max}
            />
        );
    }

    return (
        <span
            onClick={handleStartEdit}
            className={`text-sm font-medium ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:text-primary'}`}
        >
            {value}
        </span>
    );
} 