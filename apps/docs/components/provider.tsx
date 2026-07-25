'use client';
// React
import { type ReactNode } from 'react';

// Fumadocs
import { RootProvider } from 'fumadocs-ui/provider/next';

// Internal
import SearchDialog from '@/components/search';

export function Provider({ children }: { children: ReactNode }) {
    return <RootProvider search={{ SearchDialog }}>{children}</RootProvider>;
}
