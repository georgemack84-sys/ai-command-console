'use client';

import { useState } from 'react';

import { Permission } from '@/generated/permission-catalog';
import { ApiError } from '@/lib/api/api-error';
import { useAuthentication } from '@/lib/auth/auth-context';
import { updateCurrentUserProfile } from '@/lib/auth/auth-service';
import { Button, Field, FieldError, Input } from '@/ui/components/primitives';

import { RecoveryContactForm } from './recovery-contact-form';

export function ProfileForm() {
  const { state, refreshAuthentication } = useAuthentication();
  const [displayName, setDisplayName] = useState(
    state.status === 'authenticated' ? state.user.displayName : '',
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  if (state.status !== 'authenticated') return null;
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!displayName.trim() || saving) return;
    setSaving(true);
    setMessage(undefined);
    try {
      await updateCurrentUserProfile(displayName);
      await refreshAuthentication();
      setMessage('Profile saved.');
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? 'We could not save your profile. Please try again.'
          : 'We could not save your profile. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <section className="household-home">
        <header>
          <p className="eyebrow">Account</p>
          <h1>Profile</h1>
          <p>Update the name shown in Proprium.</p>
        </header>
        <form className="ui-card household-form" onSubmit={save}>
          <Field label="Display name" required>
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={240}
            />
          </Field>
          {message ? <FieldError role="status">{message}</FieldError> : null}
          <Button type="submit" loading={saving} loadingLabel="Saving profile">
            Save profile
          </Button>
        </form>
      </section>
      {state.user.permissions.has(Permission.RecoveryContactManageSelf) ? (
        <RecoveryContactForm />
      ) : null}
    </>
  );
}
