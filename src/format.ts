import { parseImports } from './parser';
import { deduplicateImports } from './deduplicator';
import { groupImports } from './grouper';
import { sortGroup, sortNamedImports } from './sorter';
import { printGroups, detectQuoteChar } from './printer';
import type { ApothekeConfig, ImportNode } from './types';

function collectOrphanSegments(source: string, imports: ImportNode[]): string[] {
    const orphans: string[] = [];
    for (let i = 0; i < imports.length - 1; i++) {
        const gapStart = imports[i]!.end;
        const gapEnd = imports[i + 1]!.start;
        if (gapEnd <= gapStart) continue;
        let gap = source.slice(gapStart, gapEnd);
        // Strip attached comment of the next import from the tail of the gap
        const nextComment = imports[i + 1]!.attachedComment;
        if (nextComment) {
            const commentText = nextComment.startsWith('//') ? nextComment.slice(2) : nextComment;
            const commentPattern = `// ${commentText.trim()}`;
            const idx = gap.lastIndexOf(commentPattern);
            if (idx !== -1) gap = gap.slice(0, idx);
        }
        const trimmed = gap.trim();
        if (trimmed) orphans.push(trimmed);
    }
    return orphans;
}

interface FormatOptions {
    fileDir?: string;
    rootDir?: string;
}

export function formatImports(
    source: string,
    config: ApothekeConfig,
    options: FormatOptions = {}
): string {
    const imports = parseImports(source);
    if (imports.length === 0) return source;

    // Collect orphans before stripping comments (needs original comment positions)
    const orphans = collectOrphanSegments(source, imports);

    // Strip attached comments — the import block is fully owned by apotheke.
    // Old manual section headers (// Models, // Providers, etc.) are dropped so
    // the printer can regenerate clean headers from the config group names.
    const clean = imports.map(n => ({ ...n, attachedComment: undefined }));

    // Deduplicate
    const deduped = deduplicateImports(clean);

    // Sort named imports within each node
    const sorted = deduped.map(sortNamedImports);

    // Group
    const grouped = groupImports(sorted, config, options);

    // Sort within each group
    const sortedGroups = grouped.map(g => ({ ...g, imports: sortGroup(g.imports) }));

    // Print the new import block
    const q = detectQuoteChar(source);
    const newImportBlock = printGroups(sortedGroups, config, q);

    // Find the original import region in source (first to last import)
    const firstImport = imports[0]!;
    const lastImport = imports[imports.length - 1]!;

    // Expand start back to include any comment on the line immediately before the first import
    let regionStart = firstImport.start;
    if (firstImport.attachedComment) {
        const before = source.slice(0, firstImport.start);
        const commentLineStart = before.lastIndexOf('\n', before.length - 2) + 1;
        regionStart = commentLineStart;
    }

    // Expand end to consume the newline after the last import
    let regionEnd = lastImport.end;
    if (source[regionEnd] === '\n') regionEnd++;

    const before = source.slice(0, regionStart);
    const after = source.slice(regionEnd);

    const orphanSuffix = orphans.length > 0 ? '\n' + orphans.join('\n') + '\n' : '';
    return before + newImportBlock + '\n' + orphanSuffix + after;
}
