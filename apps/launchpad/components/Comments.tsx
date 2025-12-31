'use client'

import { useEffect, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { formatDistanceToNow } from 'date-fns'
import { Heart, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { getComments, postComment } from '@/actions/comments'

interface Comment {
  id: string
  tokenId: string
  address: string
  message: string
  img: string | null
  createdAt: Date
}

interface CommentsProps {
  agentId: string
}

export default function Comments({ agentId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { authenticated, login } = usePrivy()
  const { wallets } = useWallets()

  const fetchComments = async () => {
    const data = await getComments(agentId)
    setComments(data)
  }

  useEffect(() => {
    fetchComments()
    // Poll for new comments every 10 seconds
    const interval = setInterval(fetchComments, 10000)
    return () => clearInterval(interval)
  }, [agentId])

  const handlePostComment = async () => {
    if (!authenticated) {
      login()
      return
    }

    if (!newComment.trim()) return

    setIsLoading(true)
    try {
      const address = wallets[0]?.address
      if (!address) throw new Error('No wallet address found')

      const result = await postComment(agentId, newComment, address)
      if (result.success) {
        setNewComment('')
        fetchComments()
        toast.success('Comment posted!')
      } else {
        toast.error('Failed to post comment')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error('Error posting comment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className='flex h-screen flex-col rounded-xl border border-white/5 bg-bg-card'
      style={{
        background:
          'linear-gradient(360deg, rgba(0, 255, 243, 0.31) 0%, rgba(0, 0, 0, 0.31) 55.98%)',
        border: '1px solid rgba(0, 249, 207, 0.3)',
        backdropFilter: 'blur(92px)',
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div className='flex items-center justify-between border-white/5 border-b p-4'>
        <div className='flex gap-6'>
          <button className='border-accent-primary border-b-2 pb-4 font-bold text-sm text-white'>
            Comments
          </button>
          <button className='pb-4 font-medium text-sm text-text-secondary hover:text-white'>
            Trades
          </button>
        </div>
      </div>

      <div className='max-h-[600px] flex-1 space-y-4 overflow-y-auto p-4'>
        <div className='relative'>
          <input
            type='text'
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
            placeholder='Add a comment...'
            className='w-full rounded-lg border border-white/10 bg-bg-surface px-4 py-3 pr-12 text-sm text-white placeholder:text-text-muted focus:border-accent-primary focus:outline-none'
            disabled={isLoading}
          />
          <button
            onClick={handlePostComment}
            disabled={isLoading || !newComment.trim()}
            className='-translate-y-1/2 absolute top-1/2 right-2 rounded-md bg-white/5 p-1.5 text-text-secondary hover:bg-white/10 hover:text-white disabled:opacity-50'
          >
            {isLoading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Send className='h-4 w-4' />
            )}
          </button>
        </div>

        <div className='space-y-4'>
          {comments.length === 0 ? (
            <div className='py-4 text-center text-sm text-text-muted'>
              No comments yet. Be the first!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className='flex gap-3'>
                <div className='h-8 w-8 flex-shrink-0 overflow-hidden rounded bg-bg-surface'>
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.address}`}
                    alt={comment.address}
                    className='h-full w-full object-cover'
                  />
                </div>
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-bold text-white text-xs'>
                      {comment.address.slice(0, 6)}...
                      {comment.address.slice(-4)}
                    </span>
                    <span className='text-[10px] text-text-muted'>
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className='break-all text-sm text-text-secondary'>{comment.message}</p>
                  <button className='mt-1 text-text-muted text-xs hover:text-white'>Reply</button>
                </div>
                <div className='flex flex-col items-center gap-1'>
                  <Heart className='h-3 w-3 cursor-pointer text-text-muted hover:text-status-error' />
                  <span className='text-[10px] text-text-muted'>0</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
