import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import type { OutlinedInputProps } from '@mui/material/OutlinedInput';
import { useId } from 'react';

export interface FieldProps extends Omit<OutlinedInputProps, 'label' | 'notched'> {
  label: string;
}

// The guide's text field: the label above, then a white pill (a rounded box when `multiline`). Pass
// `startAdornment` for something before the value, like the "$" of a price. The look is the theme's
// (src/theme.ts), so any other MUI input gets it too.
export function Field({ label, id, fullWidth = true, ...props }: FieldProps): React.JSX.Element {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <FormControl fullWidth={fullWidth} disabled={props.disabled} error={props.error} required={props.required}>
      <FormLabel htmlFor={inputId} required={false}>
        {label}
      </FormLabel>
      <OutlinedInput id={inputId} {...props} />
    </FormControl>
  );
}
