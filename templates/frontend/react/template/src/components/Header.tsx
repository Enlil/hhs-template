import logo from '../assets/logo.svg';

const APP_NAME = '{{projectName}}';

export function Header(): React.JSX.Element {
  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center justify-between bg-primary px-4 text-primary-foreground sm:px-6">
      <div className="flex items-center gap-3">
        <img src={logo} alt="" className="h-8 w-8" />
        <span className="text-lg font-semibold">{APP_NAME}</span>
      </div>
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-medium"
        aria-hidden="true"
      >
        U
      </div>
    </header>
  );
}
