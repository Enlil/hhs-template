import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import type { ComponentType } from 'react';

export interface ToggleOption<Value extends string> {
  value: Value;
  /** Read out by screen readers: the options are only icons. */
  label: string;
  icon: ComponentType<{ width?: number; height?: number }>;
}

export interface SegmentedToggleProps<Value extends string> {
  /** What is being switched, for screen readers: "Theme". */
  label: string;
  options: Array<ToggleOption<Value>>;
  value: Value;
  onChange: (value: Value) => void;
}

// The guide's toggle: a white pill with one icon button per choice, the picked one filled blue (the look
// is the theme's <ToggleButtonGroup>, in src/theme.ts).
export function SegmentedToggle<Value extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedToggleProps<Value>): React.JSX.Element {
  return (
    <ToggleButtonGroup
      exclusive
      aria-label={label}
      value={value}
      onChange={(_event, next: Value | null) => {
        if (next !== null) onChange(next);
      }}
      sx={{ width: 'fit-content' }}
    >
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
        <ToggleButton key={optionValue} value={optionValue} aria-label={optionLabel}>
          <Icon width={20} height={20} />
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
