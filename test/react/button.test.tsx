import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeTruthy();
    expect(button.className).toMatch(/bg-slate-900/);
  });

  it('renders with different variants', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button.className).toMatch(/bg-red-500/);
  });

  it('renders with different sizes', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button', { name: 'Small' });
    expect(button.className).toMatch(/h-9/);
  });

  it('renders as a link when variant is link', () => {
    render(<Button variant="link">Link button</Button>);
    const button = screen.getByRole('button', { name: 'Link button' });
    expect(button.className).toMatch(/underline-offset-4/);
  });

  it('handles disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button', { name: 'Disabled' });
    expect(button.disabled).toBe(true);
    expect(button.className).toMatch(/disabled:opacity-50/);
  });

  it('renders with asChild prop using Slot', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const link = screen.getByRole('link', { name: 'Link Button' });
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/test');
  });
});