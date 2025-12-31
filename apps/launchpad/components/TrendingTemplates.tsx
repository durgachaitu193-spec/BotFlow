'use client'

import { Flame } from 'lucide-react'
import Link from 'next/link'
import { templates } from '@/lib/templatesData'
import TemplateCard from './TemplateCard'

export default function TrendingTemplates() {
  const trendingTemplates = templates.slice(0, 3)

  return (
    <div className='mb-4 rounded-2xl border border-white/5 bg-bg-card p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Flame className='h-5 w-5 text-accent-primary' />
          <h3 className='font-bold text-text-primary text-xl'>Trending Templates</h3>
        </div>
        <Link
          href='/templates'
          className='text-sm text-text-secondary transition-colors hover:text-accent-primary'
        >
          View All
        </Link>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        {trendingTemplates.map((template, index) => (
          <div key={template.id} className='h-[280px]'>
            <TemplateCard template={template} index={index} />
          </div>
        ))}
      </div>
    </div>
  )
}
