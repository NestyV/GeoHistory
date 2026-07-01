import { render, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import AdminPanel from './admin/page';
import Navbar from './components/layout/Navbar';
import { auth, api } from '@/lib/api';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  usePathname: () => '/admin',
}));

jest.mock('next/link', () => {
  return function MockNextLink({ children, href, ...rest }: any) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
});

jest.mock('@/app/lib/i18n', () => ({
  t: (key: string) => key,
  languages: [
    { code: 'es', name: 'Espanol', flag: 'ES' },
    { code: 'en', name: 'English', flag: 'EN' },
    { code: 'pt', name: 'Portugues', flag: 'PT' },
  ],
}));

jest.mock('@/lib/api', () => ({
  auth: {
    getUser: jest.fn(),
    onAuthChange: jest.fn(() => () => undefined),
    logout: jest.fn(async () => ({ error: null })),
  },
  api: {
    getPendingEvents: jest.fn(),
    getFrames: jest.fn(),
    approveEvent: jest.fn(),
    deleteEvent: jest.fn(),
  },
}));

describe('Frontend accessibility checks', () => {
  beforeEach(() => {
    pushMock.mockReset();
    (api.getPendingEvents as jest.Mock).mockResolvedValue([]);
    (api.getFrames as jest.Mock).mockResolvedValue([]);
  });

  it('Navbar (logged-out state) has no critical axe violations', async () => {
    (auth.getUser as jest.Mock).mockReturnValue(null);

    const { container } = render(<Navbar />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('Admin page curator state has no critical axe violations', async () => {
    (auth.getUser as jest.Mock).mockReturnValue({
      id: 'cur-1',
      email: 'curator@example.com',
      role: 'curator',
    });

    const { container } = render(<AdminPanel />);

    await waitFor(() => {
      expect(api.getPendingEvents).toHaveBeenCalled();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
