import { test, expect, describe } from 'vitest';
import { parseImports } from '../../src/parser';

describe('parseImports', () => {
    test('extracts default import', () => {
        const src = `import React from 'react';`;
        const result = parseImports(src);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            specifier: 'react',
            defaultImport: 'React',
            namedImports: [],
            isSideEffect: false,
            importKind: 'value'
        });
    });

    test('extracts named imports', () => {
        const src = `import { useState, useEffect } from 'react';`;
        const result = parseImports(src);
        expect(result[0]?.namedImports).toEqual([
            { name: 'useState', kind: 'value' },
            { name: 'useEffect', kind: 'value' }
        ]);
    });

    test('extracts type import', () => {
        const src = `import type { FC } from 'react';`;
        const result = parseImports(src);
        expect(result[0]).toMatchObject({
            specifier: 'react',
            importKind: 'type',
            namedImports: [{ name: 'FC', kind: 'value' }]
        });
    });

    test('extracts inline type named import', () => {
        const src = `import { type Foo, bar } from './types';`;
        const result = parseImports(src);
        expect(result[0]?.namedImports).toEqual([
            { name: 'Foo', kind: 'type' },
            { name: 'bar', kind: 'value' }
        ]);
    });

    test('extracts side-effect import', () => {
        const src = `import './styles.css';`;
        const result = parseImports(src);
        expect(result[0]).toMatchObject({
            specifier: './styles.css',
            isSideEffect: true,
            namedImports: []
        });
    });

    test('extracts default and named together', () => {
        const src = `import MyComp, { helper } from './component';`;
        const result = parseImports(src);
        expect(result[0]).toMatchObject({
            defaultImport: 'MyComp',
            namedImports: [{ name: 'helper', kind: 'value' }]
        });
    });

    test('records start/end positions', () => {
        const src = `import React from 'react';`;
        const result = parseImports(src);
        expect(result[0]?.start).toBe(0);
        expect(result[0]?.end).toBe(26);
    });

    test('attaches comment immediately above import (no blank line)', () => {
        const src = `// React stuff\nimport React from 'react';`;
        const result = parseImports(src);
        expect(result[0]?.attachedComment).toBe('// React stuff');
    });

    test('does not attach comment separated by blank line', () => {
        const src = `// React stuff\n\nimport React from 'react';`;
        const result = parseImports(src);
        expect(result[0]?.attachedComment).toBeUndefined();
    });

    test('attaches comment to correct import when multiple', () => {
        const src = [
            `import React from 'react';`,
            `// Utils`,
            `import { helper } from '../utils';`
        ].join('\n');
        const result = parseImports(src);
        expect(result[0]?.attachedComment).toBeUndefined();
        expect(result[1]?.attachedComment).toBe('// Utils');
    });

    test('skips non-import statements', () => {
        const src = `import React from 'react';\nconst x = 1;\nimport { foo } from './foo';`;
        const result = parseImports(src);
        expect(result).toHaveLength(2);
    });

    test('handles aliased named import', () => {
        const src = `import { foo as bar } from './utils';`;
        const result = parseImports(src);
        expect(result[0]?.namedImports).toEqual([{ name: 'foo', alias: 'bar', kind: 'value' }]);
    });
});
