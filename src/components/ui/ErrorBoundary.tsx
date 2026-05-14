'use client';

import React from 'react';

interface State { error: Error | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode; label?: string }, State> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary: ${this.props.label}]`, error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive font-bold">
          ⚠️ {this.props.label || 'Section'} failed to load: {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}
