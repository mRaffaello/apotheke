/**
 * Hero visual — a tilted stack of code cards showing an unsorted import block
 * settling into grouped, commented output, with a few floating capability
 * chips. Static and decorative; the entrance animation is owned by HeroEntrance.
 */

// React
import type { ReactNode } from 'react';

const beforeLines = [
    "import { useQuery } from '@tanstack/react-query';",
    "import { useMemo } from 'react';",
    "import { createRoute } from '@tanstack/react-router';",
    "import { tsr } from '../api/tsr';",
    "import useLoggedUser from '../hooks/use-logged-user';"
];

const afterGroups = [
    { label: '// React', lines: ["import { useMemo } from 'react';"] },
    { label: '// Hooks', lines: ["import useLoggedUser from '../hooks/use-logged-user';"] },
    {
        label: '// Api',
        lines: [
            "import { tsr } from '../api/tsr';",
            "import { useQuery } from '@tanstack/react-query';"
        ]
    },
    { label: '// Navigation', lines: ["import { createRoute } from '@tanstack/react-router';"] }
];

function Chip({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <span
            className={`border-border bg-card text-foreground absolute rounded-md border px-2.5 py-1 font-mono text-[11px] leading-none font-medium shadow-sm ${className ?? ''}`}>
            {children}
        </span>
    );
}

export function HeroShowcase() {
    return (
        <div
            aria-hidden
            className='relative h-[26rem] w-full max-w-xl select-none [perspective:1200px]'>
            {/* Behind — the unsorted block, tilted away and dimmed */}
            <div className='border-border bg-muted/60 text-muted-foreground absolute top-2 left-2 w-[21rem] rotate-[-7deg] rounded-xl border p-4 font-mono text-[11px] leading-relaxed shadow-sm'>
                <div className='mb-2 flex gap-1.5'>
                    <span className='bg-border size-2 rounded-full' />
                    <span className='bg-border size-2 rounded-full' />
                    <span className='bg-border size-2 rounded-full' />
                </div>
                {beforeLines.map(line => (
                    <div key={line} className='truncate'>
                        {line}
                    </div>
                ))}
            </div>

            {/* In front — the organized output */}
            <div className='border-border bg-card absolute top-24 right-0 w-[23rem] rotate-[4deg] rounded-xl border p-4 font-mono text-[11px] leading-relaxed shadow-lg shadow-black/5 dark:shadow-black/40'>
                <div className='mb-2 flex gap-1.5'>
                    <span className='bg-border size-2 rounded-full' />
                    <span className='bg-border size-2 rounded-full' />
                    <span className='bg-border size-2 rounded-full' />
                </div>
                {afterGroups.map((group, index) => (
                    <div key={group.label} className={index > 0 ? 'mt-2.5' : undefined}>
                        <div className='text-muted-foreground'>{group.label}</div>
                        {group.lines.map(line => (
                            <div key={line} className='text-foreground truncate'>
                                {line}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Floating capability chips */}
            <Chip className='top-0 right-8'>prettier --write</Chip>
            <Chip className='top-[9.5rem] left-0'>apotheke --check</Chip>
            <Chip className='bottom-10 left-16'>monorepo aware</Chip>
            <Chip className='right-24 bottom-2'>tsconfig aliases</Chip>
        </div>
    );
}
