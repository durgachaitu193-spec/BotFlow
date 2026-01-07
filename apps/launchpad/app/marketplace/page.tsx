'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Box, LayoutGrid, Search, Sparkles } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import TemplateCard from '@/components/TemplateCard'
import { nextApiFetch } from '@/global/utils/nextApiFetch'

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [apiTemplates, setApiTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const { data, error } = await nextApiFetch<{ data: any[] }>({
          url: '/api/templates',
        })

        if (data?.data) {
          const mappedTemplates = data.data.map((t) => ({
            id: t.id,
            title: t.name,
            description: t.details?.tagline || t.name,
            author: t.creator?.name || 'Unknown',
            stars: t.stars || 0,
            forks: t.views || 0, // Using views as forks
            tags: t.tags || [],
            updatedAt: new Date(t.updatedAt).toLocaleDateString(),
            credentials: t.requiredCredentials || [],
            flowData: t.state || { nodes: [], edges: [] },
            icon: Box, // Default icon for API templates
          }))
          setApiTemplates(mappedTemplates)
        }
      } catch (err) {
        console.error('Failed to fetch templates:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const templates = [...apiTemplates]

  const filteredTemplates = templates.filter(
    (template) =>
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <DashboardLayout>
      <div className='pointer-events-none fixed inset-0 overflow-hidden'>
        <div className='absolute top-[-20%] left-[-10%] h-[50%] w-[50%] animate-pulse rounded-full bg-accent-primary/5 blur-[120px]' />
        <div
          className='absolute right-[-10%] bottom-[-20%] h-[50%] w-[50%] animate-pulse rounded-full bg-blue-500/5 blur-[120px]'
          style={{ animationDelay: '2s' }}
        />
      </div>

      <div className='relative z-10 flex flex-col gap-8 pb-10'>
        <div className='flex flex-col gap-6 md:flex-row md:items-end md:justify-between'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className='relative'
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className='-left-8 -top-8 absolute text-accent-primary/20'
            />

            <div className='mb-2 flex items-center gap-3'>
              <div className='flex h-12 w-12 items-center justify-center rounded-2xl border border-accent-primary/20 bg-gradient-to-br from-accent-primary/20 to-accent-primary/5 shadow-accent-primary/10 shadow-lg backdrop-blur-xl'>
                <LayoutGrid className='h-6 w-6 text-accent-primary' />
              </div>
              <h1 className='bg-gradient-to-r from-white via-white to-white/60 bg-clip-text font-bold text-4xl text-transparent'>
                Marketplace
              </h1>
            </div>
            <p className='max-w-xl text-lg text-text-secondary'>
              Discover powerful agent templates to automate your workflows.
              <span className='text-accent-primary/80'> Build faster, together.</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className='flex items-center gap-3'
          >
            <button className='group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 font-medium text-sm text-text-secondary transition-all hover:border-white/20 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-purple-500/10'>
              <span className='relative z-10 flex items-center gap-2'>
                <Sparkles className='h-4 w-4 text-purple-400' />
                Gallery
              </span>
              <div className='-translate-x-full absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-500 group-hover:translate-x-full' />
            </button>
            <button className='group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 font-medium text-sm text-text-secondary transition-all hover:border-white/20 hover:bg-white/10 hover:text-white'>
              <span className='relative z-10'>Your Templates</span>
            </button>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='relative max-w-2xl'
        >
          <div
            className={`-inset-0.5 absolute rounded-2xl bg-gradient-to-r from-accent-primary/50 to-blue-500/50 opacity-0 blur-md transition-opacity duration-300 ${isSearchFocused ? 'opacity-50' : ''}`}
          />
          <div className='relative'>
            <Search
              className={`-translate-y-1/2 absolute top-1/2 left-4 h-5 w-5 transition-colors duration-300 ${isSearchFocused ? 'text-accent-primary' : 'text-text-muted'}`}
            />
            <input
              type='text'
              placeholder='Search for templates, agents, or tags...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className='w-full rounded-2xl border border-white/10 bg-[#0A0C10]/80 py-4 pr-4 pl-12 text-lg text-text-primary placeholder-text-muted backdrop-blur-xl transition-all focus:border-accent-primary/50 focus:bg-[#0A0C10] focus:outline-none focus:ring-0'
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className='-translate-y-1/2 absolute top-1/2 right-4 rounded-md bg-white/5 px-2 py-1 font-medium text-text-muted text-xs hover:text-text-primary'
              >
                ESC
              </button>
            )}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className='scrollbar-hide flex gap-2 overflow-x-auto pb-2'
        >
          {['All', 'Productivity', 'Development', 'Marketing', 'Data', 'Social'].map((cat, i) => (
            <button
              key={cat}
              className={`rounded-full border px-4 py-1.5 font-medium text-sm transition-all ${i === 0 ? 'border-accent-primary/20 bg-accent-primary/10 text-accent-primary' : 'border-white/5 bg-transparent text-text-secondary hover:border-white/20 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </motion.div>
        <div className='perspective-1000 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          <AnimatePresence mode='popLayout'>
            {isLoading
              ? // Loading state
                Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className='flex h-64 animate-pulse flex-col rounded-xl border border-white/5 bg-bg-card/40 p-5'
                  >
                    <div className='mb-4 h-12 w-12 rounded-xl bg-white/5' />
                    <div className='mb-2 h-4 w-3/4 rounded bg-white/5' />
                    <div className='mb-1 h-3 w-full rounded bg-white/5' />
                    <div className='mb-4 h-3 w-full rounded bg-white/5' />
                    <div className='mt-auto h-8 rounded bg-white/5' />
                  </div>
                ))
              : filteredTemplates.length > 0
                ? filteredTemplates.map((template, index) => (
                    <TemplateCard key={template.id} template={template} index={index} />
                  ))
                : null}
          </AnimatePresence>
        </div>

        {filteredTemplates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='flex flex-col items-center justify-center py-20 text-center'
          >
            <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5'>
              <Search className='h-8 w-8 text-text-muted' />
            </div>
            <h3 className='mb-2 font-bold text-text-primary text-xl'>No templates found</h3>
            <p className='text-text-secondary'>Try adjusting your search query</p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}
