import { test, expect, describe, beforeEach, afterEach } from 'vitest';
import { loadConfig, mergeConfigs } from '../../src/config';
import type { ApothekeConfig } from '../../src/types';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

describe('mergeConfigs', () => {
    test('child groups append after parent groups', () => {
        const parent: ApothekeConfig = {
            groups: [{ name: 'React', match: ['react'] }]
        };
        const child: ApothekeConfig = {
            groups: [{ name: 'Local', match: ['./src/**'] }]
        };
        const result = mergeConfigs(parent, child);
        expect(result.groups.map(g => g.name)).toEqual(['React', 'Local']);
    });

    test('child group with same name overrides parent group', () => {
        const parent: ApothekeConfig = {
            groups: [{ name: 'React', match: ['react'] }]
        };
        const child: ApothekeConfig = {
            groups: [{ name: 'React', match: ['react', 'react-dom'] }]
        };
        const result = mergeConfigs(parent, child);
        expect(result.groups).toHaveLength(1);
        expect(result.groups[0]?.match).toEqual(['react', 'react-dom']);
    });

    test('child settings override parent settings', () => {
        const parent: ApothekeConfig = { groups: [], groupComments: true, groupSeparator: true };
        const child: ApothekeConfig = { groups: [], groupComments: false };
        const result = mergeConfigs(parent, child);
        expect(result.groupComments).toBe(false);
        expect(result.groupSeparator).toBe(true);
    });

    test('child aliases merge with parent aliases', () => {
        const parent: ApothekeConfig = { groups: [], aliases: { '@': './src' } };
        const child: ApothekeConfig = { groups: [], aliases: { '~': './lib' } };
        const result = mergeConfigs(parent, child);
        expect(result.aliases).toEqual({ '@': './src', '~': './lib' });
    });
});

describe('loadConfig', () => {
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apotheke-test-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true });
    });

    test('loads config from apotheke.config.ts', async () => {
        const configPath = path.join(tmpDir, 'apotheke.config.ts');
        fs.writeFileSync(
            configPath,
            `export default { groups: [{ name: "React", match: ["react"] }] };`
        );
        const config = await loadConfig(configPath);
        expect(config.groups[0]?.name).toBe('React');
    });

    test('reads baseUrl from tsconfig.json when present', async () => {
        const configPath = path.join(tmpDir, 'apotheke.config.ts');
        fs.writeFileSync(configPath, `export default { groups: [] };`);
        const tsconfig = path.join(tmpDir, 'tsconfig.json');
        fs.writeFileSync(tsconfig, JSON.stringify({ compilerOptions: { baseUrl: './src' } }));
        const config = await loadConfig(configPath);
        expect(config.baseUrl).toBe('./src');
    });

    test('reads paths aliases from tsconfig.json', async () => {
        const configPath = path.join(tmpDir, 'apotheke.config.ts');
        fs.writeFileSync(configPath, `export default { groups: [] };`);
        const tsconfig = path.join(tmpDir, 'tsconfig.json');
        fs.writeFileSync(
            tsconfig,
            JSON.stringify({ compilerOptions: { paths: { '@/*': ['./src/*'] } } })
        );
        const config = await loadConfig(configPath);
        expect(config.aliases?.['@']).toBe('./src');
    });
});
