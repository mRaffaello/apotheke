import type { ImportNode, GroupedImports, ApothekeConfig } from './types';

export function detectQuoteChar(source: string): "'" | '"' {
    const m = source.match(/from\s*(["'])/);
    return m?.[1] === '"' ? '"' : "'";
}

export function printImportNode(node: ImportNode, q: "'" | '"' = "'"): string {
    return buildImportStatement(node, q);
}

export function printGroups(
    groups: GroupedImports[],
    config: ApothekeConfig,
    q: "'" | '"' = "'"
): string {
    const useComments = config.groupComments !== false;
    const useSeparator = config.groupSeparator !== false;

    const parts: string[] = [];

    for (const group of groups) {
        const importLines: string[] = [];

        for (let i = 0; i < group.imports.length; i++) {
            const node = group.imports[i]!;

            if (i === 0 && useComments) {
                importLines.push(`// ${group.name}\n${buildImportStatement(node, q)}`);
                continue;
            }

            importLines.push(printImportNode(node, q));
        }

        parts.push(importLines.join('\n'));
    }

    return parts.join(useSeparator ? '\n\n' : '\n');
}

function buildImportStatement(node: ImportNode, q: "'" | '"'): string {
    if (node.isSideEffect) {
        return `import ${q}${node.specifier}${q};`;
    }

    const typePrefix = node.importKind === 'type' ? 'type ' : '';
    const parts: string[] = [];

    if (node.defaultImport) {
        parts.push(node.defaultImport);
    }

    if (node.namespaceImport) {
        parts.push(`* as ${node.namespaceImport}`);
    }

    if (node.namedImports.length > 0) {
        const named = node.namedImports
            .map(n => {
                const typePrefix = n.kind === 'type' ? 'type ' : '';
                return n.alias ? `${typePrefix}${n.name} as ${n.alias}` : `${typePrefix}${n.name}`;
            })
            .join(', ');
        parts.push(`{ ${named} }`);
    }

    return `import ${typePrefix}${parts.join(', ')} from ${q}${node.specifier}${q};`;
}
