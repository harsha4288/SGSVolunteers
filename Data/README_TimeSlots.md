# Time Slots Implementation

## Overview

This document explains how time slots are handled in the SGS Volunteers application, particularly focusing on the data migration process from Google Forms Excel data to the database.

## Time Slot Formats

The application deals with two different formats for time slots:

1. **Full Descriptive Format**: Used in the Google Form responses for volunteer availability
   - Example: `8th July (Tuesday) - Evening`, `9th July (Wednesday) - Morning`, `10th July (Thursday) - ALL DAY`
   - These are more human-readable and contain day of week information

2. **Short Format**: Used in assignment columns in the Excel file
   - Example: `8th PM`, `9th AM`, `10th Full`
   - These are more concise and used for task assignments

## Database Implementation

In the database, we store both formats to maintain the connection between availability and assignments:

- `slot_name`: Contains the standardized short format (e.g., `8th PM`)
- `description`: Contains the full descriptive format (e.g., `8th July (Tuesday) - Evening`)

This approach ensures that:
1. We have a consistent, unique identifier for each time slot (`slot_name`)
2. We preserve the full descriptive information for display purposes (`description`)
3. We can link both availability and assignments to the same time slot record

## Implementation Details

The data migration script (`DataMigration.py`) handles this mapping through the following process:

1. **Standardized Short Names**: All time slot descriptions (both full and short) are parsed to extract the day number and time period, then converted to a standardized short name format (e.g., `8th PM`).

2. **Best Description Selection**: For each standardized short name, we select the best available description, preferring full descriptive names over short names.

3. **Database Storage**: We store both the standardized short name and the best description in the database, ensuring that each time slot has a unique `slot_name` and the most informative `description` available.

## Example Mapping

| Input Format (from Excel)       | Standardized `slot_name` | Stored `description`           |
|--------------------------------|------------------------|-------------------------------|
| `8th July (Tuesday) - Evening` | `8th PM`               | `8th July (Tuesday) - Evening` |
| `8th PM`                       | `8th PM`               | `8th July (Tuesday) - Evening` |
| `9th July (Wednesday) - Morning` | `9th AM`             | `9th July (Wednesday) - Morning` |
| `9th AM`                       | `9th AM`               | `9th July (Wednesday) - Morning` |
| `10th July (Thursday) - ALL DAY` | `10th Full`          | `10th July (Thursday) - ALL DAY` |
| `10th Full`                    | `10th Full`            | `10th July (Thursday) - ALL DAY` |

## Benefits

This implementation ensures that:

1. Volunteer availability and task assignments are properly linked to the same time slot records
2. The UI can display the most informative description of each time slot
3. The database maintains a clean, normalized structure with unique time slot records
