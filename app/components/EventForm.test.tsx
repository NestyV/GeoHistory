import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EventForm from './EventForm';
import { api } from '@/lib/api';

jest.mock('@/app/lib/i18n', () => ({
  t: (key: string) => key,
}));

jest.mock('@/lib/api', () => ({
  api: {
    createEvent: jest.fn(),
  },
}));

describe('EventForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits event payload and triggers success callback', async () => {
    (api.createEvent as jest.Mock).mockResolvedValue({ id: 'evt-1' });

    const onSuccess = jest.fn();
    render(
      <EventForm
        lat={10.1}
        lng={20.2}
        frames={[{ id: 'frame-1', name: 'Modern Era' }]}
        onClose={jest.fn()}
        onSuccess={onSuccess}
      />,
    );

    fireEvent.change(screen.getByLabelText('title'), { target: { value: 'Moon Landing' } });
    fireEvent.change(screen.getByLabelText('date'), { target: { value: '1969-07-20' } });
    fireEvent.change(screen.getByLabelText('description'), { target: { value: 'Apollo 11 mission.' } });
    fireEvent.change(screen.getByLabelText('historicalFrame'), { target: { value: 'frame-1' } });

    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => {
      expect(api.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Moon Landing',
          event_date: '1969-07-20',
          frame_id: 'frame-1',
          lat: 10.1,
          lng: 20.2,
        }),
      );
    });

    expect(onSuccess).toHaveBeenCalled();
  });
});
