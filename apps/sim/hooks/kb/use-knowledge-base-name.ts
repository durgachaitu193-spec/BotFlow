import { useKnowledgeBase } from './use-knowledge'

export function useKnowledgeBaseName(id: string | undefined | null) {
    const { knowledgeBase } = useKnowledgeBase(id || '')
    return knowledgeBase?.name
}
