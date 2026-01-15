'use client'

import { type KeyboardEvent, useCallback, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Input } from '../input/input'
import { cn } from '@/lib/core/utils/cn'

export interface TagItem {
    value: string
    isValid: boolean
}

export interface FileInputOptions {
    enabled: boolean
    accept: string
    extractValues: (text: string) => string[]
}

interface TagInputProps {
    items: TagItem[]
    onAdd: (value: string) => boolean
    onRemove: (value: string, index: number, isValid: boolean) => void
    placeholder?: string
    placeholderWithTags?: string
    disabled?: boolean
    fileInputOptions?: FileInputOptions
    className?: string
}

export function TagInput({
    items = [],
    onAdd,
    onRemove,
    placeholder = 'Type and press Enter',
    placeholderWithTags,
    disabled = false,
    fileInputOptions,
    className,
}: TagInputProps) {
    const [inputValue, setInputValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const addTag = useCallback(
        (tag: string) => {
            const trimmedTag = tag.trim()
            if (trimmedTag) {
                const success = onAdd(trimmedTag)
                if (success) {
                    setInputValue('')
                }
            }
        },
        [onAdd]
    )

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault()
            addTag(inputValue)
        } else if (e.key === 'Backspace' && !inputValue && items.length > 0) {
            const lastItem = items[items.length - 1]
            onRemove(lastItem.value, items.length - 1, lastItem.isValid)
        }
    }

    const handleBlur = () => {
        if (inputValue.trim()) {
            addTag(inputValue)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !fileInputOptions) return

        try {
            const text = await file.text()
            const values = fileInputOptions.extractValues(text)

            values.forEach((value) => {
                onAdd(value)
            })

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } catch (error) {
            console.error('Failed to read file:', error)
        }
    }

    const effectivePlaceholder = items.length > 0 && placeholderWithTags
        ? placeholderWithTags
        : placeholder

    return (
        <div
            className={cn(
                'scrollbar-hide flex max-h-32 min-h-9 flex-wrap items-center gap-x-[8px] gap-y-[4px] overflow-y-auto rounded-[4px] border border-[var(--surface-11)] bg-[var(--surface-6)] px-[6px] py-[4px] focus-within:outline-none dark:bg-[var(--surface-9)]',
                disabled && 'cursor-not-allowed opacity-50',
                className
            )}
            onClick={() => !disabled && inputRef.current?.focus()}
        >
            {items.map((item, index) => (
                <Tag
                    key={`${item.value}-${index}`}
                    value={item.value}
                    isValid={item.isValid}
                    onRemove={() => onRemove(item.value, index, item.isValid)}
                    disabled={disabled}
                />
            ))}
            {!disabled && (
                <>
                    <Input
                        ref={inputRef}
                        type='text'
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        placeholder={effectivePlaceholder}
                        disabled={disabled}
                        className={cn(
                            'h-6 min-w-[180px] flex-1 border-none bg-transparent p-0 font-medium font-sans text-sm placeholder:text-[var(--text-muted)] focus-visible:ring-0 focus-visible:ring-offset-0',
                            items.length > 0 ? 'pl-[4px]' : 'pl-[4px]'
                        )}
                    />
                    {fileInputOptions?.enabled && (
                        <>
                            <button
                                type='button'
                                onClick={(e) => {
                                    e.stopPropagation()
                                    fileInputRef.current?.click()
                                }}
                                className='flex-shrink-0 rounded-[4px] p-[4px] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-5)] hover:text-[var(--text-primary)] focus:outline-none'
                                aria-label='Upload file'
                                disabled={disabled}
                            >
                                <Upload className='h-[14px] w-[14px]' />
                            </button>
                            <input
                                ref={fileInputRef}
                                type='file'
                                accept={fileInputOptions.accept}
                                onChange={handleFileUpload}
                                className='hidden'
                                disabled={disabled}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    )
}

interface TagProps {
    value: string
    isValid: boolean
    onRemove: () => void
    disabled?: boolean
}

function Tag({ value, isValid, onRemove, disabled }: TagProps) {
    return (
        <div
            className={cn(
                'flex w-auto items-center gap-[4px] rounded-[4px] border px-[6px] py-[2px] text-[12px]',
                isValid
                    ? 'border-[var(--surface-11)] bg-[var(--surface-5)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    : 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'
            )}
        >
            <span className='max-w-[200px] truncate'>{value}</span>
            {!disabled && (
                <button
                    type='button'
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemove()
                    }}
                    className='flex-shrink-0 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] focus:outline-none'
                    aria-label={`Remove ${value}`}
                >
                    <X className='h-[12px] w-[12px] translate-y-[0.2px]' />
                </button>
            )}
        </div>
    )
}
