// Next
import Link from 'next/link';

// Icons
import { ArrowRight, FileCode2, FolderTree, Terminal } from 'lucide-react';

// Internal
import { HeroEntrance } from '@/components/hero-entrance';
import { HeroGlow } from '@/components/hero-glow';
import { HeroShowcase } from '@/components/hero-showcase';
import { ScrollCta } from '@/components/scroll-cta';
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

/**
 * The shared page rail. Width and gutter come from --page-width /
 * --page-gutter in global.css, which the home navbar reads too, so the logo
 * and every heading on this page sit on the same left edge.
 */
const rail = 'mx-auto w-full max-w-(--page-width) px-(--page-gutter)';

function Separator() {
    return <hr className='border-border/60 border-t' />;
}

/** Inline link in body copy — underlined, foreground weight. */
function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className='text-foreground hover:text-foreground/80 font-medium underline underline-offset-4'>
            {children}
        </Link>
    );
}

function CodePanel({ label, code }: { label: string; code: string }) {
    return (
        <div className='bg-card flex-1 overflow-hidden rounded-xl border'>
            <div className='text-muted-foreground border-b px-4 py-2 text-xs font-medium'>
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
        <main className='min-w-0 flex-1'>
            {/* Hero — split layout, staged page-transition-in */}
            <section className='relative overflow-hidden py-10 md:py-16'>
                {/* Full-bleed, so it sits outside the rail */}
                <HeroGlow />
                <div className={rail}>
                    <HeroEntrance
                        variant='unfold'
                        announcement={
                            <Link
                                href='/docs/guides/agent-skill'
                                className='group border-border bg-card hover:bg-accent inline-flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm transition-colors'>
                                <span className='bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs font-medium'>
                                    New
                                </span>
                                <span className='text-muted-foreground'>
                                    Agent skill — teach your agent your import order
                                </span>
                                <ArrowRight className='text-muted-foreground size-3.5 transition-transform group-hover:translate-x-0.5' />
                            </Link>
                        }
                        heading={
                            <h1 className='text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl'>
                                The import order your{' '}
                                <span className='inline-flex items-baseline'>
                                    <code className='border-border bg-muted rounded-md border px-2 py-0.5 font-mono text-[0.85em]'>
                                        diff
                                    </code>
                                </span>{' '}
                                and{' '}
                                <span className='inline-flex items-baseline'>
                                    <code className='border-border bg-muted rounded-md border px-2 py-0.5 font-mono text-[0.85em]'>
                                        reviewer
                                    </code>
                                </span>{' '}
                                deserve.
                            </h1>
                        }
                        subtext={
                            <p className='text-muted-foreground text-lg text-pretty'>
                                Deterministic, configurable import organization for JavaScript and
                                TypeScript. Run it as a{' '}
                                <TextLink href='/docs/guides/prettier-plugin'>
                                    Prettier plugin
                                </TextLink>{' '}
                                or a <TextLink href='/docs/guides/cli'>standalone CLI</TextLink> —
                                same engine, same config.
                            </p>
                        }
                        actions={
                            <div className='flex flex-wrap items-center gap-3'>
                                <Link
                                    href='/docs'
                                    className='bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90'>
                                    Get started
                                    <ArrowRight className='size-4' />
                                </Link>
                                <code className='bg-card text-muted-foreground rounded-lg border px-4 py-2.5 text-sm'>
                                    pnpm add -D apotheke
                                </code>
                            </div>
                        }
                        showcase={<HeroShowcase />}
                        scrollCta={<ScrollCta targetId='how-it-works' />}
                    />
                </div>
            </section>

            <div className={rail}>
                <Separator />

                {/* Two entry points */}
                <section id='how-it-works' className='scroll-mt-16 py-16'>
                    <div className='max-w-lg'>
                        <h2 className='text-2xl font-bold tracking-tight sm:text-3xl'>
                            Two ways to run it
                        </h2>
                        <p className='text-muted-foreground mt-3 text-pretty'>
                            Drop it into an existing Prettier setup as a{' '}
                            <TextLink href='/docs/guides/prettier-plugin'>plugin</TextLink>, or gate
                            CI with the <TextLink href='/docs/guides/cli'>CLI</TextLink>. Both read
                            the same{' '}
                            <TextLink href='/docs/reference/config'>configuration</TextLink>, so
                            editors and pipelines never disagree.
                        </p>
                    </div>

                    <div className='mt-10 grid gap-4 sm:grid-cols-3'>
                        {features.map(feature => (
                            <div key={feature.title} className='bg-card rounded-xl border p-5'>
                                <feature.icon className='text-muted-foreground size-5' />
                                <h3 className='mt-3 text-base font-semibold'>{feature.title}</h3>
                                <p className='text-muted-foreground mt-1.5 text-sm'>
                                    {feature.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <Separator />

                {/* Before / after */}
                <section className='py-16'>
                    <div className='flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between'>
                        <div className='max-w-lg'>
                            <h2 className='text-2xl font-bold tracking-tight sm:text-3xl'>
                                Groups you define
                            </h2>
                            <p className='text-muted-foreground mt-3 text-pretty'>
                                Imports land in the order you read them — not by where the module
                                happens to live. Every group is named, ordered and commented the way
                                your team already talks about the codebase.
                            </p>
                        </div>
                        <Link
                            href='/docs/guides/groups'
                            className='text-foreground hover:text-foreground/80 inline-flex shrink-0 items-center gap-1.5 text-sm font-medium'>
                            Configure groups
                            <ArrowRight className='size-4' />
                        </Link>
                    </div>

                    <div className='mt-8 flex flex-col gap-4 md:flex-row'>
                        <CodePanel label='Before' code={before} />
                        <CodePanel label='After' code={after} />
                    </div>
                </section>

                <Separator />

                {/* Closing CTA */}
                <section className='py-16'>
                    <div className='max-w-lg'>
                        <h2 className='text-2xl font-bold tracking-tight sm:text-3xl'>
                            Ready when you are
                        </h2>
                        <p className='text-muted-foreground mt-3 text-pretty'>
                            Install it, point it at your globs and let CI hold the line. Start with
                            the <TextLink href='/docs/quick-start'>quick start</TextLink>, or read
                            the source on{' '}
                            <TextLink
                                href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}>
                                GitHub
                            </TextLink>
                            .
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
