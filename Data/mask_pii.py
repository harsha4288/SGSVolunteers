import pandas as pd
import re
import os
import sys

def identify_sheets_with_pii(file_path):
    """
    Identifies sheets in an Excel file and determines which ones contain emails or phone numbers.
    
    Returns:
        Dictionary with sheet names as keys and PII info as values
    """
    # Check if file exists
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' not found.")
        sys.exit(1)
        
    # Load Excel file (without reading data yet)
    excel_file = pd.ExcelFile(file_path)
    sheet_names = excel_file.sheet_names
    
    print(f"\nFound {len(sheet_names)} sheets in {os.path.basename(file_path)}:")
    for sheet in sheet_names:
        print(f"  - {sheet}")
    
    # Regular expressions for detecting emails and phone numbers
    email_regex = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    phone_regex = r'(\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}'
    
    sheets_with_pii = {}
    
    print("\nAnalyzing sheets for emails and phone numbers...")
    
    # Check each sheet for PII
    for sheet_name in sheet_names:
        try:
            # Read sheet data
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            
            # Convert all columns to string for regex matching
            df_str = df.astype(str)
            
            # Check for emails and phone numbers
            has_email = False
            has_phone = False
            
            # List to store column names with PII
            email_columns = []
            phone_columns = []
            
            for column in df_str.columns:
                # Check for emails
                if df_str[column].str.contains(email_regex, regex=True, na=False).any():
                    has_email = True
                    email_columns.append(column)
                
                # Check for phone numbers
                if df_str[column].str.contains(phone_regex, regex=True, na=False).any():
                    has_phone = True
                    phone_columns.append(column)
            
            if has_email or has_phone:
                sheets_with_pii[sheet_name] = {
                    'has_email': has_email,
                    'has_phone': has_phone,
                    'email_columns': email_columns,
                    'phone_columns': phone_columns
                }
        except Exception as e:
            print(f"Error analyzing sheet '{sheet_name}': {e}")
    
    return sheets_with_pii

def mask_email(email):
    """Masks an email address by hiding most of the username."""
    if not isinstance(email, str):
        return email
    
    match = re.search(r'([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', email)
    if not match:
        return email
    
    username = match.group(1)
    domain = match.group(2)
    
    if len(username) <= 2:
        masked_username = username  # Don't mask very short usernames
    else:
        masked_username = username[0] + '*' * (len(username) - 2) + username[-1]
    
    return f"{masked_username}@{domain}"

def mask_phone(phone):
    """Masks a phone number, keeping only the last 4 digits visible."""
    if not isinstance(phone, str):
        return phone
    
    # Find the phone number in the string
    match = re.search(r'(\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}', phone)
    if not match:
        return phone
    
    # Extract the matched phone number
    phone_number = match.group(0)
    
    # Mask all digits except the last 4
    masked = re.sub(r'\d(?=\d{4})', '*', phone_number)
    
    # Replace the original phone number with the masked version
    return phone.replace(phone_number, masked)

def mask_pii_in_excel(file_path, output_path=None):
    """
    Masks emails and phone numbers in an Excel file and saves to a new file.
    
    Args:
        file_path: Path to the Excel file
        output_path: Path to save the masked file (default: adds '_masked' to original filename)
    """
    if output_path is None:
        file_dir, file_name = os.path.split(file_path)
        file_base, file_ext = os.path.splitext(file_name)
        output_path = os.path.join(file_dir, f"{file_base}_masked{file_ext}")
    
    # Get sheets with PII
    sheets_with_pii = identify_sheets_with_pii(file_path)
    
    if not sheets_with_pii:
        print("\nNo emails or phone numbers found in any sheet.")
        return
    
    print("\nSheets containing PII:")
    for sheet_name, pii_info in sheets_with_pii.items():
        pii_types = []
        if pii_info['has_email']:
            pii_types.append(f"emails in columns: {', '.join(str(col) for col in pii_info['email_columns'])}")
        if pii_info['has_phone']:
            pii_types.append(f"phone numbers in columns: {', '.join(str(col) for col in pii_info['phone_columns'])}")
        
        print(f"  - {sheet_name}: {' and '.join(pii_types)}")
    
    # Create Excel writer
    with pd.ExcelWriter(output_path) as writer:
        excel_file = pd.ExcelFile(file_path)
        
        print("\nMasking PII in sheets...")
        for sheet_name in excel_file.sheet_names:
            # Read the sheet
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            
            # If this sheet has PII, mask it
            if sheet_name in sheets_with_pii:
                pii_info = sheets_with_pii[sheet_name]
                
                # Mask emails
                if pii_info['has_email']:
                    for col in pii_info['email_columns']:
                        if col in df.columns:
                            df[col] = df[col].astype(str).apply(mask_email)
                
                # Mask phone numbers
                if pii_info['has_phone']:
                    for col in pii_info['phone_columns']:
                        if col in df.columns:
                            df[col] = df[col].astype(str).apply(mask_phone)
                
                print(f"  - Masked PII in sheet '{sheet_name}'")
            
            # Write the sheet to the output file
            df.to_excel(writer, sheet_name=sheet_name, index=False)
    
    print(f"\nMasked file saved to: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python mask_pii.py <excel_file_path> [output_file_path]")
        sys.exit(1)
    
    file_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    print(f"Processing file: {file_path}")
    mask_pii_in_excel(file_path, output_path)
