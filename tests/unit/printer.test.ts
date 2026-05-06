import { test, expect, describe } from 'vitest';
import { printImportNode, printGroups } from '../../src/printer';
import type { ImportNode, GroupedImports, ApothekeConfig } from '../../src/types';

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

const defaultConfig: ApothekeConfig = {
    groups: [],
    groupSeparator: true,
    groupComments: true
};

describe('printImportNode', () => {
    test('prints default import', () => {
        const node = makeImport('react', { defaultImport: 'React' });
        expect(printImportNode(node)).toBe(`import React from 'react';`);
    });

    test('prints named imports', () => {
        const node = makeImport('react', {
            namedImports: [
                { name: 'useState', kind: 'value' },
                { name: 'useEffect', kind: 'value' }
            ]
        });
        expect(printImportNode(node)).toBe(`import { useState, useEffect } from 'react';`);
    });

    test('prints default + named', () => {
        const node = makeImport('./comp', {
            defaultImport: 'Comp',
            namedImports: [{ name: 'helper', kind: 'value' }]
        });
        expect(printImportNode(node)).toBe(`import Comp, { helper } from './comp';`);
    });

    test('prints type import', () => {
        const node = makeImport('react', {
            importKind: 'type',
            namedImports: [{ name: 'FC', kind: 'value' }]
        });
        expect(printImportNode(node)).toBe(`import type { FC } from 'react';`);
    });

    test('prints inline type named import', () => {
        const node = makeImport('./types', {
            namedImports: [
                { name: 'Foo', kind: 'type' },
                { name: 'bar', kind: 'value' }
            ]
        });
        expect(printImportNode(node)).toBe(`import { type Foo, bar } from './types';`);
    });

    test('prints side-effect import', () => {
        const node = makeImport('./styles.css', { isSideEffect: true });
        expect(printImportNode(node)).toBe(`import './styles.css';`);
    });

    test('prints aliased named import', () => {
        const node = makeImport('./utils', {
            namedImports: [{ name: 'foo', alias: 'bar', kind: 'value' }]
        });
        expect(printImportNode(node)).toBe(`import { foo as bar } from './utils';`);
    });

    test('ignores attachedComment — printer never emits legacy section headers', () => {
        const node = makeImport('react', {
            defaultImport: 'React',
            attachedComment: '// React stuff'
        });
        expect(printImportNode(node)).toBe(`import React from 'react';`);
    });
});

describe('printGroups', () => {
    test('prints group with comment header', () => {
        const groups: GroupedImports[] = [
            { name: 'React', imports: [makeImport('react', { defaultImport: 'React' })] }
        ];
        const result = printGroups(groups, defaultConfig);
        expect(result).toBe(`// React\nimport React from 'react';`);
    });

    test('separates groups with blank line', () => {
        const groups: GroupedImports[] = [
            { name: 'React', imports: [makeImport('react', { defaultImport: 'React' })] },
            {
                name: 'Utils',
                imports: [makeImport('./utils', { namedImports: [{ name: 'foo', kind: 'value' }] })]
            }
        ];
        const result = printGroups(groups, defaultConfig);
        expect(result).toBe(
            `// React\nimport React from 'react';\n\n// Utils\nimport { foo } from './utils';`
        );
    });

    test('omits group comment when groupComments is false', () => {
        const groups: GroupedImports[] = [
            { name: 'React', imports: [makeImport('react', { defaultImport: 'React' })] }
        ];
        const result = printGroups(groups, { ...defaultConfig, groupComments: false });
        expect(result).toBe(`import React from 'react';`);
    });

    test('omits blank line separator when groupSeparator is false', () => {
        const groups: GroupedImports[] = [
            { name: 'React', imports: [makeImport('react', { defaultImport: 'React' })] },
            {
                name: 'Utils',
                imports: [makeImport('./utils', { namedImports: [{ name: 'foo', kind: 'value' }] })]
            }
        ];
        const result = printGroups(groups, { ...defaultConfig, groupSeparator: false });
        expect(result).toBe(
            `// React\nimport React from 'react';\n// Utils\nimport { foo } from './utils';`
        );
    });

    test('always uses group.name as header, even when import has attachedComment', () => {
        const node = makeImport('react', {
            defaultImport: 'React',
            attachedComment: '// My React'
        });
        const groups: GroupedImports[] = [{ name: 'React', imports: [node] }];
        const result = printGroups(groups, defaultConfig);
        expect(result).toBe(`// React\nimport React from 'react';`);
    });
});
