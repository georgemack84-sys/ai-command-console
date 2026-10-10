import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createBill,
  listBills,
  listHouseholds,
  renameHousehold,
  setBillPaymentStatus,
  updateBill,
} from '@/lib/households/household-service';

import { HouseholdHome } from './household-home';

vi.mock('@/lib/households/household-service', () => ({
  createBill: vi.fn(),
  listBills: vi.fn(),
  listHouseholds: vi.fn(),
  renameHousehold: vi.fn(),
  setBillPaymentStatus: vi.fn(),
  updateBill: vi.fn(),
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
    expect(screen.getByText('$87.45 · Due 2030-01-15')).toBeVisible();
  });

  it('updates a bill and changes its payment status without a reload', async () => {
    const bill = {
      id: 'bill-1',
      householdId,
      name: 'Internet',
      amount: 87.45,
      dueDate: '2030-01-15',
      notes: null,
      paymentStatus: 'Unpaid' as const,
      updatedAtUtc: '2030-01-01T00:00:00Z',
    };
    vi.mocked(listBills).mockResolvedValue([bill]);
    vi.mocked(updateBill).mockResolvedValue({
      ...bill,
      amount: 91.2,
      dueDate: '2030-01-20',
      notes: 'New plan',
    });
    vi.mocked(setBillPaymentStatus).mockResolvedValue({
      ...bill,
      amount: 91.2,
      dueDate: '2030-01-20',
      notes: 'New plan',
      paymentStatus: 'Paid',
    });
    render(<HouseholdHome householdId={householdId} />);

    await screen.findByText('Internet');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Internet' }));
    fireEvent.change(screen.getByLabelText('Amount for Internet *'), {
      target: { value: '91.20' },
    });
    fireEvent.change(screen.getByLabelText('Due date for Internet *'), {
      target: { value: '2030-01-20' },
    });
    fireEvent.change(screen.getByLabelText('Notes for Internet'), {
      target: { value: 'New plan' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save bill' }));

    await waitFor(() =>
      expect(updateBill).toHaveBeenCalledWith(householdId, bill.id, {
        amount: 91.2,
        dueDate: '2030-01-20',
        notes: 'New plan',
      }),
    );
    expect(await screen.findByText('$91.20 · Due 2030-01-20')).toBeVisible();
    expect(screen.getByText('New plan')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Mark paid' }));
    await waitFor(() =>
      expect(setBillPaymentStatus).toHaveBeenCalledWith(
        householdId,
        bill.id,
        'Paid',
      ),
    );
    expect(
      await screen.findByText('$91.20 · Paid · due 2030-01-20'),
    ).toBeVisible();
  });
});
