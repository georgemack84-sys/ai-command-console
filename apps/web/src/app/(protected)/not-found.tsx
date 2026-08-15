import { RouteNotFoundState } from '@/ui/route-states';

export default function ProtectedNotFound() {
  return <RouteNotFoundState recoveryHref="/dashboard" />;
}
