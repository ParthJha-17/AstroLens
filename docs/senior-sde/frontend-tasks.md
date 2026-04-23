# Senior SDE — Frontend Task List

**Last updated:** 2026-04-23
**Source of truth for Frontend Dev.** Read `tech-design.md` first, then implement tasks in priority order.

---

## Start-of-session checklist

1. Read `tech-design.md` — understand Server vs Client component split before writing any component
2. Backend base URL: `http://localhost:8000/api/v1` (or `NEXT_PUBLIC_API_URL` env var)
3. Write progress to `docs/frontend/impl-log.md`
4. Post blockers to `docs/frontend/questions.md`
5. Backend must be running locally for any data to appear — ask Backend Dev for status

---

## FE-01 — Next.js scaffold

**Priority:** P0 | **Milestone:** M3

**What to build:**
- Initialize Next.js 14+ project with App Router and TypeScript in `frontend/`
- Install and configure Tailwind CSS v3
- Create `lib/api.ts` with all typed fetch wrappers (full interface in tech-design Section 5)
- Apply global dark theme in `app/layout.tsx`
- Create `tailwind.config.ts` with `space` color extensions (tech-design Section 5)
- Create `frontend/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`

**`app/layout.tsx`:**
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-space-950">
      <body className="min-h-screen bg-space-950 text-slate-100 font-sans antialiased">
        <nav>/* AstroLens logo + nav links */</nav>
        {children}
      </body>
    </html>
  )
}
```

Nav links: `Home (/)`, `Search (/search)`, `Library (/library)`

**`lib/api.ts`** must export all functions listed in tech-design. All functions should:
- Use `fetch` with `{ next: { revalidate: 60 } }` for Server Component calls (APOD data)
- No cache headers for Client Component calls (briefings, search)
- Throw an `Error` on non-OK responses (don't return null for errors except `getBriefing` which returns `null` on 404)

**Acceptance criteria:**
- `npm run dev` starts on port 3000 without errors
- `localhost:3000` renders a dark-background page with nav
- TypeScript compiles cleanly (`npm run build` succeeds)

---

## FE-02 — Homepage: TodayHero

**Priority:** P0 | **Milestone:** M3

**What to build:**

`app/page.tsx` (Server Component):
```tsx
import { getApodToday } from '@/lib/api'
import TodayHero from '@/components/TodayHero'
import RecentFeed from '@/components/RecentFeed'

export default async function HomePage() {
  const apod = await getApodToday()
  return (
    <main>
      <TodayHero apod={apod} />
      <RecentFeed />
    </main>
  )
}
```

`components/TodayHero.tsx` (Server Component):
- Full-width hero section
- If `media_type === 'image'`: show `<Image>` (Next.js) filling width, max height 600px, `object-cover`
- If `media_type === 'video'`: show `<iframe>` embed (YouTube URL)
- Overlay: date badge (top-left), title (bottom-left in large text), short excerpt from explanation (2 sentences max)
- CTA button: "Read Full Briefing →" → links to `/apod/{date}`
- Design: dark gradient overlay on image so text is legible

**Skeleton placeholder** (use while image loads):
```tsx
<div className="w-full h-[600px] bg-space-800 animate-pulse rounded-lg" />
```

**Acceptance criteria:**
- Homepage shows today's APOD image or video embed
- Title and date are visible overlaid on the image
- "Read Full Briefing" button navigates to `/apod/2026-04-23`
- Video APODs render an iframe, not a broken `<img>` tag

---

## FE-03 — Homepage: RecentFeed

**Priority:** P1 | **Milestone:** M3

**What to build:**

`components/RecentFeed.tsx` (Server Component):
- Fetch last 7 days of APOD: `getApodFeed(sevenDaysAgo, yesterday)`
- Render as a horizontal scroll row on mobile, 7-column grid on desktop
- Each card: thumbnail image, date, title (truncated to 2 lines)
- Cards link to `/apod/{date}`
- Skip cards where `media_type === 'video'` (show placeholder with video icon instead of broken image)

**Date calculation:** Do this server-side in the component using `new Date()`. Format as `YYYY-MM-DD`.

**Card design:**
```tsx
<a href={`/apod/${item.date}`}>
  <div className="bg-space-800 rounded-lg overflow-hidden hover:ring-1 hover:ring-blue-400 transition">
    <Image src={item.url} alt={item.title} width={200} height={150} className="object-cover w-full h-32" />
    <div className="p-2">
      <p className="text-slate-400 text-xs">{item.date}</p>
      <p className="text-slate-100 text-sm line-clamp-2">{item.title}</p>
    </div>
  </div>
