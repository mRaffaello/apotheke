// Testing
import { describe, expect, test } from 'vitest';

// Internal
import { isDocumentSnippet, parsers } from '../../index';

const UNORGANISED = [
    "import { useQuery } from '@tanstack/react-query';",
    "import { useMemo } from 'react';",
    "import path from 'node:path';"
].join('\n');

describe('isDocumentSnippet', () => {
    test('detects markdown and mdx containers', () => {
        expect(isDocumentSnippet('markdown')).toBe(true);
        expect(isDocumentSnippet('mdx')).toBe(true);
    });

    test('leaves standalone files and other embeddings alone', () => {
        // undefined means prettier is formatting a real source file
        expect(isDocumentSnippet(undefined)).toBe(false);
        expect(isDocumentSnippet('')).toBe(false);
        // other embedded contexts keep their previous behaviour
        expect(isDocumentSnippet('vue')).toBe(false);
        expect(isDocumentSnippet('html')).toBe(false);
    });
});

describe('preprocess', () => {
    // Prettier hands fenced code blocks to the embedded language's parser with
    // a placeholder filepath and the container reported via parentParser, so
    // the document cannot be recognised from the path alone.
    test.each(['markdown', 'mdx'])('returns %s code blocks untouched', async parentParser => {
        const result = await parsers.typescript.preprocess!(UNORGANISED, {
            filepath: 'dummy.ts',
            parentParser
        });

        expect(result).toBe(UNORGANISED);
    });

    test.each(['typescript', 'babel', 'babel-ts', 'babel-flow'] as const)(
        '%s parser skips document snippets',
        async name => {
            const result = await parsers[name].preprocess!(UNORGANISED, {
                filepath: 'dummy.ts',
                parentParser: 'mdx'
            });

            expect(result).toBe(UNORGANISED);
        }
    );

    test('still organises a real source file', async () => {
        const result = await parsers.typescript.preprocess!(UNORGANISED, {
            filepath: new URL('../../index.ts', import.meta.url).pathname
        });

        expect(result).not.toBe(UNORGANISED);
        expect(result).toContain('// Node');
    });
});
