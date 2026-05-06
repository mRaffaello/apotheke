import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import type { ApothekeConfig } from './types';

export function mergeConfigs(parent: ApothekeConfig, child: ApothekeConfig): ApothekeConfig {
    const mergedGroups = [...parent.groups];

    for (const childGroup of child.groups ?? []) {
        const existingIdx = mergedGroups.findIndex(g => g.name === childGroup.name);
        if (existingIdx >= 0) {
            mergedGroups[existingIdx] = childGroup;
        } else {
            mergedGroups.push(childGroup);
        }
    }

    return {
        ...parent,
        ...child,
        groups: mergedGroups,
        aliases: { ...(parent.aliases ?? {}), ...(child.aliases ?? {}) }
    };
}

export async function loadConfig(configPath: string): Promise<ApothekeConfig> {
    const mod = await import(configPath);
    const userConfig: ApothekeConfig = mod.default ?? mod;

    const configDir = path.dirname(configPath);

    const config: ApothekeConfig = { ...userConfig };

    const tsconfig = loadTsConfig(configDir);
    if (tsconfig) {
        const opts = (tsconfig.compilerOptions ?? {}) as Record<string, unknown>;

        if (opts.baseUrl && !config.baseUrl) {
            config.baseUrl = opts.baseUrl as string;
        }

        if (opts.paths) {
            const aliases: Record<string, string> = { ...(config.aliases ?? {}) };
            for (const [aliasPattern, targets] of Object.entries(
                opts.paths as Record<string, string[]>
            )) {
                const alias = aliasPattern.replace(/\/\*$/, '');
                const target = (targets[0] ?? '').replace(/\/\*$/, '');
                if (!aliases[alias]) aliases[alias] = target;
            }
            config.aliases = aliases;
        }
    }

    if (userConfig.extends) {
        const parentPath = path.resolve(configDir, userConfig.extends);
        if (!existsSync(parentPath)) {
            throw new Error(
                `apotheke: extended config not found: ${parentPath}\n` +
                `  (referenced from ${configPath} via "extends": "${userConfig.extends}")`
            );
        }
        const parent = await loadConfig(parentPath);
        return mergeConfigs(parent, config);
    }

    return config;
}

function loadTsConfig(dir: string): Record<string, unknown> | null {
    const tsconfigPath = path.join(dir, 'tsconfig.json');
    if (!existsSync(tsconfigPath)) return null;
    try {
        const text = readFileSync(tsconfigPath, 'utf8');
        const cleaned = text.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
        return JSON.parse(cleaned);
    } catch {
        return null;
    }
}
