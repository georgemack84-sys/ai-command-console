import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import HealthPage from './health/page';
import HomePage from './page';

describe('foundation routes', () => {
  it('renders startup information', () => {
    render(createElement(HomePage));
    expect(
      screen.getByText('Backend connectivity: Not checked'),
    ).toBeInTheDocument();
  });
  it('renders only approved health information', () => {
    const { container } = render(createElement(HealthPage));
    expect(screen.getByText('Operational')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(
      /secret|token|password|process\.env/i,
    );
  });
});
