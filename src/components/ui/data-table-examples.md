# Standardized Data Table System

## Overview
This standardized table system provides consistent styling, behavior, and features across all modules. No more manual coding of table features!

## Features Included
- ✅ **Frozen headers** (Excel-like sticky positioning)
- ✅ **Custom scrollbars** (thin, elegant, theme-aware)
- ✅ **Consistent fonts, spacing, borders**
- ✅ **Hover effects**
- ✅ **Column alignment** (left, center, right)
- ✅ **Responsive design**
- ✅ **Accent border styling** (matches other interactive components)
- ✅ **Proper column width control**

## Basic Usage

```tsx
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableColGroup,
  DataTableCol
} from "@/components/ui/data-table"

function MyTable() {
  return (
    <DataTable>
      <DataTableColGroup>
        <DataTableCol width="200px" />
        <DataTableCol width="100px" />
        <DataTableCol width="150px" />
      </DataTableColGroup>
      
      <DataTableHeader>
        <DataTableRow hover={false}>
          <DataTableHead align="left">Name</DataTableHead>
          <DataTableHead align="center">Count</DataTableHead>
          <DataTableHead align="right">Actions</DataTableHead>
        </DataTableRow>
      </DataTableHeader>
      
      <DataTableBody>
        {data.map((item) => (
          <DataTableRow key={item.id}>
            <DataTableCell>{item.name}</DataTableCell>
            <DataTableCell align="center">{item.count}</DataTableCell>
            <DataTableCell align="right">
              <Button>Edit</Button>
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTable>
  )
}
```

## Advanced Features

### Merged Headers (like T-shirt table)
```tsx
<DataTableHeader>
  <DataTableRow hover={false}>
    <DataTableHead rowSpan={2}>Volunteer</DataTableHead>
    <DataTableHead colSpan={3} align="center">T-Shirt Sizes</DataTableHead>
  </DataTableRow>
  <DataTableRow hover={false}>
    <DataTableHead align="center">XS</DataTableHead>
    <DataTableHead align="center">S</DataTableHead>
    <DataTableHead align="center">M</DataTableHead>
  </DataTableRow>
</DataTableHeader>
```

### Custom Height and Scrolling
```tsx
<DataTable maxHeight="calc(100vh-200px)" minWidth="800px">
  {/* Table content */}
</DataTable>
```

### No Borders (for specific cells)
```tsx
<DataTableCell border={false}>Content without right border</DataTableCell>
<DataTableHead border={false}>Header without right border</DataTableHead>
```

## Component Props

### DataTable
- `maxHeight?: string` - Maximum height before scrolling (default: "calc(100vh-300px)")
- `minWidth?: string` - Minimum width for horizontal scrolling (default: "max")

### DataTableHead
- `align?: "left" | "center" | "right"` - Text alignment (default: "left")
- `border?: boolean` - Show right border (default: true)
- `rowSpan?: number` - Span multiple rows
- `colSpan?: number` - Span multiple columns
- `sticky?: boolean` - Individual cell stickiness (default: false)

### DataTableCell
- `align?: "left" | "center" | "right"` - Text alignment (default: "left")
- `border?: boolean` - Show right border (default: true)
- `rowSpan?: number` - Span multiple rows
- `colSpan?: number` - Span multiple columns

### DataTableRow
- `hover?: boolean` - Enable hover effect (default: true)

## Migration Guide

### Before (Manual Styling)
```tsx
<div className="rounded-md border border-accent/20 bg-card overflow-hidden">
  <div className="overflow-auto max-h-[calc(100vh-300px)] custom-scrollbar">
    <table className="w-full border-collapse table-fixed">
      <thead className="sticky top-0 z-40 bg-card">
        <tr className="bg-muted/50 hover:bg-muted/50">
          <th className="font-semibold py-1 px-3 border-r border-accent/20">Name</th>
        </tr>
      </thead>
      <tbody>
        <tr className="hover:bg-muted/30 border-b border-accent/20">
          <td className="py-2 px-3 border-r border-accent/20">Data</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### After (Standardized Components)
```tsx
<DataTable>
  <DataTableHeader>
    <DataTableRow hover={false}>
      <DataTableHead>Name</DataTableHead>
    </DataTableRow>
  </DataTableHeader>
  <DataTableBody>
    <DataTableRow>
      <DataTableCell>Data</DataTableCell>
    </DataTableRow>
  </DataTableBody>
</DataTable>
```

## Benefits
- ✅ **90% less code** for table creation
- ✅ **Automatic consistency** across all modules
- ✅ **No more manual border/styling** management
- ✅ **Built-in responsive design**
- ✅ **Centralized maintenance** - update once, affects all tables
- ✅ **Type-safe props** with TypeScript
- ✅ **Accessibility built-in**

## Usage Across Modules
- **Assignments Module**: Use for volunteer assignment tables
- **T-shirt Module**: Already converted (see example)
- **Inventory Module**: Use for stock management tables
- **Reports Module**: Use for data display tables
- **Any future modules**: Just import and use!

No more reminders needed about table styling - it's all handled automatically! 🎉
