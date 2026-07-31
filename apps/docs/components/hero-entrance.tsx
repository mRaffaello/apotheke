/**
 * Homepage "page transition in". Stages the hero elements (announcement,
 * heading, subtext, actions, showcase, scroll cta) into view on mount. A single
 * integer stage drives the whole sequence, and every timing lives in one place.
 *
 * ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD (cascade variant, ms after mount)
 *
 *    0ms   hero hidden (opacity 0, slid down, blurred)
 *  120ms   announcement pill fades up
 *  260ms   heading fades up
 *  420ms   subtext fades up
 *  560ms   actions fade up
 *  300ms   showcase fades + scales in (runs alongside the text)
 *  760ms   scroll cta fades in last
 * ─────────────────────────────────────────────────────────
 */

'use client';

// React
import { type ReactNode, useEffect, useState } from 'react';

// Others
import { type Transition, motion, useReducedMotion } from 'motion/react';

type VariantConfig = {
    /** Stage delays in ms after mount. The ONLY place timing values live. */
    timing: {
        announcement: number;
        heading: number;
        subtext: number;
        actions: number;
        showcase: number;
        scrollCta: number;
    };
    /** Rising text/actions column reveal. */
    rise: {
        offsetY: number; // px each element slides up from
        blur: number; //   px blur burned off as it settles
        spring: { type: 'spring'; visualDuration: number; bounce: number };
    };
    /** Showcase reveal (scales in rather than rising). */
    showcase: {
        initialScale: number;
        spring: { type: 'spring'; stiffness: number; damping: number };
    };
};

const VARIANTS = {
    cascade: {
        timing: {
            announcement: 120,
            heading: 260,
            subtext: 420,
            actions: 560,
            showcase: 300,
            scrollCta: 760
        },
        rise: {
            offsetY: 16,
            blur: 8,
            spring: { type: 'spring', visualDuration: 0.5, bounce: 0.15 }
        },
        showcase: {
            initialScale: 0.92,
            spring: { type: 'spring', stiffness: 260, damping: 28 }
        }
    },
    snap: {
        timing: {
            announcement: 60,
            heading: 140,
            subtext: 220,
            actions: 300,
            showcase: 160,
            scrollCta: 420
        },
        rise: {
            offsetY: 10,
            blur: 4,
            spring: { type: 'spring', visualDuration: 0.3, bounce: 0.05 }
        },
        showcase: {
            initialScale: 0.96,
            spring: { type: 'spring', stiffness: 460, damping: 26 }
        }
    },
    unfold: {
        timing: {
            announcement: 200,
            heading: 440,
            subtext: 700,
            actions: 960,
            showcase: 360,
            scrollCta: 1240
        },
        rise: {
            offsetY: 28,
            blur: 14,
            spring: { type: 'spring', visualDuration: 0.8, bounce: 0.3 }
        },
        showcase: {
            initialScale: 0.85,
            spring: { type: 'spring', stiffness: 170, damping: 22 }
        }
    }
} satisfies Record<string, VariantConfig>;

type VariantName = keyof typeof VARIANTS;

interface HeroEntranceProps {
    announcement: ReactNode;
    heading: ReactNode;
    subtext: ReactNode;
    actions: ReactNode;
    showcase: ReactNode;
    scrollCta: ReactNode;
    /** Which entrance preset to play. Default: 'cascade'. */
    variant?: VariantName;
}

export function HeroEntrance({
    variant = 'cascade',
    announcement,
    heading,
    subtext,
    actions,
    showcase,
    scrollCta
}: HeroEntranceProps) {
    const preset = VARIANTS[variant];
    const t = preset.timing;
    const riseCfg = preset.rise;
    const reduce = useReducedMotion();

    // 1: announcement  2: heading  3: subtext  4: actions  5: showcase  6: scrollCta
    // Reduced motion: skip straight to the final stage — no staggered reveal.
    const [stage, setStage] = useState(reduce ? 6 : 0);

    useEffect(() => {
        if (reduce) return;
        const timers: ReturnType<typeof setTimeout>[] = [];
        timers.push(setTimeout(() => setStage(s => Math.max(s, 1)), t.announcement));
        timers.push(setTimeout(() => setStage(s => Math.max(s, 2)), t.heading));
        timers.push(setTimeout(() => setStage(s => Math.max(s, 3)), t.subtext));
        timers.push(setTimeout(() => setStage(s => Math.max(s, 4)), t.actions));
        timers.push(setTimeout(() => setStage(s => Math.max(s, 5)), t.showcase));
        timers.push(setTimeout(() => setStage(s => Math.max(s, 6)), t.scrollCta));
        return () => timers.forEach(clearTimeout);
    }, [reduce, t.announcement, t.heading, t.subtext, t.actions, t.showcase, t.scrollCta]);

    /*
     * Reusable reveal props for a rising column element. The reduced branch has
     * to specify every property the animated branch does, at its settled value:
     * useReducedMotion() can flip from null (matching SSR) to true *after*
     * mount, and a target object missing a property leaves it frozen
     * mid-entrance instead of resetting.
     */
    const rise = (atStage: number) => ({
        initial: reduce
            ? { opacity: 1, y: 0, filter: 'blur(0px)' }
            : { opacity: 0, y: riseCfg.offsetY, filter: `blur(${riseCfg.blur}px)` },
        animate: reduce
            ? { opacity: 1, y: 0, filter: 'blur(0px)' }
            : {
                  opacity: stage >= atStage ? 1 : 0,
                  y: stage >= atStage ? 0 : riseCfg.offsetY,
                  filter: stage >= atStage ? 'blur(0px)' : `blur(${riseCfg.blur}px)`
              },
        transition: reduce ? { duration: 0 } : (riseCfg.spring as Transition)
    });

    return (
        <>
            {/* Horizontal rail is owned by the caller's page container. */}
            <div className='flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12'>
                {/* Left — text content */}
                <div className='relative z-10 space-y-6 lg:w-1/2'>
                    <motion.div {...rise(1)}>{announcement}</motion.div>
                    <motion.div {...rise(2)}>{heading}</motion.div>
                    <motion.div {...rise(3)}>{subtext}</motion.div>
                    <motion.div {...rise(4)}>{actions}</motion.div>
                </div>

                {/* Right — visual slot */}
                <motion.div
                    className='relative z-0 hidden items-center justify-center md:flex lg:-ml-8 lg:w-1/2'
                    initial={
                        reduce
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0, scale: preset.showcase.initialScale }
                    }
                    animate={
                        reduce
                            ? { opacity: 1, scale: 1 }
                            : {
                                  opacity: stage >= 5 ? 1 : 0,
                                  scale: stage >= 5 ? 1 : preset.showcase.initialScale
                              }
                    }
                    transition={reduce ? { duration: 0 } : (preset.showcase.spring as Transition)}>
                    {showcase}
                </motion.div>
            </div>

            {/* Scroll cta — fades in last */}
            <motion.div
                initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: reduce ? 1 : stage >= 6 ? 1 : 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.4 }}>
                {scrollCta}
            </motion.div>
        </>
    );
}
