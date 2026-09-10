export interface NamedImport {
    name: string;
    alias?: string;
    kind: 'value' | 'type';
}

export interface ImportNode {
    specifier: string;
    defaultImport?: string;
    namespaceImport?: string;
    namedImports: NamedImport[];
    isSideEffect: boolean;
    importKind: 'value' | 'type';
    // Offset of the `//` of the comment sitting on the line directly above this
    // import — a position, not text: the gap between two imports is cut at this
    // offset, so the comment is removed exactly as written rather than matched
    // against a re-spelled copy of itself.
    attachedCommentStart?: number;
    start: number;
    end: number;
}

export interface GroupConfig {
    name: string;
    match: string[];
}

export interface ApothekeConfig {
    extends?: string;
    groups: GroupConfig[];
    aliases?: Record<string, string>;
    baseUrl?: string;
    groupSeparator?: boolean;
    groupComments?: boolean;
}

export interface GroupedImports {
    name: string;
    imports: ImportNode[];
}

// Implicit block names, not user-definable. OTHERS_GROUP trails the configured
// groups; SIDE_EFFECTS_BLOCK labels a run of bare imports held in place, and is
// printed without a header since it is not a group the user named.
export const OTHERS_GROUP = 'Others';
export const SIDE_EFFECTS_BLOCK = 'SideEffects';
