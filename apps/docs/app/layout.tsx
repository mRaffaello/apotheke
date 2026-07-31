// SideEffects
import './global.css';

// Next
import type { Metadata, Viewport } from 'next';
import { Fira_Code, Geist, Sora } from 'next/font/google';

// Internal
import { Provider } from '@/components/provider';
import { siteUrl } from '@/lib/shared';

// Geist carries body copy, Sora the headings and Fira Code every code surface.
const geist = Geist({
    subsets: ['latin'],
    variable: '--font-geist'
});

const sora = Sora({
    subsets: ['latin'],
    variable: '--font-sora'
});

const firaCode = Fira_Code({
    subsets: ['latin'],
    variable: '--font-fira-code'
});

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: 'apotheke — Prettier for imports',
        template: '%s — apotheke'
    },
    description:
        'Deterministic, configurable import organization for JavaScript and TypeScript — as a Prettier plugin or a standalone CLI.'
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#fcfcfc' },
        { media: '(prefers-color-scheme: dark)', color: '#000000' }
    ]
};

export default function Layout({ children }: LayoutProps<'/'>) {
    return (
        <html
            lang='en'
            className={`${geist.variable} ${sora.variable} ${firaCode.variable}`}
            suppressHydrationWarning>
            <body className='flex min-h-screen flex-col font-sans antialiased'>
                <Provider>{children}</Provider>
            </body>
        </html>
    );
}
