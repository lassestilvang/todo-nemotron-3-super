import { render, screen } from '@testing-library/react';
import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeTruthy();
  });

  it('renders with an aria-label', () => {
    render(<Input aria-label="Username" />);
    const input = screen.getByLabelText('Username');
    expect(input).toBeTruthy();
  });

  it('handles disabled state', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input.disabled).toBe(true);
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toMatch(/custom-class/);
  });

  it('renders as a controlled input', () => {
    render(<Input value="test value" readOnly />);
    const input = screen.getByRole('textbox');
    expect(input.value).toBe('test value');
  });
});