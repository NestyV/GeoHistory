import { act, render, screen, waitFor } from '@testing-library/react';
import Map from './Map';
import { api, auth } from '@/lib/api';

let mapHandlers: any = null;

jest.mock('leaflet', () => ({
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: jest.fn(),
    },
  },
  latLng: (lat: number, lng: number) => ({ lat, lng }),
}));

jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: any) => <div>{children}</div>,
  Popup: ({ children }: any) => <div>{children}</div>,
  useMapEvents: (handlers: any) => {
    mapHandlers = handlers;
    return {
      getCenter: () => ({ lat: 0, lng: 0 }),
      getZoom: () => 3,
    };
  },
}));

jest.mock('./EventForm', () => {
  return function MockEventForm() {
    return <div>event-form-open</div>;
  };
});

jest.mock('./OptimizedImage', () => {
  return function MockOptimizedImage(props: any) {
    return <div data-testid="mock-optimized-image">{props.alt || 'optimized'}</div>;
  };
});

jest.mock('@/app/lib/i18n', () => ({
  t: (key: string) => key,
}));

jest.mock('@/lib/api', () => ({
  auth: {
    getUser: jest.fn(),
  },
  api: {
    getEvents: jest.fn(),
    getFrames: jest.fn(),
    getCharacters: jest.fn(),
    getUserPreferences: jest.fn(),
    saveUserPreferences: jest.fn(),
  },
}));

describe('Map interaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mapHandlers = null;
    localStorage.setItem('auth_token', 'test-token');
    (auth.getUser as jest.Mock).mockReturnValue({
      id: 'u-1',
      email: 'u@example.com',
      role: 'regular',
    });
    (api.getEvents as jest.Mock).mockResolvedValue([]);
    (api.getFrames as jest.Mock).mockResolvedValue([{ id: 'f-1', name: 'Frame 1' }]);
    (api.getCharacters as jest.Mock).mockResolvedValue([]);
    (api.getUserPreferences as jest.Mock).mockResolvedValue({ hasPreferences: false });
    (api.saveUserPreferences as jest.Mock).mockResolvedValue({ ok: true });
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hasPreferences: false }),
    });
  });

  it('opens EventForm on map contextmenu for authenticated user', async () => {
    render(<Map />);

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    await act(async () => {
      mapHandlers.contextmenu({
        latlng: { lat: -25.3, lng: -57.6 },
        originalEvent: {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        },
      });
    });

    expect(screen.getByText('event-form-open')).toBeInTheDocument();
  });
});
