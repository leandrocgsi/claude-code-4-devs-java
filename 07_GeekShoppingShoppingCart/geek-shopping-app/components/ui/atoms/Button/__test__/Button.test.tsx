import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Button from '../Button';

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Details</Button>);
    expect(screen.getByRole('button', { name: 'Details' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Details</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Details
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
