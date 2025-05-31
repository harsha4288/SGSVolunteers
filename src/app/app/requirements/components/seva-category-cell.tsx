import * as React from "react";
import { SevaCategoryIcon } from "@/components/shared/seva-category-icon";

interface SevaCategoryCellProps {
    categoryName: string;
}

// Seva category icon and short code mapping
const sevaCategoryMeta: Record<string, { icon: React.ReactNode; code: string }> = {
    // Original names
    'Crowd Management': { icon: <span className="text-blue-400">👥</span>, code: 'CM' },
    'Health Services': { icon: <span className="text-green-400">🩺</span>, code: 'HL' },
    'Help Desk': { icon: <span className="text-yellow-400">🛎️</span>, code: 'HD' },
    'Meal Preparation': { icon: <span className="text-orange-400">🍽️</span>, code: 'MP' },
    'Hospitality': { icon: <span className="text-pink-400">🏠</span>, code: 'HO' },
    'Stage Management': { icon: <span className="text-purple-400">🎤</span>, code: 'ST' },
    // Alternative names
    'Crowd': { icon: <span className="text-blue-400">👥</span>, code: 'CM' },
    'Health': { icon: <span className="text-green-400">🩺</span>, code: 'HL' },
    'Helpdesk': { icon: <span className="text-yellow-400">🛎️</span>, code: 'HD' },
    'Meals': { icon: <span className="text-orange-400">🍽️</span>, code: 'MP' },
    'Food': { icon: <span className="text-orange-400">🍽️</span>, code: 'MP' },
    'Stage': { icon: <span className="text-purple-400">🎤</span>, code: 'ST' },
    // Add more variations as needed
};

// Helper function to find the best match for a category name
function findBestMatch(categoryName: string): { icon: React.ReactNode; code: string } {
    // Try exact match first
    if (sevaCategoryMeta[categoryName]) {
        return sevaCategoryMeta[categoryName];
    }

    // Try case-insensitive match
    const lowerCategoryName = categoryName.toLowerCase();
    const match = Object.entries(sevaCategoryMeta).find(([key]) =>
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

export function SevaCategoryCell({ categoryName }: SevaCategoryCellProps) {
    return (
        <div
            className="font-medium px-0.5 py-px text-[11px] truncate text-center align-top flex flex-col items-center justify-start w-full h-full bg-gray-100 dark:bg-transparent"
        >
            <SevaCategoryIcon categoryName={categoryName} />
        </div>
    );
}