</a>
```

**Acceptance criteria:**
- 7 image cards visible below TodayHero
- Clicking any card navigates to its APOD detail page
- Video APOD entries show a play icon placeholder instead of broken image
- Feed renders correctly at 320px width (horizontal scroll)

---

## FE-04 — APOD Detail page

**Priority:** P0 | **Milestone:** M3

**What to build:**

`app/apod/[date]/page.tsx` (Server Component):
```tsx
import { getApodByDate, getBriefing } from '@/lib/api'
import ImageViewer from '@/components/ImageViewer'
import BriefingPanel from '@/components/BriefingPanel'

export default async function ApodDetailPage({ params }: { params: { date: string } }) {
  const [apod, existingBriefing] = await Promise.all([
    getApodToday(),  // or a getApodByDate(date) call — add this to api.ts
    getBriefing(params.date)
  ])
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <ImageViewer apod={apod} />
      <BriefingPanel date={params.date} initialBriefing={existingBriefing} />
    </main>
  )
}
```

**Note:** `api.ts` needs a `getApodByDate(date: string): Promise<ApodItem>` function — add it. It calls `GET /api/v1/apod/feed?start={date}&end={date}` and returns the first item.

`components/ImageViewer.tsx` (Server Component):
- Large image display (100% width, max-height 70vh, object-contain)
- Below image: title (h1), date, full `explanation` text
- HD image link: "View HD →" if `hdurl` exists
- Video: `<iframe>` embed

**Acceptance criteria:**
- `/apod/2026-04-23` renders the image and full explanation text
- Page title (`<title>`) is the APOD title
- Invalid date (no APOD exists) shows a 404-style message (handle the error from API)

---

## FE-05 — BriefingPanel

**Priority:** P1 | **Milestone:** M3

**What to build:**

`components/BriefingPanel.tsx` (`'use client'`):

Implement the state machine from tech-design Section 5:

```
IDLE → LOADING (on mount, GET /briefings/date)
LOADING → READY (briefing found)
LOADING → PROMPT (404, no briefing yet)
PROMPT → GENERATING (user clicks button, POST /briefings/generate)
GENERATING → READY (response received)
GENERATING → ERROR (30s timeout or fetch error)
```

**Props:**
```tsx
interface BriefingPanelProps {
  date: string
  initialBriefing: Briefing | null
}
```

If `initialBriefing` is non-null, start in READY state immediately (skip the GET call).

**READY state renders:**
```tsx
<section className="mt-8">
  <h2 className="text-blue-400 text-xl font-semibold mb-4">AI Briefing</h2>
  <div className="bg-space-800 rounded-lg p-6 space-y-6">
    <div>
      <h3 className="text-purple-400 font-medium mb-2">Mission Context</h3>
      <p className="text-slate-300">{briefing.mission_context}</p>
    </div>
    <div>
      <h3 className="text-purple-400 font-medium mb-2">Scientific Significance</h3>
      <p className="text-slate-300">{briefing.scientific_significance}</p>
    </div>
    <div>
      <h3 className="text-purple-400 font-medium mb-2">Key Facts</h3>
      <ul className="list-disc list-inside space-y-1 text-slate-300">
        {briefing.key_facts.map((f, i) => <li key={i}>{f}</li>)}
      </ul>
    </div>
    <SourceList sources={briefing.sources} />
  </div>
