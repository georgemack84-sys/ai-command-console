'use client';

import { useEffect, useState } from 'react';

import { ApiError } from '@/lib/api/api-error';
import {
  createHouseholdInvitation,
  listHouseholds,
} from '@/lib/households/household-service';
import { Button, Field, FieldError, Input } from '@/ui/components/primitives';

export function HouseholdInvitationForm({
  householdId,
}: {
  householdId: string;
}) {
  const [isOwner, setIsOwner] = useState(false);
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    void listHouseholds().then((households) =>
      setIsOwner(
        households.some((item) => item.id === householdId && item.isOwner),
      ),
    );
  }, [householdId]);

  if (!isOwner) return null;
  const invite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || saving) return;
    setSaving(true);
    setMessage(undefined);
    try {
      await createHouseholdInvitation(householdId, username);
      setUsername('');
      setMessage(
        'Invitation created. The member can accept it from their dashboard.',
      );
    } catch (error) {
      setMessage(
        error instanceof ApiError && error.kind === 'authorization'
          ? 'You cannot invite members to this household.'
          : 'We could not create that invitation. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="ui-card household-form" onSubmit={invite}>
      <div>
        <h2>Invite a member</h2>
        <p>Invite an existing Proprium user by username.</p>
      </div>
      <Field label="Username" required>
        <Input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          maxLength={256}
        />
      </Field>
      {message ? <FieldError role="status">{message}</FieldError> : null}
      <Button type="submit" loading={saving} loadingLabel="Creating invitation">
        Create invitation
      </Button>
    </form>
  );
}
