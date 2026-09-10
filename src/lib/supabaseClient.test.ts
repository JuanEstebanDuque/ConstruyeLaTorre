import { describe, it, expect } from 'vitest'
import { createSupabaseClient } from './supabaseClient'

describe('createSupabaseClient', () => {
  it('builds a client pointed at the given URL', () => {
    const client = createSupabaseClient('https://example.supabase.co', 'test-anon-key') as unknown as {
      supabaseUrl: string
      supabaseKey: string
    }
    expect(client.supabaseUrl).toBe('https://example.supabase.co')
    expect(client.supabaseKey).toBe('test-anon-key')
  })

  it('throws if the URL is empty', () => {
    expect(() => createSupabaseClient('', 'test-anon-key')).toThrow(
      'VITE_SUPABASE_URL is required'
    )
  })

  it('throws if the anon key is empty', () => {
    expect(() => createSupabaseClient('https://example.supabase.co', '')).toThrow(
      'VITE_SUPABASE_ANON_KEY is required'
    )
  })
})
