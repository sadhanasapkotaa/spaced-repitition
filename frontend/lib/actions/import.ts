'use server'

import { createClient } from '@/utils/supabase/server'
import { getAppUser } from '@/utils/supabase/auth'
import { revalidatePath } from 'next/cache'

export interface ImportResult {
  total: number
  successCount: number
  errorCount: number
  errors: { line: number; reason: string }[]
}

/**
 * Parse a CSV string with support for quoted fields and escaped quotes.
 * Lines beginning with # are treated as comments and ignored.
 */
function parseCsv(text: string): { row: string[]; line: number }[] {
  const out: { row: string[]; line: number }[] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let lineNum = 1
  let lineStart = 1
  let rowHasContent = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        if (ch === '\n') lineNum++
        field += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
      continue
    }

    if (ch === ',') {
      row.push(field)
      field = ''
      rowHasContent = true
      continue
    }

    if (ch === '\r') continue

    if (ch === '\n') {
      row.push(field)
      const isComment = row[0]?.trimStart().startsWith('#')
      const isBlank = !rowHasContent && field === ''
      if (!isComment && !isBlank) {
        out.push({ row, line: lineStart })
      }
      row = []
      field = ''
      rowHasContent = false
      lineNum++
      lineStart = lineNum
      continue
    }

    field += ch
  }

  // Trailing field
  if (field !== '' || rowHasContent) {
    row.push(field)
    const isComment = row[0]?.trimStart().startsWith('#')
    if (!isComment) {
      out.push({ row, line: lineStart })
    }
  }

  return out
}

export async function importCards(
  folderId: string | null,
  csvText: string,
): Promise<ImportResult> {
  const appUser = await getAppUser()
  if (!appUser) throw new Error('Unauthorized')

  const parsed = parseCsv(csvText)
  if (parsed.length === 0) {
    return { total: 0, successCount: 0, errorCount: 0, errors: [] }
  }

  const errors: { line: number; reason: string }[] = []
  const rowsToInsert: { user_id: number; folder_id: string | null; front: string; back: string; hint: string | null }[] = []

  for (const { row, line } of parsed) {
    const front = (row[0] ?? '').trim()
    const back  = (row[1] ?? '').trim()
    const hint  = (row[2] ?? '').trim()

    if (!front || !back) {
      errors.push({ line, reason: 'Missing front or back' })
      continue
    }
    if (front.length > 2000 || back.length > 2000) {
      errors.push({ line, reason: 'Field too long (>2000 chars)' })
      continue
    }

    rowsToInsert.push({
      user_id: appUser.id,
      folder_id: folderId,
      front,
      back,
      hint: hint || null,
    })
  }

  const supabase = await createClient()
  let successCount = 0

  if (rowsToInsert.length > 0) {
    const { error, count } = await supabase
      .from('cards')
      .insert(rowsToInsert, { count: 'exact' })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
    successCount = count ?? rowsToInsert.length
  }

  // Log the import
  await supabase
    .from('import_logs')
    .insert({
      user_id: appUser.id,
      folder_id: folderId,
      total_cards: parsed.length,
      success_count: successCount,
      error_count: errors.length,
    })

  revalidatePath('/library')
  revalidatePath('/library/orphaned')
  if (folderId) revalidatePath(`/library/${folderId}`)

  return {
    total: parsed.length,
    successCount,
    errorCount: errors.length,
    errors: errors.slice(0, 20), // cap to keep response manageable
  }
}
