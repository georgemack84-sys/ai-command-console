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

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      <path d="M2.06 12.35a1 1 0 0 1 0-.7C3.64 7.78 7.37 5 12 5s8.36 2.78 9.94 6.65a1 1 0 0 1 0 .7C20.36 16.22 16.63 19 12 19s-8.36-2.78-9.94-6.65Z" />
      <circle cx="12" cy="12" r="3" />
      {visible ? <path d="m4 4 16 16" /> : null}
    </svg>
  );
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
        icon={<PasswordVisibilityIcon visible={visible} />}
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
