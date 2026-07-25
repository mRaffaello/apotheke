import type { ImportNode } from './types';

export function sortGroup(imports: ImportNode[]): ImportNode[] {
    return [...imports].sort((a, b) => {
        // type imports float to top
        if (a.importKind === 'type' && b.importKind !== 'type') return -1;
        if (a.importKind !== 'type' && b.importKind === 'type') return 1;
        return a.specifier.localeCompare(b.specifier);
    });
}

export function sortNamedImports(node: ImportNode): ImportNode {
    const sorted = [...node.namedImports].sort((a, b) => {
        if (a.kind === 'type' && b.kind !== 'type') return -1;
        if (a.kind !== 'type' && b.kind === 'type') return 1;
        return a.name.localeCompare(b.name);
    });
    return { ...node, namedImports: sorted };
}
