import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('test framework smoke check', () => {
  it('renders a component and queries it by role', () => {
    render(<button type="button">Click me</button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });
});
