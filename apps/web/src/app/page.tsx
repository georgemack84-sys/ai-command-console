import Link from 'next/link';

import { BackendConnectivity } from '@/components/system/backend-connectivity';
import { application } from '@/config/application';

export default function HomePage() {
  return (
    <section>
      <h1>{application.name}</h1>
      <p>Environment: {application.environment}</p>
      <p>Frontend version: {application.version}</p>
      <BackendConnectivity />
      <p>Startup confirmation: Ready</p>
      <nav aria-label="Account access">
        <Link className="ui-button" href="/login">
          Sign in
        </Link>
      </nav>
    </section>
  );
}
