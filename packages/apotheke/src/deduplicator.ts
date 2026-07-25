import type { ImportNode, NamedImport } from './types';

export function deduplicateImports(imports: ImportNode[]): ImportNode[] {
    // Group by dedup key: specifier + importKind (type imports stay separate)
    const map = new Map<string, ImportNode>();

    for (const node of imports) {
        const key = `${node.importKind}::${node.specifier}`;

        if (!map.has(key)) {
            map.set(key, { ...node, namedImports: [...node.namedImports] });
            continue;
        }

        const existing = map.get(key)!;

        if (node.defaultImport && !existing.defaultImport) {
            existing.defaultImport = node.defaultImport;
        }

        if (node.namespaceImport && !existing.namespaceImport) {
            existing.namespaceImport = node.namespaceImport;
        }

        for (const named of node.namedImports) {
            if (!existing.namedImports.some(n => n.name === named.name && n.kind === named.kind)) {
                existing.namedImports.push(named);
            }
        }

        existing.isSideEffect =
            !existing.defaultImport &&
            !existing.namespaceImport &&
            existing.namedImports.length === 0;
    }

    return Array.from(map.values());
}
