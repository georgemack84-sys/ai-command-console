import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, type FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  Button,
  Card,
  CardTitle,
  Field,
  IconButton,
  Input,
  Textarea,
} from '@/ui/components';

describe('shared component contracts', () => {
  it('defaults Button to non-submitting native behavior', () => {
    const submit = vi.fn((event: FormEvent) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <Button>Action</Button>
        <Button type="submit">Submit</Button>
      </form>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Action' }));
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(submit).toHaveBeenCalledTimes(1);
  });
  it('exposes disabled loading behavior without discarding its label or width content', () => {
    render(
      <Button loading loadingLabel="Saving changes" className="consumer-hook">
        Save changes
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Saving changes' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveClass('ui-button', 'consumer-hook');
    expect(screen.getByRole('status')).toHaveTextContent('Saving changes');
  });
  it('gives icon-only buttons a native button and required accessible name', () => {
    render(<IconButton label="Add project" icon="+" />);
    expect(screen.getByRole('button', { name: 'Add project' })).toHaveAttribute(
      'type',
      'button',
    );
  });
  it('forwards native input and textarea refs', () => {
    const input = createRef<HTMLInputElement>();
    const textarea = createRef<HTMLTextAreaElement>();
    render(
      <>
        <Input ref={input} defaultValue="one" />
        <Textarea ref={textarea} defaultValue="two" />
      </>,
    );
    expect(input.current).toBeInstanceOf(HTMLInputElement);
    expect(textarea.current).toBeInstanceOf(HTMLTextAreaElement);
  });
  it('associates field labels, descriptions, and errors', () => {
    render(
      <Field
        label="Name"
        description="Your public name"
        error="Name is required"
        required
      >
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText(/name/i);
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toContain('description');
    expect(input.getAttribute('aria-describedby')).toContain('error');
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
  });
  it('preserves explicit control IDs and existing descriptions', () => {
    render(
      <>
        <p id="external-description">External help</p>
        <Field label="Email" description="Account notifications">
          <Input id="email-address" aria-describedby="external-description" />
        </Field>
      </>,
    );
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('id', 'email-address');
    expect(input.getAttribute('aria-describedby')).toContain(
      'external-description',
    );
    expect(input.getAttribute('aria-describedby')).toContain('description');
  });
  it('keeps cards visual and leaves heading semantics to consumers', () => {
    render(
      <Card variant="elevated" aria-label="Project summary">
        <CardTitle>Project summary</CardTitle>
      </Card>,
    );
    expect(screen.getByLabelText('Project summary')).toHaveAttribute(
      'data-variant',
      'elevated',
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
