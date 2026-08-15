import { ProtectedExperienceBoundary } from '@/components/auth/protected-experience-boundary';
import { UserMenu } from '@/components/auth/user-menu';
import { AuthenticationProvider } from '@/lib/auth/auth-provider';
import { ApplicationShell } from '@/shell/components/application-shell';
export const dynamic = 'force-dynamic';
export default function ProtectedLayout({ children }: React.PropsWithChildren) {
  return (
    <AuthenticationProvider>
      <ProtectedExperienceBoundary>
        <ApplicationShell accountSlot={<UserMenu />}>
          {children}
        </ApplicationShell>
      </ProtectedExperienceBoundary>
    </AuthenticationProvider>
  );
}
