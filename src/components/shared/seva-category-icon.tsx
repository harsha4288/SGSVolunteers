import * as React from "react";
import { taskIcons, getTaskIconConfig, TaskIconConfig } from "@/lib/task-icons";

// Seva category emoji fallbacks
const sevaCategoryEmojis: Record<string, { icon: React.ReactNode; code: string }> = {
    // Original names
    'Crowd Management': { icon: <span className="text-blue-400">👥</span>, code: 'CM' },
    'Health Services': { icon: <span className="text-green-400">🩺</span>, code: 'HL' },
    'Help Desk': { icon: <span className="text-indigo-400">🖥️</span>, code: 'HD' },
    'Meal Preparation': { icon: <span className="text-orange-400">🍽️</span>, code: 'MP' },
    'Maha Prasad': { icon: <span className="text-orange-500">🍲</span>, code: 'MP' },
    'Snacks': { icon: <span className="text-yellow-500">☕</span>, code: 'SN' },
    'Hospitality': { icon: <span className="text-pink-400">🏠</span>, code: 'HO' },
    'Stage Management': { icon: <span className="text-purple-400">🎤</span>, code: 'ST' },
    'Mobile': { icon: <span className="text-violet-500">🚗</span>, code: 'MO' },
    'Reserve': { icon: <span className="text-blue-500">🏃</span>, code: 'RV' },
    'Ticket': { icon: <span className="text-red-500">🎟️</span>, code: 'TK' },
    // Alternative names
    'Crowd': { icon: <span className="text-blue-400">👥</span>, code: 'CM' },
    'Health': { icon: <span className="text-green-400">🩺</span>, code: 'HL' },
    'Helpdesk': { icon: <span className="text-indigo-400">🖥️</span>, code: 'HD' },
    'Meals': { icon: <span className="text-orange-400">🍽️</span>, code: 'MP' },
    'Food': { icon: <span className="text-orange-400">🍽️</span>, code: 'MP' },
    'Stage': { icon: <span className="text-purple-400">🎤</span>, code: 'ST' },
    'Snack': { icon: <span className="text-yellow-500">☕</span>, code: 'SN' },
    'Vehicle': { icon: <span className="text-violet-500">🚗</span>, code: 'MO' },
    'Rapid Action': { icon: <span className="text-blue-500">🏃</span>, code: 'RV' },
    'RAF': { icon: <span className="text-blue-500">🏃</span>, code: 'RV' },
    'Tickets': { icon: <span className="text-red-500">🎟️</span>, code: 'TK' },
    'Pass': { icon: <span className="text-red-500">🎟️</span>, code: 'TK' },
};

interface SevaCategoryIconProps {
    categoryName: string;
    variant?: 'responsive' | 'emoji' | 'default' | 'compact';
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string;
}

export function SevaCategoryIcon({
    categoryName,
    variant = 'responsive',
    size = 'md',
    showLabel = true,
    className = '',
}: SevaCategoryIconProps) {
    const emojiConfig = findBestEmojiMatch(categoryName);
    // Size mappings
    const labelSizeClasses = {
        sm: 'text-[10px]',
        md: 'text-xs',
        lg: 'text-sm'
    };

    if (variant === 'emoji') {
        return (
            <div className={`inline-flex items-center gap-1 ${className}`}>
                {emojiConfig.icon}
                {showLabel && (
                    <span className={`font-semibold ${labelSizeClasses[size]}`}>
                        {emojiConfig.code}
                    </span>
                )}
            </div>
        );
    }

    if (variant === 'responsive') {
        return (
            <>
                {/* Mobile: icon + code */}
                <span className="flex items-center gap-0.5 md:hidden">
                    {emojiConfig.icon}
                    <span className="font-bold">{emojiConfig.code}</span>
                </span>
                {/* Desktop: icon + code in bold, full name below in small gray text */}
                <span className="hidden md:flex flex-col items-center w-full h-full">
                    <span className="flex items-center gap-0.5">
                        {emojiConfig.icon}
                        <span className="font-bold">{emojiConfig.code}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 truncate">{categoryName}</span>
                </span>
            </>
        );
    }

    // fallback to Lucide icon system for 'default' and 'compact' variants
    const taskConfig = getTaskIconConfig(categoryName);
    const sizeClasses = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5'
    };
    const containerSizeClasses = {
        sm: 'p-1',
        md: 'p-1.5',
        lg: 'p-2'
    };
    const TaskIcon = taskConfig.icon;
    const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
    const iconColor = isDark ? taskConfig.darkColor : taskConfig.color;
    const bgColor = isDark ? taskConfig.darkBgColor : taskConfig.bgColor;

    if (variant === 'compact') {
        return (
            <div className={`inline-flex items-center gap-1 ${className}`}>
                <div
                    className={`rounded-full ${containerSizeClasses[size]}`}
                    style={{ backgroundColor: bgColor }}
                >
                    <TaskIcon
                        className={sizeClasses[size]}
                        style={{ color: iconColor }}
                        aria-label={categoryName}
                    />
                </div>
                {showLabel && (
                    <span className={`font-semibold ${labelSizeClasses[size]}`}>
                        {taskConfig.label}
                    </span>
                )}
            </div>
        );
    }

    // 'default' variant: Lucide icon + full name
    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            <div
                className={`rounded-full ${containerSizeClasses[size]}`}
                style={{ backgroundColor: bgColor }}
            >
                <TaskIcon
                    className={sizeClasses[size]}
                    style={{ color: iconColor }}
                    aria-label={categoryName}
                />
            </div>
            {showLabel && (
                <span className={`${labelSizeClasses[size]} max-w-[120px] truncate`}>
                    {categoryName}
                </span>
            )}
        </div>
    );
}

// Helper function to find the best emoji match for a category name
function findBestEmojiMatch(categoryName: string): { icon: React.ReactNode; code: string } {
    // Try exact match first
    if (sevaCategoryEmojis[categoryName]) {
        return sevaCategoryEmojis[categoryName];
    }

    // Try case-insensitive match
    const lowerCategoryName = categoryName.toLowerCase();
    const match = Object.entries(sevaCategoryEmojis).find(([key]) =>
        key.toLowerCase() === lowerCategoryName ||
        lowerCategoryName.includes(key.toLowerCase()) ||
        key.toLowerCase().includes(lowerCategoryName)
    );

    if (match) {
        return match[1];
    }

    // Default fallback
    return {
        icon: <span>🔹</span>,
        code: categoryName.slice(0, 2).toUpperCase()
    };
} 