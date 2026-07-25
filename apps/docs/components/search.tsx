'use client';
// Fumadocs
import { create } from '@orama/orama';
import { useDocsSearch } from 'fumadocs-core/search/client';
import { oramaStaticClient } from 'fumadocs-core/search/client/orama-static';
import {
    type SharedProps,
    SearchDialog,
    SearchDialogClose,
    SearchDialogContent,
    SearchDialogHeader,
    SearchDialogIcon,
    SearchDialogInput,
    SearchDialogList,
    SearchDialogOverlay
} from 'fumadocs-ui/components/dialog/search';
import { useI18n } from 'fumadocs-ui/contexts/i18n';

function initOrama() {
    return create({
        schema: { _: 'string' },
        // https://docs.orama.com/docs/orama-js/supported-languages
        language: 'english'
    });
}

// fumadocs-core defaults this to `/api/search` because its BASE_PATH constant
// reads Vite's import.meta.env.BASE_URL, which does not exist under Next.js.
// Without the explicit prefix the index is fetched from the domain root, which
// 404s on GitHub Pages project sites.
const searchIndexUrl = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/search`;

export default function DefaultSearchDialog(props: SharedProps) {
    const { locale } = useI18n(); // (optional) for i18n
    const { search, setSearch, query } = useDocsSearch({
        client: oramaStaticClient({
            from: searchIndexUrl,
            initOrama,
            locale
        })
    });

    return (
        <SearchDialog
            search={search}
            onSearchChange={setSearch}
            isLoading={query.isLoading}
            {...props}>
            <SearchDialogOverlay />
            <SearchDialogContent>
                <SearchDialogHeader>
                    <SearchDialogIcon />
                    <SearchDialogInput />
                    <SearchDialogClose />
                </SearchDialogHeader>
                <SearchDialogList items={query.data !== 'empty' ? query.data : null} />
            </SearchDialogContent>
        </SearchDialog>
    );
}
