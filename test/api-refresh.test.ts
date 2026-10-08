import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { startMockApi, type MockApi } from './helpers.js';

let api: MockApi;
let homeDir: string;
let savedHome: string | undefined;
let savedApiUrl: string | undefined;
let refreshes: number;

beforeEach(() => {
  api = startMockApi();

  // Point homedir-based config resolution and the API base URL (both read at
  // import time) at the sandbox before src/ is imported below.
  savedHome = process.env.HOME;
  savedApiUrl = process.env.MDCLI_API_URL;
  homeDir = mkdtempSync(join(tmpdir(), 'mdcli-refresh-test-'));
  process.env.HOME = homeDir;
  process.env.MDCLI_API_URL = api.url;
  const configDir = join(homeDir, '.config', 'mdcli');
  mkdirSync(configDir, { recursive: true });
  writeFileSync(
    join(configDir, 'mdcli.config.json'),
    JSON.stringify({
      auth: { apiKey: 'stale-key', uid: '42', token: 'stale-token' },
      authMethod: 'browser-chrome',
    })
  );

  refreshes = 0;
  mock.module('../src/lib/browser-session.js', () => ({
    extractSessionFromBrowser: async () => {
      refreshes += 1;
      // Slow enough that both concurrent requests 401 while refreshing.
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { apiKey: 'fresh-key', uid: '42', token: 'fresh-token' };
    },
  }));
});

afterEach(() => {
  api.stop();
  rmSync(homeDir, { recursive: true, force: true });
  mock.restore();
  if (savedHome === undefined) {
    delete process.env.HOME;
  } else {
    process.env.HOME = savedHome;
  }
  if (savedApiUrl === undefined) {
    delete process.env.MDCLI_API_URL;
  } else {
    process.env.MDCLI_API_URL = savedApiUrl;
  }
});

describe('concurrent refresh after 401', () => {
  test('two parallel requests share one refresh and both retry with the new credentials', async () => {
    let calls = 0;
    api.on('DELETE /v1/cadastros/contas/1001', () => {
      calls += 1;
      return calls <= 2
        ? new Response(JSON.stringify({ error: 'expired' }), { status: 401 })
        : new Response(null, { status: 204 });
    });

    const { deleteAccount } = await import('../src/lib/api.js');

    await expect(Promise.all([deleteAccount(1001), deleteAccount(1001)])).resolves.toEqual([undefined, undefined]);
    expect(refreshes).toBe(1);
    expect(calls).toBe(4);
    // Both retries went out with the refreshed credentials.
    expect(api.requests[2].headers.get('mdapikey')).toBe('fresh-key');
    expect(api.requests[3].headers.get('mdapikey')).toBe('fresh-key');
  });
});
