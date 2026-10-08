import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { parseFirefoxInstallDefault } from '../src/lib/browser-session.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'mdcli-firefox-ini-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function writeIni(name: string, content: string): string {
  const path = join(dir, name);
  writeFileSync(path, content);
  return path;
}

describe('parseFirefoxInstallDefault', () => {
  test('prefers the install-section default over the legacy profile flag', () => {
    const path = writeIni(
      'profiles.ini',
      [
        '[Profile1]',
        'Name=default',
        'IsRelative=1',
        'Path=Profiles/lxzf6zzf.default',
        'Default=1',
        '',
        '[Profile0]',
        'Name=default-release',
        'IsRelative=1',
        'Path=Profiles/0gpyfjx8.default-release',
        '',
        '[General]',
        'StartWithLastProfile=1',
        'Version=2',
        '',
        '[Install2656FF1E876E9973]',
        'Default=Profiles/0gpyfjx8.default-release',
        'Locked=1',
        '',
      ].join('\n')
    );

    expect(parseFirefoxInstallDefault(path)).toBe('Profiles/0gpyfjx8.default-release');
  });

  test('returns null when no install section names a default', () => {
    const path = writeIni(
      'profiles.ini',
      ['[Profile0]', 'Name=default-release', 'IsRelative=1', 'Path=Profiles/abc.default-release', 'Default=1', ''].join(
        '\n'
      )
    );

    expect(parseFirefoxInstallDefault(path)).toBeNull();
  });

  test('returns null for an install section without a Default key or with an empty one', () => {
    const lockedOnly = writeIni('a.ini', ['[InstallABC]', 'Locked=1', ''].join('\n'));
    const emptyDefault = writeIni('b.ini', ['[InstallABC]', 'Default=', 'Locked=1', ''].join('\n'));

    expect(parseFirefoxInstallDefault(lockedOnly)).toBeNull();
    expect(parseFirefoxInstallDefault(emptyDefault)).toBeNull();
  });

  test('handles CRLF line endings and absolute paths', () => {
    const path = writeIni(
      'profiles.ini',
      ['[Profile0]', 'Name=x', 'Path=C:\\Firefox\\Profiles\\abc', '', '[InstallABC]', 'Default=C:\\Firefox\\Profiles\\abc', ''].join(
        '\r\n'
      )
    );

    expect(parseFirefoxInstallDefault(path)).toBe('C:\\Firefox\\Profiles\\abc');
  });
});
