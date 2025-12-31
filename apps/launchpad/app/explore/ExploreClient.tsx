'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock, DollarSign, Filter, Sparkles, TrendingUp } from 'lucide-react'
import AgentCard from '@/components/AgentCard'
import DashboardLayout from '@/components/DashboardLayout'

const categories = [
  { id: 'featured', label: 'Featured', icon: Sparkles },
  { id: 'live', label: 'Live now', icon: Clock },
  { id: 'valuable', label: 'Most valuable', icon: DollarSign },
  { id: 'new', label: 'New coins', icon: TrendingUp },
  { id: 'oldest', label: 'Oldest coins', icon: Clock },
]

import type { Agent } from '@/lib/agentsData'

interface ExploreClientProps {
  initialAgents: Agent[]
}

export default function ExploreClient({ initialAgents }: ExploreClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('featured')

  const [isFilterOpen, setIsFilterOpen] = useState(false)

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className='mb-6'>
        <h1 className='mb-2 font-bold text-3xl text-text-primary'>Explore</h1>
        <p className='text-text-secondary'>Discover trending agents and new opportunities</p>
      </motion.div>

      {/* Category Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='scrollbar-hide mb-6 flex items-center gap-3 overflow-x-auto pb-2'
      >
        {categories.map((category, index) => {
          const Icon = category.icon
          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 font-medium text-sm transition-all ${
                selectedCategory === category.id
                  ? 'bg-accent-primary text-bg-deep shadow-glow-primary'
                  : 'border border-white/5 bg-bg-card text-text-secondary hover:bg-bg-surface hover:text-text-primary'
              }`}
            >
              <Icon className='h-4 w-4' />
              {category.label}
            </motion.button>
          )
        })}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className='flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-bg-card px-4 py-2 font-medium text-sm text-text-secondary transition-all hover:bg-bg-surface hover:text-text-primary'
        >
          <Filter className='h-4 w-4' />
          More
        </motion.button>
      </motion.div>

      {/* Agents Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      >
        <AnimatePresence mode='popLayout'>
          {initialAgents.map((agent, index) => (
            <AgentCard key={agent.id} agent={agent} index={index} />
          ))}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  )
}
