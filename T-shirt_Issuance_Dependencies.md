# T-shirt Issuance Dependencies

To implement the T-shirt issuance functionality, you'll need to install the following npm packages:

```bash
npm install qrcode.react html5-qrcode
```

## Package Details

### qrcode.react

This package provides a React component for generating QR codes. It's used in the `QRCodeGenerator` component to display QR codes for volunteers.

**Usage Example:**
```jsx
import QRCode from 'qrcode.react';

<QRCode
  id="qr-code-canvas"
  value={qrCodeData}
  size={200}
  level="H"
  includeMargin={true}
/>
```

### html5-qrcode

This package provides a QR code scanner that works in the browser. It's used in the `QrScannerSection` component to scan QR codes presented by volunteers.

**Usage Example:**
```jsx
import { Html5Qrcode } from "html5-qrcode";

const html5QrCode = new Html5Qrcode("qr-reader");
html5QrCode.start(
  { facingMode: "environment" },
  {
    fps: 10,
    qrbox: { width: 250, height: 250 }
  },
  (decodedText) => {
    // QR code detected and decoded
    handleDetected(decodedText);
    html5QrCode.stop();
  },
  (errorMessage) => {
    // QR code detection error (usually just means no QR code in view)
    console.log(errorMessage);
  }
);
```

## Implementation Notes

1. In the `QRCodeGenerator` component, uncomment the QRCode import and component usage once the package is installed.

2. In the `QrScannerSection` component, replace the simulation code with actual QR code scanning using the html5-qrcode library.

3. Make sure to handle camera permissions properly, as the QR code scanner requires access to the device's camera.

4. Test the QR code generation and scanning functionality thoroughly to ensure it works correctly on different devices and browsers.

## Browser Compatibility

Both packages have good browser compatibility, but you should test on the specific browsers and devices your users will be using. In particular, camera access can sometimes be problematic on certain browsers or devices.

## Security Considerations

1. QR codes should be validated on the server side to prevent tampering.
2. Consider implementing expiration for QR codes to limit their validity period.
3. Implement single-use QR codes to prevent multiple uses of the same code.

These security measures are already implemented in the database functions we've created.
