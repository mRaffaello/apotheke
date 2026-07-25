// Next
import Link from 'next/link';

// Icons
import { ArrowRight, FileCode2, FolderTree, Terminal } from 'lucide-react';

// Internal
import { gitConfig } from '@/lib/shared';

const before = `import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { createRoute } from '@tanstack/react-router';
import { tsr } from '../api/tsr';
import useLoggedUser from '../hooks/use-logged-user';`;

const after = `// React
import { useMemo } from 'react';

// Hooks
import useLoggedUser from '../hooks/use-logged-user';

// Api
import { tsr } from '../api/tsr';
import { useQuery } from '@tanstack/react-query';

// Navigation
import { createRoute } from '@tanstack/react-router';`;

const features = [
    {
        icon: FileCode2,
        title: 'Prettier plugin',
        body: 'Runs as a preprocess hook, so a single prettier --write organises imports and formats code in one pass.'
    },
    {
        icon: Terminal,
        title: 'Standalone CLI',
        body: 'No Prettier required. --write, --check and --diff share the same engine, the same config and CI-ready exit codes.'
    },
    {
        icon: FolderTree,
        title: 'Monorepo aware',
        body: 'A root config defines shared groups and each package extends it. tsconfig path aliases are picked up automatically.'
    }
];

function CodePanel({ label, code }: { label: string; code: string }) {
    return (
        <div className='bg-fd-card flex-1 overflow-hidden rounded-xl border'>
            <div className='text-fd-muted-foreground border-b px-4 py-2 text-xs font-medium'>
                {label}
            </div>
            <pre className='overflow-x-auto p-4 text-[13px] leading-relaxed'>
                <code>{code}</code>
            </pre>
        </div>
    );
}

export default function HomePage() {
    return (
        <main className='flex flex-1 flex-col items-center px-4 py-16'>
            <section className='flex max-w-3xl flex-col items-center text-center'>
                <h1 className='text-4xl font-bold tracking-tight sm:text-5xl'>
                    Prettier for imports.
                </h1>
                <p className='text-fd-muted-foreground mt-4 text-lg'>
                    Deterministic, configurable import organization — as a Prettier plugin or a
                    standalone CLI.
                </p>
                <div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
                    <Link
                        href='/docs'
                        className='bg-fd-primary text-fd-primary-foreground inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90'>
                        Get started
                        <ArrowRight className='size-4' />
                    </Link>
                    <a
                        href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
                        className='hover:bg-fd-accent inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors'>
                        GitHub
                    </a>
                </div>
                <code className='bg-fd-card text-fd-muted-foreground mt-6 rounded-md border px-3 py-1.5 text-sm'>
                    pnpm add -D apotheke
                </code>
            </section>

            <section className='mt-16 w-full max-w-5xl'>
                <div className='flex flex-col gap-4 md:flex-row'>
                    <CodePanel label='Before' code={before} />
                    <CodePanel label='After' code={after} />
                </div>
                <p className='text-fd-muted-foreground mt-4 text-center text-sm'>
                    Groups you define, ordered the way you read them — not by where the module
                    happens to live.
                </p>
            </section>

            <section className='mt-16 grid w-full max-w-5xl gap-4 sm:grid-cols-3'>
                {features.map(feature => (
                    <div key={feature.title} className='bg-fd-card rounded-xl border p-5'>
                        <feature.icon className='text-fd-muted-foreground size-5' />
                        <h2 className='mt-3 font-semibold'>{feature.title}</h2>
                        <p className='text-fd-muted-foreground mt-1.5 text-sm'>{feature.body}</p>
                    </div>
                ))}
            </section>
        </main>
    );
}
