let lastId = 0;

/** An id no other element on the page has, for linking a <label> to its field: `uniqueId('app-input')` is "app-input-1", then "app-input-2". */
export function uniqueId(prefix: string): string {
  return `${prefix}-${++lastId}`;
}
