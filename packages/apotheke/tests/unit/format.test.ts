import { test, expect, describe } from 'vitest';
import { formatImports } from '../../src/format';
import { detectQuoteChar } from '../../src/printer';
import type { ApothekeConfig } from '../../src/types';

const config: ApothekeConfig = {
    groups: [
        { name: 'React', match: ['react', 'react-*'] },
        { name: 'Hooks', match: ['**/hooks/**'] },
        { name: 'Api', match: ['**/api/**', '@tanstack/react-query'] },
        { name: 'Navigation', match: ['@tanstack/react-router'] },
        { name: 'Assets', match: ['lucide-react'] }
    ],
    groupSeparator: true,
    groupComments: true
};

describe('formatImports', () => {
    test('groups and sorts imports with comments', () => {
        const source = `
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { createRoute } from '@tanstack/react-router';
import { Trash2Icon } from 'lucide-react';
import { tsr } from '../../../api/tsr';
import useLoggedUser from '../../../hooks/use-logged-user';

const x = 1;
`.trimStart();

        const result = formatImports(source, config, { fileDir: '/project/src/pages/ambient' });

        expect(result).toContain("// React\nimport { useMemo } from 'react';");
        expect(result).toContain(
            "// Hooks\nimport useLoggedUser from '../../../hooks/use-logged-user';"
        );
        expect(result).toContain(
            "// Api\nimport { tsr } from '../../../api/tsr';\nimport { useQuery } from '@tanstack/react-query';"
        );
        expect(result).toContain(
            "// Navigation\nimport { createRoute } from '@tanstack/react-router';"
        );
        expect(result).toContain("// Assets\nimport { Trash2Icon } from 'lucide-react';");
        expect(result).toContain('const x = 1;');
    });

    test('deduplicates imports before grouping', () => {
        const source = `import { foo } from './utils';\nimport { bar, foo } from './utils';\nconst x = 1;\n`;
        const result = formatImports(source, config, { fileDir: '/project/src' });
        const lines = result.split('\n').filter(l => l.includes("from './utils'"));
        expect(lines).toHaveLength(1);
        expect(lines[0]).toContain('bar');
        expect(lines[0]).toContain('foo');
    });

    test('preserves non-import code after imports', () => {
        const source = `import React from 'react';\n\nconst App = () => null;\nexport default App;\n`;
        const result = formatImports(source, config);
        expect(result).toContain('const App = () => null;');
        expect(result).toContain('export default App;');
    });

    test('leaves dynamic imports untouched', () => {
        const source = `import React from 'react';\nconst mod = await import('./heavy');\n`;
        const result = formatImports(source, config);
        expect(result).toContain(`const mod = await import('./heavy');`);
    });

    test('puts side-effect imports first', () => {
        const source = `import React from 'react';\nimport './styles.css';\n`;
        const result = formatImports(source, config);
        const lines = result.split('\n').filter(l => l.startsWith('import'));
        expect(lines[0]).toBe(`import './styles.css';`);
    });

    test('unmatched imports go to Others', () => {
        const source = `import { t } from 'i18next';\nimport React from 'react';\n`;
        const result = formatImports(source, config);
        expect(result).toContain("// Others\nimport { t } from 'i18next';");
    });

    test('idempotent: running twice produces same result', () => {
        const source = `import { useQuery } from '@tanstack/react-query';\nimport { useMemo } from 'react';\nconst x = 1;\n`;
        const first = formatImports(source, config, { fileDir: '/project/src' });
        const second = formatImports(first, config, { fileDir: '/project/src' });
        expect(first).toBe(second);
    });

    test('handles file with no imports', () => {
        const source = `const x = 1;\nexport default x;\n`;
        expect(formatImports(source, config)).toBe(source);
    });

    test('sorts named imports within a line', () => {
        const source = `import { useState, useCallback, useEffect } from 'react';\n`;
        const result = formatImports(source, config);
        expect(result).toContain('{ useCallback, useEffect, useState }');
    });
});

// ── regression: orphan code between imports ───────────────────────────────────

