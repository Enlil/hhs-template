import { APP_NAME } from '../lib/config';
import { APP_VERSION } from '../lib/version';

export function Footer(): React.JSX.Element {
  return (
    <footer className="shrink-0 py-2 text-center text-content-4 text-muted">
      {APP_NAME} &middot; v{APP_VERSION}
    </footer>
  );
}
