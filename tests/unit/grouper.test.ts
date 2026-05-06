import { test, expect, describe } from 'vitest';
import { groupImports } from '../../src/grouper';
import type { ImportNode, ApothekeConfig } from '../../src/types';

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

const config: ApothekeConfig = {
    groups: [
        { name: 'React', match: ['react', 'react-*'] },
        { name: 'Hooks', match: ['**/hooks/**'] },
        { name: 'Api', match: ['**/api/**', '@tanstack/react-query'] }
    ]
};

describe('groupImports', () => {
    test('assigns package import to matching group', () => {
        const imports = [makeImport('react')];
        const result = groupImports(imports, config);
        const reactGroup = result.find(g => g.name === 'React');
        expect(reactGroup?.imports).toHaveLength(1);
        expect(reactGroup?.imports[0]?.specifier).toBe('react');
    });

    test('matches wildcard package pattern', () => {
        const imports = [makeImport('react-dom')];
        const result = groupImports(imports, config);
        expect(result.find(g => g.name === 'React')?.imports).toHaveLength(1);
    });

    test('assigns path import to matching glob group', () => {
        const imports = [makeImport('../../../hooks/use-auth')];
        const result = groupImports(imports, config, { fileDir: '/project/src/pages' });
        expect(result.find(g => g.name === 'Hooks')?.imports).toHaveLength(1);
    });

    test('assigns explicit package in multi-match group', () => {
        const imports = [makeImport('@tanstack/react-query')];
        const result = groupImports(imports, config);
        expect(result.find(g => g.name === 'Api')?.imports).toHaveLength(1);
    });

    test('puts unmatched imports in Others group', () => {
        const imports = [makeImport('some-unmatched-lib')];
        const result = groupImports(imports, config);
        const others = result.find(g => g.name === 'Others');
        expect(others?.imports).toHaveLength(1);
    });

    test('side-effect imports go to SideEffects group first', () => {
        const imports = [makeImport('./styles.css', { isSideEffect: true })];
        const result = groupImports(imports, config);
        const se = result.find(g => g.name === 'SideEffects');
        expect(se?.imports).toHaveLength(1);
    });

    test('SideEffects group appears before all others', () => {
        const imports = [makeImport('react'), makeImport('./styles.css', { isSideEffect: true })];
        const result = groupImports(imports, config);
        expect(result[0]?.name).toBe('SideEffects');
    });

    test('Others group appears last', () => {
        const imports = [makeImport('some-lib'), makeImport('react')];
        const result = groupImports(imports, config);
        expect(result[result.length - 1]?.name).toBe('Others');
    });

    test('empty groups are omitted from output', () => {
        const imports = [makeImport('react')];
        const result = groupImports(imports, config);
        const names = result.map(g => g.name);
        expect(names).not.toContain('Hooks');
        expect(names).not.toContain('Api');
    });

    test('resolves alias for path matching', () => {
        const configWithAlias: ApothekeConfig = {
            groups: [{ name: 'Hooks', match: ['**/hooks/**'] }],
            aliases: { '@': './src' }
        };
        const imports = [makeImport('@/hooks/use-auth')];
        const result = groupImports(imports, configWithAlias, { rootDir: '/project' });
        expect(result.find(g => g.name === 'Hooks')?.imports).toHaveLength(1);
    });

    test('multiple imports split across correct groups', () => {
        const imports = [
            makeImport('react'),
            makeImport('../hooks/use-auth'),
            makeImport('unknown-lib')
        ];
        const result = groupImports(imports, config, { fileDir: '/project/src/pages' });
        const names = result.map(g => g.name);
        expect(names).toContain('React');
        expect(names).toContain('Hooks');
        expect(names).toContain('Others');
    });
});
