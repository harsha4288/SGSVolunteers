import pandas as pd
import re
import os
import sys
import warnings

# Filter out specific warnings that don't affect functionality
warnings.filterwarnings("ignore", category=UserWarning, 
                        message="This pattern is interpreted as a regular expression, and has match groups.*")

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
        
    # Load Excel file with more robust options to handle date/number formats
    excel_file = pd.ExcelFile(file_path)
    sheet_names = excel_file.sheet_names
    
    print(f"\nFound {len(sheet_names)} sheets in {os.path.basename(file_path)}:")
    for sheet in sheet_names:
        print(f"  - {sheet}")
    
    # Regular expressions for detecting emails and phone numbers
    # More comprehensive patterns to handle various formats
    email_regex = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    # Updated phone regex to handle more formats
    phone_regex = r'(\+\d{1,3}[-\s.]?)?\(?\d{3}\)?[-\s.]?\d{3}[-\s.]?\d{4}|\d{10}'
    
    sheets_with_pii = {}
    
    print("\nAnalyzing sheets for emails and phone numbers...")
    
    # Check each sheet for PII
    for sheet_name in sheet_names:
        try:
            # Read sheet data with options to handle problematic cells
            # Using converters to ensure phone numbers are read as strings
            df = pd.read_excel(
                excel_file, 
                sheet_name=sheet_name,
                dtype=str,  # Read all columns as strings initially
                na_filter=False  # Don't convert empty cells to NaN
            )
            
            # Check for emails and phone numbers
            has_email = False
            has_phone = False
            
            # List to store column names with PII
            email_columns = []
            phone_columns = []
            
            for column in df.columns:
                # Check for emails
                if df[column].astype(str).str.contains(email_regex, regex=True, na=False).any():
                    has_email = True
                    email_columns.append(column)
                
                # Check for phone numbers
                if df[column].astype(str).str.contains(phone_regex, regex=True, na=False).any():
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
    if not isinstance(email, str) or email == 'nan':
        return email
    
    # Find all email addresses in the text
    matches = re.findall(r'([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', email)
    
    if not matches:
        return email
    
    masked_email = email
    for username, domain in matches:
        if len(username) <= 2:
            masked_username = username  # Don't mask very short usernames
        else:
            masked_username = username[0] + '*' * (len(username) - 2) + username[-1]
        
        original_email = f"{username}@{domain}"
        masked_email = masked_email.replace(original_email, f"{masked_username}@{domain}")
    
    return masked_email

def mask_phone(phone):
    """Masks a phone number, keeping only the last 4 digits visible."""
    if not isinstance(phone, str) or phone == 'nan':
        return phone
    
    # More comprehensive pattern to find phone numbers in various formats
    pattern = r'(\+\d{1,3}[-\s.]?)?\(?\d{3}\)?[-\s.]?\d{3}[-\s.]?\d{4}|\d{10}'
    
    # Find all phone numbers in the text
    matches = re.finditer(pattern, phone)
    
    if not matches:
        return phone
    
    masked_phone = phone
    for match in matches:
        original_phone = match.group(0)
        # Mask all digits except the last 4
        masked = re.sub(r'\d(?=\d{4})', '*', original_phone)
        masked_phone = masked_phone.replace(original_phone, masked)
    
    return masked_phone

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
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        excel_file = pd.ExcelFile(file_path)
        
        print("\nMasking PII in sheets...")
        
        # First, read all sheets to retain formatting
        all_dfs = {}
        for sheet_name in excel_file.sheet_names:
            all_dfs[sheet_name] = pd.read_excel(
                excel_file, 
                sheet_name=sheet_name,
                dtype=str,  # Read all cells as strings to avoid date conversion issues
                na_filter=False  # Don't convert empty cells to NaN
            )
        
        # Process and write each sheet
        for sheet_name, df in all_dfs.items():
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
