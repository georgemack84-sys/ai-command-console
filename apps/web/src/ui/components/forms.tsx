import {
  cloneElement,
  forwardRef,
  useId,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactElement,
  type TextareaHTMLAttributes,
} from 'react';

import { classNames } from './class-names';

export const Label = forwardRef<
  HTMLLabelElement,
  LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label {...props} ref={ref} className={classNames('ui-label', className)} />
));
Label.displayName = 'Label';

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input {...props} ref={ref} className={classNames('ui-input', className)} />
));
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    {...props}
    ref={ref}
    className={classNames('ui-input', 'ui-textarea', className)}
  />
));
Textarea.displayName = 'Textarea';

export const FieldDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    {...props}
    ref={ref}
    className={classNames('ui-field__description', className)}
  />
));
FieldDescription.displayName = 'FieldDescription';

export const FieldError = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    {...props}
    ref={ref}
    role={props.role ?? 'alert'}
    className={classNames('ui-field__error', className)}
  />
));
FieldError.displayName = 'FieldError';

interface FieldControlProps {
  id?: string;
  required?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'false' | 'true';
}

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactElement<FieldControlProps>;
}

export function Field({
  label,
  description,
  error,
  required,
  children,
  className,
  ...props
}: FieldProps) {
  const generatedId = useId();
  const controlId = children.props.id ?? `field-${generatedId}`;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [
    children.props['aria-describedby'],
    descriptionId,
    errorId,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      {...props}
      className={classNames('ui-field', className)}
      data-invalid={error ? true : undefined}
    >
      <Label htmlFor={controlId}>
        {label}
        {required ? (
          <span className="ui-field__required" aria-hidden>
            {' '}
            *
          </span>
        ) : null}
      </Label>
      {description ? (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      ) : null}
      {cloneElement(children, {
        id: controlId,
        required: required || children.props.required,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : children.props['aria-invalid'],
      })}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}
