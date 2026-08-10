// Node
import path from 'node:path';

// Internal
import type { ApothekeConfig, GroupedImports, ImportNode } from './types';
import { OTHERS_GROUP } from './types';

interface GroupOptions {
    fileDir?: string;
    rootDir?: string;
}

// Groups one span of value imports. Side-effect imports never reach here: they
// are held in place by format as barriers between spans.
export function groupImports(
    imports: ImportNode[],
    config: ApothekeConfig,
    options: GroupOptions = {}
): GroupedImports[] {
    const buckets = new Map<string, ImportNode[]>();

    for (const node of imports) {
        const groupName = assignGroup(node, config, options);
        if (!buckets.has(groupName)) buckets.set(groupName, []);
        buckets.get(groupName)!.push(node);
    }

    const result: GroupedImports[] = [];

    // User-defined groups in config order
    for (const group of config.groups) {
        if (buckets.has(group.name)) {
            result.push({ name: group.name, imports: buckets.get(group.name)! });
        }
    }

    // Others always last
    if (buckets.has(OTHERS_GROUP)) {
        result.push({ name: OTHERS_GROUP, imports: buckets.get(OTHERS_GROUP)! });
    }

    return result;
}

function assignGroup(node: ImportNode, config: ApothekeConfig, options: GroupOptions): string {
    const canonicalPath = resolveCanonicalPath(node.specifier, config, options);

    for (const group of config.groups) {
        for (const pattern of group.match) {
            if (matches(node.specifier, pattern)) return group.name;
            if (canonicalPath && matches(canonicalPath, pattern)) return group.name;
        }
    }

    return OTHERS_GROUP;
}

function resolveCanonicalPath(
    specifier: string,
    config: ApothekeConfig,
    options: GroupOptions
): string | null {
    // Relative path import
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
        const base = options.fileDir ?? process.cwd();
        return path.resolve(base, specifier);
    }

    // Alias resolution
    const aliases = config.aliases ?? {};
    for (const [alias, target] of Object.entries(aliases)) {
        const prefix = alias.endsWith('/') ? alias : `${alias}/`;
        if (specifier === alias || specifier.startsWith(prefix)) {
            const rest = specifier.slice(prefix.length);
            const root = options.rootDir ?? process.cwd();
            const resolved = path.resolve(root, target, rest);
            return resolved;
        }
    }

    return null;
}

function matches(value: string, pattern: string): boolean {
    return globToRegex(pattern).test(value);
}

function globToRegex(pattern: string): RegExp {
    let i = 0;
    let re = '^';
    while (i < pattern.length) {
        const ch = pattern[i]!;
        if (ch === '*' && pattern[i + 1] === '*') {
            if (i === 0 && pattern[i + 2] === '/') {
                // Leading **/ — matches any depth prefix including none
                re += '(.*\\/)?';
                i += 3;
            } else {
                re += '.*';
                i += 2;
                if (pattern[i] === '/') i++;
            }
        } else if (ch === '*') {
            re += '[^/]*';
            i++;
        } else if (ch === '?') {
            re += '[^/]';
            i++;
        } else {
            re += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
            i++;
        }
    }
    return new RegExp(re + '$');
}
