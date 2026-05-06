import { test, expect, describe } from 'vitest';
import { sortGroup, sortNamedImports } from '../../src/sorter';
import type { ImportNode } from '../../src/types';

function makeImport(specifier: string, overrides: Partial<ImportNode> = {}): ImportNode {
    return {
        specifier,
        namedImports: [],
        isSideEffect: false,
        importKind: 'value',
        start: 0,
        end: 0,
        ...overrides
    };
}

describe('sortGroup', () => {
    test('sorts imports alphabetically by specifier', () => {
        const imports = [makeImport('./zoo'), makeImport('./alpha'), makeImport('./beta')];
        const result = sortGroup(imports);
        expect(result.map(i => i.specifier)).toEqual(['./alpha', './beta', './zoo']);
    });

    test('type imports float to top of group', () => {
        const imports = [
            makeImport('./utils', { importKind: 'value' }),
            makeImport('./types', { importKind: 'type' }),
            makeImport('./helpers', { importKind: 'value' })
        ];
        const result = sortGroup(imports);
        expect(result[0]?.importKind).toBe('type');
        expect(result[0]?.specifier).toBe('./types');
    });

    test('type imports among themselves are alphabetical', () => {
        const imports = [
            makeImport('./z-types', { importKind: 'type' }),
            makeImport('./a-types', { importKind: 'type' })
        ];
        const result = sortGroup(imports);
        expect(result[0]?.specifier).toBe('./a-types');
    });

    test('value imports among themselves are alphabetical', () => {
        const imports = [makeImport('./zoo'), makeImport('./alpha')];
        const result = sortGroup(imports);
        expect(result[0]?.specifier).toBe('./alpha');
    });
});

describe('sortNamedImports', () => {
    test('sorts named imports alphabetically', () => {
        const node = makeImport('react', {
            namedImports: [
                { name: 'useState', kind: 'value' },
                { name: 'useEffect', kind: 'value' },
                { name: 'useCallback', kind: 'value' }
            ]
        });
        const result = sortNamedImports(node);
        expect(result.namedImports.map(n => n.name)).toEqual([
            'useCallback',
            'useEffect',
            'useState'
        ]);
    });

    test('type named imports float to top within named list', () => {
        const node = makeImport('./module', {
            namedImports: [
                { name: 'foo', kind: 'value' },
                { name: 'Bar', kind: 'type' },
                { name: 'baz', kind: 'value' }
            ]
        });
        const result = sortNamedImports(node);
        expect(result.namedImports[0]?.kind).toBe('type');
        expect(result.namedImports[0]?.name).toBe('Bar');
    });

    test('preserves default import and specifier', () => {
        const node = makeImport('react', {
            defaultImport: 'React',
            namedImports: [
                { name: 'useState', kind: 'value' },
                { name: 'useEffect', kind: 'value' }
            ]
        });
        const result = sortNamedImports(node);
        expect(result.defaultImport).toBe('React');
        expect(result.specifier).toBe('react');
    });
});
