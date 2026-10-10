'use client';
import { useEffect, useState } from 'react';

import { useAuthentication } from '@/lib/auth/auth-context';
import {
  acceptHouseholdInvitation,
  listHouseholdInvitations,
  type HouseholdInvitation,
} from '@/lib/households/household-service';
import { Button, FieldError } from '@/ui/components/primitives';

export default function DashboardPage() {
  const { state } = useAuthentication();
  const [invitations, setInvitations] = useState<readonly HouseholdInvitation[]>();
  const [error, setError] = useState<string>();
  const [accepting, setAccepting] = useState<string>();
  useEffect(() => {
    void listHouseholdInvitations()
      .then(setInvitations)
      .catch(() => setError('We could not load your invitations. Please try again.'));
  }, []);
  if (state.status !== 'authenticated') return null;
  const accept = async (invitation: HouseholdInvitation) => {
    if (accepting) return;
    setAccepting(invitation.id);
    setError(undefined);
    try {
      await acceptHouseholdInvitation(invitation.id);
      setInvitations((current) => current?.filter((item) => item.id !== invitation.id));
    } catch {
      setError('We could not accept that invitation. Please try again.');
    } finally {
      setAccepting(undefined);
    }
  };
  return (
    <section>
      <h1>Dashboard</h1>
      <p>Welcome, {state.user.displayName}.</p>
      <section className="ui-card household-form" aria-labelledby="invitations-heading">
        <h2 id="invitations-heading">Household invitations</h2>
        {error ? <FieldError>{error}</FieldError> : null}
        {!invitations && !error ? <p>Loading invitations…</p> : null}
        {invitations?.length === 0 ? <p>No pending invitations.</p> : null}
        {invitations?.map((invitation) => (
          <div key={invitation.id} className="bill-actions">
            <p>{invitation.inviterDisplayName} invited you to join {invitation.householdName}.</p>
            <Button loading={accepting === invitation.id} loadingLabel="Accepting invitation" onClick={() => void accept(invitation)}>Accept invitation</Button>
          </div>
        ))}
      </section>
    </section>
  );
}
