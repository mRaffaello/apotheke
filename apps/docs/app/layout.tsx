// SideEffects
import './global.css';

// Next
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

// Internal
import { Provider } from '@/components/provider';
import { siteUrl } from '@/lib/shared';

const inter = Inter({
    subsets: ['latin']
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

export default function Layout({ children }: LayoutProps<'/'>) {
    return (
        <html lang='en' className={inter.className} suppressHydrationWarning>
            <body className='flex min-h-screen flex-col'>
                <Provider>{children}</Provider>
            </body>
        </html>
    );
}
