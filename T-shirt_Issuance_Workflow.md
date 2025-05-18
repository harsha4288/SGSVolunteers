# T-shirt Issuance Workflow

## Overview

The T-shirt issuance workflow consists of the following main components:

1. **Volunteer T-shirt Size Preference Collection**
   - Volunteers specify their preferred T-shirt size
   - This information is stored in the `volunteers` table

2. **QR Code Generation**
   - Volunteers can generate a QR code containing their volunteer ID
   - This QR code is used for T-shirt issuance

3. **T-shirt Inventory Management**
   - Admins manage T-shirt inventory by size
   - System tracks available quantities

4. **T-shirt Issuance Process**
   - Help desk staff scan volunteer QR codes
   - System validates the QR code and retrieves volunteer information
   - Staff selects the appropriate T-shirt size from inventory
   - System records the issuance and updates inventory

## Detailed Workflow

### 1. Volunteer T-shirt Size Preference Collection

#### Database:
- `volunteers` table with `tshirt_size_preference` column
- `tshirt_sizes` table with standardized sizes

#### UI Components:
- **Profile Settings Page**:
  - Add T-shirt size preference dropdown to volunteer profile settings
  - Allow volunteers to update their preference

- **Registration Form**:
  - Include T-shirt size preference in the initial registration form
  - Pre-populate from Google Form data if available

#### Implementation Steps:
1. Add T-shirt size preference field to volunteer profile form
2. Update database when preference is saved
3. Display current preference in profile view

### 2. QR Code Generation

#### Database:
- `volunteer_qr_codes` table to store generated QR codes
- Functions for generating and validating QR codes

#### UI Components:
- **My QR Codes Page**:
  - Button to generate a new QR code
  - Display of generated QR code (as image)
  - Option to download or share QR code
  - Status of QR code (used/unused, expiration)

#### Implementation Steps:
1. Create QR code generation endpoint
2. Implement QR code display component using a library like `qrcode.react`
3. Add download/share functionality
4. Implement QR code status tracking

### 3. T-shirt Inventory Management

#### Database:
- `tshirt_inventory` table linked to `tshirt_sizes`
- Tracking of initial and current quantities

#### UI Components:
- **Inventory Management Page** (Admin/Team Lead):
  - Table of T-shirt sizes and quantities
  - Form to add/update inventory
  - Inventory status indicators (low stock, out of stock)
  - Filtering and sorting options

#### Implementation Steps:
1. Enhance existing inventory page with CRUD operations
2. Add inventory status indicators
3. Implement inventory reports

### 4. T-shirt Issuance Process

#### Database:
- `tshirt_issuances` table to record issuances
- Functions to update inventory when T-shirts are issued

#### UI Components:
- **QR Scanner Page** (Admin/Team Lead):
  - Camera access for QR code scanning
  - Volunteer information display after scanning
  - T-shirt size selection based on inventory
  - Confirmation button for issuance

- **Manual Issuance Page** (Admin/Team Lead):
  - Volunteer search functionality
  - T-shirt size selection
  - Confirmation for manual issuance

#### Implementation Steps:
1. Enhance existing QR scanner with actual QR code library
2. Implement validation of scanned QR codes
3. Update inventory tracking when T-shirts are issued
4. Add manual issuance option for fallback

## User Flows

### Volunteer Flow:
1. Volunteer logs into the system
2. Updates profile with T-shirt size preference
3. Navigates to "My QR Codes" page
4. Generates a QR code for T-shirt issuance
5. Downloads or displays QR code on mobile device
6. Presents QR code at help desk for T-shirt issuance

### Admin/Team Lead Flow:
1. Admin logs into the system
2. Navigates to T-shirt inventory page to check stock
3. Updates inventory as needed
4. Navigates to QR scanner page
5. Scans volunteer's QR code
6. Verifies volunteer information
7. Selects appropriate T-shirt size from inventory
8. Confirms issuance
9. System updates inventory and records issuance

## Technical Implementation

### QR Code Format:
- QR code data format: `{volunteer_id}|{timestamp}|{random_string}`
- Encoded as a URL-safe string
- Can include additional metadata as needed

### Security Considerations:
- QR codes should be time-limited (expiration)
- QR codes should be single-use
- Validation should check volunteer status and event association

### Offline Support:
- Consider implementing offline scanning capability
- Queue issuances for sync when back online
- Provide manual issuance option as fallback

## Reporting

- **Issuance Reports**:
  - Total T-shirts issued by size
  - Issuance history by volunteer
  - Issuance history by admin/team lead

- **Inventory Reports**:
  - Current inventory levels
  - Inventory changes over time
  - Projected needs based on volunteer preferences

## Future Enhancements

1. **Multiple T-shirt Types**:
   - Support for different T-shirt types (e.g., event-specific, role-specific)
   - Different color options

2. **Batch Issuance**:
   - Support for issuing T-shirts to groups (e.g., families)

3. **Integration with Check-in**:
   - Combine T-shirt issuance with volunteer check-in process

4. **Automated Notifications**:
   - Notify volunteers when T-shirts are ready for pickup
   - Remind volunteers to generate QR codes
