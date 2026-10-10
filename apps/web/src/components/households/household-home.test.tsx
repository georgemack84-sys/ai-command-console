import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createBill,
  listBills,
  listHouseholds,
  renameHousehold,
} from '@/lib/households/household-service';

import { HouseholdHome } from './household-home';

vi.mock('@/lib/households/household-service', () => ({
  createBill: vi.fn(),
  listBills: vi.fn(),
  listHouseholds: vi.fn(),
  renameHousehold: vi.fn(),
}));

const householdId = 'household-1';

describe('HouseholdHome', () => {
  beforeEach(() => {
    vi.mocked(listBills).mockResolvedValue([]);
    vi.mocked(listHouseholds).mockResolvedValue([
      { id: householdId, name: 'Original household', isOwner: true },
    ]);
  });

  it('shows the member household and lets its owner rename it', async () => {
    vi.mocked(renameHousehold).mockResolvedValue({
      id: householdId,
      name: 'Our household',
      isOwner: true,
    });
    render(<HouseholdHome householdId={householdId} />);

    expect(
      await screen.findByRole('heading', { name: 'Original household' }),
    ).toBeVisible();
    fireEvent.change(screen.getByLabelText('Household name *'), {
      target: { value: 'Our household' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save name' }));

    await waitFor(() =>
      expect(renameHousehold).toHaveBeenCalledWith(
        householdId,
        'Our household',
      ),
    );
    expect(
      await screen.findByRole('heading', { name: 'Our household' }),
    ).toBeVisible();
  });

  it('creates and displays the first bill without requiring a page reload', async () => {
    vi.mocked(createBill).mockResolvedValue({
      id: 'bill-1',
      householdId,
      name: 'Internet',
      amount: 87.45,
      dueDate: '2030-01-15',
      notes: null,
      paymentStatus: 'Unpaid',
      updatedAtUtc: '2030-01-01T00:00:00Z',
    });
    render(<HouseholdHome householdId={householdId} />);
    await screen.findByRole('heading', { name: 'Original household' });

    fireEvent.change(screen.getByLabelText('Bill name *'), {
      target: { value: 'Internet' },
    });
    fireEvent.change(screen.getByLabelText('Amount *'), {
      target: { value: '87.45' },
    });
    fireEvent.change(screen.getByLabelText('Due date *'), {
      target: { value: '2030-01-15' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add bill' }));

    await waitFor(() =>
      expect(createBill).toHaveBeenCalledWith(householdId, {
        name: 'Internet',
        amount: 87.45,
        dueDate: '2030-01-15',
        notes: undefined,
      }),
    );
    expect(await screen.findByText('Internet')).toBeVisible();
    expect(screen.getByText('$87.45 · due 2030-01-15')).toBeVisible();
  });
});
