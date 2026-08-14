'use client';
import { useState } from 'react';

import { ApiError } from '@/lib/api/api-error';
import { useAuthentication } from '@/lib/auth/auth-context';
import { login } from '@/lib/auth/auth-service';
import {
  Button,
  Field,
  FieldError,
  IconButton,
  Input,
} from '@/ui/components/primitives';

export function loginErrorMessage(reason: unknown): string {
  if (reason instanceof ApiError && reason.kind === 'authentication')
    return 'Unable to sign in with those credentials.';
  if (reason instanceof ApiError && reason.status === 429)
    return 'Too many sign-in attempts. Please try again later.';
  return 'Unable to sign in right now. Please try again.';
}

interface LoginFormProps {
  authenticate?: typeof login;
  initialError?: string;
  submitting?: boolean;
}

export function LoginForm({
  authenticate = login,
  initialError,
  submitting = false,
}: LoginFormProps = {}) {
  const { completeLogin } = useAuthentication();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>(initialError);
  const busy = pending || submitting;
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setPending(true);
    setError(undefined);
    try {
      await authenticate(username, password);
      await completeLogin();
      setPending(false);
    } catch (reason) {
      setError(loginErrorMessage(reason));
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
          disabled={busy}
        />
      </Field>
      <Field label="Password" required>
        <Input
          name="password"
          type={visible ? 'text' : 'password'}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(undefined);
          }}
          autoComplete="current-password"
          disabled={busy}
        />
      </Field>
      <IconButton
        variant="ghost"
        label={visible ? 'Hide password' : 'Show password'}
        icon={visible ? '○' : '●'}
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
        disabled={busy}
      />
      {error ? <FieldError id="login-error">{error}</FieldError> : null}
      <Button type="submit" loading={busy} loadingLabel="Signing in">
        Sign in
      </Button>
      <span className="sr-only" aria-live="polite">
        {busy ? 'Signing in' : ''}
      </span>
    </form>
  );
}
