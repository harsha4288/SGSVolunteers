import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QrCodeDisplay } from '../qr-code-display'; // Adjust path as necessary

// Mock qrcode.react
vi.mock('qrcode.react', () => ({
  QRCodeSVG: vi.fn((props) => (
    <svg data-testid="mock-qrcode-svg">
      <rect width={props.size} height={props.size} />
      <text x="10" y="20">
        Value: {props.value}
      </text>
      {props.imageSettings && (
        <image
          href={props.imageSettings.src}
          x={props.imageSettings.x}
          y={props.imageSettings.y}
          height={props.imageSettings.height}
          width={props.imageSettings.width}
        />
      )}
    </svg>
  )),
}));

describe('QrCodeDisplay', () => {
  const defaultProps = {
    value: 'test-qr-value',
    size: 128,
    volunteerName: 'Test Volunteer',
    volunteerRole: 'Volunteer',
    loading: false,
  };
  const mockQRCodeSVG = vi.mocked(require('qrcode.react').QRCodeSVG);


  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render QRCodeSVG with correct props when not loading and value is present', () => {
    render(<QrCodeDisplay {...defaultProps} />);

    expect(screen.getByTestId('mock-qrcode-svg')).toBeInTheDocument();
    expect(mockQRCodeSVG).toHaveBeenCalledWith(
      expect.objectContaining({
        value: defaultProps.value,
        size: defaultProps.size,
        level: 'H', // Default level
        imageSettings: expect.objectContaining({
          src: expect.stringContaining('amrita_logo_black_bg_white.png'), // Check if logo path is included
          height: defaultProps.size * 0.2, // Example: 20% of size
          width: defaultProps.size * 0.2,
          excavate: true,
        }),
      }),
      expect.anything() // For ref or other internal props
    );
    expect(screen.getByText(defaultProps.volunteerName)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.volunteerRole)).toBeInTheDocument();
    expect(screen.queryByText(/Loading QR Code/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/QR code value is missing/i)).not.toBeInTheDocument();
  });

  it('should display loading state when loading is true', () => {
    render(<QrCodeDisplay {...defaultProps} loading={true} />);

    expect(screen.getByText(/Loading QR Code/i)).toBeInTheDocument();
    expect(screen.queryByTestId('mock-qrcode-svg')).not.toBeInTheDocument();
    expect(screen.queryByText(defaultProps.volunteerName)).not.toBeInTheDocument();
  });
  
  it('should display loading state when value is empty and not explicitly loading (initial state)', () => {
    // This simulates the initial state where value might not be fetched yet.
    // The component internally treats empty value as a loading-like state if not explicitly erroring.
    render(<QrCodeDisplay {...defaultProps} value="" loading={false} />);

    expect(screen.getByText(/Loading QR Code/i)).toBeInTheDocument(); // Or a specific "generating" message
    expect(screen.queryByTestId('mock-qrcode-svg')).not.toBeInTheDocument();
  });


  it('should display error message when value is null after loading (explicit error)', () => {
    // To test the explicit error for null/empty value post-loading,
    // the component would need a state to differentiate initial load from a load-attempt-failed.
    // Assuming the component shows "QR code value is missing" if loading=false and value is empty.
    // The previous test covers empty value -> loading. This covers if parent explicitly says "not loading" but value is still bad.
    // This might be a slightly redundant test depending on component's internal logic,
    // but it ensures that if `loading` prop is definitively false and `value` is bad, an error is shown.
    render(<QrCodeDisplay {...defaultProps} value={null as any} loading={false} />); // Cast null as any to satisfy type, then test runtime

    expect(screen.getByText(/QR code value is missing or invalid/i)).toBeInTheDocument();
    expect(screen.queryByTestId('mock-qrcode-svg')).not.toBeInTheDocument();
  });
  
  it('should display error message when value is an empty string after loading (explicit error)', () => {
    render(<QrCodeDisplay {...defaultProps} value="" loading={false} />);
     // If value is empty string AND loading is false, it's treated as an error after attempting to load.
    expect(screen.getByText(/QR code value is missing or invalid/i)).toBeInTheDocument();
    expect(screen.queryByTestId('mock-qrcode-svg')).not.toBeInTheDocument();
  });


  it('should render without volunteer name and role if not provided', () => {
    render(<QrCodeDisplay {...defaultProps} volunteerName={undefined} volunteerRole={undefined} />);

    expect(screen.getByTestId('mock-qrcode-svg')).toBeInTheDocument();
    expect(mockQRCodeSVG).toHaveBeenCalledWith(
      expect.objectContaining({ value: defaultProps.value }),
      expect.anything()
    );
    expect(screen.queryByText(defaultProps.volunteerName)).not.toBeInTheDocument();
    expect(screen.queryByText(defaultProps.volunteerRole)).not.toBeInTheDocument();
  });
  
  it('should pass correct imageSettings to QRCodeSVG', () => {
    render(<QrCodeDisplay {...defaultProps} />);
    const expectedImageHeight = defaultProps.size * 0.2; // Example: 20% of size
    const expectedImageWidth = defaultProps.size * 0.2;

    expect(mockQRCodeSVG).toHaveBeenCalledWith(
      expect.objectContaining({
        imageSettings: {
          src: expect.stringContaining('amrita_logo_black_bg_white.png'),
          height: expectedImageHeight,
          width: expectedImageWidth,
          excavate: true,
          x: defaultProps.size / 2 - expectedImageWidth / 2, // Centered
          y: defaultProps.size / 2 - expectedImageHeight / 2, // Centered
        },
      }),
      expect.anything()
    );
  });
});
