// Fumadocs
import { HomeLayout } from 'fumadocs-ui/layouts/home';

// Internal
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/'>) {
    return <HomeLayout {...baseOptions()}>{children}</HomeLayout>;
}
