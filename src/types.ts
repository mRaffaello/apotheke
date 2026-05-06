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
    attachedComment?: string;
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
    normalizeImports?: 'alias' | 'relative' | 'absolute' | false;
    groupSeparator?: boolean;
    groupComments?: boolean;
}

export interface GroupedImports {
    name: string;
    imports: ImportNode[];
}
