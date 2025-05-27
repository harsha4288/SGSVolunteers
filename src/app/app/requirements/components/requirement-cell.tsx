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
    p-3 border border-border h-16 flex items-center justify-center
    text-center text-lg font-semibold transition-colors
    ${isEditable ? 'cursor-pointer hover:bg-accent/20 hover:border-accent/50' : 'bg-muted/10 cursor-default'}
    ${total_required_count > 0 ? 'bg-background' : 'bg-muted/5'}
  `;

  const valueClasses = `
    ${total_required_count > 0 && total_required_count < 5 ? 'text-orange-600' : ''}
    ${total_required_count >= 5 && total_required_count < 10 ? 'text-blue-600' : ''}
    ${total_required_count >= 10 ? 'text-green-600' : ''}
    ${total_required_count === 0 && isEditable ? 'text-muted-foreground italic text-sm' : ''}
    ${total_required_count === 0 && !isEditable ? 'text-muted-foreground' : ''}
  `;

  return (
    <td
      className={cellClasses}
      onClick={handleClick}
      title={isEditable ? `Click to edit requirements for ${cellData.sevaCategory.name} at ${cellData.timeslot.name}` : `View requirements for ${cellData.sevaCategory.name} at ${cellData.timeslot.name}`}
    >
      <span className={valueClasses}>
        {total_required_count > 0 ? total_required_count : (isEditable ? '0 (Edit)' : '—')}
      </span>
    </td>
  );
}
