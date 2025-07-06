# Self Check-In QR Generation Module: Full Functionality Overview

## Progress Status: ✅ Mockup Complete - Ready for Implementation

**Current Phase:** UI/UX Design Complete  
**Next Phase:** React Component Implementation  
**Completion:** Mockup6.html finalized and approved

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

## UI/UX Details - ✅ FINALIZED in mockup6.html

### Core Interface Design (Based on Approved Mockup)
- **Check-in Spots as Containers**: Primary concept where physical locations act as QR code containers
- **Drag & Drop Workflow**: Seva categories are dragged INTO check-in spots (not separate QR cards)
- **Inline CRUD Operations**: Direct editing of spot titles/descriptions without separate management panels
- **Smart QR Logic**: 1 seva = Independent QR, 2+ sevas = Shared QR (automatic determination)
- **Single Page Overview**: All functionality visible in one interface without tabs

### Left Sidebar (Simplified)
- **Seva Categories Grid**: Draggable 2-column grid of seva types
- **Instructions Panel**: Built-in help explaining the workflow
- **No Separate Management**: Removed complex spot management interface

### Right Main Area
- **Check-in Spot Cards**: Physical locations with inline editing capabilities
- **Add New Spot Card**: Large ➕ card for creating new locations
- **Direct Title/Description Editing**: Click to edit inline with Enter/Esc support
- **Hover Actions**: Edit/Delete buttons appear on hover
- **Drop Zones**: Visual feedback when dragging seva categories

### QR Generation Features
- **Date Picker**: Event date selection in header
- **Status Indicators**: Visual dots (Ready/Pending/Empty) with real-time updates
- **Batch Operations**: Generate All, Print All, Clear All, Save Config buttons
- **Status Bar**: Live count of generated/pending/empty spots
- **Print Preview**: Modal for print-ready layouts

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

## Implementation Plan - Next Steps

### Phase 1: Core React Components (Next)
1. **QRCheckInSpotsManager** - Main container component
2. **SevaGrid** - Left sidebar with draggable seva categories  
3. **CheckInSpotCard** - Individual spot cards with inline editing
4. **AddSpotCard** - New spot creation interface
5. **QRGenerationSection** - QR preview and actions per spot

### Phase 2: Hooks & Services
1. **useCheckInSpots** - CRUD operations for spots
2. **useSevaAssignment** - Drag & drop logic for assigning sevas to spots
3. **useQRGeneration** - QR code creation and management
4. **useInlineEditing** - Title/description editing functionality

### Phase 3: Integration
1. **Route Setup** - `/app/selfcheckin-qr-gen/page.tsx`
2. **Navigation Integration** - Add to admin menu
3. **Permission Guards** - Admin-only access
4. **Database Schema** - Tables for spots, QR codes, assignments

**File Structure (Updated):**
```
src/app/app/selfcheckin-qr-gen/
├── components/
│   ├── QRCheckInSpotsManager.tsx (main interface)
│   ├── SevaGrid.tsx (sidebar with draggable items)
│   ├── CheckInSpotCard.tsx (individual spot with editing)
│   ├── AddSpotCard.tsx (new spot creation)
│   ├── QRGenerationSection.tsx (QR preview & actions)
│   └── PrintModal.tsx (print preview)
├── hooks/
│   ├── useCheckInSpots.ts (spot CRUD operations)
│   ├── useSevaAssignment.ts (drag & drop logic)
│   ├── useQRGeneration.ts (QR creation)
│   └── useInlineEditing.ts (edit functionality)
├── services/
│   ├── checkin-spots.service.ts
│   └── qr-generation.service.ts
├── utils/
│   └── qr-helpers.ts
├── types.ts
└── page.tsx
```

## Design Assets
- **✅ mockup6.html** - Final approved interface design
- **📋 User workflow** - Check-in spots as containers approach
- **🎨 Visual design** - Simplified single-page interface