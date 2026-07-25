import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

// Served from https://marcoraffaello.com/apotheke as a GitHub Pages project
// site, so every route and asset needs the repository name as a prefix. Kept
// unconditional so local dev and the deployed site resolve URLs identically.
const basePath = '/apotheke';

/** @type {import('next').NextConfig} */
const config = {
    output: 'export',
    basePath,
    reactStrictMode: true,
    trailingSlash: true,
    images: {
        // GitHub Pages has no Next.js image optimisation server.
        unoptimized: true
    },
    env: {
        // fumadocs-core resolves its own BASE_PATH from Vite's
        // import.meta.env.BASE_URL, which is undefined under Next and falls
        // back to "/". The static search client needs the real prefix or it
        // fetches the index from the domain root and 404s on Pages.
        NEXT_PUBLIC_BASE_PATH: basePath
    }
};

export default withMDX(config);
