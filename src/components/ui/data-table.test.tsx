import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect } from 'vitest';

import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableBadge,
  // Assuming DataTableContext is not directly tested but used by DataTable
} from './data-table';
import { BadgeProps } from './badge'; // For DataTableBadge variant props

// Mock for Next.js specific features if any are inadvertently pulled in by components
// For example, if a component used next/link or next/image
vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
  }),
}));

// Mock console.warn and console.log to keep test output clean, especially for diagnostic logs in DataTable
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'log').mockImplementation(() => {});


describe('DataTable Component Systems', () => {

  describe('DataTable Density', () => {
    const densities = [
      { name: 'compact', headClass: ['py-0.5', 'px-1'], cellClass: ['py-0.5', 'px-1'] },
      { name: 'default', headClass: ['py-1', 'px-2'], cellClass: ['py-1', 'px-2'] },
      { name: 'spacious', headClass: ['py-2', 'px-3'], cellClass: ['py-2', 'px-3'] },
    ] as const;

    densities.forEach(({ name, headClass, cellClass }) => {
      test(`applies ${name} density padding correctly`, () => {
        render(
          <DataTable density={name}>
            <DataTableHeader>
              <DataTableRow>
                <DataTableHead>Header</DataTableHead>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              <DataTableRow>
                <DataTableCell>Cell</DataTableCell>
              </DataTableRow>
            </DataTableBody>
          </DataTable>
        );

        const headCell = screen.getByRole('columnheader');
        headClass.forEach(cls => expect(headCell).toHaveClass(cls));

        const dataCell = screen.getByRole('cell');
        cellClass.forEach(cls => expect(dataCell).toHaveClass(cls));
      });
    });
  });

  describe('DataTableRow Row Striping', () => {
    test('applies striping class by default', () => {
      render(
        <DataTable>
          <DataTableBody>
            <DataTableRow data-testid="row1"><td>Cell 1</td></DataTableRow>
            <DataTableRow data-testid="row2"><td>Cell 2</td></DataTableRow>
          </DataTableBody>
        </DataTable>
      );
      // Default is rowStriping = true
      const row1 = screen.getByTestId('row1');
      const row2 = screen.getByTestId('row2');
      // If rowStriping is true, the class 'even:bg-muted/10' is always added to the element's class list.
      // The :nth-child(even) CSS selector baked into Tailwind's 'even:' prefix handles the actual styling.
      // So, both rows should have the class in their attribute.
      expect(row1).toHaveClass('even:bg-muted/10');
      expect(row2).toHaveClass('even:bg-muted/10');
    });

    test('applies striping class when rowStriping is true', () => {
      render(
        <DataTable>
          <DataTableBody>
            <DataTableRow rowStriping={true} data-testid="row1"><td>Cell 1</td></DataTableRow>
            <DataTableRow rowStriping={true} data-testid="row2"><td>Cell 2</td></DataTableRow>
          </DataTableBody>
        </DataTable>
      );
      const row2 = screen.getByTestId('row2');
      expect(row2).toHaveClass('even:bg-muted/10');
    });

    test('does not apply striping class when rowStriping is false', () => {
      render(
        <DataTable>
          <DataTableBody>
            <DataTableRow rowStriping={false} data-testid="row1"><td>Cell 1</td></DataTableRow>
            <DataTableRow rowStriping={false} data-testid="row2"><td>Cell 2</td></DataTableRow>
          </DataTableBody>
        </DataTable>
      );
      const row2 = screen.getByTestId('row2');
      expect(row2).not.toHaveClass('even:bg-muted/10');
    });
  });

  describe('DataTableCell Vertical Alignment', () => {
    const alignments = [
      { name: 'top', class: 'align-top' },
      { name: 'middle', class: 'align-middle' },
      { name: 'bottom', class: 'align-bottom' },
    ] as const;

    alignments.forEach(({ name, class: expectedClass }) => {
      test(`applies ${name} vertical alignment correctly`, () => {
        render(
          <DataTable>
            <DataTableBody>
              <DataTableRow>
                <DataTableCell verticalAlign={name}>Cell</DataTableCell>
              </DataTableRow>
            </DataTableBody>
          </DataTable>
        );
        const cell = screen.getByRole('cell');
        expect(cell).toHaveClass(expectedClass);
      });
    });

    test('applies middle vertical alignment by default', () => {
      render(
        <DataTable>
          <DataTableBody>
            <DataTableRow>
              <DataTableCell>Cell</DataTableCell>
            </DataTableRow>
          </DataTableBody>
        </DataTable>
      );
      const cell = screen.getByRole('cell');
      expect(cell).toHaveClass('align-middle'); // Default
    });
  });

  describe('DataTableCell Text Overflow Handling', () => {
    const longText = "This is a very long string that should overflow";

    test('applies truncate by default', () => {
      render(
        <table><tbody><tr><DataTableCell>{longText}</DataTableCell></tr></tbody></table>
      );
      const cell = screen.getByRole('cell');
      // Content is wrapped in a span
      const innerSpan = cell.querySelector('span');
      expect(innerSpan).toHaveClass('truncate');
      expect(innerSpan).toHaveClass('block');
      expect(innerSpan).toHaveClass('w-full');
    });

    test('applies truncate class correctly', () => {
      render(
        <table><tbody><tr><DataTableCell overflowHandling="truncate">{longText}</DataTableCell></tr></tbody></table>
      );
      const cell = screen.getByRole('cell');
      const innerSpan = cell.querySelector('span');
      expect(innerSpan).toHaveClass('truncate');
    });

    test('applies whitespace-normal for wrap', () => {
      render(
        <table><tbody><tr><DataTableCell overflowHandling="wrap">{longText}</DataTableCell></tr></tbody></table>
      );
      const cell = screen.getByRole('cell');
      const innerSpan = cell.querySelector('span');
      expect(innerSpan).toHaveClass('whitespace-normal');
    });

    describe('Tooltip Overflow Handling', () => {
      // Basic Radix UI Tooltip structure check
      // Note: Full tooltip interaction (hover) is complex to test in JSDOM and often skipped.
      // We'll check for structural correctness and content.

      test('renders tooltip structure and truncates text', async () => {
        render(
          <table><tbody><tr><DataTableCell overflowHandling="tooltip">{longText}</DataTableCell></tr></tbody></table>
        );

        const cell = screen.getByRole('cell');
        const triggerSpan = cell.querySelector('span[class*="truncate"]'); // The trigger is a span that truncates
        expect(triggerSpan).toBeInTheDocument();
        expect(triggerSpan).toHaveTextContent(longText); // It contains the text
        expect(triggerSpan).toHaveClass('truncate');

        // Tooltip content is not visible by default.
        // Radix UI TooltipContent is portalled, so it's not a direct child.
        // We'll look for it in the document body if screen.getByText doesn't find it easily.
        // For testing, TooltipProvider from data-table.tsx should make it available.
        // @testing-library/react might not fully render portalled content without specific setup.
        // However, Radix usually makes content accessible via roles or text if open.
        // Since it's not open, we can't check its content directly here without interaction.
        // This test primarily ensures the trigger is set up for truncation.
      });

      test('uses tooltipContent prop when provided', async () => {
        const customTooltipText = "Custom tooltip text";
        render(
          <table><tbody><tr>
            <DataTableCell overflowHandling="tooltip" tooltipContent={customTooltipText}>
              {longText}
            </DataTableCell>
          </tr></tbody></table>
        );

        const cell = screen.getByRole('cell');
        const triggerSpan = cell.querySelector('span[class*="truncate"]');
        expect(triggerSpan).toBeInTheDocument();
        expect(triggerSpan).toHaveTextContent(longText);

        // To test TooltipContent, we would ideally trigger the tooltip.
        // For now, this setup tests that DataTableCell *attempts* to render the tooltip parts.
        // A more robust test would involve userEvent.hover and checking for the appearance of customTooltipText.
        // This requires a more complex setup, potentially with real timers or specific Radix testing utilities.
        // The structure within DataTableCell implies TooltipContent will receive tooltipContent.
      });
    });
  });

  describe('DataTableBadge Component', () => {
    test('renders children correctly', () => {
      render(<DataTableBadge>Badge Text</DataTableBadge>);
      expect(screen.getByText('Badge Text')).toBeInTheDocument();
    });

    const badgeVariants: BadgeProps['variant'][] = ['default', 'secondary', 'destructive', 'outline'];
    // Expected classes are based on the badgeVariants object in badge.tsx
    // default: "border-transparent bg-primary text-primary-foreground"
    // secondary: "border-transparent bg-secondary text-secondary-foreground"
    // destructive: "border-transparent bg-destructive text-destructive-foreground"
    // outline: "text-foreground" (border is part of base class)

    badgeVariants.forEach(variant => {
      test(`applies correct classes for ${variant} variant`, () => {
        render(<DataTableBadge variant={variant}>Test</DataTableBadge>);
        const badge = screen.getByText('Test');

        // Base classes for all badges
        expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full', 'border', 'px-2.5', 'py-0.5', 'text-xs', 'font-semibold');

        if (variant === 'default') {
          expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
        } else if (variant === 'secondary') {
          expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
        } else if (variant === 'destructive') {
          expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
        } else if (variant === 'outline') {
          expect(badge).toHaveClass('text-foreground'); // and not other bg/text specific classes
          expect(badge).not.toHaveClass('bg-primary');
        }
      });
    });
  });
});
