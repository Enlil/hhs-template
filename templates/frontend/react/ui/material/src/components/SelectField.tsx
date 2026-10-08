import { ChevronDownIcon } from '@heroicons/react/24/solid';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Select from '@mui/material/Select';
import type { SelectProps } from '@mui/material/Select';
import { useId } from 'react';

export type SelectFieldProps<Value = unknown> = Omit<SelectProps<Value>, 'label' | 'variant'> & { label: string };

// The guide's select: the label above, then a white pill with a chevron. Fill it with MUI <MenuItem>s.
export function SelectField<Value = unknown>({ label, children, ...props }: SelectFieldProps<Value>): React.JSX.Element {
  const labelId = useId();

  return (
    <FormControl fullWidth disabled={props.disabled}>
      <FormLabel id={labelId}>{label}</FormLabel>
      <Select<Value> labelId={labelId} displayEmpty IconComponent={ChevronDownIcon} {...props}>
        {children}
      </Select>
    </FormControl>
  );
}
