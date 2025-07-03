// Reusable Data Table Cell Components
// Designed for zero breaking changes and full backward compatibility

export { InlineEditCell } from './InlineEditCell';
export type { InlineEditCellProps } from './InlineEditCell';

export { StatusBadgeCell } from './StatusBadgeCell';
export type { StatusBadgeCellProps } from './StatusBadgeCell';

export { ActionButtonCell, commonActions } from './ActionButtonCell';
export type { ActionButtonCellProps, ActionButtonConfig } from './ActionButtonCell';

export { IconCell, iconPresets } from './IconCell';
export type { IconCellProps } from './IconCell';

export { CompoundCell, compoundCellPresets } from './CompoundCell';
export type { CompoundCellProps } from './CompoundCell';

// Re-export common types for convenience
export type UserRole = "admin" | "team_lead" | "volunteer";
export type StatusType = 'present' | 'absent' | 'pending' | 'upcoming' | 'not-recorded' | 
                        'active' | 'inactive' | 'success' | 'warning' | 'error' | 'info' |
                        'positive' | 'negative' | 'neutral' | 'inventory';