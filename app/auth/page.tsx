import { Suspense } from "react";
import { AuthClient } from "@/src/components/auth/auth-client";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthClient />
    </Suspense>
  );
}
