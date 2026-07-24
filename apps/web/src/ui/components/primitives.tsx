import {
  cloneElement,
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'danger';
type Size = 'small' | 'medium' | 'large';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
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
      loadingLabel,
      disabled,
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
      data-variant={variant}
      data-size={size}
      className="ui-button"
    >
      <span>{children}</span>
      {loading ? (
        <span role="status" aria-label={loadingLabel ?? 'Loading'}>
          …
        </span>
      ) : null}
    </button>
  ),
);
Button.displayName = 'Button';
export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  label: string;
  icon: ReactNode;
}
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, icon, ...props }, ref) => (
    <Button {...props} ref={ref} aria-label={label}>
      {<span aria-hidden>{icon}</span>}
    </Button>
  ),
);
IconButton.displayName = 'IconButton';
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>((props, ref) => <input {...props} ref={ref} className="ui-input" />);
Input.displayName = 'Input';
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>((props, ref) => (
  <textarea {...props} ref={ref} className="ui-input ui-textarea" />
));
Textarea.displayName = 'Textarea';
export function Field({
  label,
  description,
  error,
  required,
  children,
}: {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactElement<Record<string, unknown>>;
}) {
  const id = useId();
  const controlId =
    typeof children.props.id === 'string' ? children.props.id : `field-${id}`;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy =
    [children.props['aria-describedby'], descriptionId, errorId]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <div className="ui-field">
      <label htmlFor={controlId}>
        {label}
        {required ? ' *' : null}
      </label>
      {description ? <p id={descriptionId}>{description}</p> : null}
      {cloneElement(children, {
        id: controlId,
        required: required || children.props.required,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : children.props['aria-invalid'],
      })}
      {error ? (
        <p id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
export function Card({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'default' | 'subtle' | 'outlined';
}) {
  return (
    <div className="ui-card" data-variant={variant}>
      {children}
    </div>
  );
}
export function Spinner({ label }: { label?: string }) {
  return label ? (
    <span role="status" className="ui-spinner" aria-label={label}>
      Loading
    </span>
  ) : (
    <span className="ui-spinner" aria-hidden />
  );
}
export function Skeleton({
  shape = 'rectangle',
}: {
  shape?: 'text' | 'rectangle' | 'circle';
}) {
  return <span className="ui-skeleton" data-shape={shape} aria-hidden />;
}
export function EmptyState({
  title,
  description,
  visual,
  primaryAction,
  secondaryAction,
}: {
  title: string;
  description?: string;
  visual?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
}) {
  return (
    <section className="ui-empty-state">
      {visual ? <div aria-hidden>{visual}</div> : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {primaryAction || secondaryAction ? (
        <div>
          {primaryAction}
          {secondaryAction}
        </div>
      ) : null}
    </section>
  );
}

export function Alert({
  variant = 'info',
  title,
  children,
}: {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
}) {
  return (
    <section
      className="ui-alert"
      data-variant={variant}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      {title ? <strong>{title}</strong> : null}
      <div>{children}</div>
    </section>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      title="Something went wrong"
      description="Please try again. If the problem continues, return later."
      primaryAction={
        onRetry ? <Button onClick={onRetry}>Try again</Button> : undefined
      }
    />
  );
}

export function UnavailableState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      title="This is currently unavailable"
      description="Please try again later."
      primaryAction={
        onRetry ? <Button onClick={onRetry}>Try again</Button> : undefined
      }
    />
  );
}
