# Teach Yourself Design — Frontend Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the default `react-notion-x` site chrome with a custom homepage, slim chapter top bar, chapter bottom nav, and localStorage progress tracking — while keeping `NotionRenderer` and all Notion content untouched.

**Architecture:** `NotionPage.tsx` becomes a router: it detects whether the current page is the root, a top-level chapter, or a sub-topic page (via `block.parent_id` walked against the static `chapters` list in `content/chapters.ts`), then renders the matching chrome around the unchanged `NotionRenderer`. Chapter order/titles/descriptions come from the static `content/chapters.ts` (already written); `lib/get-chapters.ts` resolves each chapter's *real* canonical URL at build time via the already-memoized `getSiteMap()` — this avoids hardcoding URLs that could drift from Notion's canonical slugs.

**Tech Stack:** Tailwind CSS (new dependency), shadcn/ui primitives (Button, Progress), lucide-react icons, CSS custom property design tokens matching the existing `.dark-mode` system.

**Note on testing:** This project has no unit test framework (`pnpm test` runs lint + prettier only, per `CLAUDE.md`). Each task below ends with **manual verification in the running dev server** instead of automated tests — confirm the existing site still renders correctly before moving to the next task. This is intentional: the #1 risk here is breaking the live `react-notion-x` rendering, so we verify after every change.

---

## Before You Start

Run the dev server in the background and keep it running for the whole plan:

```bash
pnpm dev
```

Open `http://localhost:3000` in a browser. Confirm the homepage and at least one chapter page (e.g. `http://localhost:3000/1-introduction-...` — click through from the homepage) render normally. This is your baseline — if anything breaks later, you'll know immediately.

---

### Task 1: Fix `pageId` format mismatch in `content/chapters.ts`

