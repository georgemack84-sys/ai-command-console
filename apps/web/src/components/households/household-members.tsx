'use client';

import { useEffect, useState } from 'react';

import {
  listHouseholdMembers,
  listHouseholds,
  removeHouseholdMember,
  type HouseholdMember,
} from '@/lib/households/household-service';
import { Button, FieldError } from '@/ui/components/primitives';

export function HouseholdMembers({ householdId }: { householdId: string }) {
  const [members, setMembers] = useState<readonly HouseholdMember[]>();
  const [isOwner, setIsOwner] = useState(false);
  const [removing, setRemoving] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let current = true;
    void Promise.all([listHouseholdMembers(householdId), listHouseholds()])
      .then(([results, households]) => {
        if (!current) return;
        setMembers(results);
        setIsOwner(
          households.some(
            (household) => household.id === householdId && household.isOwner,
          ),
        );
      })
      .catch(() => {
        if (current) setError('We could not load household members.');
      });
    return () => {
      current = false;
    };
  }, [householdId]);

  const remove = async (member: HouseholdMember) => {
    if (removing) return;
    setRemoving(member.userId);
    setError(undefined);
    try {
      await removeHouseholdMember(householdId, member.userId);
      setMembers((current) =>
        current?.filter((item) => item.userId !== member.userId),
      );
    } catch {
      setError('We could not remove that member. Please try again.');
    } finally {
      setRemoving(undefined);
    }
  };

  return (
    <section
      className="ui-card household-form"
      aria-labelledby="members-heading"
    >
      <h2 id="members-heading">Household members</h2>
      {error ? <FieldError>{error}</FieldError> : null}
      {!members && !error ? <p>Loading members…</p> : null}
      {members?.map((member) => (
        <div key={member.userId} className="bill-actions">
          <span>
            {member.displayName}
            {member.isOwner ? ' · Owner' : ''}
          </span>
          {isOwner && !member.isOwner ? (
            <Button
              variant="outline"
              size="small"
              loading={removing === member.userId}
              loadingLabel="Removing member"
              onClick={() => void remove(member)}
            >
              Remove member
            </Button>
          ) : null}
        </div>
      ))}
    </section>
  );
}
