/**
 * Bouncing scroll indicator that scrolls to a target section.
 */

'use client';

// Icons
import { ChevronDown } from 'lucide-react';

interface ScrollCtaProps {
    targetId: string;
    label?: string;
}

export function ScrollCta({ targetId, label = 'see it' }: ScrollCtaProps) {
    const handleClick = () => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className='absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 md:block'>
            <button
                type='button'
                onClick={handleClick}
                className='group text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 flex flex-col items-center gap-1 rounded-md px-3 py-1 transition-colors focus-visible:ring-2 focus-visible:outline-none'>
                <span className='text-xs font-medium tracking-widest uppercase'>{label}</span>
                <ChevronDown className='size-4 motion-safe:animate-[scroll-hint_2s_ease-in-out_infinite]' />
            </button>
        </div>
    );
}