</section>
```

**GENERATING state:** Show spinner + `"Searching the web, Reddit, and YouTube..."` text. Spinner is a CSS animate-spin circle.

**PROMPT state:** Show card with: `"No briefing yet for this image."` + `"Generate AI Briefing"` button (blue, primary style).

**ERROR state:** Show `"Briefing generation failed. Please try again."` + retry button (re-runs GENERATING flow).

**30s timeout:** Use `AbortController` with `signal` passed to fetch, or set a `setTimeout` that sets state to ERROR.

**Acceptance criteria:**
- If briefing exists: immediately shows briefing on page load (no spinner flash)
- If no briefing: shows "Generate AI Briefing" button
- Button triggers POST; spinner appears during generation
- Briefing renders correctly after generation
- After 30 seconds without response, shows error state

---

## FE-06 — SourceList

**Priority:** P1 | **Milestone:** M3

**What to build:**

`components/SourceList.tsx` (Server Component, or used inside BriefingPanel client context):

```tsx
const icons = { web: '🌐', reddit: '🔴', youtube: '▶️' }

export default function SourceList({ sources }: { sources: Source[] }) {
  return (
    <div>
      <h3 className="text-purple-400 font-medium mb-3">Sources</h3>
      <div className="flex flex-wrap gap-2">
        {sources.map((s, i) => (
          <a
            key={i}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-full text-sm text-slate-200 transition"
          >
            <span>{icons[s.type]}</span>
            <span className="max-w-[200px] truncate">{s.title}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
```

Since `BriefingPanel` is a Client Component, `SourceList` will run in client context — that's fine.

**Acceptance criteria:**
- Sources render as rounded pills
- Web / Reddit / YouTube each have distinct icons
- Clicking a pill opens the source URL in a new tab
- Long titles are truncated with ellipsis

---

## FE-07 — Search page: SearchBar

**Priority:** P1 | **Milestone:** M4

**What to build:**

`app/search/page.tsx` (Server shell — Client components handle interaction):
```tsx
import SearchBar from '@/components/SearchBar'
import SearchResults from '@/components/SearchResults'

export default function SearchPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Search APOD Archive</h1>
      <SearchBar />
      <SearchResults />
    </main>
  )
}
```

`components/SearchBar.tsx` (`'use client'`):
- Controlled input with 300ms debounce (use `setTimeout`/`clearTimeout` pattern — no library)
- On debounced change: update URL search params (`?q=...`) using `useRouter` + `useSearchParams`
- Input styling: full-width, dark background, blue focus ring

**URL-based state:** Query lives in `?q=` param so results are shareable. `SearchResults` reads from `useSearchParams()`.

```tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      router.replace(`/search?q=${encodeURIComponent(e.target.value)}`)
    }, 300)
  }, [router])

  return (
    <input
      defaultValue={q}
      onChange={handleChange}
      placeholder="Search for images... (e.g. 'black hole', 'Hubble', 'Mars')"
      className="w-full px-4 py-3 bg-space-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  )
}
```

**Acceptance criteria:**
- Typing "hubble" shows results after ~300ms pause
- URL updates to `/search?q=hubble`
- Clearing input clears results
- Loading state shown during fetch

---

## FE-08 — SearchResults

**Priority:** P1 | **Milestone:** M4

**What to build:**

`components/SearchResults.tsx` (`'use client'`):
- Read `q` from `useSearchParams()`
- When `q` changes: call `searchApod(q)` from `lib/api.ts`
- Show loading skeleton while fetching
- Render results as a list (not grid — text-heavy results benefit from list layout)

**Result item:**
```tsx
<a href={`/apod/${result.date}`} className="flex gap-4 p-4 bg-space-800 rounded-lg hover:bg-slate-700 transition">
  <Image src={result.url} alt={result.title} width={80} height={60} className="object-cover rounded flex-shrink-0" />
  <div>
    <p className="text-slate-400 text-xs mb-1">{result.date}</p>
    <p className="text-slate-100 font-medium">{result.title}</p>
  </div>
