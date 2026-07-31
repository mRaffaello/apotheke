// Next
import Image from 'next/image';

// Fumadocs
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

// Internal
import { appName, gitConfig, npmUrl } from './shared';
import wordmark from '@/public/wordmark.png';

export function baseOptions(): BaseLayoutProps {
    return {
        nav: {
            title: (
                // The wordmark already reads "apotheke", so it carries the name
                // on its own. It ships as solid black, hence the dark-mode flip.
                <Image src={wordmark} alt={appName} priority className='h-4 w-auto dark:invert' />
            )
        },
        links: [
            {
                text: 'Documentation',
                url: '/docs',
                active: 'nested-url',
                // Navbar only — the docs sidebar is already the documentation.
                on: 'nav'
            },
            {
                text: 'npm',
                url: npmUrl,
                external: true
            }
        ],
        githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`
    };
}
