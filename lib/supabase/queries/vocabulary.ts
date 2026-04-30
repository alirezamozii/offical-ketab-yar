import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type VocabularyInsert = Database['public']['Tables']['vocabulary']['Insert']
type VocabularyUpdate = Database['public']['Tables']['vocabulary']['Update']

// Get user's vocabulary words
export async function getUserVocabulary(userId?: string) {
  const supabase = createClient()

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    userId = user.id
  }

  const { data, error } = await supabase
    .from('vocabulary')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Check vocabulary limit (Agent 3: Freemium psychology)
async function checkVocabularyLimit(userId?: string) {
  const supabase = createClient()

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    userId = user.id
  }

  // Get user's subscription tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single()

  const isPremium = profile?.subscription_tier && profile.subscription_tier !== 'free'

  // Get current word count
  const { count, error } = await supabase
    .from('vocabulary')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) throw error

  const FREE_LIMIT = 20 // Agent 3: Strategic limit for conversion
  const currentCount = count || 0

  return {
    isPremium,
    currentCount,
    limit: isPremium ? Infinity : FREE_LIMIT,
    canAddMore: isPremium || currentCount < FREE_LIMIT,
    remaining: isPremium ? Infinity : Math.max(0, FREE_LIMIT - currentCount),
  }
}

// Add word to vocabulary (with limit check)
export async function addVocabularyWord(word: Omit<VocabularyInsert, 'user_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  // Agent 3: Check limit before adding
  const limitCheck = await checkVocabularyLimit(user.id)

  if (!limitCheck.canAddMore) {
    throw new Error('VOCABULARY_LIMIT_REACHED')
  }

  const { data, error } = await supabase
    .from('vocabulary')
    .insert({
      ...word,
      user_id: user.id,
    } as any)
    .select()
    .single()

  if (error) throw error
  return { data, limitCheck }
}

// Update vocabulary word
async function updateVocabularyWord(id: string, updates: VocabularyUpdate) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vocabulary')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete vocabulary word
export async function deleteVocabularyWord(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('vocabulary')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get words for review (spaced repetition)
async function getWordsForReview(userId?: string, limit: number = 20) {
  const supabase = createClient()

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    userId = user.id
  }

  const { data, error } = await supabase
    .from('vocabulary')
    .select('*')
    .eq('user_id', userId)
    .lte('next_review_at', new Date().toISOString())
    .order('next_review_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data
}

// Update word mastery after review
async function updateWordMastery(
  id: string,
  correct: boolean
) {
  const supabase = createClient()

  // Get current word data
  const { data: word, error: fetchError } = await supabase
    .from('vocabulary')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  // Calculate new mastery level and next review date
  const currentLevel = word.mastery_level || 0
  const newLevel = correct
    ? Math.min(currentLevel + 1, 5)
    : Math.max(currentLevel - 1, 0)

  // Spaced repetition intervals (in days)
  const intervals = [1, 3, 7, 14, 30, 60]
  const daysUntilNextReview = intervals[newLevel] || 60

  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + daysUntilNextReview)

  const { data, error } = await supabase
    .from('vocabulary')
    .update({
      mastery_level: newLevel,
      next_review_at: nextReviewDate.toISOString( as any),
      last_reviewed_at: new Date().toISOString(),
      review_count: (word.review_count || 0) + 1,
      correct_count: correct ? (word.correct_count || 0) + 1 : (word.correct_count || 0),
      incorrect_count: !correct ? (word.incorrect_count || 0) + 1 : (word.incorrect_count || 0),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get vocabulary statistics
async function getVocabularyStats(userId?: string) {
  const supabase = createClient()

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    userId = user.id
  }

  const { data, error } = await supabase
    .rpc('get_vocabulary_stats', { user_id_param: userId })

  if (error) throw error
  return data
}

// Search vocabulary
async function searchVocabulary(query: string, userId?: string) {
  const supabase = createClient()

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    userId = user.id
  }

  const { data, error } = await supabase
    .from('vocabulary')
    .select('*')
    .eq('user_id', userId)
    .or(`word.ilike.%${query}%,definition.ilike.%${query}%`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get words by book
async function getVocabularyByBook(bookId: string, userId?: string) {
  const supabase = createClient()

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    userId = user.id
  }

  const { data, error } = await supabase
    .from('vocabulary')
    .select('*')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
