'use client';

import { useEffect, useState } from 'react';

import { ApiError } from '@/lib/api/api-error';
import {
  createHouseholdInvitation,
  listHouseholds,
  listOwnedHouseholdInvitations,
  revokeHouseholdInvitation,
  type HouseholdInvitation,
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
  const [invitations, setInvitations] =
    useState<readonly HouseholdInvitation[]>();
  const [revoking, setRevoking] = useState<string>();

  useEffect(() => {
    void listHouseholds().then((households) => {
      const owner = households.some(
        (item) => item.id === householdId && item.isOwner,
      );
      setIsOwner(owner);
      if (owner)
        void listOwnedHouseholdInvitations(householdId).then(setInvitations);
    });
  }, [householdId]);

  if (!isOwner) return null;
  const invite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || saving) return;
    setSaving(true);
    setMessage(undefined);
    try {
      const invitation = await createHouseholdInvitation(householdId, username);
      setUsername('');
      setInvitations((current) => [...(current ?? []), invitation]);
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

  const revoke = async (invitation: HouseholdInvitation) => {
    if (revoking) return;
    setRevoking(invitation.id);
    setMessage(undefined);
    try {
      await revokeHouseholdInvitation(invitation.id);
      setInvitations((current) =>
        current?.filter((item) => item.id !== invitation.id),
      );
      setMessage('Invitation revoked.');
    } catch {
      setMessage('We could not revoke that invitation. Please try again.');
    } finally {
      setRevoking(undefined);
    }
  };

  return (
    <section className="ui-card household-form">
      <form onSubmit={invite}>
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
        <Button
          type="submit"
          loading={saving}
          loadingLabel="Creating invitation"
        >
          Create invitation
        </Button>
      </form>
      <div>
        <h3>Pending invitations</h3>
        {!invitations ? <p>Loading invitations…</p> : null}
        {invitations?.length === 0 ? <p>No pending invitations.</p> : null}
        {invitations?.map((invitation) => (
          <div key={invitation.id} className="bill-actions">
            <span>{invitation.inviterDisplayName}’s invitation</span>
            <Button
              variant="outline"
              size="small"
              loading={revoking === invitation.id}
              loadingLabel="Revoking invitation"
              onClick={() => void revoke(invitation)}
            >
              Revoke invitation
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
