'use client'

type AuthBackgroundProps = {
  className?: string
  children?: React.ReactNode
}

/** The BotFlow symbol as a graph: three nodes on the left rail, two on the right. */
const EDGES = ['M80 70 L230 120', 'M80 170 L230 120', 'M80 170 L230 220', 'M80 270 L230 220']

const NODES = [
  { cx: 80, cy: 70 },
  { cx: 230, cy: 120 },
  { cx: 80, cy: 170 },
  { cx: 230, cy: 220 },
  { cx: 80, cy: 270 },
]

/**
 * Auth backdrop, matching the BotFlow marketing site.
 *
 * Ink base with two soft orange glows and a fine grain overlay. Deliberately
 * static: the previous version layered a grid, floating orbs and animated
 * particles in teal/purple/blue, which fought with the content and was
 * off-brand.
 */
export default function AuthBackground({ children }: AuthBackgroundProps) {
  return (
    <section className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0b0b0b] px-4 md:px-6'>
      <div
        aria-hidden
        className='pointer-events-none absolute -top-48 -left-40 h-[620px] w-[620px] rounded-full blur-[120px]'
        style={{ background: 'radial-gradient(circle, rgba(255,106,0,0.30), transparent 66%)' }}
      />
      <div
        aria-hidden
        className='pointer-events-none absolute right-[-208px] bottom-[-180px] h-[560px] w-[560px] rounded-full blur-[120px]'
        style={{ background: 'radial-gradient(circle, rgba(255,106,0,0.16), transparent 68%)' }}
      />

      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 opacity-[0.035]'
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Oversized BotFlow graph, sitting far back. Low opacity so it reads as
          texture rather than decoration competing with the sign-in action. */}
      <svg
        aria-hidden
        viewBox='0 0 320 340'
        className='pointer-events-none absolute -right-24 bottom-[-60px] h-[560px] w-[560px] opacity-[0.07] md:right-[6%] md:bottom-[8%]'
      >
        <defs>
          <linearGradient id='authFlowEdge' x1='0' y1='0' x2='1' y2='0'>
            <stop offset='0%' stopColor='#ff6a00' stopOpacity='0.1' />
            <stop offset='50%' stopColor='#ff6a00' stopOpacity='1' />
            <stop offset='100%' stopColor='#ff6a00' stopOpacity='0.1' />
          </linearGradient>
        </defs>

        {EDGES.map((d) => (
          <path key={d} d={d} fill='none' stroke='#ff6a00' strokeOpacity='0.35' strokeWidth='3' />
        ))}

        {EDGES.map((d, i) => (
          <path
            key={`pulse-${d}`}
            d={d}
            fill='none'
            stroke='url(#authFlowEdge)'
            strokeWidth='3.5'
            className='auth-flow-pulse'
            style={{ animationDelay: `${i * 0.5}s` }}
          />
        ))}

        {NODES.map((n, i) => (
          <circle
            key={`${n.cx}-${n.cy}`}
            cx={n.cx}
            cy={n.cy}
            r={26}
            fill='#ff6a00'
            className='auth-flow-node'
            style={{ animationDelay: `${i * 0.45}s` }}
          />
        ))}
      </svg>

      <div className='relative z-10 w-full max-w-md'>{children}</div>
    </section>
  )
}