**Why:** `content/chapters.ts` already exists with `pageId` values in 32-character no-dash format (e.g. `'cb449c29b3e647f9a02cf6af605d606f'`). But `NotionPage` receives `pageId` as a dashed UUID (e.g. `'cb449c29-b3e6-47f9-a02c-f6af605d606f'') from `resolveNotionPage`. The existing `getChapterByPageId` and `getAdjacentChapters` compare with `===` directly — they will never match. Fix this now, before anything depends on them.

**Files:**
- Modify: `content/chapters.ts`

**Step 1: Add the `uuidToId` import and normalize both lookup functions**

Add this import at the top of the file:

```ts
import { uuidToId } from 'notion-utils'
```

Replace the two lookup functions at the bottom of the file:

```ts
export function getChapterByPageId(pageId: string): ChapterMeta | undefined {
  const normalized = uuidToId(pageId)
  return chapters.find((c) => c.pageId === normalized)
}

export function getAdjacentChapters(pageId: string): {
  prev: ChapterMeta | null
  next: ChapterMeta | null
} {
  const normalized = uuidToId(pageId)
  const idx = chapters.findIndex((c) => c.pageId === normalized)
  if (idx === -1) return { prev: null, next: null }
  return {
    prev: idx > 0 ? (chapters[idx - 1] ?? null) : null,
    next: idx < chapters.length - 1 ? (chapters[idx + 1] ?? null) : null
  }
}
```

`uuidToId` strips dashes from a UUID, so both a dashed and non-dashed `pageId` normalize to the same 32-char string used in the static data.

**Step 2: Verify**

```bash
pnpm test:lint
```

Expected: no new errors. The file still compiles (TypeScript is checked at build/dev time — the dev server should keep running without errors in the terminal).

**Step 3: Commit**

```bash
git add content/chapters.ts
git commit -m "fix: normalize pageId format when matching chapters"
```

---

### Task 2: Delete `GitHubShareButton` and remove its usage

**Why:** It hardcodes a link to Travis Fischer's starter-kit repo (`transitive-bullshit/nextjs-notion-starter-kit`) — template leftover, not Aagreet's project.

**Files:**
- Delete: `components/GitHubShareButton.tsx`
- Modify: `components/NotionPage.tsx:26` (import) and `components/NotionPage.tsx:330` (render)

**Step 1: Remove the import**

In `components/NotionPage.tsx`, delete this line (currently line 26):

```ts
import { GitHubShareButton } from './GitHubShareButton'
```

**Step 2: Remove the render**

Delete this line (currently line 330, right before the closing `</>`):

```tsx
<GitHubShareButton />
```

**Step 3: Delete the file**

```bash
rm components/GitHubShareButton.tsx
```

**Step 4: Verify in browser**

Reload `http://localhost:3000`. The floating GitHub icon button (bottom-right corner) should be gone. Everything else renders the same.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove GitHubShareButton template leftover"
```

---

### Task 3: Install and configure Tailwind CSS

**Files:**
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Modify: `styles/global.css`

**Step 1: Install Tailwind and its peer dependencies**

```bash
pnpm add -D tailwindcss@^3 postcss autoprefixer
```

We pin to Tailwind v3 — shadcn/ui's CLI generates v3-compatible config and the project's CSS variable conventions assume v3's `theme.extend` shape.

**Step 2: Create `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

(Note the `export default` — this repo's `package.json` has `"type": "module"`, so config files use ESM syntax, matching `next.config.js`.)

**Step 3: Create `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '.dark-mode'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './content/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: 'hsl(var(--surface))',
        border: 'hsl(var(--border))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: []
}
```

**`darkMode: ['class', '.dark-mode']` is critical** — the existing `useDarkMode` hook (`lib/use-dark-mode.ts`) applies a `.dark-mode` class to `<body>`, not Tailwind's default `.dark`. Without this, every `dark:*` utility would silently never match.

**Step 4: Add Tailwind directives to `styles/global.css`**

Open `styles/global.css` and add these three lines at the very top of the file (above the existing `* { box-sizing: border-box; }` rule):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 5: Verify in browser**

Restart the dev server (`Ctrl-C`, then `pnpm dev` again — Tailwind/PostCSS config changes require a restart). Reload `http://localhost:3000`.

Check carefully:
- The page still renders with its existing dark background and content
- No layout shifts, no missing styles
- Open browser dev tools → Elements → confirm `<body>` still has expected classes and the Notion content looks identical to before

Tailwind's `base` layer (Preflight) resets default browser styles — this is the step most likely to visually disturb the existing `react-notion-x` CSS. If you see broken spacing, broken lists, or odd typography in the Notion content area, STOP and report it — do not proceed until this is resolved (likely fix: scope Preflight or move `@tailwind base` after the Notion CSS imports in `_app.tsx`, but try the simple order first since `global.css` is imported before `notion.css`).

**Step 6: Commit**

```bash
git add tailwind.config.js postcss.config.js styles/global.css package.json pnpm-lock.yaml
git commit -m "build: add Tailwind CSS"
```

---

### Task 4: Add design token CSS custom properties

**Why:** Industry-standard (shadcn/ui convention): colors live as HSL channel values in CSS custom properties; Tailwind classes reference them by name (`bg-accent`, not `bg-[#adff2f]`). Rebranding later means editing one block of CSS, not hunting through every component.

**Files:**
- Modify: `styles/global.css`

**Step 1: Add the token block**

In `styles/global.css`, add this directly after the `@tailwind` directives from Task 3:

```css
@layer base {
  :root {
    --background: 0 0% 7%; /* #111111 */
    --foreground: 0 0% 100%; /* #ffffff */
    --surface: 0 0% 10%; /* #1a1a1a */
    --border: 0 0% 13%; /* #222222 */
    --muted: 0 0% 33%; /* #555555 */
    --muted-foreground: 0 0% 53%; /* #888888 */
    --accent: 74 100% 59%; /* #adff2f */
    --accent-foreground: 0 0% 0%; /* #000000 */
    --radius: 0.5rem;
  }
}
```

Values are HSL channels *without* the `hsl()` wrapper (`<hue> <saturation>% <lightness>%`) — this is what lets Tailwind compose opacity modifiers like `bg-accent/50`. The `tailwind.config.js` from Task 3 wraps them in `hsl(var(--background))` etc.

**Step 2: Verify in browser**

Open browser dev tools → Elements → select `<html>` or `<body>` → Computed styles → confirm `--background`, `--accent`, etc. appear with the values above.

Add a temporary test: open `pages/index.tsx` in the browser via React DevTools, or simpler — temporarily add `className="bg-accent text-accent-foreground p-4"` to any element in a component, reload, confirm it renders lime-green with black text, then remove the temporary class. (You'll use these classes for real in upcoming tasks — this is just confirming the token pipeline works end to end before building on it.)

**Step 3: Commit**

```bash
git add styles/global.css
git commit -m "feat: add design token CSS custom properties"
```

---

### Task 5: Install shadcn/ui primitives and lucide-react

**Files:**
- Create: `components.json` (generated by shadcn CLI)
- Create: `lib/utils.ts` (generated by shadcn CLI — `cn()` helper)
- Create: `components/ui/button.tsx`, `components/ui/progress.tsx` (generated by shadcn CLI)

**Step 1: Install lucide-react**

```bash
pnpm add lucide-react
```

**Step 2: Initialize shadcn/ui**

```bash
pnpm dlx shadcn@latest init
```

When prompted, answer:
- Style: **New York** (or default — either works, this is a minimal site)
- Base color: **Neutral**
- CSS variables: **Yes** (this is essential — it must integrate with the tokens from Task 4, not generate its own)

This generates `components.json`, `lib/utils.ts` (the `cn()` class-merging helper), and may add `tailwindcss-animate` to `package.json`.

**Step 3: Reconcile generated tokens with the existing ones**

The shadcn init likely appended its own `:root` CSS variable block to `styles/global.css` (e.g. `--card`, `--popover`, `--primary`, etc.) and may have rewritten parts of `tailwind.config.js`. Open both files and:

- Keep the token names from Task 4 (`--background`, `--surface`, `--border`, `--muted`, `--accent`, etc.) — these are the project's chosen palette
- Remove any duplicate or conflicting `:root` block the CLI added that redefines `--background`/`--foreground` with different (shadcn default) values
- Confirm `darkMode: ['class', '.dark-mode']` is still present in `tailwind.config.js` — the CLI may have overwritten it back to `darkMode: ['class']` or `'media'`. Restore it if so.
- It's fine to keep additional shadcn tokens (`--card`, `--primary`, `--ring`, etc.) alongside — just make sure they don't collide in name with the project's tokens

**Step 4: Add the Button and Progress components**

```bash
pnpm dlx shadcn@latest add button progress
```

**Step 5: Verify in browser**

Restart the dev server. Reload the homepage — confirm nothing broke (these are new files, not yet used anywhere).

In a scratch component or via a temporary inline test in `pages/index.tsx`, render `<Button>Test</Button>` and `<Progress value={40} />`, confirm they render with the dark theme + accent colors (not shadcn's default blue/gray), then remove the temporary test code.

**Step 6: Commit**

```bash
git add -A
git commit -m "build: add shadcn/ui primitives (Button, Progress) and lucide-react"
```

---

### Task 6: Write `lib/get-chapters.ts`

**Why:** `content/chapters.ts` has the right chapter list, order, titles, and descriptions — but its `slug` field is a guess (`'1-introduction'`) that may not match the canonical URL Notion actually generates for that page (which depends on the page's title and/or a `Slug` property set in Notion). Linking to a guessed slug risks 404s. This module resolves the *real* URL for each chapter via `getSiteMap()`'s `canonicalPageMap` — which is exactly how the rest of the site (`mapPageUrl`) generates links — using the build's already-memoized sitemap (no extra Notion API calls).

**Files:**
- Create: `lib/get-chapters.ts`

**Step 1: Write the module**

```ts
import { type ExtendedRecordMap } from 'notion-types'
import { uuidToId } from 'notion-utils'

import { chapters, type ChapterMeta } from '@/content/chapters'

import { getSiteMap } from './get-site-map'

export interface ChapterLink extends ChapterMeta {
  /** the real, resolvable URL path for this chapter, e.g. "/introduction-to-ui-ux-design-5d4c21d8..." */
  url: string
}

/**
 * Resolves each statically-defined chapter's real canonical URL via the
 * sitemap's canonicalPageMap, so links never drift from what Notion / the
 * site's URL resolution actually produces. getSiteMap() is memoized, so
 * calling this alongside resolveNotionPage() in the same build cycle does
 * not trigger extra Notion API requests.
 */
export async function getChapters(): Promise<ChapterLink[]> {
  const { canonicalPageMap } = await getSiteMap()

  const idToCanonical = new Map<string, string>()
  for (const [canonicalId, pageId] of Object.entries(canonicalPageMap)) {
    idToCanonical.set(uuidToId(pageId), canonicalId)
  }

  return chapters.map((chapter) => ({
    ...chapter,
    url: `/${idToCanonical.get(chapter.pageId) ?? chapter.pageId}`
  }))
}

/**
 * Walks up a block's parent chain to find the nearest ancestor that is one
 * of the 13 top-level chapters. Used to give sub-topic pages (e.g. "Mastering
 * Figma" inside Chapter 3) correct chapter context — the recordMap for any
 * page includes its ancestor blocks (react-notion-x's Breadcrumbs depends on
 * this), so the walk is safe. Capped at 10 hops as a guard against malformed data.
 */
export function findAncestorChapter(
  block: ExtendedRecordMap['block'][string]['value'],
  recordMap: ExtendedRecordMap,
  chapterLinks: ChapterLink[]
): ChapterLink | undefined {
  const byPageId = new Map(chapterLinks.map((c) => [c.pageId, c]))

  let current = block
  for (let i = 0; i < 10 && current?.parent_id; i++) {
    const parent = byPageId.get(uuidToId(current.parent_id))
    if (parent) return parent

    const next = recordMap.block[current.parent_id]?.value
    if (!next) break
    current = next
  }

  return undefined
}
```

**Step 2: Verify it compiles**

```bash
pnpm test:lint
```

Expected: no new errors (this file isn't imported anywhere yet, so it won't affect runtime — this just confirms types check out).

**Step 3: Commit**

```bash
git add lib/get-chapters.ts
git commit -m "feat: add getChapters and findAncestorChapter helpers"
```

---

### Task 7: Write `lib/use-progress.ts`

**Files:**
- Create: `lib/use-progress.ts`

**Step 1: Write the hook**

```ts
import * as React from 'react'

const STORAGE_KEY = 'tyd_progress'

type ProgressMap = Record<string, boolean>

function readProgress(): ProgressMap {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ProgressMap) : {}
  } catch {
    return {}
  }
}

function writeProgress(progress: ProgressMap): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // localStorage unavailable (private browsing, storage disabled, etc.)
    // progress simply won't persist — content still renders fully
  }
}

export interface UseProgressReturn {
  isComplete: (pageId: string) => boolean
  markComplete: (pageId: string) => void
  completedCount: number
}

/**
 * localStorage-backed chapter completion tracking. No backend, no auth,
 * no undo — intentionally simple. `chapterPageIds` scopes `completedCount`
 * to chapters that currently exist, so a deleted chapter's stale entry
 * doesn't inflate the count.
 */
export function useProgress(chapterPageIds: string[]): UseProgressReturn {
  const [progress, setProgress] = React.useState<ProgressMap>({})

  React.useEffect(() => {
    setProgress(readProgress())
  }, [])

  const markComplete = React.useCallback((pageId: string) => {
    setProgress((prev) => {
      if (prev[pageId]) return prev

      const next = { ...prev, [pageId]: true }
      writeProgress(next)
      return next
    })
  }, [])

  const isComplete = React.useCallback(
    (pageId: string) => !!progress[pageId],
    [progress]
  )

  const completedCount = React.useMemo(
    () => chapterPageIds.filter((id) => progress[id]).length,
    [progress, chapterPageIds]
  )

  return { isComplete, markComplete, completedCount }
}
```

**Step 2: Verify it compiles**

```bash
pnpm test:lint
```

Expected: no new errors.

**Step 3: Commit**

```bash
git add lib/use-progress.ts
git commit -m "feat: add useProgress localStorage hook"
```

---

### Task 8: Write `components/ChapterTopBar.tsx`

**Files:**
- Create: `components/ChapterTopBar.tsx`

**Step 1: Write the component**

```tsx
import Link from 'next/link'
import { Moon, Sun } from 'lucide-react'
import * as React from 'react'

import { Progress } from '@/components/ui/progress'
import { TOTAL_CHAPTERS } from '@/content/chapters'

export interface ChapterTopBarProps {
  /** 1-based position in the curriculum, e.g. 4 for "Chapter 4 of 13". Omitted when it can't be determined. */
  chapterNumber?: number
  completedCount: number
  isDarkMode: boolean
  toggleDarkMode: () => void
}

export function ChapterTopBar({
  chapterNumber,
  completedCount,
  isDarkMode,
  toggleDarkMode
}: ChapterTopBarProps) {
  return (
    <div className='sticky top-0 z-40 border-b border-border bg-background'>
      <div className='mx-auto flex h-12 max-w-3xl items-center justify-between px-4'>
        <Link
          href='/'
          className='text-sm font-bold tracking-wide text-accent hover:opacity-80'
        >
          ← TYD
        </Link>

        {chapterNumber !== undefined && (
          <span className='text-sm text-muted-foreground'>
            Chapter {chapterNumber} of {TOTAL_CHAPTERS}
          </span>
        )}

        <button
          type='button'
          onClick={toggleDarkMode}
          aria-label='Toggle dark mode'
          className='text-muted-foreground transition-colors hover:text-foreground'
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <Progress
        value={(completedCount / TOTAL_CHAPTERS) * 100}
        className='h-1 rounded-none'
      />
    </div>
  )
}
```

**Step 2: Verify it compiles**

```bash
pnpm test:lint
```

Expected: no new errors. (Not yet rendered anywhere — wired in Task 12.)

**Step 3: Commit**

```bash
git add components/ChapterTopBar.tsx
git commit -m "feat: add ChapterTopBar component"
```

---

### Task 9: Write `components/ChapterBottomBar.tsx`

**Files:**
- Create: `components/ChapterBottomBar.tsx`

**Step 1: Write the component**

```tsx
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { type ChapterLink } from '@/lib/get-chapters'

export interface ChapterBottomBarProps {
  prevChapter: ChapterLink | null
  nextChapter: ChapterLink | null
  isComplete: boolean
  /** marks the current chapter complete and navigates to the next chapter (or stays put on the last chapter) */
  onDone: () => void
}

export function ChapterBottomBar({
  prevChapter,
  nextChapter,
  isComplete,
  onDone
}: ChapterBottomBarProps) {
  return (
    <div className='mt-12 border-t border-border bg-surface'>
      <div className='mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between'>
        <div className='order-2 sm:order-1'>
          {prevChapter && (
            <Link
              href={prevChapter.url}
              className='text-sm text-muted-foreground transition-colors hover:text-foreground'
            >
              ← {prevChapter.title}
            </Link>
          )}
        </div>

        <div className='order-1 sm:order-2'>
          {nextChapter ? (
            <Button onClick={onDone} className='w-full sm:w-auto'>
              {isComplete ? (
                <>
                  <Check className='mr-2' size={16} />
                  Completed — Next: {nextChapter.title}
                </>
              ) : (
                <>
                  Done with this chapter
                  <ArrowRight className='ml-2' size={16} />
                </>
              )}
            </Button>
          ) : (
            <span className='text-sm font-medium text-accent'>
              {isComplete ? (
                "You've completed the curriculum 🎉"
              ) : (
                <Button onClick={onDone}>
                  Done with this chapter
                  <Check className='ml-2' size={16} />
                </Button>
              )}
            </span>
          )}
        </div>

        <div className='order-3 text-right'>
          {nextChapter && (
            <Link
              href={nextChapter.url}
              className='text-sm text-muted-foreground transition-colors hover:text-foreground'
            >
              {nextChapter.title} →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify it compiles**

```bash
pnpm test:lint
```

Expected: no new errors.

**Step 3: Commit**

```bash
git add components/ChapterBottomBar.tsx
git commit -m "feat: add ChapterBottomBar component"
```

---

### Task 10: Write `components/SubTopicBackLink.tsx`

**Files:**
- Create: `components/SubTopicBackLink.tsx`

**Step 1: Write the component**

```tsx
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import * as React from 'react'

import { type ChapterLink } from '@/lib/get-chapters'

export interface SubTopicBackLinkProps {
  parentChapter: ChapterLink
}

export function SubTopicBackLink({ parentChapter }: SubTopicBackLinkProps) {
  return (
    <div className='mx-auto max-w-3xl px-4 pt-6'>
      <Link
        href={parentChapter.url}
        className='inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground'
      >
        <ArrowLeft size={14} />
        Back to: {parentChapter.title}
      </Link>
    </div>
  )
}
```

**Step 2: Verify it compiles**

```bash
pnpm test:lint
```

**Step 3: Commit**

```bash
git add components/SubTopicBackLink.tsx
git commit -m "feat: add SubTopicBackLink component"
```

---

### Task 11: Write `components/HomePage.tsx`

**Files:**
- Create: `components/HomePage.tsx`

**Step 1: Write the component**

```tsx
import { type Block } from 'notion-types'
import Link from 'next/link'
import { CheckCircle2, Circle } from 'lucide-react'
import * as React from 'react'
import { Search } from 'react-notion-x'

import * as config from '@/lib/config'
import { type ChapterLink } from '@/lib/get-chapters'
import { searchNotion } from '@/lib/search-notion'
import { TOTAL_CHAPTERS } from '@/content/chapters'

export interface HomePageProps {
  chapters: ChapterLink[]
  /** the root page's block — passed to react-notion-x's Search for context */
  block: Block
  isComplete: (pageId: string) => boolean
  completedCount: number
  isDarkMode: boolean
  toggleDarkMode: () => void
}

export function HomePage({
  chapters,
  block,
  isComplete,
  completedCount,
  isDarkMode,
  toggleDarkMode
}: HomePageProps) {
  const isCurriculumComplete = completedCount >= TOTAL_CHAPTERS

  const ctaChapter = React.useMemo(() => {
    if (completedCount === 0 || isCurriculumComplete) return chapters[0]
    return chapters.find((c) => !isComplete(c.pageId)) ?? chapters[0]
  }, [chapters, completedCount, isCurriculumComplete, isComplete])

  const ctaLabel = isCurriculumComplete
    ? 'Review Curriculum'
    : completedCount === 0
      ? 'Start Learning'
      : 'Continue'

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <header className='sticky top-0 z-40 border-b border-border bg-background'>
        <div className='mx-auto flex h-12 max-w-3xl items-center justify-between px-4'>
          <span className='text-xs font-bold tracking-[0.2em] text-accent'>
            TYD
          </span>

          <div className='flex items-center gap-4'>
            {config.isSearchEnabled && (
              <Search block={block} search={searchNotion} title='Search' />
            )}
            <button
              type='button'
              onClick={toggleDarkMode}
              aria-label='Toggle dark mode'
              className='text-sm text-muted-foreground transition-colors hover:text-foreground'
            >
              {isDarkMode ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-3xl px-4 pb-24'>
        <section className='flex flex-col items-center gap-3 py-20 text-center'>
          <h1 className='text-4xl font-extrabold tracking-tight sm:text-5xl'>
            Teach Yourself Design
          </h1>
          <p className='max-w-md text-muted-foreground'>
            A curated learning guide for UI/UX Design.
          </p>
          <a
            href='https://aagreetsinha.com'
            target='_blank'
            rel='noopener noreferrer'
            className='text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'
          >
            by Aagreet Sinha ↗
          </a>

          {completedCount > 0 && (
            <p className='mt-2 text-sm font-medium text-accent'>
              {completedCount} / {TOTAL_CHAPTERS} chapters explored
            </p>
          )}

          {ctaChapter && (
            <Link
              href={ctaChapter.url}
              className='mt-4 inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90'
            >
              {ctaLabel} →
            </Link>
          )}
        </section>

        <section className='border-t border-border pt-10'>
          <h2 className='mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground'>
            Curriculum
          </h2>

          <ul className='divide-y divide-border'>
            {chapters.map((chapter) => {
              const complete = isComplete(chapter.pageId)

              return (
                <li key={chapter.pageId}>
                  <Link
                    href={chapter.url}
                    className='flex items-start gap-4 rounded-md px-3 py-4 transition-colors hover:bg-surface'
                  >
                    <span className='mt-0.5 font-mono text-sm text-muted-foreground'>
                      {String(chapter.index).padStart(2, '0')}
                    </span>

                    <span className='flex-1'>
                      <span className='block font-medium'>
                        {chapter.title}
                      </span>
                      <span className='mt-1 block text-sm text-muted-foreground'>
                        {chapter.description}
                      </span>
                    </span>

                    {complete ? (
                      <CheckCircle2
                        className='mt-0.5 shrink-0 text-accent'
                        size={18}
                      />
                    ) : (
                      <Circle
                        className='mt-0.5 shrink-0 text-muted'
                        size={18}
                      />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      </main>

      <footer className='border-t border-border py-8 text-center text-sm text-muted-foreground'>
        Curated by{' '}
        <a
          href='https://aagreetsinha.com'
          target='_blank'
          rel='noopener noreferrer'
          className='text-foreground hover:underline'
        >
          Aagreet Sinha
        </a>
      </footer>
    </div>
  )
}
```

**Step 2: Verify it compiles**

```bash
pnpm test:lint
```

**Step 3: Commit**

```bash
git add components/HomePage.tsx
git commit -m "feat: add HomePage component"
```

---

### Task 12: Wire `getChapters()` into `getStaticProps`

**Files:**
- Modify: `lib/types.ts`
- Modify: `pages/index.tsx`
- Modify: `pages/[pageId].tsx`

**Step 1: Extend `PageProps` in `lib/types.ts`**

Add this import near the top (after the existing `notion-types` re-export on line 5):

```ts
import { type ChapterLink } from './get-chapters'
```

Then update the `PageProps` interface (currently lines 14-19):

```ts
export interface PageProps {
  site?: Site
  recordMap?: ExtendedRecordMap
  pageId?: string
  error?: PageError
  chapters?: ChapterLink[]
}
```

**Step 2: Update `pages/index.tsx`**

Add the import:

```ts
import { getChapters } from '@/lib/get-chapters'
```

Replace the `getStaticProps` function:

```tsx
export const getStaticProps = async () => {
  try {
    const [props, chapters] = await Promise.all([
      resolveNotionPage(domain),
      getChapters()
    ])

    return { props: { ...props, chapters }, revalidate: 10 }
  } catch (err) {
    console.error('page error', domain, err)

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    throw err
  }
}
```

**Step 3: Update `pages/[pageId].tsx`**

Add the import:

```ts
import { getChapters } from '@/lib/get-chapters'
```

Replace the `getStaticProps` function:

```tsx
export const getStaticProps: GetStaticProps<PageProps, Params> = async (
  context
) => {
  const rawPageId = context.params?.pageId as string

  try {
    const [props, chapters] = await Promise.all([
      resolveNotionPage(domain, rawPageId),
      getChapters()
    ])

    return { props: { ...props, chapters }, revalidate: 10 }
  } catch (err) {
    console.error('page error', domain, rawPageId, err)

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    throw err
  }
}
```

**Step 4: Verify in browser**

Restart the dev server. Reload any page. It should render exactly as before — `chapters` is now in props but `NotionPage` doesn't use it yet (next task). Check the terminal for errors; `getChapters()` calls `getSiteMap()`, which makes a real Notion API request on first call — confirm it doesn't throw.

**Step 5: Commit**

```bash
git add lib/types.ts pages/index.tsx "pages/[pageId].tsx"
git commit -m "feat: pass resolved chapter list to every page via getStaticProps"
```

---

### Task 13: Wire it all into `components/NotionPage.tsx`

This is the integration point — the riskiest task because it changes what actually renders. Read through the whole task before starting.

**Files:**
- Modify: `components/NotionPage.tsx`

**Step 1: Add new imports**

Add `uuidToId` to the existing `notion-utils` import (line 7):

```ts
import { formatDate, getBlockTitle, getPageProperty, uuidToId } from 'notion-utils'
```

Add these new imports (alongside the existing `@/lib/*` and relative imports — follow the file's existing import grouping):

```ts
import { findAncestorChapter, type ChapterLink } from '@/lib/get-chapters'
import { useProgress } from '@/lib/use-progress'
```

```ts
import { ChapterBottomBar } from './ChapterBottomBar'
import { ChapterTopBar } from './ChapterTopBar'
import { HomePage } from './HomePage'
import { SubTopicBackLink } from './SubTopicBackLink'
```

**Step 2: Destructure `chapters` from props**

Change the function signature (currently lines 186-191):

```tsx
export function NotionPage({
  site,
  recordMap,
  error,
  pageId,
  chapters
}: types.PageProps) {
```

**Step 3: Add chapter-routing logic**

Right after the existing `const { isDarkMode } = useDarkMode()` line (currently line 216), add:

```tsx
  const { toggleDarkMode } = useDarkMode()

  const chapterPageIds = React.useMemo(
    () => chapters?.map((c) => c.pageId) ?? [],
    [chapters]
  )
  const { isComplete, markComplete, completedCount } =
    useProgress(chapterPageIds)
```

> Note: `useDarkMode()` is already called above for `isDarkMode` — just add `toggleDarkMode` to that same destructure rather than calling the hook twice. Find the existing line:
> ```tsx
> const { isDarkMode } = useDarkMode()
> ```
> and change it to:
> ```tsx
> const { isDarkMode, toggleDarkMode } = useDarkMode()
> ```
> then remove the duplicate `useDarkMode()` call you just added above — only the `chapterPageIds`/`useProgress` lines are new.

**Step 4: Compute page-type and chapter context**

This needs `block` and `recordMap`, which are computed slightly later in the function (currently lines 226-227: `const keys = ...` / `const block = ...`). Add the following code **immediately after** that `block` assignment (after line 227, before the `isBlogPost` line):

```tsx
  const isRootPage = !!site && pageId === site.rootNotionPageId

  const currentChapter = React.useMemo(
    () =>
      pageId
        ? chapters?.find((c) => c.pageId === uuidToId(pageId))
        : undefined,
    [chapters, pageId]
  )

  const isTopLevelChapter = !isRootPage && !!currentChapter

  const ancestorChapter = React.useMemo(() => {
    if (isRootPage || isTopLevelChapter || !block || !recordMap) return undefined
    return findAncestorChapter(block, recordMap, chapters ?? [])
  }, [isRootPage, isTopLevelChapter, block, recordMap, chapters])

  const chapterNumber = currentChapter
    ? currentChapter.index + 1
    : ancestorChapter
      ? ancestorChapter.index + 1
      : undefined

  const adjacentChapters = React.useMemo(() => {
    if (!currentChapter || !chapters) return { prev: null, next: null }
    const idx = chapters.findIndex((c) => c.pageId === currentChapter.pageId)
    return {
      prev: idx > 0 ? (chapters[idx - 1] ?? null) : null,
      next: idx < chapters.length - 1 ? (chapters[idx + 1] ?? null) : null
    }
  }, [chapters, currentChapter])

  const handleChapterDone = React.useCallback(() => {
    if (!currentChapter) return

    markComplete(currentChapter.pageId)

    if (adjacentChapters.next) {
      void router.push(adjacentChapters.next.url)
    }
  }, [currentChapter, adjacentChapters.next, markComplete, router])
```

**Step 5: Replace the return statement's body for the routing decision**

Find the existing `return` block (starts at line 291). It currently always renders `<PageHead>` + `<NotionRenderer>` + `<GitHubShareButton>` (already removed in Task 2). Replace the JSX returned — keep `<PageHead>` and the `BodyClassName` lines exactly as they are, but replace everything from `<NotionRenderer` through the closing `</>` with this conditional:

```tsx
      {isRootPage && block && recordMap ? (
        <HomePage
          chapters={chapters ?? []}
          block={block}
          isComplete={isComplete}
          completedCount={completedCount}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />
      ) : (
        <>
          <ChapterTopBar
            chapterNumber={chapterNumber}
            completedCount={completedCount}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          />

          {ancestorChapter && (
            <SubTopicBackLink parentChapter={ancestorChapter} />
          )}

          <NotionRenderer
            bodyClassName={cs(styles.notion)}
            darkMode={isDarkMode}
            components={components}
            recordMap={recordMap}
            rootPageId={site.rootNotionPageId}
            rootDomain={site.domain}
            fullPage={!isLiteMode}
            previewImages={!!recordMap.preview_images}
            showCollectionViewDropdown={false}
            showTableOfContents={showTableOfContents}
            minTableOfContentsItems={minTableOfContentsItems}
            defaultPageIcon={config.defaultPageIcon}
            defaultPageCover={config.defaultPageCover}
            defaultPageCoverPosition={config.defaultPageCoverPosition}
            mapPageUrl={siteMapPageUrl}
            mapImageUrl={mapImageUrl}
            searchNotion={config.isSearchEnabled ? searchNotion : undefined}
            pageAside={pageAside}
            footer={footer}
          />

          {isTopLevelChapter && currentChapter && (
            <ChapterBottomBar
              prevChapter={adjacentChapters.prev}
              nextChapter={adjacentChapters.next}
              isComplete={isComplete(currentChapter.pageId)}
              onDone={handleChapterDone}
            />
          )}
        </>
      )}
```

A few important details about this replacement:
- `bodyClassName={cs(styles.notion)}` — drop the `pageId === site.rootNotionPageId && 'index-page'` modifier from the original. That class targeted the *default* Notion-rendered homepage, which no longer renders (HomePage replaces it). Keeping it would apply `index-page` styling to chapter pages too, which is wrong.
- `isLiteMode` is still used for `fullPage` — leave that variable and its `useSearchParam` line untouched.
- `<GitHubShareButton />` was already removed in Task 2 — there should be nothing after `<NotionRenderer>` / the new conditional except the closing `</>`.

**Step 6: Verify in browser — this is the critical check**

Restart the dev server. Walk through every scenario:

1. **Homepage** (`http://localhost:3000`): should now show the custom `HomePage` — hero, "by Aagreet Sinha" link, curriculum list with 13 rows, footer. NOT the default Notion-rendered homepage.
2. **Top-level chapter** (click chapter "1" from the homepage list): should show `ChapterTopBar` ("Chapter 2 of 13" — remember chapters are 0-indexed, so chapter at index 1 shows "Chapter 2 of 13"), the Notion content unchanged, and `ChapterBottomBar` at the bottom with prev/Done/next.
3. **Click "Done with this chapter"**: button should change state, and the page should navigate to the next chapter. Reload the page you just completed — the homepage list should show a checkmark next to it, and the progress bar in `ChapterTopBar` should reflect it.
4. **Sub-topic page** (from within a chapter, click into a sub-page like "Mastering Figma" inside Chapter 3): should show `ChapterTopBar` with the *parent chapter's* number, `SubTopicBackLink` below it pointing back to the parent chapter, Notion content, and **no** `ChapterBottomBar`.
5. **Chapter 0** ("Welcome"): prev link should be hidden in `ChapterBottomBar` (← nothing to its left).
6. **Chapter 12** ("Additional Resources", the last one): next link/button area should show the completion state instead of a next-chapter button.
7. **Mobile width** (resize browser to ~375px or use dev tools device emulation): confirm `ChapterTopBar`, `ChapterBottomBar`, and `HomePage` all remain usable — no horizontal overflow, text doesn't overlap, the bottom bar stacks vertically.
8. **Dark mode toggle**: click it on both the homepage and a chapter page — confirm it still works (uses the existing `useDarkMode` hook unchanged).
9. **Browser console**: confirm no new errors or warnings (React key warnings, hydration mismatches, etc.)

If anything looks wrong, fix it before committing — this task changes the most code and is the highest-risk point in the plan.

**Step 7: Run lint and prettier**

```bash
pnpm test
```

Fix any reported issues (import order, formatting, etc.).

**Step 8: Commit**

```bash
git add components/NotionPage.tsx
git commit -m "feat: route root/chapter/sub-topic pages to custom chrome components"
```

---

### Task 14: Final pass — full walkthrough + lint

**Files:** none (verification only)

**Step 1: Full golden-path walkthrough**

Starting from a hard refresh of `http://localhost:3000` with `localStorage` cleared (`localStorage.clear()` in the browser console, then reload):

1. Confirm the homepage shows "Start Learning →" (0 complete)
2. Click through all 13 chapters sequentially using "Done with this chapter →"
3. Confirm the homepage progress pill updates each time you return
4. Confirm the CTA changes to "Continue →" mid-way and "Review Curriculum →" at 13/13
5. Confirm the final chapter shows the completion message instead of a "Done" → next button

**Step 2: Edge cases**

- Open a chapter page directly via URL (not by clicking from the homepage) — confirm `ChapterTopBar` shows the right "Chapter N of 13"
- Disable JavaScript (or check server-rendered HTML via view-source) — confirm content still renders (progress simply won't be interactive, per the SSR-safe guard in `useProgress`)
- Resize to tablet width (~768px) — confirm no layout breakage at the responsive boundary

**Step 3: Run the full test suite**

```bash
pnpm test
```

Expected: PASS (lint + prettier clean).

**Step 4: Build check**

```bash
pnpm build
```

Expected: production build succeeds with no type errors. This catches anything `pnpm dev` might have masked (dev mode is more lenient about certain type issues).

**Step 5: Commit (if Step 1-4 surfaced any fixes)**

```bash
git add -A
git commit -m "fix: address issues found during full walkthrough"
```

---

## Summary of What's Deliberately Different From the PRD

Two small, justified deviations from `docs/superpowers/specs/2026-06-06-prd.md` §8.5/§8.6, surfaced while implementing:

1. **No dynamic chapter *discovery*.** The PRD's `getChapters()` walks `recordMap.block[rootId].content` and parses numeric prefixes from titles. Since `content/chapters.ts` already has the full, hand-verified list (titles, order, descriptions, page IDs), re-deriving the same data from fragile title-parsing would be redundant and more failure-prone (e.g. if Aagreet renames "1. Introduction to UI/UX Design" to "Introduction to UI/UX Design" in Notion, regex-based extraction breaks; the static list doesn't care). `lib/get-chapters.ts` instead trusts the static list for *order/identity* and only asks Notion to resolve each chapter's *real URL* — the one piece of information that genuinely can't be hand-written reliably.
2. **Trade-off this introduces:** a brand-new 14th chapter added in Notion will not automatically appear on the homepage — `content/chapters.ts` needs a new entry (with a description Aagreet writes anyway, since descriptions can't come from Notion regardless of approach). This is a one-line, well-understood edit to a config file Aagreet already owns, not a code change — an acceptable cost for removing a class of brittle title-parsing bugs.

---

## Execution Note

Run `pnpm dev` in the background for the entire plan (see "Before You Start"). After each task's verification step, the dev server should still be running cleanly with no new console errors — that's your signal to proceed.
