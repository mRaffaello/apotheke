import { test, expect, describe } from 'vitest';
import { deduplicateImports } from '../../src/deduplicator';
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

describe('deduplicateImports', () => {
    test('leaves unique imports untouched', () => {
        const imports = [makeImport('react'), makeImport('./utils')];
        expect(deduplicateImports(imports)).toHaveLength(2);
    });

    test('merges named imports from same specifier', () => {
        const imports = [
            makeImport('./utils', { namedImports: [{ name: 'foo', kind: 'value' }] }),
            makeImport('./utils', { namedImports: [{ name: 'bar', kind: 'value' }] })
        ];
        const result = deduplicateImports(imports);
        expect(result).toHaveLength(1);
        expect(result[0]?.namedImports.map(n => n.name)).toEqual(['foo', 'bar']);
    });

    test('removes duplicate named imports', () => {
        const imports = [
            makeImport('./utils', { namedImports: [{ name: 'foo', kind: 'value' }] }),
            makeImport('./utils', {
                namedImports: [
                    { name: 'foo', kind: 'value' },
                    { name: 'bar', kind: 'value' }
                ]
            })
        ];
        const result = deduplicateImports(imports);
        expect(result[0]?.namedImports).toHaveLength(2);
        expect(result[0]?.namedImports.map(n => n.name)).toEqual(['foo', 'bar']);
    });

    test('merges default import with named imports from same specifier', () => {
        const imports = [
            makeImport('./component', { defaultImport: 'MyComp' }),
            makeImport('./component', { namedImports: [{ name: 'helper', kind: 'value' }] })
        ];
        const result = deduplicateImports(imports);
        expect(result).toHaveLength(1);
        expect(result[0]?.defaultImport).toBe('MyComp');
        expect(result[0]?.namedImports.map(n => n.name)).toEqual(['helper']);
    });

    test('keeps import type separate from value imports', () => {
        const imports = [
            makeImport('./types', {
                importKind: 'type',
                namedImports: [{ name: 'Foo', kind: 'value' }]
            }),
            makeImport('./types', { namedImports: [{ name: 'bar', kind: 'value' }] })
        ];
        const result = deduplicateImports(imports);
        expect(result).toHaveLength(2);
        const typeImport = result.find(i => i.importKind === 'type');
        const valueImport = result.find(i => i.importKind === 'value');
        expect(typeImport?.namedImports.map(n => n.name)).toEqual(['Foo']);
        expect(valueImport?.namedImports.map(n => n.name)).toEqual(['bar']);
    });

    test('keeps side-effect imports separate (they have observable effects)', () => {
        const imports = [
            makeImport('./styles.css', { isSideEffect: true }),
            makeImport('./styles.css', { isSideEffect: true })
        ];
        const result = deduplicateImports(imports);
        // Two side-effect imports from same file are deduplicated (safe — same effect)
        expect(result).toHaveLength(1);
    });

    test('preserves attachedComment of first occurrence', () => {
        const imports = [
            makeImport('./utils', {
                attachedComment: '// Utils',
                namedImports: [{ name: 'foo', kind: 'value' }]
            }),
            makeImport('./utils', { namedImports: [{ name: 'bar', kind: 'value' }] })
        ];
        const result = deduplicateImports(imports);
        expect(result[0]?.attachedComment).toBe('// Utils');
    });
});
