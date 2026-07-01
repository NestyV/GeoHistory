import { render, screen, waitFor } from '@testing-library/react';
import AdminPanel from './page';
import { auth, api } from '@/lib/api';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('@/app/lib/i18n', () => ({
  t: (key: string) => key,
}));

jest.mock('../components/layout/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

jest.mock('../components/layout/AdminNav', () => {
  return function MockAdminNav() {
    return <div data-testid="admin-nav">AdminNav</div>;
  };
});

jest.mock('@/lib/api', () => ({
  auth: {
    getUser: jest.fn(),
  },
  api: {
    getPendingEvents: jest.fn(),
    getFrames: jest.fn(),
    approveEvent: jest.fn(),
    deleteEvent: jest.fn(),
  },
}));

describe('AdminPanel permissions', () => {
  beforeEach(() => {
    pushMock.mockReset();
    (api.getPendingEvents as jest.Mock).mockResolvedValue([]);
    (api.getFrames as jest.Mock).mockResolvedValue([]);
  });

  it('redirects to auth when user is not authenticated', async () => {
    (auth.getUser as jest.Mock).mockReturnValue(null);

    render(<AdminPanel />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/auth');
    });
  });

  it('redirects regular user to map', async () => {
    (auth.getUser as jest.Mock).mockReturnValue({
      id: 'u-1',
      email: 'user@example.com',
      role: 'regular',
    });

    render(<AdminPanel />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/map');
    });
  });

  it('renders pending-events view for curator', async () => {
    (auth.getUser as jest.Mock).mockReturnValue({
      id: 'u-2',
      email: 'curator@example.com',
      role: 'curator',
    });
    (api.getPendingEvents as jest.Mock).mockResolvedValue([
      {
        id: 'event-1',
        title: 'Test pending event',
        description: 'Pending description',
        event_date: '2026-01-01',
        lat: -25,
        lng: -57,
        user_id: 'u-2',
      },
    ]);

    render(<AdminPanel />);

    await waitFor(() => {
      expect(api.getPendingEvents).toHaveBeenCalled();
    });

    expect(screen.getByText('adminPanel')).toBeInTheDocument();
    expect(screen.getByText('pendingEvents (1)')).toBeInTheDocument();
    expect(screen.getByText('Test pending event')).toBeInTheDocument();
    expect(screen.getByText('approve')).toBeInTheDocument();
    expect(screen.getByText('reject')).toBeInTheDocument();
  });
});
