import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'
import {
  ArrowRight,
  Bot,
  Box,
  Database,
  Github,
  Globe,
  Layers,
  Mail,
  Maximize,
  MessageSquare,
  Minus,
  MousePointer2,
  Plus,
  Search as SearchIcon,
  Youtube,
  Zap,
} from 'lucide-react'
import type { TemplateEdge, TemplateNode } from '@/lib/templatesData'

interface FlowPreviewProps {
  nodes: TemplateNode[]
  edges: TemplateEdge[]
}

const getNodeIcon = (type: string, blockType?: string) => {
  if (blockType) {
    if (blockType.includes('gmail')) return Mail
    if (blockType.includes('browser') || blockType.includes('google')) return Globe
    if (blockType.includes('chat') || blockType.includes('telegram') || blockType.includes('slack'))
      return MessageSquare
    if (blockType.includes('youtube')) return Youtube
    if (blockType.includes('github')) return Github
    if (
      blockType.includes('search') ||
      blockType.includes('tavily') ||
      blockType.includes('perplexity')
    )
      return SearchIcon
    if (
      blockType.includes('pinecone') ||
      blockType.includes('mongodb') ||
      blockType.includes('postgres') ||
      blockType.includes('db')
    )
      return Database
  }

  switch (type) {
    case 'trigger':
      return Zap
    case 'agent':
      return Bot
    case 'action':
      return ArrowRight
    case 'router':
      return Layers
    case 'memory':
      return Database
    default:
      return Box
  }
}

const getNodeColor = (type: string) => {
  switch (type) {
    case 'trigger':
      return '#3b82f6'
    case 'agent':
      return '#8b5cf6'
    case 'action':
      return '#10b981'
    case 'router':
      return '#f59e0b'
    case 'memory':
      return '#ec4899'
    default:
      return '#6b7280'
  }
}

