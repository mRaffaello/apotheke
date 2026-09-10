// Parser
import { parseSync } from 'oxc-parser';

// Internal
import type { ImportNode, NamedImport } from './types';

export function parseImports(source: string): ImportNode[] {
    const result = parseSync('file.tsx', source);
    const comments = result.comments;
    const nodes: ImportNode[] = [];

    for (const node of result.program.body) {
        if (node.type !== 'ImportDeclaration') continue;

        const specifier = node.source.value as string;
        let defaultImport: string | undefined;
        const namedImports: NamedImport[] = [];

        let namespaceImport: string | undefined;

        for (const s of node.specifiers) {
            if (s.type === 'ImportDefaultSpecifier') {
                defaultImport = s.local.name as string;
            } else if (s.type === 'ImportNamespaceSpecifier') {
                namespaceImport = s.local.name as string;
            } else if (s.type === 'ImportSpecifier') {
                const imported = s.imported as { type: string; name?: string; value?: string };
                const name = (
                    imported.type === 'Identifier' ? imported.name : imported.value
                ) as string;
                const localName = s.local.name as string;
                const kind = (s.importKind === 'type' ? 'type' : 'value') as 'value' | 'type';
                const named: NamedImport = { name, kind };
                if (localName !== name) named.alias = localName;
                namedImports.push(named);
            }
        }

        const importKind = (node.importKind === 'type' ? 'type' : 'value') as 'value' | 'type';
        const isSideEffect = node.specifiers.length === 0 && importKind === 'value';

        const importNode: ImportNode = {
            specifier,
            namedImports,
            isSideEffect,
            importKind,
            start: node.start as number,
            end: node.end as number
        };

        if (defaultImport) importNode.defaultImport = defaultImport;
        if (namespaceImport) importNode.namespaceImport = namespaceImport;

        const attached = findAttachedComment(source, node.start as number, comments);
        if (attached !== undefined) importNode.attachedCommentStart = attached;

        nodes.push(importNode);
    }

    return nodes;
}

function findAttachedComment(
    source: string,
    importStart: number,
    comments: Array<{ type: string; value: string; start: number; end: number }>
): number | undefined {
    // Find line number of the import
    const linesBefore = source.slice(0, importStart).split('\n');
    const importLine = linesBefore.length - 1;

    for (const comment of comments) {
        if (comment.type !== 'Line') continue;
        // A triple-slash directive is an instruction to the compiler, not a
        // section header someone typed. Attaching it would hand it to the block
        // apotheke rewrites, and every attached comment is dropped there — which
        // is how next-env.d.ts lost one `/// <reference types="next" />` per save
        // until the file had none left and the project's types went with them.
        if (comment.value.startsWith('/')) continue;
        const commentLines = source.slice(0, comment.end).split('\n');
        const commentLine = commentLines.length - 1;
        // Comment must be on the immediately preceding line with no blank line between
        if (commentLine === importLine - 1) {
            return comment.start;
        }
    }

    return undefined;
}
