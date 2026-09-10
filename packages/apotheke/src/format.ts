// Internal
import type { ApothekeConfig, GroupedImports, ImportNode } from './types';
import { deduplicateImports } from './deduplicator';
import { groupImports } from './grouper';
import { parseImports } from './parser';
import { detectQuoteChar, printGroups } from './printer';
import { sortGroup, sortNamedImports } from './sorter';
import { OTHERS_GROUP, SIDE_EFFECTS_BLOCK } from './types';

// The headers apotheke prints: `// GroupName` for every configured group, plus
// the implicit Others. A comment matching one of these came out of apotheke
// rather than off someone's keyboard, which is what makes it safe to drop —
// a licence banner or a note never matches, and is left alone.
function printedHeaders(config: ApothekeConfig): Set<string> {
    return new Set([...config.groups.map(group => `// ${group.name}`), `// ${OTHERS_GROUP}`]);
}

// A header is recognised as one only while it sits directly above its import.
// Anything that puts a blank line under it — an editor rule, a second formatter
// — hides it there, and a hidden header is worse than a missed one: it gets
// carried out below the block, or left standing above it, while a fresh header
// is printed for the same group, so the file gains a copy on every save.
function isStrandedHeaders(segment: string, headers: Set<string>): boolean {
    const lines = segment.split('\n').filter(line => line.trim() !== '');
    return lines.length > 0 && lines.every(line => headers.has(line.trim()));
}

// Walk back over the blank lines and stranded headers directly above the first
// import and report where they start, so they are replaced along with the rest
// of the block rather than left sitting above the header printed to succeed
// them. Stops at the first line that is neither, which is what keeps a licence
// banner or a file docblock out of the region.
function strandedHeaderStart(
    source: string,
    importStart: number,
    headers: Set<string>
): number | undefined {
    let start: number | undefined;
    let lineEnd = source.lastIndexOf('\n', importStart - 1);

    while (lineEnd > -1) {
        const lineStart = source.lastIndexOf('\n', lineEnd - 1) + 1;
        const line = source.slice(lineStart, lineEnd).trim();

        if (line !== '') {
            if (!headers.has(line)) break;
            start = lineStart;
        }

        if (lineStart === 0) break;
        lineEnd = lineStart - 1;
    }

    return start;
}

function collectOrphanSegments(
    source: string,
    imports: ImportNode[],
    headers: Set<string>
): string[] {
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
        if (trimmed && !isStrandedHeaders(trimmed, headers)) orphans.push(trimmed);
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
    const headers = printedHeaders(config);
    const orphans = collectOrphanSegments(source, imports, headers);

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
    // Keep walking past whatever the attached comment was, so a header left
    // over from an earlier run is swallowed too rather than left standing above
    // the one printed to replace it. Reading only the line directly above the
    // import cleared one copy per run and never the copies above it, so a file
    // that had picked up a duplicate kept it for good.
    regionStart = strandedHeaderStart(source, regionStart, headers) ?? regionStart;

    // Expand end to consume the newline after the last import
    let regionEnd = lastImport.end;
    if (source[regionEnd] === '\n') regionEnd++;

    const before = source.slice(0, regionStart);
    const after = source.slice(regionEnd);

    const orphanSuffix = orphans.length > 0 ? '\n' + orphans.join('\n') + '\n' : '';
    return before + newImportBlock + '\n' + orphanSuffix + after;
}
