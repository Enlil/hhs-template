import { describe, expect, it } from 'vitest';
import { applyConditionals, type ConditionalContext } from '../src/core/conditionals.js';

const known = new Set(['lombok', 'docker']);
const on = (...enabled: string[]): ConditionalContext => ({ enabled: new Set(enabled), known });
const run = (text: string, context: ConditionalContext): string => applyConditionals(text, context, 'test-file');

describe('applyConditionals', () => {
  it('keeps the block when the option is on and drops it when off', () => {
    const text = ['a', '// #if lombok', 'b', '// #endif', 'c'].join('\n');

    expect(run(text, on('lombok'))).toBe('a\nb\nc');
    expect(run(text, on())).toBe('a\nc');
  });

  it('supports #else', () => {
    const text = ['// #if lombok', 'with', '// #else', 'without', '// #endif'].join('\n');

    expect(run(text, on('lombok'))).toBe('with');
    expect(run(text, on())).toBe('without');
  });

  it('supports negation with #if !option', () => {
    const text = ['// #if !lombok', 'plain', '// #endif'].join('\n');

    expect(run(text, on())).toBe('plain');
    expect(run(text, on('lombok'))).toBe('');
  });

  it('handles nested blocks, including inside a dropped block', () => {
    const text = ['// #if lombok', 'L', '// #if docker', 'LD', '// #endif', '// #endif', 'end'].join('\n');

    expect(run(text, on('lombok', 'docker'))).toBe('L\nLD\nend');
    expect(run(text, on('lombok'))).toBe('L\nend');
    expect(run(text, on('docker'))).toBe('end');
  });

  it('recognizes markers written as //, # and <!-- --> comments', () => {
    const java = '// #if lombok\nx\n// #endif';
    const yaml = '# #if lombok\nx\n# #endif';
    const xml = '<!-- #if lombok -->\nx\n<!-- #endif -->';

    for (const text of [java, yaml, xml]) {
      expect(run(text, on('lombok'))).toBe('x');
      expect(run(text, on())).toBe('');
    }
  });

  it('allows indented markers', () => {
    expect(run('    // #if lombok\n    x\n    // #endif', on('lombok'))).toBe('    x');
  });

  it('keeps CRLF line endings on the lines it keeps', () => {
    expect(run('a\r\n// #if lombok\r\nb\r\n// #endif\r\nc\r\n', on('lombok'))).toBe('a\r\nb\r\nc\r\n');
  });

  it('returns text without markers untouched', () => {
    const text = 'package x;\n\npublic class A {}\n';
    expect(run(text, on('lombok'))).toBe(text);
  });

  it('does not treat real preprocessor directives (C# #if DEBUG) as markers', () => {
    const text = '#if DEBUG\nvar x = 1;\n#endif\n';
    expect(run(text, on())).toBe(text);
  });

  it('fails loudly on an unknown option name, naming the file and line', () => {
    expect(() => run('a\n// #if lombk\nb\n// #endif', on())).toThrow(/test-file:2: unknown option "lombk"/);
  });

  it('fails on unbalanced markers', () => {
    expect(() => run('// #endif', on())).toThrow(/test-file:1: "#endif" without a matching "#if"/);
    expect(() => run('// #else', on())).toThrow(/"#else" without a matching "#if"/);
    expect(() => run('// #if lombok\nx', on())).toThrow(/test-file:1: "#if" is never closed/);
    expect(() => run('// #if lombok\n// #else\n// #else\n// #endif', on())).toThrow(/second "#else"/);
  });

  it('fails on #if with no option name', () => {
    expect(() => run('// #if\nx\n// #endif', on())).toThrow(/needs an option name/);
  });
});
