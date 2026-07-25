// Fumadocs
import { llms } from 'fumadocs-core/source';

// Internal
import { source } from '@/lib/source';

export const revalidate = false;

export function GET() {
    return new Response(llms(source).index());
}
