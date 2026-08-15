import { AuthenticationProvider } from '@/lib/auth/auth-provider';

export default function PublicLayout({ children }: React.PropsWithChildren) {
  return <AuthenticationProvider>{children}</AuthenticationProvider>;
}
