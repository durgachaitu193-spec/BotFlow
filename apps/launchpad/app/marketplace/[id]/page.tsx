'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  GitFork,
  Globe,
  Linkedin,
  Loader2,
  Mail,
  Share2,
  Star,
  Twitter,
} from 'lucide-react'
import NextLink from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'

const Link = NextLink as any

import { useParams, useRouter } from 'next/navigation'
import FlowPreview from '@/components/FlowPreview'
import { templates as staticTemplates } from '@/lib/templatesData'
import { nextApiFetch } from '@/global/utils/nextApiFetch'

export default function TemplateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [template, setTemplate] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchTemplate() {
      const id = params.id as string

      // First check static templates
      const staticTemplate = staticTemplates.find((t) => t.id === id)
      if (staticTemplate) {
        setTemplate(staticTemplate)
        setIsLoading(false)
        return
      }

      // If not found in static, fetch from API
      try {
        const { data, error } = await nextApiFetch<{ data: any }>({
          url: `/api/templates?id=${id}`,
        })

        if (data?.data) {
          const t = data.data

          // Map database structure to UI structure
          const mappedNodes = t.state?.blocks
            ? Object.values(t.state.blocks).map((block: any) => {
                let type = 'action'
                if (
                  [
                    'api_trigger',
                    'chat_trigger',
                    'input_trigger',
                    'manual_trigger',
                    'start_trigger',
                    'webhook',
                  ].includes(block.type)
                ) {
                  type = 'trigger'
                } else if (
                  ['agent', 'stagehand_agent', 'llm-agent'].includes(block.type) ||
                  block.type.includes('agent')
                ) {
                  type = 'agent'
                } else if (['router', 'condition'].includes(block.type)) {
                  type = 'router'
                } else if (
                  [
                    'memory',
                    'mem0',
                    'zep',
                    'pinecone',
                    'mongodb',
                    'postgresql',
                    'mysql',
                    'rds',
                    'dynamodb',
                  ].includes(block.type)
                ) {
                  type = 'memory'
                }

                return {
                  id: block.id,
                  type,
                  blockType: block.type,
                  label: block.name,
                  position: block.position,
                  data: {
                    subBlocks: block.subBlocks,
                    isTrigger:
                      block.triggerMode === true ||
                      [
                        'api_trigger',
                        'chat_trigger',
                        'input_trigger',
                        'manual_trigger',
                        'start_trigger',
                        'webhook',
                      ].includes(block.type),
                  },
                }
              })
            : []

          const mappedEdges = t.state?.edges
            ? t.state.edges.map((edge: any) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
              }))
            : []

          setTemplate({
            id: t.id,
            title: t.name,
            description: t.details?.tagline || t.name,
            about: t.details?.about,
            author: t.creator?.name || 'Unknown',
            stars: t.stars || 0,
            forks: t.views || 0,
            tags: t.tags || [],
            updatedAt: new Date(t.updatedAt).toLocaleDateString(),
            credentials: t.requiredCredentials || [],
            flowData: {
              nodes: mappedNodes,
              edges: mappedEdges,
            },
            creator: t.creator,
          })
        }
      } catch (err) {
        console.error('Failed to fetch template details:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplate()
  }, [params.id])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className='flex h-[70vh] items-center justify-center'>
          <div className='flex flex-col items-center gap-4'>
            <Loader2 className='h-10 w-10 animate-spin text-accent-primary' />
            <p className='animate-pulse text-text-secondary'>Loading template details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!template) {
    return (
      <DashboardLayout>
        <div className='flex h-full items-center justify-center'>
          <div className='text-center'>
            <h2 className='font-bold text-2xl text-text-primary'>Template not found</h2>
            <Link
              href='/marketplace'
              className='mt-4 inline-block text-accent-primary hover:underline'
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className='mx-auto max-w-6xl'>
        {/* Header Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className='mb-6'
        >
          <Link
            href='/marketplace'
            className='flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary'
          >
            <ArrowLeft className='h-4 w-4' />
            More Templates
          </Link>
        </motion.div>

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between'
        >
          <div>
            <h1 className='mb-2 font-bold text-3xl text-text-primary'>{template.title}</h1>
            <p className='mb-4 text-lg text-text-secondary'>{template.description}</p>

            <div className='flex items-center gap-6 text-sm text-text-muted'>
              <div className='flex items-center gap-2'>
                <Star
                  className={`h-4 w-4 ${template.stars > 0 ? 'fill-yellow-400 text-yellow-400' : ''}`}
                />
                <span>{template.stars}</span>
              </div>
              <div className='flex items-center gap-2'>
                <GitFork className='h-4 w-4' />
                <span>{template.forks}</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='flex h-5 w-5 items-center justify-center rounded-full bg-accent-primary/20 font-bold text-accent-primary text-xs'>
                  {template.author[0]}
                </div>
                <span>{template.author}</span>
              </div>
            </div>

            {template.credentials && template.credentials.length > 0 && (
              <div className='mt-4 text-sm text-text-muted'>
                <span className='font-medium text-text-secondary'>Credentials needed: </span>
                {Array.isArray(template.credentials)
                  ? template.credentials.map((c: any) => c.label || c).join(', ')
                  : template.credentials}
              </div>
            )}

            {template.tags && template.tags.length > 0 && (
              <div className='mt-4 flex flex-wrap gap-2'>
                {template.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className='rounded-full border border-white/10 bg-white/5 px-3 py-1 text-text-secondary text-xs'
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className='flex items-center gap-3'>
            <button className='flex items-center gap-2 rounded-lg bg-accent-primary px-6 py-2.5 font-medium text-bg-deep transition-all hover:bg-accent-primary/90 hover:shadow-glow-primary'>
              Use template
            </button>
            <button className='flex items-center justify-center rounded-lg border border-white/10 bg-bg-card p-2.5 text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary'>
              <Share2 className='h-5 w-5' />
            </button>
          </div>
        </motion.div>

        {/* Flow Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='mb-12'
        >
          <FlowPreview
            nodes={template.flowData?.nodes || []}
            edges={template.flowData?.edges || []}
          />
        </motion.div>

        {/* Details Grid */}
        <div className='grid gap-12 md:grid-cols-3'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='md:col-span-2'
          >
            <h2 className='mb-4 font-bold text-text-primary text-xl'>About this Workflow</h2>
            <div className='prose prose-invert max-w-none text-text-secondary'>
              {template.about ? (
                <div className='whitespace-pre-wrap'>{template.about}</div>
              ) : (
                <>
                  <p>
                    {template.description ||
                      'This workflow is designed to streamline your operations by leveraging multiple AI agents.'}
                  </p>
                  <p className='mt-4'>
                    It starts with a trigger and processes data through various steps including
                    routing, agent analysis, and memory storage.
                  </p>
                  <p className='mt-4'>Key features:</p>
                  <ul className='mt-2 list-disc space-y-1 pl-5'>
                    <li>Automated data processing</li>
                    <li>Multi-agent collaboration</li>
                    <li>Persistent memory storage</li>
                    <li>Error handling and routing</li>
                  </ul>
                  <p className='mt-4'>
                    Ensure that you have the necessary API keys configured in your settings to use
                    this template effectively.
                  </p>
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className='mb-4 font-bold text-text-primary text-xl'>About the Creator</h2>
            <div className='rounded-xl border border-white/5 bg-bg-card/50 p-6'>
              <div className='mb-4 flex items-center gap-4'>
                {template.creator?.profileImageUrl ? (
                  <img
                    src={template.creator.profileImageUrl}
                    alt={template.author}
                    className='h-12 w-12 rounded-full object-cover'
                  />
                ) : (
                  <div className='flex h-12 w-12 items-center justify-center rounded-full bg-accent-primary/20 font-bold text-accent-primary text-xl'>
                    {template.author[0]}
                  </div>
                )}
                <div>
                  <div className='font-bold text-text-primary'>{template.author}</div>
                  <div className='mt-1 flex items-center gap-3 text-text-muted'>
                    <Globe className='h-4 w-4 cursor-pointer hover:text-text-primary' />
                    <Twitter className='h-4 w-4 cursor-pointer hover:text-text-primary' />
                    <Linkedin className='h-4 w-4 cursor-pointer hover:text-text-primary' />
                    <Mail className='h-4 w-4 cursor-pointer hover:text-text-primary' />
                  </div>
                </div>
              </div>

              <div className='space-y-4 text-sm text-text-secondary'>
                <div>
                  <div className='mb-1 font-medium text-text-primary'>About</div>
                  <p>
                    {template.creator?.details?.about ||
                      `I'm ${template.author.split(' ')[0]} with a passion for building agentic systems.`}
                  </p>
                </div>
                {template.creator?.details?.websiteUrl && (
                  <div>
                    <div className='mb-1 font-medium text-text-primary'>Website</div>
                    <a
                      href={template.creator.details.websiteUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-accent-primary hover:underline'
                    >
                      {template.creator.details.websiteUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}
