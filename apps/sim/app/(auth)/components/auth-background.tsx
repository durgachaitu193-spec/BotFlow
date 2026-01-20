'use client'

import { cn } from '@/lib/utils'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'

type AuthBackgroundProps = {
  className?: string
  children?: React.ReactNode
}

function GridPattern() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden opacity-[0.15] dark:opacity-[0.1]">
      <svg
        className="absolute w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid-pattern"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-black dark:text-white"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>

      {/* Scanning Beam */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/10 to-transparent"
        style={{ height: '20%' }}
        animate={{
          top: ['-20%', '120%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 0
        }}
      />
    </div>
  )
}

function FloatingOrb({
  className,
  delay = 0,
  duration = 20,
  scale = 1
}: {
  className?: string
  delay?: number
  duration?: number
  scale?: number
}) {
  return (
    <motion.div
      className={cn("absolute rounded-full blur-[100px] pointer-events-none opacity-40 dark:opacity-60", className)}
      animate={{
        x: [0, 50, -50, 0],
        y: [0, -50, 50, 0],
        scale: [1, 1.1, 0.9, 1],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay,
      }}
      initial={{ scale }}
    />
  )
}

function Particles() {
  // Static random positions to avoid hydration mismatch
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-teal-500 rounded-full dark:bg-teal-400"
          style={{
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            opacity: Math.random() * 0.5 + 0.2,
          }}
          animate={{
            y: [0, -100],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 10
          }}
        />
      ))}
    </div>
  )
}

export default function AuthBackground({ className, children }: AuthBackgroundProps) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 md:px-6 bg-[#F5F5F5] dark:bg-[#080808] overflow-hidden">

      {/* Background Gradients */}
      <div className="absolute inset-0 z-0">
        <FloatingOrb
          className="bg-teal-500/30 w-[600px] h-[600px] left-[-100px] top-[-100px]"
          duration={25}
        />
        <FloatingOrb
          className="bg-purple-500/20 w-[500px] h-[500px] right-[-100px] bottom-[-100px]"
          delay={5}
          duration={30}
        />
        <FloatingOrb
          className="bg-blue-500/20 w-[400px] h-[400px] left-[40%] top-[40%]"
          delay={2}
          duration={20}
        />
      </div>

      <GridPattern />
      <Particles />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background: "radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)"
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </section>
  )
}
