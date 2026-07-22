import { application } from '@/config/application';

export default function HealthPage() {
  return (
    <main>
      <h1>Health</h1>
      <dl>
        <dt>Application</dt>
        <dd>{application.name}</dd>
        <dt>Version</dt>
        <dd>{application.version}</dd>
        <dt>Environment</dt>
        <dd>{application.environment}</dd>
        <dt>Operational status</dt>
        <dd>Operational</dd>
        <dt>Public API base URL</dt>
        <dd>{application.apiBaseUrl}</dd>
      </dl>
    </main>
  );
}
