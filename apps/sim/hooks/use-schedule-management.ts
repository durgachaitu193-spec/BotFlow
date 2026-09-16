import { useCallback, useState } from 'react'
import { useParams } from 'next/navigation'
import { createLogger } from '@botflow/logger'
import { useSubBlockStore } from '@/stores/workflows/subblock/store'

const logger = createLogger('useScheduleManagement')

interface UseScheduleManagementProps {
    blockId: string
    isPreview?: boolean
}

export function useScheduleManagement({ blockId, isPreview }: UseScheduleManagementProps) {
    const params = useParams()
    const workflowId = params.workflowId as string
    const [isSaving, setIsSaving] = useState(false)

    const scheduleId = useSubBlockStore(
        useCallback((state) => state.getValue(blockId, 'scheduleId') as string | null, [blockId])
    )

    const saveConfig = async () => {
        if (isPreview) return { success: false }

        setIsSaving(true)
        try {
            const store = useSubBlockStore.getState()
            const getValue = (key: string) => store.getValue(blockId, key)

            const payload = {
                workflowId,
                blockId,
                scheduleType: getValue('scheduleType'),
                minutesInterval: getValue('minutesInterval'),
                hourlyMinute: getValue('hourlyMinute'),
                dailyTime: getValue('dailyTime'),
                weeklyDay: getValue('weeklyDay'),
                weeklyDayTime: getValue('weeklyDayTime'),
                monthlyDay: getValue('monthlyDay'),
                monthlyTime: getValue('monthlyTime'),
                cronExpression: getValue('cronExpression'),
                timezone: getValue('timezone'),
                scheduleId
            }

            let url = '/api/schedules'
            let method = 'POST'

            if (scheduleId) {
                url = `/api/schedules/${scheduleId}`
                method = 'PUT'
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to save schedule')
            }

            const data = await response.json()

            if (!scheduleId && data.schedule?.id) {
                useSubBlockStore.getState().setValue(blockId, 'scheduleId', data.schedule.id)
            }

            return {
                success: true,
                nextRunAt: data.schedule?.nextRunAt,
                cronExpression: data.schedule?.cronExpression
            }

        } catch (error) {
            logger.error('Error saving schedule', { error })
            throw error
        } finally {
            setIsSaving(false)
        }
    }

    const deleteConfig = async () => {
        if (isPreview || !scheduleId) return false
        setIsSaving(true)
        try {
            const response = await fetch(`/api/schedules/${scheduleId}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete')
            return true
        } catch (error) {
            logger.error('Error deleting', error)
            return false
        } finally {
            setIsSaving(false)
        }
    }

    return { scheduleId, saveConfig, deleteConfig, isSaving }
}
