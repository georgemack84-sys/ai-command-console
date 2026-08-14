import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApplicationShell } from '@/shell/components/application-shell';
import { isActiveRoute } from '@/shell/navigation/navigation-model';

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));

const navigation = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    indicator: 'DB',
    exact: true,
  },
  {
    id: 'projects',
    label: 'Projects',
    href: '/projects',
    indicator: 'PR',
  },
] as const;

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('application shell', () => {
  it('owns landmarks, skip navigation, slots, and deterministic current state', () => {
    render(
      <ApplicationShell
        navigation={navigation}
        headerTitle="Operations"
        headerActions={<button>Header action</button>}
        accountSlot={<button>Account</button>}
      >
        <h1>Workspace</h1>
      </ApplicationShell>,
    );
    expect(screen.getByRole('banner')).toHaveTextContent('Operations');
    expect(screen.getByRole('complementary')).toHaveAccessibleName(
      'Application sidebar',
    );
    expect(screen.getByRole('main')).toHaveTextContent('Workspace');
    expect(screen.getByText('Skip to main content')).toHaveAttribute(
      'href',
      '#main-workspace',
    );
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: 'Header action' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Account' })).toBeVisible();
  });

  it('toggles the desktop sidebar without changing the navigation model', () => {
    const { container } = render(
      <ApplicationShell navigation={navigation}>Workspace</ApplicationShell>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(container.querySelector('.shell')).toHaveAttribute(
      'data-sidebar',
      'collapsed',
    );
    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('traps focus, closes on Escape, unlocks scroll, and restores focus', async () => {
    render(
      <ApplicationShell navigation={navigation}>Workspace</ApplicationShell>,
    );
    const trigger = screen.getByRole('button', { name: 'Open navigation' });
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Navigation' });
    expect(dialog).toBeVisible();
    expect(document.body.style.overflow).toBe('hidden');
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Close navigation' }),
      ).toHaveFocus(),
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
    expect(trigger).toHaveFocus();
  });

  it('wraps focus from the final drawer destination to the close action', async () => {
    render(
      <ApplicationShell navigation={navigation} defaultMobileNavigationOpen>
        Workspace
      </ApplicationShell>,
    );
    const close = screen.getByRole('button', { name: 'Close navigation' });
    const projectLinks = screen.getAllByRole('link', { name: 'Projects' });
    const finalLink = projectLinks[projectLinks.length - 1];
    expect(finalLink).toBeDefined();
    if (!finalLink) return;
    finalLink.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();
  });
});

describe('shell route matching', () => {
  it('supports explicit exact routes and bounded descendants', () => {
    expect(isActiveRoute('/dashboard/', navigation[0])).toBe(true);
    expect(isActiveRoute('/dashboard/activity', navigation[0])).toBe(false);
    expect(isActiveRoute('/projects/one?tab=summary', navigation[1])).toBe(
      true,
    );
    expect(isActiveRoute('/projects-archive', navigation[1])).toBe(false);
  });
});
