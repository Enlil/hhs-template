import type { KeyboardEvent } from 'react';

// The look of one tab, shared by <Tabs> and the top navigation (whose tabs are links).
export function tabClasses(active: boolean): string {
  return `shrink-0 border-b-2 px-6 py-4 text-h4 text-text transition-colors ${
    active ? 'border-primary' : 'border-transparent hover:border-base-light'
  }`;
}

export interface TabsProps {
  /** What the tabs switch between, for screen readers. */
  label: string;
  tabs: string[];
  value: string;
  onChange: (tab: string) => void;
}

// A row of tabs that switch in-page content; you supply the content, and give it role="tabpanel". The
// left and right arrow keys move between the tabs, as users expect.
export function Tabs({ label, tabs, value, onChange }: TabsProps): React.JSX.Element {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = tabs[(tabs.indexOf(value) + step + tabs.length) % tabs.length];
    onChange(next);
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[tabs.indexOf(next)]?.focus();
  }

  return (
    <div role="tablist" aria-label={label} onKeyDown={handleKeyDown} className="flex border-b border-surface">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={tab === value}
          tabIndex={tab === value ? 0 : -1}
          onClick={() => onChange(tab)}
          className={tabClasses(tab === value)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
