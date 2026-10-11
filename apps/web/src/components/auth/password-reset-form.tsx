'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { ApiError } from '@/lib/api/api-error';
import {
  completePasswordReset,
  requestPasswordReset,
} from '@/lib/auth/auth-service';
import { Button, Field, FieldError, Input } from '@/ui/components/primitives';

const requestConfirmation =
  'If this address can be used, we sent a password-reset link.';

export function PasswordResetForm() {
  const search = useSearchParams();
  const token = search.get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<string>();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setStatus(undefined);
    setError(undefined);
    try {
      if (token) {
        await completePasswordReset(token, password);
        setStatus('Your password has been reset. Sign in with your new password.');
      } else {
        await requestPasswordReset(email);
        setStatus(requestConfirmation);
      }
    } catch (reason) {
      if (token && reason instanceof ApiError && reason.status === 400)
        setError('This password-reset link is invalid or has expired. Request a new link.');
      else setError('Unable to process this request right now. Please try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-experience">
        <form className="login-form ui-card" onSubmit={submit}>
          <h1>{token ? 'Choose a new password' : 'Reset your password'}</h1>
          <p className="auth-intro">
            {token
              ? 'This will sign you out everywhere.'
              : 'Enter your recovery email and we will send a one-time link if it can be used.'}
          </p>
          {token ? (
            <Field label="New password" description="At least 12 characters" required>
              <Input
                name="new-password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={1024}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={pending}
              />
            </Field>
          ) : (
            <Field label="Recovery email" required>
              <Input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={320}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={pending}
              />
            </Field>
          )}
          {error ? <FieldError>{error}</FieldError> : null}
          {status ? <p role="status">{status}</p> : null}
          <Button type="submit" loading={pending} loadingLabel="Processing">
            {token ? 'Reset password' : 'Send reset link'}
          </Button>
          <p className="auth-switch">
            <Link href="/login">Back to sign in</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
