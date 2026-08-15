import { IconButton } from '@/ui/components';

// @ts-expect-error Icon-only controls require an accessible label.
export const InvalidIconButton = <IconButton icon="+" />;
