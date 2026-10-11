'use client';

import { useEffect, useState } from 'react';

import { ApiError } from '@/lib/api/api-error';
import {
  beginRecoveryContactVerification,
  completeRecoveryContactVerification,
  getRecoveryContact,
  type RecoveryContact,
} from '@/lib/auth/auth-service';
import { Button, Field, FieldError, Input } from '@/ui/components/primitives';

export function RecoveryContactForm() {
  const [contact, setContact] = useState<RecoveryContact>();
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<string>();

  const refresh = async () => {
    try {
      setContact(await getRecoveryContact());
    } catch {
      setMessage(
        'We could not load your recovery-contact status. Please try again.',
      );
    }
  };

  useEffect(() => {
    let active = true;
    void getRecoveryContact().then(
      (value) => {
        if (active) setContact(value);
      },
      () => {
        if (active)
          setMessage(
            'We could not load your recovery-contact status. Please try again.',
          );
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !currentPassword || sending) return;
    setSending(true);
    setMessage(undefined);
    try {
      await beginRecoveryContactVerification(email, currentPassword);
      setCurrentPassword('');
      await refresh();
      setMessage('If this address can be used, we sent a verification code.');
    } catch (error) {
      setMessage(
        error instanceof ApiError && error.status === 503
          ? 'Recovery-contact verification is currently unavailable. Please try again later.'
          : 'We could not send a verification code. Please try again.',
      );
    } finally {
      setSending(false);
    }
  };

  const verify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!verificationCode.trim() || verifying) return;
    setVerifying(true);
    setMessage(undefined);
    try {
      await completeRecoveryContactVerification(verificationCode);
      setVerificationCode('');
      await refresh();
      setMessage('Recovery contact verified.');
    } catch {
      setMessage(
        'That verification code is invalid or expired. Please try again.',
      );
    } finally {
      setVerifying(false);
    }
  };

  return (
    <section
      className="household-home"
      aria-labelledby="recovery-contact-title"
    >
      <header>
        <p className="eyebrow">Account security</p>
        <h2 id="recovery-contact-title">Recovery contact</h2>
        <p>
          Add one email address you control to help recover your account later.
        </p>
      </header>
      {contact?.maskedEmail ? (
        <p className="ui-field__description">
          {contact.isVerified ? 'Verified contact: ' : 'Verification pending: '}
          {contact.maskedEmail}
        </p>
      ) : null}
      <form className="ui-card household-form" onSubmit={send}>
        <Field
          label="Recovery email"
          required
          description="We will send a verification code to this address."
        >
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            maxLength={320}
          />
        </Field>
        <Field label="Current password" required>
          <Input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            maxLength={1024}
          />
        </Field>
        <Button
          type="submit"
          loading={sending}
          loadingLabel="Sending verification code"
        >
          Send verification code
        </Button>
      </form>
      {contact?.verificationPending ? (
        <form className="ui-card household-form" onSubmit={verify}>
          <Field label="Verification code" required>
            <Input
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              autoComplete="one-time-code"
              maxLength={128}
            />
          </Field>
          <Button
            type="submit"
            loading={verifying}
            loadingLabel="Verifying recovery contact"
          >
            Verify recovery contact
          </Button>
        </form>
      ) : null}
      {message ? <FieldError role="status">{message}</FieldError> : null}
    </section>
  );
}
