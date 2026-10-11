import Link from 'next/link';

import { BackendConnectivity } from '@/components/system/backend-connectivity';
import { application } from '@/config/application';

export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <p className="eyebrow">Shared household clarity</p>
        <h1 id="landing-title">Know what matters at home.</h1>
        <p className="landing-hero__summary">
          Proprium brings your household, routine bills, and trusted account
          recovery into one calm, private place.
        </p>
        <nav className="landing-hero__actions" aria-label="Account access">
          <Link className="ui-button" href="/register">
            Create your account
          </Link>
          <Link className="ui-button" data-variant="secondary" href="/login">
            Sign in
          </Link>
        </nav>
        <p className="landing-hero__signin">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </section>

      <aside className="landing-status ui-card" aria-label="Service status">
        <p className="eyebrow">Service status</p>
        <p className="landing-status__title">Ready when you are</p>
        <dl className="landing-status__details">
          <div>
            <dt>Environment</dt>
            <dd>{application.environment}</dd>
          </div>
          <div>
            <dt>Backend</dt>
            <dd>
              <BackendConnectivity />
            </dd>
          </div>
        </dl>
        <p className="landing-status__version">Release {application.version}</p>
      </aside>
    </main>
  );
}
