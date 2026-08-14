import {
  forwardRef,
  useId,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';

import { Button } from './button';
import { classNames } from './class-names';

export interface AlertProps extends HTMLAttributes<HTMLElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
}

export function Alert({
  variant = 'info',
  title,
  className,
  children,
  ...props
}: AlertProps) {
  return (
    <section
      {...props}
      className={classNames('ui-alert', className)}
      data-variant={variant}
      role={props.role ?? (variant === 'error' ? 'alert' : 'status')}
    >
      {title ? <strong>{title}</strong> : null}
      <div>{children}</div>
    </section>
  );
}

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'small' | 'medium' | 'large';
  label?: string;
}

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ size = 'medium', label, className, ...props }, ref) => (
    <span
      {...props}
      ref={ref}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-size={size}
      className={classNames('ui-spinner', className)}
    />
  ),
);
Spinner.displayName = 'Spinner';

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  shape?: 'text' | 'rectangle' | 'circle';
}

export const Skeleton = forwardRef<HTMLSpanElement, SkeletonProps>(
  ({ shape = 'rectangle', className, ...props }, ref) => (
    <span
      {...props}
      ref={ref}
      data-shape={shape}
      aria-hidden
      className={classNames('ui-skeleton', className)}
    />
  ),
);
Skeleton.displayName = 'Skeleton';

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  size?: SpinnerProps['size'];
}

export function LoadingState({
  label = 'Loading',
  size,
  className,
  ...props
}: LoadingStateProps) {
  return (
    <div
      {...props}
      role="status"
      className={classNames('ui-loading-state', className)}
    >
      <Spinner size={size} />
      <span>{label}</span>
    </div>
  );
}

export interface EmptyStateProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  visual?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  headingLevel?: 1 | 2;
  headingRef?: Ref<HTMLHeadingElement>;
}

export function EmptyState({
  title,
  description,
  visual,
  action,
  secondaryAction,
  headingLevel = 2,
  headingRef,
  className,
  ...props
}: EmptyStateProps) {
  const titleId = useId();
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <section
      {...props}
      aria-labelledby={titleId}
      className={classNames('ui-empty-state', className)}
    >
      {visual ? (
        <div className="ui-empty-state__visual" aria-hidden>
          {visual}
        </div>
      ) : null}
      <Heading
        ref={headingRef}
        id={titleId}
        tabIndex={headingRef ? -1 : undefined}
      >
        {title}
      </Heading>
      {description ? <p>{description}</p> : null}
      {action || secondaryAction ? (
        <div className="ui-empty-state__actions">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </section>
  );
}

export interface RetryStateProps extends Omit<
  EmptyStateProps,
  'title' | 'description' | 'action'
> {
  title?: string;
  description?: string;
  action?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again. If the problem continues, return later.',
  action,
  onRetry,
  retryLabel = 'Try again',
  ...props
}: RetryStateProps) {
  return (
    <EmptyState
      {...props}
      title={title}
      description={description}
      action={
        action ??
        (onRetry ? <Button onClick={onRetry}>{retryLabel}</Button> : undefined)
      }
    />
  );
}

export function UnavailableState({
  title = 'This is currently unavailable',
  description = 'Please try again later.',
  action,
  onRetry,
  retryLabel = 'Try again',
  ...props
}: RetryStateProps) {
  return (
    <EmptyState
      {...props}
      title={title}
      description={description}
      action={
        action ??
        (onRetry ? <Button onClick={onRetry}>{retryLabel}</Button> : undefined)
      }
    />
  );
}
