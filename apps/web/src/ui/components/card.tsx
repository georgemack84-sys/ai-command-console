import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

import { classNames } from './class-names';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'outlined' | 'elevated';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className, ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      data-variant={variant}
      className={classNames('ui-card', className)}
    />
  ),
);
Card.displayName = 'Card';

function cardPart(name: string) {
  const Component = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement> & { children?: ReactNode }
  >(({ className, ...props }, ref) => (
    <div {...props} ref={ref} className={classNames(name, className)} />
  ));
  Component.displayName = name;
  return Component;
}

export const CardHeader = cardPart('ui-card__header');
export const CardTitle = cardPart('ui-card__title');
export const CardDescription = cardPart('ui-card__description');
export const CardContent = cardPart('ui-card__content');
export const CardFooter = cardPart('ui-card__footer');
