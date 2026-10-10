'use client';

import Link from 'next/link';
import { useState } from 'react';

import { ApiError } from '@/lib/api/api-error';
import { useAuthentication } from '@/lib/auth/auth-context';
import { registerAccount } from '@/lib/auth/auth-service';
import { Button, Field, FieldError, Input } from '@/ui/components/primitives';

export function registrationErrorMessage(reason: unknown): string {
  if (reason instanceof ApiError && reason.status === 409)
    return 'That username is unavailable. Please choose another.';
  if (reason instanceof ApiError && reason.status === 429)
    return 'Too many account-creation attempts. Please try again later.';
  return 'Unable to create your account right now. Please try again.';
}

interface RegisterAccountFormProps {
  createAccount?: typeof registerAccount;
}

export function RegisterAccountForm({
  createAccount = registerAccount,
}: RegisterAccountFormProps = {}) {
  const { completeLogin } = useAuthentication();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(undefined);
    try {
      await createAccount(username, displayName, password);
      await completeLogin();
    } catch (reason) {
      setError(registrationErrorMessage(reason));
      setPending(false);
    }
  };

  return (
    <form
      className="login-form ui-card"
      onSubmit={submit}
      aria-describedby={error ? 'registration-error' : undefined}
    >
      <h1>Create account</h1>
      <p className="auth-intro">
        Start with a private household that you can manage yourself.
      </p>
      <Field label="Name" required>
        <Input
          name="display-name"
          value={displayName}
          onChange={(event) => {
            setDisplayName(event.target.value);
            setError(undefined);
          }}
          autoComplete="name"
          disabled={pending}
        />
      </Field>
      <Field label="Username" required>
        <Input
          name="username"
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            setError(undefined);
          }}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          minLength={3}
          maxLength={64}
          disabled={pending}
        />
      </Field>
      <Field label="Password" description="At least 12 characters" required>
        <Input
          name="password"
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(undefined);
          }}
          autoComplete="new-password"
          minLength={12}
          maxLength={1024}
          disabled={pending}
        />
      </Field>
      {error ? <FieldError id="registration-error">{error}</FieldError> : null}
      <Button type="submit" loading={pending} loadingLabel="Creating account">
        Create account
      </Button>
      <p className="auth-switch">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
      <span className="sr-only" aria-live="polite">
        {pending ? 'Creating account' : ''}
      </span>
    </form>
  );
}
