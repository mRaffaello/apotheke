// apotheke.config.mjs — apotheke organising its own imports
export default {
    groups: [
        { name: 'Node', match: ['node:*'] },
        { name: 'React', match: ['react', 'react-dom'] },
        { name: 'Next', match: ['next', 'next/**'] },
        { name: 'Fumadocs', match: ['fumadocs-*', 'fumadocs-*/**', '@orama/*'] },
        { name: 'Icons', match: ['lucide-react'] },
        { name: 'Testing', match: ['vitest', 'vitest/*'] },
        { name: 'Parser', match: ['oxc-parser'] },
        { name: 'Fs', match: ['fast-glob'] },
        { name: 'Internal', match: ['./**', '../**', '@/**'] }
    ],
    groupSeparator: true,
    groupComments: true
};
