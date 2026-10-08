import { useCallback, useEffect, useState } from 'react';
import { fetchExample, type ExampleResponse } from './api';

export type ExampleState =
  | { status: 'loading' }
  | { status: 'success'; data: ExampleResponse }
  | { status: 'error'; message: string };

// Loads GET /api/example when the page opens, and again whenever `reload` is
// called (the Retry button). It holds no markup, so the dashboard of every CSS
// framework folder (see ui/ in the template) shows the same three states its own way.
export function useExample(): { state: ExampleState; reload: () => void } {
  const [state, setState] = useState<ExampleState>({ status: 'loading' });

  const reload = useCallback((): void => {
    setState({ status: 'loading' });
    fetchExample()
      .then((data) => setState({ status: 'success', data }))
      .catch((error: unknown) =>
        setState({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' }),
      );
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { state, reload };
}
