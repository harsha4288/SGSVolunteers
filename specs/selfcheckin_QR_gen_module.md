# Self Check-In QR Generation Module: Full Functionality Overview

## Purpose

The Self Check-In QR Generation module enables administrators to generate location-based QR codes that volunteers can use for self-service check-in at events. It provides a comprehensive interface for creating, managing, and distributing QR codes with date and seva category validity constraints, reducing admin workload for large-scale events.

## Key Features

- **Location-Based QR Generation**: Create QR codes for specific seva locations with embedded location codes, dates, and category restrictions.
- **Flexible Category Assignment**: Generate generic QR codes for multiple seva categories or independent QR codes for specific tasks (kitchen, food service, etc.).
- **Date-Specific Validity**: QR codes are valid only for specified dates, with automatic AM/PM time slot detection based on system time.
- **Batch Generation**: Create multiple QR codes for different locations and categories simultaneously.
- **Printable Formats**: Generate QR codes in print-ready layouts for physical placement at seva locations.
- **Admin Interface**: Integrated admin dashboard for QR code management within the existing assignments workflow.
- **Validity Information Display**: Clear indication of QR code validity periods, supported seva categories, and usage restrictions.
- **Integration with Existing Systems**: Leverages current QR infrastructure from T-shirt module and integrates with assignments and volunteer management.

## Data Model

- **Location Code**: Unique identifier for each seva location/category combination
- **QR Metadata**: Embedded data structure containing location code, date validity, and supported seva categories
- **Validity Constraints**: Date ranges, time slot restrictions, and category permissions
- **Generation History**: Track created QR codes, their parameters, and usage statistics
- **Category Mapping**: Link between seva categories and their corresponding location codes

## Main Components & Hooks

- `AdminQRGenerator`: Main interface for generating QR codes with category and date selection
- `QRCodeDisplay`: Display generated QR codes with validity information and download options
- `QRBatchGenerator`: Interface for creating multiple QR codes for different locations
- `QRPrintLayout`: Printable format component for physical QR code placement
- `LocationCodeManager`: Management interface for location codes and category mappings
- `useQRGeneration`: Hook for QR code creation, validation, and management
- `useLocationCodes`: Hook for managing location codes and category assignments
- `usePrintableQR`: Hook for generating print-ready QR code layouts

## UI/UX Details

- **Admin Dashboard Integration**: New tab in assignments module for QR code generation
- **Category Selection**: Multi-select interface for choosing seva categories for each QR code
- **Date Picker**: Calendar interface for selecting validity dates
- **QR Preview**: Live preview of generated QR codes with validity information
- **Batch Operations**: Interface for generating multiple QR codes with different parameters
- **Print Layout**: Formatted view optimized for printing and physical placement
- **Validity Indicators**: Clear visual indicators showing QR code validity periods and restrictions
- **Download Options**: Export QR codes as PNG, PDF, or printable layouts
- **Responsive Design**: Mobile-friendly interface for QR code generation and management

## Business Rules

- **Date Validity**: QR codes are valid only for specified dates, preventing misuse across different events
- **Category Restrictions**: Each QR code specifies which seva categories it supports
- **Location Mapping**: Each location code maps to specific seva categories and physical locations
- **Time Slot Detection**: System automatically determines AM/PM based on current time, no separate codes needed
- **Admin-Only Access**: QR code generation restricted to admin users with appropriate permissions
- **Unique Location Codes**: Each seva location has a unique identifier to prevent conflicts
- **Validity Display**: QR codes include clear information about their validity and supported categories
- **Integration Requirements**: Generated QR codes must be compatible with the planned self-check-in interface

## Extensibility

- **Multi-Event Support**: Designed to handle QR codes for multiple events with different date ranges
- **Scalable Location Management**: Support for adding new seva locations and categories
- **Enhanced Analytics**: Foundation for tracking QR code usage and self-check-in statistics
- **Custom Validity Rules**: Extensible framework for adding complex validity constraints
- **Integration Points**: Designed to integrate seamlessly with the planned volunteer self-check-in interface
- **Bulk Operations**: Support for large-scale QR code generation for events with 100+ volunteers
- **Template System**: Reusable QR code templates for common seva category combinations

---

**Dependencies:**
- Existing QR infrastructure from T-shirt module (`qrcode.react`, `html5-qrcode`)
- Assignments module for seva category management
- Volunteer management system for location and category data
- Role-based access control for admin permissions

**Integration Points:**
- `/app/assignments/qr-codes` - New admin interface within assignments module
- Existing admin navigation and permission systems
- Current seva category and event management workflows
- Future self-check-in interface (`/volunteer-checkin/{locationCode}`)

**File Structure:**
```
src/app/app/selfcheckin-qr-gen/
├── components/
│   ├── AdminQRGenerator.tsx
│   ├── QRCodeDisplay.tsx
│   ├── QRBatchGenerator.tsx
│   ├── QRPrintLayout.tsx
│   └── LocationCodeManager.tsx
├── hooks/
│   ├── useQRGeneration.ts
│   ├── useLocationCodes.ts
│   └── usePrintableQR.ts
├── services/
│   ├── qr-generation.service.ts
│   └── location-codes.service.ts
├── utils/
│   └── qr-helpers.ts
├── types.ts
└── page.tsx
```