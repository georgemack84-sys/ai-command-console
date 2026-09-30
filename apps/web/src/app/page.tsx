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
    </section>
  );
}
