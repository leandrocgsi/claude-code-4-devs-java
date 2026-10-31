import { act, fireEvent, render, screen } from '@testing-library/react';
import { useToastStore } from '@/app/store/modules/global/useToastStore';
import Toast from '../Toast';

describe('Toast', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows nothing while there is no message', () => {
    render(<Toast />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a success message as a status', () => {
    render(<Toast />);

    act(() => useToastStore.getState().show('success', 'Added to your cart.'));

    expect(screen.getByRole('status')).toHaveTextContent('Added to your cart.');
  });

  it('shows an error message as an alert', () => {
    render(<Toast />);

    act(() => useToastStore.getState().show('error', 'Only 2 units are available'));

    expect(screen.getByRole('alert')).toHaveTextContent('Only 2 units are available');
  });

  it('shows an info message as a status', () => {
    render(<Toast />);

    act(() => useToastStore.getState().show('info', 'Heads up'));

    expect(screen.getByRole('status')).toHaveTextContent('Heads up');
  });

  it('stacks several messages in the order they arrived', () => {
    render(<Toast />);

    act(() => {
      useToastStore.getState().show('success', 'First');
      useToastStore.getState().show('error', 'Second');
    });

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Dismiss' })).toHaveLength(2);
  });

  it('dismisses only the message whose button was clicked', () => {
    render(<Toast />);
    act(() => {
      useToastStore.getState().show('success', 'First');
      useToastStore.getState().show('error', 'Second');
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Dismiss' })[0]);

    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('dismisses a message by itself after four seconds', () => {
    vi.useFakeTimers();
    render(<Toast />);
    act(() => useToastStore.getState().show('success', 'Added to your cart.'));

    act(() => vi.advanceTimersByTime(3999));
    expect(screen.getByText('Added to your cart.')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText('Added to your cart.')).not.toBeInTheDocument();
  });

  it('counts the four seconds of each message from its own arrival', () => {
    vi.useFakeTimers();
    render(<Toast />);
    act(() => useToastStore.getState().show('success', 'First'));
    act(() => vi.advanceTimersByTime(3000));
    act(() => useToastStore.getState().show('success', 'Second'));

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3000));
    expect(screen.queryByText('Second')).not.toBeInTheDocument();
  });
});
