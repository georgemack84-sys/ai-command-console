"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const [ready, setReady] = useState(pathname === "/access");
  useEffect(() => { if (pathname === "/access") { setReady(true); return; } setReady(false); void fetch("/api/access").then((response) => response.json()).then((status: { protected: boolean; authenticated: boolean }) => { if (status.protected && !status.authenticated) router.replace("/access"); else setReady(true); }).catch(() => router.replace("/access")); }, [pathname, router]);
  return ready ? <>{children}</> : null;
}
