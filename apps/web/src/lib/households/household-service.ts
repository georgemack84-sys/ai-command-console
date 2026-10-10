import { apiRequest } from '@/lib/api/api-client';

export interface Household {
  id: string;
  name: string;
  isOwner: boolean;
}

export interface Bill {
  id: string;
  householdId: string;
  name: string;
  amount: number;
  dueDate: string;
  notes: string | null;
  paymentStatus: 'Unpaid' | 'Paid';
  updatedAtUtc: string;
}

function parseHousehold(value: unknown): Household {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid household');
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== 'string' ||
    typeof item.name !== 'string' ||
    typeof item.isOwner !== 'boolean'
  )
    throw new Error('Invalid household');
  return { id: item.id, name: item.name, isOwner: item.isOwner };
}

function parseBill(value: unknown): Bill {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid bill');
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== 'string' ||
    typeof item.householdId !== 'string' ||
    typeof item.name !== 'string' ||
    typeof item.amount !== 'number' ||
    typeof item.dueDate !== 'string' ||
    typeof item.updatedAtUtc !== 'string' ||
    (item.notes !== null && typeof item.notes !== 'string') ||
    (item.paymentStatus !== 'Unpaid' && item.paymentStatus !== 'Paid')
  )
    throw new Error('Invalid bill');
  return {
    id: item.id,
    householdId: item.householdId,
    name: item.name,
    amount: item.amount,
    dueDate: item.dueDate,
    notes: item.notes,
    paymentStatus: item.paymentStatus,
    updatedAtUtc: item.updatedAtUtc,
  };
}

export function listHouseholds(): Promise<readonly Household[]> {
  return apiRequest({
    path: '/api/v1/households',
    parse: (payload) => {
      if (!Array.isArray(payload)) throw new Error('Invalid household list');
      return payload.map(parseHousehold);
    },
  });
}

export function renameHousehold(id: string, name: string): Promise<Household> {
  return apiRequest({
    path: `/api/v1/households/${id}`,
    method: 'PATCH',
    body: { name },
    parse: parseHousehold,
  });
}

export function listBills(householdId: string): Promise<readonly Bill[]> {
  return apiRequest({
    path: `/api/v1/households/${householdId}/bills`,
    parse: (payload) => {
      if (!Array.isArray(payload)) throw new Error('Invalid bill list');
      return payload.map(parseBill);
    },
  });
}

export function createBill(
  householdId: string,
  value: { name: string; amount: number; dueDate: string; notes?: string },
): Promise<Bill> {
  return apiRequest({
    path: `/api/v1/households/${householdId}/bills`,
    method: 'POST',
    body: value,
    parse: parseBill,
  });
}
