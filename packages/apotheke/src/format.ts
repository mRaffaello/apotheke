// Internal
import type { ApothekeConfig, GroupedImports, ImportNode } from './types';
import { deduplicateImports } from './deduplicator';
import { groupImports } from './grouper';
import { parseImports } from './parser';
import { detectQuoteChar, printGroups } from './printer';
import { sortGroup, sortNamedImports } from './sorter';
import { SIDE_EFFECTS_BLOCK } from './types';

function collectOrphanSegments(source: string, imports: ImportNode[]): string[] {
    const orphans: string[] = [];
    for (let i = 0; i < imports.length - 1; i++) {
        const gapStart = imports[i]!.end;
        const gapEnd = imports[i + 1]!.start;
        if (gapEnd <= gapStart) continue;
        // Cut the gap where the next import's attached comment starts: apotheke
        // reprints that header itself, so anything from there on is already
        // accounted for. Cutting by offset rather than by searching for a
        // rebuilt `// Name` keeps the match exact — a header whose spelling did
        // not survive the round trip used to be read as stray code, moved below
        // the block, and reprinted, adding one copy per run.
        const commentStart = imports[i + 1]!.attachedCommentStart;
        const cut =
            commentStart !== undefined && commentStart >= gapStart && commentStart < gapEnd
                ? commentStart
                : gapEnd;
        const trimmed = source.slice(gapStart, cut).trim();
        if (trimmed) orphans.push(trimmed);
    }
    return orphans;
}

interface FormatOptions {
    fileDir?: string;
    rootDir?: string;
}

// Side-effect imports are barriers, not a group. A bare import runs its module
// for effect, and so does a value import that transitively reaches one — a
// stylesheet imported by a component, a polyfill pulled in by an entry module.
// apotheke reads one file at a time and cannot see through a specifier, so it
// cannot know which value imports carry effects of their own. Moving anything
// across a bare import would therefore risk reordering effects it cannot see.
//
// So each run of bare imports is held where the author put it, and the value
// imports between two runs are grouped and sorted only among themselves. The
// invariant: no import ever crosses a side-effect import.
function buildBlocks(
    imports: ImportNode[],
    config: ApothekeConfig,
    options: FormatOptions
): GroupedImports[] {
    const blocks: GroupedImports[] = [];

    let values: ImportNode[] = [];
    let sideEffects: ImportNode[] = [];

    function flushValues() {
        if (values.length === 0) return;
        for (const group of groupImports(values, config, options)) {
            blocks.push({ ...group, imports: sortGroup(group.imports) });
        }
        values = [];
    }

    function flushSideEffects() {
        if (sideEffects.length === 0) return;
        blocks.push({ name: SIDE_EFFECTS_BLOCK, imports: sideEffects });
        sideEffects = [];
    }

    for (const node of imports) {
        if (node.isSideEffect) {
            flushValues();
            sideEffects.push(node);
        } else {
            flushSideEffects();
            values.push(node);
        }
    }

    flushSideEffects();
    flushValues();

    return blocks;
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
    const clean = imports.map(n => ({ ...n, attachedCommentStart: undefined }));

    // Deduplicate
    const deduped = deduplicateImports(clean);

    // Sort named imports within each node
    const sorted = deduped.map(sortNamedImports);

    // Group and sort each span of value imports, keeping side effects in place
    const blocks = buildBlocks(sorted, config, options);

    // Print the new import block
    const q = detectQuoteChar(source);
    const newImportBlock = printGroups(blocks, config, q);

    // Find the original import region in source (first to last import)
    const firstImport = imports[0]!;
    const lastImport = imports[imports.length - 1]!;

    // Expand start back to include any comment on the line immediately before the first import
    let regionStart = firstImport.start;
    if (firstImport.attachedCommentStart !== undefined) {
        regionStart = source.lastIndexOf('\n', firstImport.attachedCommentStart) + 1;
    }

    // Expand end to consume the newline after the last import
    let regionEnd = lastImport.end;
    if (source[regionEnd] === '\n') regionEnd++;

    const before = source.slice(0, regionStart);
    const after = source.slice(regionEnd);

    const orphanSuffix = orphans.length > 0 ? '\n' + orphans.join('\n') + '\n' : '';
    return before + newImportBlock + '\n' + orphanSuffix + after;
}
