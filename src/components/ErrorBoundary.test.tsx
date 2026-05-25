import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

function Bomb(): React.ReactNode {
  throw new Error('💥');
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: string }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode; fallback?: string }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error('Caught:', error.message);
  }
  render() {
    if (this.state.error) {
      return <div role="alert">{this.props.fallback ?? 'Something went wrong'}</div>;
    }
    return this.props.children;
  }
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(<ErrorBoundary><div>Hello</div></ErrorBoundary>);
    expect(screen.getByText('Hello')).toBeDefined();
  });

  it('catches error and shows fallback', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary fallback="Custom error UI"><Bomb /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent('Custom error UI');
    spy.mockRestore();
  });

  it('shows default fallback text', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><Bomb /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    spy.mockRestore();
  });
});
