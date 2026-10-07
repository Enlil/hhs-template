export interface ConditionalContext {
  /** Options the user turned on. */
  enabled: ReadonlySet<string>;
  /** Every option id that exists anywhere in the registry — a marker naming anything else is a typo. */
  known: ReadonlySet<string>;
}

// A marker is a whole line holding a comment in the file's own language, so
// the template stays valid XML/Java/YAML/etc. before it's rendered:
//   // #if lombok        <!-- #if lombok -->        # #if lombok
//   // #else
//   // #endif
// `#if !lombok` negates. Requiring the comment prefix keeps real preprocessor
// directives (C#'s `#if DEBUG`) from ever being mistaken for a marker.
const MARKER = /^\s*(?:\/\/|#|<!--)\s*#(if|else|endif)(?:\s+(!)?([a-z][a-z0-9-]*))?\s*(?:-->)?\s*$/;
const MIGHT_HAVE_MARKERS = /#(?:if|else|endif)\b/;

interface Frame {
  parentActive: boolean;
  conditionTrue: boolean;
  seenElse: boolean;
  line: number;
}

/**
 * Keeps or drops the lines between `#if <option>` / `#else` / `#endif`
 * markers depending on which options are enabled. Marker lines themselves
 * never reach the output. Throws on typos (unknown option, unbalanced
 * markers) so a broken template fails loudly in tests instead of shipping.
 */
export function applyConditionals(text: string, context: ConditionalContext, fileLabel: string): string {
  if (!MIGHT_HAVE_MARKERS.test(text)) return text;

  const fail = (line: number, message: string): never => {
    throw new Error(`${fileLabel}:${line}: ${message}`);
  };

  const output: string[] = [];
  const stack: Frame[] = [];
  let active = true;

  text.split('\n').forEach((line, index) => {
    const lineNumber = index + 1;
    const marker = MARKER.exec(line);

    if (!marker) {
      if (active) output.push(line);
      return;
    }

    const [, kind, negation, name] = marker;

    if (kind === 'if') {
      if (!name) return fail(lineNumber, '"#if" needs an option name, e.g. "// #if lombok".');
      if (!context.known.has(name)) return fail(lineNumber, `unknown option "${name}" in "#if" marker.`);
      const conditionTrue = context.enabled.has(name) !== Boolean(negation);
      stack.push({ parentActive: active, conditionTrue, seenElse: false, line: lineNumber });
      active = active && conditionTrue;
      return;
    }

    const frame = kind === 'else' ? stack[stack.length - 1] : stack.pop();
    if (!frame) return fail(lineNumber, `"#${kind}" without a matching "#if".`);

    if (kind === 'else') {
      if (frame.seenElse) return fail(lineNumber, 'a second "#else" for the same "#if".');
      frame.seenElse = true;
      active = frame.parentActive && !frame.conditionTrue;
    } else {
      active = frame.parentActive;
    }
  });

  const unclosed = stack[stack.length - 1];
  if (unclosed) fail(unclosed.line, '"#if" is never closed with "#endif".');

  return output.join('\n');
}
