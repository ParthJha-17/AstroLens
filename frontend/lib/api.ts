const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

export type ApodItem = {
  date: string
  title: string
  explanation: string
  url: string
  hdurl?: string
  media_type: 'image' | 'video'
}

export type Briefing = {
  apod_date: string
  mission_context: string
  scientific_significance: string
  key_facts: string[]
  sources: { type: 'web' | 'reddit' | 'youtube'; title: string; url: string }[]
  generated_at: string
}

export type SearchResult = Pick<ApodItem, 'date' | 'title' | 'url' | 'media_type'> & { rank: number }

export type NasaImage = {
  nasa_id: string
  title: string
  thumb_url: string | null
  date_created: string | null
  media_type: string
  description?: string
  keywords?: string[]
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export async function getApodToday(): Promise<ApodItem> {
  return apiFetch<ApodItem>('/apod/today', { next: { revalidate: 60 } } as RequestInit)
}

export async function getApodFeed(start: string, end: string): Promise<ApodItem[]> {
  return apiFetch<ApodItem[]>(
    `/apod/feed?start=${start}&end=${end}`,
    { next: { revalidate: 60 } } as RequestInit,
  )
}

export async function getApodByDate(date: string): Promise<ApodItem> {
  const items = await getApodFeed(date, date)
  if (!items.length) throw new Error(`No APOD for date: ${date}`)
  return items[0]
}

export async function searchApod(q: string, limit = 20): Promise<SearchResult[]> {
  return apiFetch<SearchResult[]>(`/apod/search?q=${encodeURIComponent(q)}&limit=${limit}`)
}

export async function searchImages(q: string, page = 1, limit = 20): Promise<NasaImage[]> {
  return apiFetch<NasaImage[]>(
    `/images/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`,
  )
}

export async function getNasaImage(id: string): Promise<NasaImage> {
  return apiFetch<NasaImage>(`/images/${encodeURIComponent(id)}`)
}

export async function getBriefing(date: string): Promise<Briefing | null> {
  const res = await fetch(`${BASE}/briefings/${date}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`API error ${res.status}: /briefings/${date}`)
  return res.json() as Promise<Briefing>
}

export async function generateBriefing(date: string): Promise<Briefing> {
  return apiFetch<Briefing>('/briefings/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apod_date: date }),
  })
}