</a>
```

**Empty state:** `"No results for '{q}'. Try 'Hubble', 'Mars', or 'black hole'."` (only show after fetch, not on initial load)

**Video entries:** Show a play icon thumbnail placeholder instead of broken img

**Acceptance criteria:**
- Results appear within 500ms of query update
- Each result links to the correct APOD detail page
- Empty query shows nothing (no empty-state message, no API call)
- 0 results shows the empty-state message

---

## FE-09 — Library page

**Priority:** P2 | **Milestone:** M5

**What to build:**

`app/library/page.tsx`:
- Server shell rendering `<FilterBar />` and `<ImageGrid initialImages={[]} />`
- On first load, show empty grid with `FilterBar` prompting the user to search

`components/FilterBar.tsx` (`'use client'`):
- Search input for NASA Image Library keyword
- On submit (Enter or button click): update URL `?q=` param
- Keep it simple — no year/category filters in v1 (out of scope per DEC-01 scoping spirit; search is sufficient)

`components/ImageGrid.tsx` (client, since it reacts to query):
- Read `q` from `useSearchParams()`
- On `q` change: call `searchImages(q, page)` from `lib/api.ts`
- Render as a responsive masonry-style grid: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`
- Each cell: thumbnail + title overlay on hover
- "Load More" button (increment page param) — no infinite scroll in v1

**Image card:**
```tsx
<a href={`/library/${image.nasa_id}`}>
  <div className="relative group overflow-hidden rounded-lg bg-space-800 aspect-square">
    <Image src={image.thumb_url} alt={image.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
      <p className="text-white text-xs line-clamp-2">{image.title}</p>
    </div>
  </div>
</a>
```

**Acceptance criteria:**
- Searching "nebula" renders NASA Image Library thumbnails in a grid
- Clicking any image navigates to `/library/{nasa_id}`
- "Load More" fetches page 2 and appends to the grid

---

## FE-10 — Library Detail page

**Priority:** P2 | **Milestone:** M5

**What to build:**

`app/library/[id]/page.tsx` (Server Component):
- `lib/api.ts`: add `getNasaImage(id: string): Promise<NasaImage>` — calls `https://images-api.nasa.gov/asset/{id}` to get full metadata
- Display: large image (use the asset URL, not just thumb), title, description, date, keywords as tags
- "Back to Library" link

Note: NASA Image Library asset URLs use the format `https://images-assets.nasa.gov/image/{nasa_id}/{nasa_id}~orig.jpg` — use this pattern for the full-resolution image. Fallback to `thumb_url` if the original fails.

**Acceptance criteria:**
- `/library/PIA12345` renders the NASA image with full title and description
- Keywords render as gray tags
- "Back to Library" navigates to `/library`

---

## FE-11 — Responsive design audit

**Priority:** P1 | **Milestone:** M3 (run after FE-04 through FE-08)

**What to audit:**

Test all pages at these breakpoints: 320px, 375px, 768px, 1024px, 1440px.

Checklist:
- [ ] Nav: collapses to hamburger or icon-only on mobile
- [ ] TodayHero: image fills width at 320px; text is legible (no overflow)
- [ ] RecentFeed: horizontal scroll at 320px; full grid at 1024px+
- [ ] APOD Detail: single-column at mobile; image max-height constrains correctly
- [ ] BriefingPanel: text is readable; source pills wrap correctly
- [ ] Search: input full-width at all sizes
- [ ] SearchResults: list items don't overflow; thumbnails resize
- [ ] Library grid: 2 columns at 320px; 4 columns at 1440px

Fix any overflow, cut-off text, or broken layout found during audit. Log all fixes in `docs/frontend/impl-log.md`.

---

## FE-12 — Deploy to Vercel

**Priority:** P0 | **Milestone:** M3 (deploy as soon as FE-01 is done to establish the pipeline)

**What to do:**
1. Push `frontend/` to GitHub (via GitHub MCP or git push)
2. Use Vercel MCP: `deploy_to_vercel` — point it at the `frontend/` directory
3. Set environment variable `NEXT_PUBLIC_API_URL` to the backend URL in Vercel project settings
4. Verify the deployment URL loads the dark-theme homepage
5. Record the Vercel URL in `docs/frontend/impl-log.md`

**Note on backend URL:** Backend is not deployed yet in M3 — use a placeholder URL. Real backend URL will be provided by Backend Dev once they deploy. Coordinate via the questions files.

**Acceptance criteria:**
- Vercel build succeeds (no TypeScript or ESLint errors)
- Deployment URL is accessible
- Dark theme renders correctly in production build
- Recorded Vercel URL in impl-log