export default function FlowPreview({ nodes, edges }: FlowPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)

  // Motion values for pan and zoom
  const scale = useMotionValue(1)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Smooth springs for fluid motion
  const springConfig = { damping: 30, stiffness: 200, mass: 0.5 }
  const smoothScale = useSpring(scale, springConfig)
  const smoothX = useSpring(x, springConfig)
  const smoothY = useSpring(y, springConfig)

  const calculateFitView = useCallback(() => {
    if (!containerRef.current || nodes.length === 0) return { x: 0, y: 0, scale: 0.8 }

    const padding = 80
    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight

    const minX = Math.min(...nodes.map((n) => n.position.x))
    const maxX = Math.max(...nodes.map((n) => n.position.x)) + 250 // Include node width
    const minY = Math.min(...nodes.map((n) => n.position.y))
    const maxY = Math.max(...nodes.map((n) => n.position.y)) + 150 // Include estimated node height

    const graphWidth = maxX - minX
    const graphHeight = maxY - minY

    const scaleX = (containerWidth - padding * 2) / graphWidth
    const scaleY = (containerHeight - padding * 2) / graphHeight
    const nextScale = Math.min(scaleX, scaleY, 1)

    const centerX = minX + graphWidth / 2
    const centerY = minY + graphHeight / 2

    const nextX = containerWidth / 2 - centerX * nextScale
    const nextY = containerHeight / 2 - centerY * nextScale

    return { x: nextX, y: nextY, scale: nextScale }
  }, [nodes])

  // Initial fit view animation
  useEffect(() => {
    const timer = setTimeout(() => {
      const fit = calculateFitView()
      x.set(fit.x)
      y.set(fit.y)
      scale.set(fit.scale)
      setIsReady(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [calculateFitView, x, y, scale])

  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return

    e.preventDefault()
    const zoomIntensity = 0.0015
    const delta = -e.deltaY
    const newScale = Math.min(Math.max(scale.get() + delta * zoomIntensity, 0.2), 2)

    // Zoom towards mouse position
    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const zoomFactor = newScale / scale.get()
    const newX = mouseX - (mouseX - x.get()) * zoomFactor
    const newY = mouseY - (mouseY - y.get()) * zoomFactor

    scale.set(newScale)
    x.set(newX)
    y.set(newY)
  }

  const zoomIn = () => {
    const nextScale = Math.min(scale.get() * 1.2, 2)
    const fit = containerRef.current?.getBoundingClientRect()
    if (!fit) return
    const centerX = fit.width / 2
    const centerY = fit.height / 2
    const zoomFactor = nextScale / scale.get()
    x.set(centerX - (centerX - x.get()) * zoomFactor)
    y.set(centerY - (centerY - y.get()) * zoomFactor)
    scale.set(nextScale)
  }

  const zoomOut = () => {
    const nextScale = Math.max(scale.get() / 1.2, 0.2)
    const fit = containerRef.current?.getBoundingClientRect()
    if (!fit) return
    const centerX = fit.width / 2
    const centerY = fit.height / 2
    const zoomFactor = nextScale / scale.get()
    x.set(centerX - (centerX - x.get()) * zoomFactor)
    y.set(centerY - (centerY - y.get()) * zoomFactor)
    scale.set(nextScale)
  }

  const resetView = () => {
    const fit = calculateFitView()
    x.set(fit.x)
    y.set(fit.y)
    scale.set(fit.scale)
  }

  return (
    <div
      ref={containerRef}
      className='group relative h-[600px] w-full cursor-grab overflow-hidden rounded-2xl border border-white/10 bg-[#050508] shadow-2xl transition-all duration-500 active:cursor-grabbing'
      onWheel={handleWheel}
    >
      {/* Canvas Grid Background */}
      <motion.div
        style={{ x: smoothX, y: smoothY, scale: smoothScale }}
        className='pointer-events-none absolute inset-0'
      >
        <div className='absolute inset-[-200%] bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50' />
      </motion.div>

      {/* Dynamic Background Glows */}
      <div className='pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)]'>
        <div className='-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-[500px] w-[800px] rounded-full bg-accent-primary/5 blur-[120px]' />
      </div>

      {/* Interactive Layer */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        onDrag={(_, info) => {
          x.set(x.get() + info.delta.x)
          y.set(y.get() + info.delta.y)
        }}
        style={{ x: smoothX, y: smoothY, scale: smoothScale }}
        className='relative h-full w-full transform-gpu'
      >
        <AnimatePresence>
          {isReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className='relative'
            >
              {/* Edges Container */}
              <svg className='pointer-events-none absolute inset-0 h-[5000px] w-[5000px] translate-x-[-1500px] translate-y-[-1500px] overflow-visible'>
                <g transform='translate(1500, 1500)'>
                  {edges.map((edge, i) => {
                    const source = nodes.find((n) => (n as any).id === edge.source)
                    const target = nodes.find((n) => (n as any).id === edge.target)
                    if (!source || !target) return null

                    const sourceX = source.position.x + 250
                    const sourceY = source.position.y + 24
                    const targetX = target.position.x
                    const targetY = target.position.y + 24

                    const midX = sourceX + (targetX - sourceX) / 2
                    const borderRadius = 12
                    const pathD = `
                      M ${sourceX} ${sourceY}
                      L ${midX - borderRadius} ${sourceY}
                      Q ${midX} ${sourceY}, ${midX} ${sourceY < targetY ? sourceY + borderRadius : sourceY - borderRadius}
                      L ${midX} ${targetY < sourceY ? targetY + borderRadius : targetY - borderRadius}
                      Q ${midX} ${targetY}, ${midX + borderRadius} ${targetY}
                      L ${targetX} ${targetY}
                    `

                    return (
                      <g key={edge.id}>
                        <motion.path
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ delay: 0.2 + i * 0.03, duration: 0.8 }}
                          d={pathD}
                          stroke='rgba(255, 255, 255, 0.1)'
                          strokeWidth='2.5'
                          fill='none'
                          strokeLinejoin='round'
                          strokeLinecap='round'
                        />
                        <circle r='3' fill='var(--accent-primary)'>
                          <animateMotion
                            dur={`${4 + Math.random() * 2}s`}
                            repeatCount='indefinite'
                            path={pathD}
                            calcMode='linear'
                          />
                          <animate
                            attributeName='opacity'
                            values='0;0.5;0'
                            dur='4s'
                            repeatCount='indefinite'
                          />
                        </circle>
                      </g>
                    )
                  })}
                </g>
              </svg>

              {/* Nodes Container */}
              {nodes.map((node, i) => {
                const color = getNodeColor(node.type)
                const Icon = getNodeIcon(node.type, (node as any).blockType)
                const subBlocks = (node as any).data?.subBlocks
                const subBlockEntries = subBlocks
                  ? Object.entries(subBlocks)
                      .filter(([key]) => !key.startsWith('_'))
                      .slice(0, 4)
                  : []

                return (
                  <motion.div
                    key={(node as any).id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className='pointer-events-auto absolute w-[250px] select-none overflow-hidden rounded-[10px] border border-white/10 bg-[#0c0d12] shadow-2xl backdrop-blur-md transition-colors hover:border-white/30'
                    style={{ left: node.position.x, top: node.position.y }}
                  >
                    <div className='flex items-center gap-[10px] border-white/5 border-b bg-white/[0.02] p-[10px]'>
                      <div
                        className='flex h-[28px] w-[28px] flex-shrink-0 items-center justify-center rounded-[6px] shadow-lg'
                        style={{ background: color }}
                      >
                        <Icon className='h-4 w-4 text-white' />
                      </div>
                      <span className='truncate font-semibold text-[15px] text-white/95 tracking-tight'>
                        {node.label}
                      </span>
                    </div>

                    <div className='flex flex-col gap-2 p-[10px]'>
                      {subBlockEntries.length > 0 ? (
                        subBlockEntries.map(([key, val]: [string, any]) => (
                          <div
                            key={key}
                            className='flex items-center justify-between gap-2 overflow-hidden'
                          >
                            <span className='min-w-0 truncate text-[12px] text-white/40 capitalize'>
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className='min-w-0 flex-1 truncate text-right font-medium text-[12px] text-white/80'>
                              {(() => {
                                const displayVal =
                                  typeof val === 'object' && val !== null
                                    ? (val.value ?? '-')
                                    : (val ?? '-')
                                return typeof displayVal === 'object' ? '-' : String(displayVal)
                              })()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className='space-y-2 py-1'>
                          <div className='h-1.5 w-full rounded-full bg-white/5' />
                          <div className='h-1.5 w-2/3 rounded-full bg-white/5' />
                        </div>
                      )}

                      <div className='mt-1 flex justify-center gap-1.5 opacity-30'>
                        <div className='h-1 w-1 rounded-full bg-white/40' />
                        <div className='h-1 w-1 rounded-full bg-white/40' />
                        <div className='h-1 w-1 rounded-full bg-white/40' />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Controls */}
      <div className='absolute right-6 bottom-6 z-50 flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-1 shadow-2xl backdrop-blur-xl'>
        <div className='flex flex-col'>
          <button
            onClick={zoomIn}
            title='Zoom In'
            className='rounded-xl p-2.5 text-white/60 transition-all hover:bg-white/10 hover:text-white'
          >
            <Plus className='h-4 w-4' />
          </button>
          <button
            onClick={zoomOut}
            title='Zoom Out'
            className='rounded-xl p-2.5 text-white/60 transition-all hover:bg-white/10 hover:text-white'
          >
            <Minus className='h-4 w-4' />
          </button>
        </div>
        <div className='mx-2 h-px bg-white/10' />
        <button
          onClick={resetView}
          title='Fit to View'
          className='rounded-xl p-2.5 text-white/60 transition-all hover:bg-white/10 hover:text-white'
        >
          <Maximize className='h-4 w-4' />
        </button>
      </div>

      <div className='absolute top-6 left-6 flex select-none items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-[10px] text-white/40 backdrop-blur-md'>
        <MousePointer2 className='h-3 w-3' />
        DRAG TO PAN • SCROLL TO ZOOM
      </div>

      {/* Decorative corner accents */}
      <div className='pointer-events-none absolute top-0 left-0 h-24 w-24 bg-gradient-to-br from-accent-primary/5 to-transparent opacity-50' />
      <div className='pointer-events-none absolute right-0 bottom-0 h-24 w-24 bg-gradient-to-tl from-accent-primary/5 to-transparent opacity-50' />
    </div>
  )
}
