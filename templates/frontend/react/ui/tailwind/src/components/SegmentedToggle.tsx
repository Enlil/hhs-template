import type { ComponentType } from 'react';

export interface ToggleOption<Value extends string> {
  value: Value;
  /** Read out by screen readers: the options are only icons. */
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export interface SegmentedToggleProps<Value extends string> {
  /** What is being switched, for screen readers: "Theme". */
  label: string;
  options: Array<ToggleOption<Value>>;
  value: Value;
  onChange: (value: Value) => void;
}

// The guide's toggle: a white pill with one icon button per choice, the picked one filled blue.
export function SegmentedToggle<Value extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedToggleProps<Value>): React.JSX.Element {
  return (
    <div role="group" aria-label={label} className="inline-flex h-11 w-fit overflow-hidden rounded-pill bg-surface">
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => {
        const picked = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            aria-pressed={picked}
            aria-label={optionLabel}
            onClick={() => onChange(optionValue)}
            className={`flex size-11 items-center justify-center rounded-pill transition-colors ${
              picked ? 'bg-primary text-primary-foreground' : 'text-text hover:bg-primary-lighter'
            }`}
          >
            <Icon className="size-5" />
          </button>
        );
      })}
    </div>
  );
}