describe('orphan preservation', () => {
    test('const between imports is moved below the import block', () => {
        const source =
            [
                "import { useState } from 'react';",
                '',
                "const LANG_MAP: Record<string, string> = { en: '+44', it: '+39' };",
                "import { useNavigate } from 'react-router-dom';",
                '',
                'function App() {}'
            ].join('\n') + '\n';

        const result = formatImports(source, config);

        // All imports still present
        expect(result).toContain("from 'react'");
        expect(result).toContain("from 'react-router-dom'");
        // Orphan is preserved
        expect(result).toContain('const LANG_MAP');
        // Orphan appears AFTER the last import line
        const lastImportEnd = Math.max(
            result.lastIndexOf("from 'react';"),
            result.lastIndexOf("from 'react-router-dom';")
        );
        expect(result.indexOf('const LANG_MAP')).toBeGreaterThan(lastImportEnd);
        // Non-import code is intact
        expect(result).toContain('function App() {}');
    });

    test('idempotent when orphan is already below imports', () => {
        const source =
            [
                '// React',
                "import { useState } from 'react';",
                '',
                'const LANG_MAP = {};',
                '',
                'function App() {}'
            ].join('\n') + '\n';

        const first = formatImports(source, config);
        const second = formatImports(first, config);
        expect(first).toBe(second);
    });
});

// ── regression: manual section comments stripped ──────────────────────────────

describe('attachedComment stripping', () => {
    test('pre-existing manual section headers are removed from output', () => {
        const source =
            [
                '// Models',
                "import { Foo } from '../models/foo';",
                '// Services',
                "import { BarService } from '../services/bar';",
                '// Nest',
                "import { Injectable } from '@nestjs/common';",
                '',
                'class X {}'
            ].join('\n') + '\n';

        const result = formatImports(source, config);

        // Old manual headers must not appear
        expect(result).not.toContain('// Models');
        expect(result).not.toContain('// Services');
        expect(result).not.toContain('// Nest');
        // All imports still present
        expect(result).toContain("from '../models/foo'");
        expect(result).toContain("from '../services/bar'");
        expect(result).toContain("from '@nestjs/common'");
    });

    test('imports in same group have no blank line between them', () => {
        const source =
            [
                '// A',
                "import { a } from '../a';",
                '// B',
                "import { b } from '../b';",
                '// C',
                "import { c } from '../c';"
            ].join('\n') + '\n';

        const result = formatImports(source, config);
        // Three relative imports should land in one group with no blank lines between them
        const lines = result.split('\n').filter(l => l.startsWith('import'));
        expect(lines).toHaveLength(3);
        const block = lines.join('\n');
        expect(block).not.toContain('\n\n');
    });

    test('idempotent: second run on already-clean output produces no change', () => {
        const source =
            [
                '// Hooks',
                "import { useState } from 'react';",
                '// Nav',
                "import { useNavigate } from 'react-router-dom';",
                '',
                'const x = 1;'
            ].join('\n') + '\n';

        const first = formatImports(source, config, { fileDir: '/project/src' });
        const second = formatImports(first, config, { fileDir: '/project/src' });
        expect(first).toBe(second);
    });
});

// ── quote style auto-detection ────────────────────────────────────────────────

describe('detectQuoteChar', () => {
    test('detects single quotes', () => {
        expect(detectQuoteChar("import React from 'react';")).toBe("'");
    });

    test('detects double quotes', () => {
        expect(detectQuoteChar(`import React from "react";`)).toBe('"');
    });

    test('defaults to single quotes when no imports', () => {
        expect(detectQuoteChar('const x = 1;')).toBe("'");
    });
});

describe('formatImports: quote style preserved', () => {
    test('double-quoted file stays double-quoted after formatting', () => {
        const source =
            [`import { b } from "@scope/b";`, `import { a } from "@scope/a";`].join('\n') + '\n';

        const result = formatImports(source, config);
        expect(result).toContain(`from "@scope/a"`);
        expect(result).toContain(`from "@scope/b"`);
        expect(result).not.toContain(`from '`);
    });

    test('single-quoted file stays single-quoted after formatting', () => {
        const source =
            [`import { b } from '@scope/b';`, `import { a } from '@scope/a';`].join('\n') + '\n';

        const result = formatImports(source, config);
        expect(result).toContain(`from '@scope/a'`);
        expect(result).not.toContain(`from "`);
    });
});
