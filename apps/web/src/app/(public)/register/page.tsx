import { LoginExperienceBoundary } from '@/components/auth/login-experience-boundary';
import { RegisterAccountForm } from '@/components/auth/register-account-form';

export default function RegisterPage() {
  return (
    <LoginExperienceBoundary authenticatedDestination="/households">
      <RegisterAccountForm />
    </LoginExperienceBoundary>
  );
}
