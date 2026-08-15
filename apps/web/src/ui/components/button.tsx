import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { classNames } from './class-names';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      type = 'button',
      variant = 'primary',
      size = 'medium',
      loading = false,
      loadingLabel = 'Loading',
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      {...props}
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={loading ? loadingLabel : props['aria-label']}
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      className={classNames('ui-button', className)}
    >
      <span className="ui-button__content">{children}</span>
      {loading ? (
        <span className="ui-button__loading">
          <span className="ui-spinner" data-size="small" aria-hidden />
          <span className="sr-only" role="status">
            {loadingLabel}
          </span>
        </span>
      ) : null}
    </button>
  ),
);
Button.displayName = 'Button';

export interface IconButtonProps extends Omit<
  ButtonProps,
  'aria-label' | 'children'
> {
  label: string;
  icon: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, icon, className, ...props }, ref) => (
    <Button
      {...props}
      ref={ref}
      aria-label={label}
      className={classNames('ui-icon-button', className)}
    >
      <span aria-hidden>{icon}</span>
    </Button>
  ),
);
IconButton.displayName = 'IconButton';
