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

// Note: The component internally fetches volunteer data and generates QR value.
// The props like 'value', 'volunteerName', 'volunteerRole' are not directly passed.
// Tests need to mock the Supabase client and its data fetching.

describe('QrCodeDisplay', () => {
  let mockSupabaseClient: any;
  const mockVolunteerId = 'test-volunteer-id';
  const mockEventId = 1;
  const mockVolunteerData = {
    id: mockVolunteerId,
    first_name: 'TestF',
    last_name: 'VolunteerL',
    email: 'test@example.com',
  };
  const expectedQrValue = `${mockVolunteerData.email}|${mockVolunteerData.id}`;

  const mockQRCodeSVG = vi.mocked(require('qrcode.react').QRCodeSVG);

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(), // This will be configured per test
    };
  });

  it('should display loading state initially then render QRCodeSVG with fetched data', async () => {
    mockSupabaseClient.single.mockResolvedValueOnce({ data: mockVolunteerData, error: null });
    render(<QrCodeDisplay volunteerId={mockVolunteerId} eventId={mockEventId} supabase={mockSupabaseClient as any} />);

    expect(screen.getByText(/Loading your QR code/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument(); // Skeleton

    await waitFor(() => {
      expect(screen.getByTestId('mock-qrcode-svg')).toBeInTheDocument();
    });

    expect(mockQRCodeSVG).toHaveBeenCalledWith(
      expect.objectContaining({
        value: expectedQrValue,
        size: 180, // Default size in component
        level: 'H',
        includeMargin: true,
      }),
      expect.anything()
    );
    // The component does not display name/role directly, but uses them for QR or download filename.
    // Card title is "Your QR Code"
    expect(screen.getByText('Your QR Code')).toBeInTheDocument();
  });

  it('should show error message if volunteer data fetching fails', async () => {
    mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: { message: 'Fetch error' } });
    render(<QrCodeDisplay volunteerId={mockVolunteerId} eventId={mockEventId} supabase={mockSupabaseClient as any} />);

    await waitFor(() => {
      expect(screen.getByText(/Could not load your QR code/i)).toBeInTheDocument();
    });
    expect(screen.queryByTestId('mock-qrcode-svg')).not.toBeInTheDocument();
  });

  it('should show error message if volunteer data is null after loading', async () => {
    mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null }); // No error, but data is null
    render(<QrCodeDisplay volunteerId={mockVolunteerId} eventId={mockEventId} supabase={mockSupabaseClient as any} />);

    await waitFor(() => {
      expect(screen.getByText(/Could not load your QR code/i)).toBeInTheDocument();
    });
    expect(screen.queryByTestId('mock-qrcode-svg')).not.toBeInTheDocument();
  });

  describe('QR Code Download Functionality', () => {
    let createElementSpy: any;
    let serializeToStringSpy: any;
    let toDataURLSpy: any;
    let clickSpy: any;

    beforeEach(() => {
      clickSpy = vi.fn();
      createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return { click: clickSpy, download: '', href: '' } as any;
        }
        if (tagName === 'canvas') {
          // Mock canvas context and toDataURL
          const mockCtx = { drawImage: vi.fn() };
          toDataURLSpy = vi.fn().mockReturnValue('mock-png-data-url');
          return { getContext: () => mockCtx, toDataURL: toDataURLSpy, width:0, height:0 } as any;
        }
        return document.createElement(tagName); // fallback for other elements if any
      });
      serializeToStringSpy = vi.spyOn(XMLSerializer.prototype, 'serializeToString');

      // Mock Image onload
      vi.spyOn(global, 'Image').mockImplementation(() => {
        const img = {
          onload: null as (() => void) | null,
          src: '',
          width: 200, // Mock width/height
          height: 200,
        };
        // Trigger onload immediately after src is set
        Object.defineProperty(img, 'src', {
            set(value) {
                this._src = value;
                if (img.onload) {
                    img.onload();
                }
            },
            get() { return this._src; }
        });
        return img as HTMLImageElement;
      });
    });

    afterEach(() => {
      createElementSpy.mockRestore();
      serializeToStringSpy.mockRestore();
      if (toDataURLSpy) toDataURLSpy.mockRestore();
      vi.restoreAllMocks(); // Cleans up Image mock
    });

    it('renders download button when QR code is displayed', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: mockVolunteerData, error: null });
      render(<QrCodeDisplay volunteerId={mockVolunteerId} eventId={mockEventId} supabase={mockSupabaseClient as any} />);

      await waitFor(() => expect(screen.getByTestId('mock-qrcode-svg')).toBeInTheDocument());
      expect(screen.getByRole('button', { name: /Download QR Code/i })).toBeInTheDocument();
    });

    it('triggers download with correct filename and data handling on button click', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: mockVolunteerData, error: null });
      render(<QrCodeDisplay volunteerId={mockVolunteerId} eventId={mockEventId} supabase={mockSupabaseClient as any} />);

      await waitFor(() => expect(screen.getByTestId('mock-qrcode-svg')).toBeInTheDocument());
      const downloadButton = screen.getByRole('button', { name: /Download QR Code/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(serializeToStringSpy).toHaveBeenCalled();
        // Check if XMLSerializer was called with an SVGElement (or mock of it)
        const firstArgToSerializer = serializeToStringSpy.mock.calls[0][0];
        expect(firstArgToSerializer.tagName.toLowerCase()).toBe('svg'); // Check if it's an SVG
      });

      await waitFor(() => {
        expect(toDataURLSpy).toHaveBeenCalledWith('image/png');
      });

      expect(createElementSpy).toHaveBeenCalledWith('a');
      const link = createElementSpy.mock.results[0].value; // Get the mocked <a> element
      expect(link.download).toBe(`qrcode-${mockVolunteerData.first_name}-${mockVolunteerData.last_name}.png`);
      expect(link.href).toBe('mock-png-data-url');
      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
