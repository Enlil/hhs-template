import { APP_NAME } from '../lib/config';
import { APP_VERSION } from '../lib/version';

export function Footer(): React.JSX.Element {
  return (
    <footer className="shrink-0 border-t border-border bg-surface px-4 py-3 text-center text-xs text-muted sm:px-6">
      {APP_NAME} &middot; v{APP_VERSION}
    </footer>
  );
}
