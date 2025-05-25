import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Standardized Data Table System
 * Handles all table features consistently across modules:
 * - Frozen headers (Excel-like)
 * - Custom scrollbars
 * - Consistent fonts, spacing, borders
 * - Hover effects
 * - Responsive design
 * - Column alignment
 */

interface DataTableProps {
  children: React.ReactNode
  className?: string
  maxHeight?: string
  minWidth?: string
}

interface DataTableHeaderProps {
  children: React.ReactNode
  className?: string
  sticky?: boolean
}

interface DataTableBodyProps {
  children: React.ReactNode
  className?: string
}

interface DataTableRowProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

interface DataTableCellProps {
  children: React.ReactNode
  className?: string
  align?: "left" | "center" | "right"
  border?: boolean
  rowSpan?: number
  colSpan?: number
}

interface DataTableHeadProps {
  children: React.ReactNode
  className?: string
  align?: "left" | "center" | "right"
  border?: boolean
  rowSpan?: number
  colSpan?: number
  sticky?: boolean
}

// Main table container with standardized styling
const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ children, className, maxHeight = "calc(100vh-300px)", minWidth = "max", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md border border-accent/20 bg-card overflow-hidden", // Consistent container styling
        className
      )}
      {...props}
    >
      <div className={cn(
        "overflow-auto custom-scrollbar", // Custom scrollbar
        maxHeight && `max-h-[${maxHeight}]`
      )}>
        <table className={cn(
          "w-full border-collapse table-fixed", // Consistent table layout
          minWidth && `min-w-${minWidth}`
        )}>
          {children}
        </table>
      </div>
    </div>
  )
)
DataTable.displayName = "DataTable"

// Standardized table header with sticky functionality
const DataTableHeader = React.forwardRef<HTMLTableSectionElement, DataTableHeaderProps>(
  ({ children, className, sticky = true, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn(
        "bg-card", // Consistent header background
        sticky && "sticky top-0 z-40", // Excel-like frozen headers
        className
      )}
      {...props}
    >
      {children}
    </thead>
  )
)
DataTableHeader.displayName = "DataTableHeader"

// Standardized table body
const DataTableBody = React.forwardRef<HTMLTableSectionElement, DataTableBodyProps>(
  ({ children, className, ...props }, ref) => (
    <tbody ref={ref} className={cn("", className)} {...props}>
      {children}
    </tbody>
  )
)
DataTableBody.displayName = "DataTableBody"

// Standardized table row with consistent hover effects
const DataTableRow = React.forwardRef<HTMLTableRowElement, DataTableRowProps>(
  ({ children, className, hover = true, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-accent/20", // Consistent row borders
        hover && "hover:bg-muted/30", // Consistent hover effect
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
)
DataTableRow.displayName = "DataTableRow"

// Standardized table header cell
const DataTableHead = React.forwardRef<HTMLTableCellElement, DataTableHeadProps>(
  ({ children, className, align = "left", border = true, sticky = false, rowSpan, colSpan, ...props }, ref) => (
    <th
      ref={ref}
      rowSpan={rowSpan}
      colSpan={colSpan}
      className={cn(
        "font-semibold py-1 px-2 relative bg-muted/50", // Consistent header styling
        align === "left" && "text-left",
        align === "center" && "text-center", 
        align === "right" && "text-right",
        border && "border-r border-accent/20", // Consistent borders
        sticky && "sticky top-0 bg-muted/50", // Individual cell stickiness
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
)
DataTableHead.displayName = "DataTableHead"

// Standardized table data cell
const DataTableCell = React.forwardRef<HTMLTableCellElement, DataTableCellProps>(
  ({ children, className, align = "left", border = true, rowSpan, colSpan, ...props }, ref) => (
    <td
      ref={ref}
      rowSpan={rowSpan}
      colSpan={colSpan}
      className={cn(
        "py-2 px-2 relative", // Consistent cell padding
        "text-sm", // Consistent font size
        align === "left" && "text-left",
        align === "center" && "text-center",
        align === "right" && "text-right", 
        border && "border-r border-accent/20", // Consistent borders
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
)
DataTableCell.displayName = "DataTableCell"

// Column group for consistent column widths
const DataTableColGroup = React.forwardRef<HTMLTableColElement, { children: React.ReactNode }>(
  ({ children }, ref) => (
    <colgroup ref={ref}>
      {children}
    </colgroup>
  )
)
DataTableColGroup.displayName = "DataTableColGroup"

const DataTableCol = React.forwardRef<HTMLTableColElement, { width?: string; className?: string }>(
  ({ width, className }, ref) => (
    <col 
      ref={ref}
      className={className}
      style={width ? { width } : undefined}
    />
  )
)
DataTableCol.displayName = "DataTableCol"

export {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableColGroup,
  DataTableCol
}
