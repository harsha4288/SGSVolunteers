// src/app/app/requirements/components/requirement-cell.tsx
"use client";

import * as React from 'react';
import type { RequirementCellData } from '../types'; // Assuming types.ts is in the parent directory

interface RequirementCellProps {
  cellData: RequirementCellData;
  onSelect: () => void; // Callback to open the modal
  isEditable: boolean;
}

export function RequirementCell({ cellData, onSelect, isEditable }: RequirementCellProps) {
  const { total_required_count } = cellData;

  const handleClick = () => {
    if (isEditable) {
      onSelect();
    }
  };

  const cellClasses = `
    p-2 border border-border h-20 flex items-center justify-center 
    text-center text-sm
    ${isEditable ? 'cursor-pointer hover:bg-muted/50' : 'bg-muted/20 cursor-not-allowed'}
    ${total_required_count > 0 ? 'font-semibold' : 'text-muted-foreground'}
  `;

  const valueClasses = `
    ${total_required_count > 0 && total_required_count < 5 ? 'text-orange-600' : ''}
    ${total_required_count >= 5 ? 'text-green-600' : ''}
    ${total_required_count === 0 && isEditable ? 'text-gray-400 italic' : ''}
     ${total_required_count === 0 && !isEditable ? 'text-muted-foreground' : ''}
  `;

  return (
    <td
      className={cellClasses}
      onClick={handleClick}
      title={isEditable ? `Click to edit requirements for ${cellData.sevaCategory.name} at ${cellData.timeslot.name}` : `View requirements for ${cellData.sevaCategory.name} at ${cellData.timeslot.name}`}
    >
      <span className={valueClasses}>
        {total_required_count > 0 ? total_required_count : (isEditable ? '0 (Edit)' : '0')}
      </span>
    </td>
  );
}
