import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QrCodeScanner } from '../qr-code-scanner'; // Adjust path as necessary
import * as unifiedTshirtService from '@/app/app/tshirts/services/unified-tshirt-service'; // To mock recordTshirtIssuanceByQr
import { useToast } from '@/components/ui/use-toast'; // To mock toast

// Mock react-qr-reader
vi.mock('react-qr-reader', () => ({
  QrReader: vi.fn((props) => (
    <div data-testid="mock-qr-reader">
      {/* Simulate a scan by calling onResult */}
      <button onClick={() => props.onResult?.({ getText: () => 'scanned-qr-value' } as any, undefined, undefined)}>
        Simulate Scan
      </button>
      <button onClick={() => props.onResult?.(null, new Error('Scan Error'), undefined)}>
        Simulate Scan Error
      </button>
       <button onClick={() => props.onResult?.(undefined, undefined, undefined)}>
        Simulate Empty Scan
      </button>
    </div>
  )),
}));

// Mock the service call
vi.mock('@/app/app/tshirts/services/unified-tshirt-service', () => ({
  recordTshirtIssuanceByQr: vi.fn(),
}));

// Mock useToast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe('QrCodeScanner', () => {
  const mockOnSuccess = vi.fn();
  const mockProfileId = 'test-issuer-profile-id';
  const mockRecordTshirtIssuanceByQr = vi.mocked(unifiedTshirtService.recordTshirtIssuanceByQr);
  const mockToastFn = vi.fn();

  const defaultProps = {
    profileId: mockProfileId,
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the toast mock for each test if useToast is called inside the component
    (useToast as vi.Mock).mockReturnValue({ toast: mockToastFn });
  });

  it('should render QrReader initially', () => {
    render(<QrCodeScanner {...defaultProps} />);
    expect(screen.getByTestId('mock-qr-reader')).toBeInTheDocument();
    expect(screen.queryByText('Scan QR Code')).toBeNull(); // Or check for specific title if any
  });

  it('should call recordTshirtIssuanceByQr on successful scan and show success toast', async () => {
    mockRecordTshirtIssuanceByQr.mockResolvedValueOnce({ data: [{ id: 'issuance-123' }], error: null });
    render(<QrCodeScanner {...defaultProps} />);

    const simulateScanButton = screen.getByText('Simulate Scan');
    fireEvent.click(simulateScanButton);

    await waitFor(() => {
      expect(mockRecordTshirtIssuanceByQr).toHaveBeenCalledWith('scanned-qr-value', mockProfileId);
    });
    await waitFor(() => {
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Success',
        description: 'T-shirt issued successfully for QR: scanned-qr-value',
      }));
    });
    expect(defaultProps.onSuccess).toHaveBeenCalledTimes(1);
    // Scanner should become inactive, "Scan Again" button appears
    expect(screen.getByText('Scan Again')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-qr-reader')).not.toBeInTheDocument();
  });

  it('should show error toast if recordTshirtIssuanceByQr returns an error', async () => {
    mockRecordTshirtIssuanceByQr.mockResolvedValueOnce({ data: null, error: { message: 'Already issued' } });
    render(<QrCodeScanner {...defaultProps} />);

    const simulateScanButton = screen.getByText('Simulate Scan');
    fireEvent.click(simulateScanButton);

    await waitFor(() => {
      expect(mockRecordTshirtIssuanceByQr).toHaveBeenCalledWith('scanned-qr-value', mockProfileId);
    });
    await waitFor(() => {
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error Issuing T-shirt',
        description: 'Already issued',
        variant: 'destructive',
      }));
    });
    expect(defaultProps.onSuccess).not.toHaveBeenCalled();
    expect(screen.getByText('Scan Again')).toBeInTheDocument();
  });

  it('should show error toast if recordTshirtIssuanceByQr throws an exception', async () => {
    mockRecordTshirtIssuanceByQr.mockRejectedValueOnce(new Error('Network failure'));
    render(<QrCodeScanner {...defaultProps} />);

    const simulateScanButton = screen.getByText('Simulate Scan');
    fireEvent.click(simulateScanButton);

    await waitFor(() => {
      expect(mockRecordTshirtIssuanceByQr).toHaveBeenCalledWith('scanned-qr-value', mockProfileId);
    });
    await waitFor(() => {
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error Issuing T-shirt',
        description: 'Network failure', // Or a generic message if error is caught and rephrased
        variant: 'destructive',
      }));
    });
    expect(defaultProps.onSuccess).not.toHaveBeenCalled();
    expect(screen.getByText('Scan Again')).toBeInTheDocument();
  });
  
  it('should show error toast on QrReader scan error', async () => {
    render(<QrCodeScanner {...defaultProps} />);
    const simulateScanErrorButton = screen.getByText('Simulate Scan Error');
    fireEvent.click(simulateScanErrorButton);

    await waitFor(() => {
       expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Scanning Error',
        description: "Error scanning QR code: Scan Error. Please try again.",
        variant: 'destructive',
      }));
    });
    // Depending on design, scanner might stay active or require reset
    expect(screen.getByTestId('mock-qr-reader')).toBeInTheDocument(); // Assuming it stays active or auto-resets
  });


  it('should do nothing if scan result is empty or undefined', async () => {
    render(<QrCodeScanner {...defaultProps} />);
    const simulateEmptyScanButton = screen.getByText('Simulate Empty Scan');
    fireEvent.click(simulateEmptyScanButton);

    await waitFor(() => {
      // Ensure no processing happens
      expect(mockRecordTshirtIssuanceByQr).not.toHaveBeenCalled();
      expect(mockToastFn).not.toHaveBeenCalled(); // Or maybe an info toast, depends on spec
    });
    expect(screen.getByTestId('mock-qr-reader')).toBeInTheDocument(); // Stays active
  });

  it('should allow scanning again after a successful scan', async () => {
    mockRecordTshirtIssuanceByQr.mockResolvedValueOnce({ data: [{ id: 'issuance-123' }], error: null });
    render(<QrCodeScanner {...defaultProps} />);

    // First scan
    fireEvent.click(screen.getByText('Simulate Scan'));
    await waitFor(() => expect(screen.getByText('Scan Again')).toBeInTheDocument());

    // Click "Scan Again"
    fireEvent.click(screen.getByText('Scan Again'));
    await waitFor(() => expect(screen.getByTestId('mock-qr-reader')).toBeInTheDocument());
    expect(screen.queryByText('Scan QR Code')).toBeNull(); // Title might reappear or stay same
    
    // Second scan
    mockRecordTshirtIssuanceByQr.mockResolvedValueOnce({ data: [{ id: 'issuance-456' }], error: null });
    fireEvent.click(screen.getByText('Simulate Scan'));
    await waitFor(() => {
        expect(mockRecordTshirtIssuanceByQr).toHaveBeenCalledTimes(2); // Called again
        expect(mockRecordTshirtIssuanceByQr).toHaveBeenLastCalledWith('scanned-qr-value', mockProfileId);
    });
     await waitFor(() => {
      expect(mockToastFn).toHaveBeenLastCalledWith(expect.objectContaining({
        title: 'Success',
        description: 'T-shirt issued successfully for QR: scanned-qr-value',
      }));
    });
  });
  
  it('should display last scanned QR code after successful scan', async () => {
    mockRecordTshirtIssuanceByQr.mockResolvedValueOnce({ data: [{ id: 'issuance-123' }], error: null });
    render(<QrCodeScanner {...defaultProps} />);

    fireEvent.click(screen.getByText('Simulate Scan'));

    await waitFor(() => {
      // Check if the success message or some part of UI shows the scanned value
      expect(screen.getByText(/Last scanned QR:/i)).toBeInTheDocument();
      expect(screen.getByText('scanned-qr-value')).toBeInTheDocument();
    });
  });
});
