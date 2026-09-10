// Testing
import { describe, expect, test } from 'vitest';

// Internal
import type { ApothekeConfig } from '../../src/types';
import { formatImports } from '../../src/format';
import { detectQuoteChar } from '../../src/printer';

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

    test('leaves side-effect imports at the top when that is where they were', () => {
        const source = `import './styles.css';\nimport React from 'react';\n`;
        const result = formatImports(source, config);
        const lines = result.split('\n').filter(l => l.startsWith('import'));
        expect(lines[0]).toBe(`import './styles.css';`);
    });

    test('does not hoist a side-effect import above a value import that preceded it', () => {
        // ./App reaches stylesheets of its own through the components it imports,
        // which apotheke cannot see, so it has to stay ahead of ./styles.css.
        const source = `import App from './App';\nimport './styles.css';\n`;
        const result = formatImports(source, config);
        const lines = result.split('\n').filter(l => l.startsWith('import'));
        expect(lines).toEqual([`import App from './App';`, `import './styles.css';`]);
    });

    test('no value import crosses a side-effect import', () => {
        // The reported entry-file shape: a component import that pulls vendor CSS,
        // then app stylesheets, then one more vendor sheet that must stay last.
        const source =
            [
                `import App from './App';`,
                `import '@edalab/ui/dist/style.css';`,
                `import './themes/index.css';`,
                `import { createRoot } from 'react-dom/client';`,
                `import '@xyflow/react/dist/style.css';`
            ].join('\n') + '\n';

        const result = formatImports(source, config, { fileDir: '/app/src' });
        const lines = result.split('\n').filter(l => l.startsWith('import'));
        expect(lines).toEqual([
            `import App from './App';`,
            `import '@edalab/ui/dist/style.css';`,
            `import './themes/index.css';`,
            `import { createRoot } from 'react-dom/client';`,
            `import '@xyflow/react/dist/style.css';`
        ]);
    });

    test('groups and sorts value imports within a span between side effects', () => {
        const source =
            [
                `import './one.css';`,
                `import { useMemo } from 'react';`,
                `import z from '../../../hooks/z';`,
                `import a from '../../../hooks/a';`
            ].join('\n') + '\n';

        const result = formatImports(source, config, { fileDir: '/project/src/pages/x' });
        expect(result).toContain(
            "// Hooks\nimport a from '../../../hooks/a';\nimport z from '../../../hooks/z';"
        );
        expect(result.split('\n').filter(l => l.startsWith('import'))[0]).toBe(
            `import './one.css';`
        );
    });

    test('emits no header for held-in-place side-effect imports', () => {
        const source = `import './styles.css';\nimport React from 'react';\n`;
        expect(formatImports(source, config)).not.toContain('// SideEffects');
    });

    test('is idempotent with side effects interleaved between value imports', () => {
        const source =
            [
                `import './one.css';`,
                `import z from '../../../hooks/z';`,
                `import './two.css';`,
                `import { useMemo } from 'react';`,
                `import './three.css';`
            ].join('\n') + '\n';

        const once = formatImports(source, config, { fileDir: '/project/src/pages/x' });
        expect(formatImports(once, config, { fileDir: '/project/src/pages/x' })).toBe(once);
        expect(once.split('\n').filter(l => /^import '\.\/[a-z]+\.css';$/.test(l))).toEqual([
            `import './one.css';`,
            `import './two.css';`,
            `import './three.css';`
        ]);
    });

    test('keeps side-effect imports in source order, not alphabetical', () => {
        // The CSS cascade follows import order: sorting these would let the
        // overrides lose to the framework sheet they are meant to override.
        const source =
            [
                `import './tailwind.css';`,
                `import { useMemo } from 'react';`,
                `import './overrides.css';`
            ].join('\n') + '\n';

        const result = formatImports(source, config);
        const sideEffects = result.split('\n').filter(l => l.startsWith(`import '.`));
        expect(sideEffects).toEqual([`import './tailwind.css';`, `import './overrides.css';`]);
    });

    test('keeps side-effect evaluation order when it runs against the alphabet', () => {
        // Instrumentation has to be evaluated before the polyfills it patches over.
        const source =
            [
                `import './sentry-instrument';`,
                `import './polyfills';`,
                `import React from 'react';`
            ].join('\n') + '\n';

        const result = formatImports(source, config);
        const sideEffects = result.split('\n').filter(l => /^import '[^']+';$/.test(l));
        expect(sideEffects).toEqual([`import './sentry-instrument';`, `import './polyfills';`]);
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

describe('attached comment stripping', () => {
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

// ── regression: group headers must survive their own round trip ───────────────
//
// A header apotheke printed is re-read on the next run as the attached comment
// of the import below it. When that read failed, the header was taken for stray
// code, moved below the import block, and printed fresh — so every save left one
// more copy of it under the imports.

describe('formatImports: repeated runs never accumulate group headers', () => {
    const leadingSpaceConfig: ApothekeConfig = {
        groups: [
            { name: 'Orpc', match: ['@orpc/*'] },
            // A name whose printed header (`//  Internal`) does not come back as
            // `// ` + name.trim() — the shape that used to break the round trip.
            { name: ' Internal', match: ['./**'] }
        ],
        groupSeparator: true,
        groupComments: true
    };

    const source =
        [
            "import { oc } from '@orpc/contract';",
            "import { presentationSchema } from './schemas/presentation.schema';",
            "import { z } from 'zod';",
            '',
            'export const contract = {};'
        ].join('\n') + '\n';

    test('output is stable across runs', () => {
        const first = formatImports(source, leadingSpaceConfig);
        const second = formatImports(first, leadingSpaceConfig);
        const third = formatImports(second, leadingSpaceConfig);

        expect(second).toBe(first);
        expect(third).toBe(first);
    });

    test('each group header appears exactly once, however many runs', () => {
        let result = source;
        for (let i = 0; i < 5; i++) result = formatImports(result, leadingSpaceConfig);

        expect(result.split('//  Internal').length - 1).toBe(1);
        expect(result.split('// Orpc').length - 1).toBe(1);
    });

    test('a header is not left dangling below the import block', () => {
        const twice = formatImports(formatImports(source, leadingSpaceConfig), leadingSpaceConfig);
        const [, afterImports = ''] = twice.split("import { z } from 'zod';");

        expect(afterImports.trim()).toBe('export const contract = {};');
    });
});

// ── regression: triple-slash directives are not section headers ───────────────
//
// The line above the first import is taken for a header and dropped, since
// apotheke prints its own. A /// directive is not one: it configures the
// compiler, and next-env.d.ts kept one fewer reference after every save.

describe('formatImports: triple-slash directives survive', () => {
    const source =
        [
            '/// <reference types="next" />',
            '/// <reference types="next/image-types/global" />',
            "import './.next/types/routes.d.ts';",
            '',
            '// NOTE: This file should not be edited'
        ].join('\n') + '\n';

    test('every directive above the first import is kept', () => {
        const result = formatImports(source, config);

        expect(result).toContain('/// <reference types="next" />');
        expect(result).toContain('/// <reference types="next/image-types/global" />');
    });

    test('none is lost however many times the file is saved', () => {
        let result = source;
        for (let i = 0; i < 5; i++) result = formatImports(result, config);

        expect(result.split('/// <reference').length - 1).toBe(2);
    });

    test('directives stay above the import block', () => {
        const result = formatImports(source, config);
        const lines = result.split('\n');

        expect(lines[0]).toBe('/// <reference types="next" />');
        expect(lines[1]).toBe('/// <reference types="next/image-types/global" />');
        expect(lines[2]).toBe("import './.next/types/routes.d.ts';");
    });

    test('a header apotheke wrote is still dropped', () => {
        const headered =
            ['// Models', "import { Foo } from '../models/foo';", '', 'class X {}'].join('\n') +
            '\n';

        expect(formatImports(headered, config)).not.toContain('// Models');
    });
});

// ── regression: a header a blank line hid must not pile up ────────────────────
//
// apotheke recognises its own header only directly above its import. An editor
// rule or a second formatter that puts a blank line under one hides it, and the
// hidden copy was then carried out below the block, or left standing above it,
// while a fresh header was printed — one more copy of it after every save.

describe('formatImports: a header separated from its import does not accumulate', () => {
    const orpcConfig: ApothekeConfig = {
        groups: [{ name: 'Orpc', match: ['@orpc/*'] }],
        groupSeparator: true,
        groupComments: true
    };

    // What the file looks like once something has inserted the blank lines
    const hidden =
        [
            '// Orpc',
            '',
            "import { oc } from '@orpc/contract';",
            '',
            '// Others',
            '',
            "import { schema } from './schemas/data-map.schema';",
            "import { z } from 'zod';",
            '',
            'export const contract = {};'
        ].join('\n') + '\n';

    test('a hidden header is not carried out below the import block', () => {
        const result = formatImports(hidden, orpcConfig);
        const [, afterImports = ''] = result.split("import { z } from 'zod';");

        expect(afterImports.trim()).toBe('export const contract = {};');
    });

    test('a hidden header is not left standing above the one that replaces it', () => {
        const result = formatImports(hidden, orpcConfig);

        expect(result.split('// Orpc').length - 1).toBe(1);
        expect(result.indexOf('// Orpc')).toBe(0);
    });

    test('saves that keep re-inserting the blank lines add nothing', () => {
        let result = hidden;
        for (let i = 0; i < 5; i++) {
            result = formatImports(result, orpcConfig);
            // stands in for whatever puts the blank line back: an eslint rule
            // such as lines-around-comment, another formatter, an editor action
            result = result.replace(/(\/\/ [A-Za-z]+)\n(import)/g, '$1\n\n$2');
        }

        expect(result.split('// Orpc').length - 1).toBe(1);
        expect(result.split('// Others').length - 1).toBe(1);
    });

    test('a comment that is not a header is still carried out, not dropped', () => {
        const note =
            [
                "import { a } from './a';",
                '',
                '// keep me: explains the import below',
                '',
                "import { b } from './b';",
                '',
                'export const y = 2;'
            ].join('\n') + '\n';

        expect(formatImports(note, orpcConfig)).toContain('// keep me: explains the import below');
    });

    test('a licence banner above the block survives', () => {
        const licensed =
            [
                '// Copyright 2026 Acme',
                '// SPDX-License-Identifier: MIT',
                '',
                "import { z } from 'zod';",
                '',
                'export const y = 2;'
            ].join('\n') + '\n';

        const result = formatImports(licensed, orpcConfig);

        expect(result).toContain('// Copyright 2026 Acme');
        expect(result).toContain('// SPDX-License-Identifier: MIT');
    });

    test('stray code between imports is still carried out, comments included', () => {
        const withCode =
            [
                "import { a } from './a';",
                '',
                '// explain why',
                'const x = 1;',
                '',
                "import { b } from './b';",
                '',
                'export const y = 2;'
            ].join('\n') + '\n';

        const result = formatImports(withCode, orpcConfig);

        expect(result).toContain('// explain why');
        expect(result).toContain('const x = 1;');
    });
});
