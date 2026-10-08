export interface StepProps {
  number: number;
  label: string;
  active?: boolean;
}

// One step of a process, like "1 Capture Document". The one you are on is `active`.
export function Step({ number, label, active = false }: StepProps): React.JSX.Element {
  return (
    <div
      aria-current={active ? 'step' : undefined}
      className={`flex items-center gap-4 rounded-lg px-6 py-4 ${active ? 'bg-primary/20' : 'bg-surface/20'}`}
    >
      <span
        className={`flex size-14 shrink-0 items-center justify-center rounded-pill font-title text-h2 ${
          active ? 'bg-primary text-primary-foreground' : 'bg-surface/60 text-text'
        }`}
      >
        {number}
      </span>
      <span className="font-title text-h2 text-text">{label}</span>
    </div>
  );
}
