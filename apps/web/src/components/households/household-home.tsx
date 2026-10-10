'use client';

import { useEffect, useState } from 'react';

import { ApiError } from '@/lib/api/api-error';
import {
  createBill,
  listBills,
  listHouseholds,
  setBillPaymentStatus,
  type Bill,
  renameHousehold,
  updateBill,
} from '@/lib/households/household-service';
import {
  Button,
  Field,
  FieldError,
  Input,
  Textarea,
} from '@/ui/components/primitives';

interface HouseholdHomeProps {
  householdId: string;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.kind === 'authorization')
    return 'You do not have access to this household.';
  return 'We could not save that change. Please try again.';
}

function dueDateCue(bill: Bill): string {
  if (bill.paymentStatus === 'Paid') return `Paid · due ${bill.dueDate}`;
  const today = new Date().toISOString().slice(0, 10);
  if (bill.dueDate < today) return `Overdue · was due ${bill.dueDate}`;
  if (bill.dueDate === today) return 'Due today';
  return `Due ${bill.dueDate}`;
}

export function HouseholdHome({ householdId }: HouseholdHomeProps) {
  const [bills, setBills] = useState<readonly Bill[]>();
  const [loadError, setLoadError] = useState<string>();
  const [householdName, setHouseholdName] = useState('');
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [billName, setBillName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill>();
  const [editAmount, setEditAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingBill, setSavingBill] = useState(false);
  const [changingPayment, setChangingPayment] = useState<string>();
  const [error, setError] = useState<string>();
  const [billError, setBillError] = useState<string>();

  const replaceBill = (updated: Bill) =>
    setBills((current) =>
      current?.map((bill) => (bill.id === updated.id ? updated : bill)),
    );

  useEffect(() => {
    let current = true;
    void Promise.all([listBills(householdId), listHouseholds()])
      .then(([billResults, households]) => {
        if (!current) return;
        setBills(billResults);
        const household = households.find((item) => item.id === householdId);
        if (!household) {
          setLoadError('You do not have access to this household.');
          return;
        }
        setHouseholdName(household.name);
        setNewName(household.name);
      })
      .catch((reason: unknown) => {
        if (current) setLoadError(errorMessage(reason));
      });
    return () => {
      current = false;
    };
  }, [householdId]);

  const rename = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newName.trim() || renaming) return;
    setRenaming(true);
    setError(undefined);
    try {
      const household = await renameHousehold(householdId, newName);
      setHouseholdName(household.name);
      setNewName(household.name);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setRenaming(false);
    }
  };

  const addBill = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (
      !billName.trim() ||
      !dueDate ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount < 0 ||
      creating
    )
      return;
    setCreating(true);
    setError(undefined);
    try {
      const bill = await createBill(householdId, {
        name: billName,
        amount: parsedAmount,
        dueDate,
        notes: notes || undefined,
      });
      setBills((current) => [...(current ?? []), bill]);
      setBillName('');
      setAmount('');
      setDueDate('');
      setNotes('');
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setCreating(false);
    }
  };

  const beginEdit = (bill: Bill) => {
    setError(undefined);
    setEditingBill(bill);
    setEditAmount(String(bill.amount));
    setEditDueDate(bill.dueDate);
    setEditNotes(bill.notes ?? '');
  };

  const saveBill = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingBill || savingBill) return;
    const parsedAmount = Number(editAmount);
    if (!editDueDate || !Number.isFinite(parsedAmount) || parsedAmount < 0)
      return;
    setSavingBill(true);
    setError(undefined);
    try {
      replaceBill(
        await updateBill(householdId, editingBill.id, {
          amount: parsedAmount,
          dueDate: editDueDate,
          notes: editNotes || undefined,
        }),
      );
      setEditingBill(undefined);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setSavingBill(false);
    }
  };

  const changePaymentStatus = async (bill: Bill) => {
    if (changingPayment) return;
    setChangingPayment(bill.id);
    setBillError(undefined);
    try {
      replaceBill(
        await setBillPaymentStatus(
          householdId,
          bill.id,
          bill.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid',
        ),
      );
    } catch (reason) {
      setBillError(errorMessage(reason));
    } finally {
      setChangingPayment(undefined);
    }
  };

  return (
    <section className="household-home">
      <header>
        <p className="eyebrow">Your household</p>
        <h1>{householdName || 'Household home'}</h1>
        <p>Keep the bills your household needs in one simple place.</p>
      </header>
      <form className="ui-card household-form" onSubmit={rename}>
        <Field label="Household name" required>
          <Input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            maxLength={256}
          />
        </Field>
        <Button
          type="submit"
          loading={renaming}
          loadingLabel="Saving household name"
        >
          Save name
        </Button>
      </form>
      <form className="ui-card household-form" onSubmit={addBill}>
        <div>
          <h2>Add your first bill</h2>
          <p>Start with one upcoming expense you want to keep track of.</p>
        </div>
        <Field label="Bill name" required>
          <Input
            value={billName}
            onChange={(event) => setBillName(event.target.value)}
            maxLength={256}
          />
        </Field>
        <Field label="Amount" required>
          <Input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </Field>
        <Field label="Due date" required>
          <Input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </Field>
        <Field label="Notes">
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={1000}
          />
        </Field>
        {error ? <FieldError>{error}</FieldError> : null}
        <Button type="submit" loading={creating} loadingLabel="Adding bill">
          Add bill
        </Button>
      </form>
      <section aria-live="polite">
        <h2>Your bills</h2>
        {loadError ? <FieldError>{loadError}</FieldError> : null}
        {billError ? <FieldError>{billError}</FieldError> : null}
        {!bills && !loadError ? <p>Loading your bills…</p> : null}
        {bills?.length === 0 ? (
          <p>No bills yet. Add one above to complete your setup.</p>
        ) : null}
        {bills?.length ? (
          <ul className="bill-list">
            {bills.map((bill) => (
              <li key={bill.id}>
                <div>
                  <strong>{bill.name}</strong>
                  <span>
                    ${bill.amount.toFixed(2)} · {dueDateCue(bill)}
                  </span>
                  {bill.notes ? <p>{bill.notes}</p> : null}
                </div>
                <div className="bill-actions">
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => beginEdit(bill)}
                  >
                    Edit {bill.name}
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    loading={changingPayment === bill.id}
                    loadingLabel={`Updating ${bill.name} payment status`}
                    onClick={() => void changePaymentStatus(bill)}
                  >
                    Mark {bill.paymentStatus === 'Paid' ? 'unpaid' : 'paid'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      {editingBill ? (
        <form className="ui-card household-form" onSubmit={saveBill}>
          <div>
            <h2>Edit {editingBill.name}</h2>
            <p>Update the amount, due date, or notes for this bill.</p>
          </div>
          <Field label={`Amount for ${editingBill.name}`} required>
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={editAmount}
              onChange={(event) => setEditAmount(event.target.value)}
            />
          </Field>
          <Field label={`Due date for ${editingBill.name}`} required>
            <Input
              type="date"
              value={editDueDate}
              onChange={(event) => setEditDueDate(event.target.value)}
            />
          </Field>
          <Field label={`Notes for ${editingBill.name}`}>
            <Textarea
              value={editNotes}
              onChange={(event) => setEditNotes(event.target.value)}
              maxLength={1000}
            />
          </Field>
          {error ? <FieldError>{error}</FieldError> : null}
          <div className="bill-actions">
            <Button
              type="submit"
              loading={savingBill}
              loadingLabel="Saving bill"
            >
              Save bill
            </Button>
            <Button variant="ghost" onClick={() => setEditingBill(undefined)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
