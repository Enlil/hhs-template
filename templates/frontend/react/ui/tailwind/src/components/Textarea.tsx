import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

// Like Input, for longer text. `className` goes on the whole field.
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, id, className = '', rows = 3, ...props },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label ? (
        <label htmlFor={textareaId} className="text-content-2 text-muted">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className="w-full resize-y rounded-xl bg-surface px-5 py-3.5 text-content-3 text-text placeholder:text-subtle disabled:opacity-50"
        {...props}
      />
    </div>
  );
});
