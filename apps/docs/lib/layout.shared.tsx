// Fumadocs
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

// Internal
import { appName, gitConfig, npmUrl } from './shared';

export function baseOptions(): BaseLayoutProps {
    return {
        nav: {
            title: <span className='font-semibold tracking-tight'>{appName}</span>
        },
        links: [
            {
                text: 'Documentation',
                url: '/docs',
                active: 'nested-url'
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
