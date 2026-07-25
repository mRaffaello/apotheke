// Fumadocs
import { DocsLayout } from 'fumadocs-ui/layouts/docs';

// Internal
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

export default function Layout({ children }: LayoutProps<'/docs'>) {
    return (
        <DocsLayout tree={source.getPageTree()} {...baseOptions()}>
            {children}
        </DocsLayout>
    );
}
