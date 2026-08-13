'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { ApiError } from '@/lib/api/api-error';
import { useAuthentication } from '@/lib/auth/auth-context';
import { login } from '@/lib/auth/auth-service';
import { resolveSafeReturnPath } from '@/lib/auth/return-path';
import { Button, Field, Input } from '@/ui/components/primitives';
export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { completeLogin } = useAuthentication();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const returnPath = resolveSafeReturnPath(search.get('returnTo'));
  const sessionEnded = search.get('reason') === 'session-ended';
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(undefined);
    try {
      await login(username, password);
      await completeLogin();
      router.replace(returnPath);
    } catch (reason) {
      setError(
        reason instanceof ApiError && reason.kind === 'authentication'
          ? 'Unable to sign in with those credentials.'
          : 'Unable to sign in right now. Please try again.',
      );
      setPending(false);
    }
  };
  return (
    <form
      className="login-form ui-card"
      onSubmit={submit}
      aria-describedby={error ? 'login-error' : undefined}
    >
      <h1>Sign in</h1>
      {sessionEnded ? (
        <p role="status">Your session ended. Please sign in again.</p>
      ) : null}
      <Field label="Username" required>
        <Input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          disabled={pending}
        />
      </Field>
      <Field label="Password" required>
        <Input
          type={visible ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          disabled={pending}
        />
      </Field>
      <button
        type="button"
        className="ui-button"
        data-variant="tertiary"
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
        disabled={pending}
      >
        {visible ? 'Hide password' : 'Show password'}
      </button>
      {error ? (
        <p id="login-error" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" loading={pending} loadingLabel="Signing in">
        Sign in
      </Button>
      <span className="sr-only" aria-live="polite">
        {pending ? 'Signing in' : ''}
      </span>
    </form>
  );
}
