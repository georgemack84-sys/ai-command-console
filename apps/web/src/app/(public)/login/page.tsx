import { LoginExperienceBoundary } from '@/components/auth/login-experience-boundary';
import { LoginForm } from '@/components/auth/login-form';
export default function LoginPage() {
  return (
    <LoginExperienceBoundary>
      <LoginForm />
    </LoginExperienceBoundary>
  );
}
