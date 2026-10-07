import { describe, expect, it } from 'vitest';
import { resolveOptions } from '../src/core/resolve-options.js';
import { backendRegistry, frontendRegistry } from '../src/registry/index.js';

const react = frontendRegistry.react;
const node = backendRegistry.node;
const spring = backendRegistry.springboot;

describe('resolveOptions', () => {
  it("uses each option's default when nothing is asked for", () => {
    const { enabled, values } = resolveOptions(react, spring);

    expect(values).toEqual({ 'java-version': '25', lombok: false });
    expect([...enabled]).toEqual([]);
  });

  it('takes a choice and an on/off option as asked', () => {
    const { enabled, values } = resolveOptions(react, spring, { 'java-version': '17', lombok: true });

    expect(values).toEqual({ 'java-version': '17', lombok: true });
    expect([...enabled]).toEqual(['lombok']);
  });

  it('an explicit "off" beats a default, and an explicit choice beats the default choice', () => {
    expect(resolveOptions(react, spring, { lombok: false, 'java-version': '21' }).values).toEqual({
      'java-version': '21',
      lombok: false,
    });
  });

  it('lists only on/off options as enabled: a choice is never an #if flag', () => {
    expect([...resolveOptions(react, spring, { 'java-version': '21' }).enabled]).toEqual([]);
    expect([...resolveOptions(react, spring, { 'java-version': '21', lombok: true }).enabled]).toEqual(['lombok']);
  });

  it('has nothing to settle for a stack that offers no options', () => {
    const { enabled, values } = resolveOptions(react, node);

    expect(values).toEqual({});
    expect(enabled.size).toBe(0);
  });

  describe('rejects', () => {
    it.each<[string, Record<string, boolean | string>, RegExp]>([
      ['a value that is not one of the choices', { 'java-version': '99' }, /must be one of: 25, 21, 17 \(got "99"\)/],
      ['a number for a choice', { 'java-version': 21 as unknown as string }, /must be one of: 25, 21, 17 \(got 21\)/],
      ['a boolean for a choice', { 'java-version': true }, /must be one of: 25, 21, 17 \(got true\)/],
      ['text for an on/off option', { lombok: 'yes' }, /must be true or false \(got "yes"\)/],
    ])('%s', (_label, requested, message) => {
      expect(() => resolveOptions(react, spring, requested)).toThrow(message);
    });

    it('an option the chosen backend does not offer, naming who does', () => {
      expect(() => resolveOptions(react, node, { 'java-version': '21' })).toThrow(
        /"java-version" isn't available for React \+ Node\.js\. It only applies to Spring Boot/,
      );
      expect(() => resolveOptions(react, node, { lombok: true })).toThrow(/It only applies to Spring Boot/);
    });

    it('an option that does not exist at all', () => {
      expect(() => resolveOptions(react, spring, { lombk: true })).toThrow(/"lombk".*There is no such option/);
    });
  });
});
