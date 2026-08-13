import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, type FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Button, Field, Input, Textarea } from '@/ui/components';

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
  });
});
