// Next
import Image from 'next/image';

// Fumadocs
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

// Internal
import { appName, gitConfig, npmUrl } from './shared';
import logo from '@/public/logo.png';

export function baseOptions(): BaseLayoutProps {
    return {
        nav: {
            title: (
                <span className='inline-flex items-center gap-2'>
                    <Image src={logo} alt='' width={22} height={22} className='rounded-md' />
                    <span className='font-semibold tracking-tight'>{appName}</span>
                </span>
            )
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
