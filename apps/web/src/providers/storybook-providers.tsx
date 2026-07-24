import { AppProviders } from './app-providers';
export function StorybookProviders({ children }: React.PropsWithChildren) {
  return <AppProviders>{children}</AppProviders>;
}
