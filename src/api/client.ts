import { useQuery } from '@tanstack/react-query'
import type { BloggersResponse } from '../types'
import { sampleResponse } from '../mock/sample'

const useMock = () => new URLSearchParams(location.search).has('mock')

async function fetchBloggers(refresh: boolean): Promise<BloggersResponse> {
  if (useMock()) return sampleResponse
  const res = await fetch(`/api/bloggers${refresh ? '?refresh=1' : ''}`)
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
  return body
}

export function useBloggers() {
  return useQuery({ queryKey: ['bloggers'], queryFn: () => fetchBloggers(false) })
}

export { fetchBloggers }
