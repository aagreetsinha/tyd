# Teach Yourself Design — Frontend Redesign Spec

**Date:** 2026-06-06  
**Author:** Aagreet Sinha  
**Status:** Approved for implementation

---

## Goal

Replace the default `react-notion-x` site chrome with a minimal, fast, intentional UI. Notion stays as the CMS and source of truth — only the wrapper around the content changes.

**Design principles:** Simple, minimal, fast. No feature creep.

---

## Reference

- **teachyourselfcs.com** — sequential curriculum structure (UX is not the reference, only the concept)
- **Existing brand:** dark background `#111111`, lime accent `#adff2f`

---

## Tech Stack Additions

| Package | Purpose |
|---------|---------|
| `tailwindcss` | Utility-first styling for all new components |
| `shadcn/ui` | Radix-based accessible components (Button, Badge, Progress, Sheet, Separator) |
| `lucide-react` | Icons (ships with shadcn) |
| `@tailwindcss/typography` | Prose styling for Notion content |

Existing `react-notion-x`, Next.js pages router, and dark mode stay untouched.

---

## Content Structure (observed)

```
Root Page
└── 13 Chapters (0–12, numerically ordered by title)
    └── Sub-topic pages (How to use, Roadmap, Understanding UI/UX…)
        └── Resources (Notion bookmarks, YouTube embeds, text)
```

Notion already renders bookmark cards and YouTube embeds well. The content itself does not change — only the site chrome around it.

---

## Components to Build

### 1. `lib/use-progress.ts` — Progress hook

```ts
// Shape stored in localStorage
type Progress = { [pageId: string]: boolean }

// Hook API
isComplete(pageId: string): boolean
markComplete(pageId: string): void
completedCount: number
totalChapters: number  // always 13
```

- Storage key: `tyd_progress`
- SSR-safe: reads `localStorage` only on client
- No backend, no auth

### 2. `components/HomePage.tsx` — Custom root page

Replaces the default Notion renderer when `pageId === rootNotionPageId`.

**Layout (top to bottom):**
1. **Nav bar** — "TYD" wordmark left, Search button right (existing search, rewired)
2. **Hero** — `"Teach Yourself Design"` heading, one-line tagline, `"by Aagreet Sinha"` linked to `aagreetsinha.com`, progress pill `"3 / 13 chapters explored"`
3. **Chapter list** — numbered rows `00` – `12`, chapter title, checkmark if complete. Full-width clickable rows with hover state. Links to chapter page.
4. **Footer** — `"Curated by Aagreet Sinha"`, link to Twitter/GitHub

Chapter metadata (title, pageId, order) is extracted from `recordMap` already passed to `NotionPage` — no extra API call needed.

### 3. `components/ChapterLayout.tsx` — Chapter page wrapper

Wraps `NotionRenderer` on all non-root pages.

**Desktop (≥768px):**
- Left sidebar (240px, sticky, full height): TYD logo, list of 13 chapters with completion dots, current chapter highlighted
- Content area: existing `NotionRenderer` output, unchanged

**Mobile (<768px):**
- Sidebar becomes a Sheet (shadcn slide-in drawer) triggered by a menu button in the top bar
- Content takes full width

**Top of content area:**
- `"Chapter N of 13"` label
- Thin progress bar (shadcn `Progress`) showing position in curriculum

**Bottom of content area:**
- `"Done with this chapter →"` button (primary)  
  On click: marks chapter complete in localStorage, navigates to next chapter  
  On last chapter: `"You've completed the curriculum"` (no navigation)
- `"← Previous chapter"` text link (secondary, shown when not on chapter 0)

### 4. Updated `components/NotionPage.tsx`

- Detect root page: `if (pageId === site.rootNotionPageId)` → render `<HomePage>`
- All other pages → wrap `NotionRenderer` in `<ChapterLayout>`
- Pass `chapters` array (ordered list of `{ pageId, title, index }`) down from `getStaticProps`

---

## Chapter Metadata Extraction

Chapters are the direct children of the root Notion page. They appear in `recordMap.block` with numeric prefixes (`0.`, `1.`, … `12.`). At `getStaticProps` time, we build an ordered `chapters` array sorted by their numeric title prefix. This array is passed as a prop — no additional Notion API calls.

---

## Styling Decisions

- New components: Tailwind + shadcn only
- `tailwind.config.js` extends theme: `accent: '#adff2f'`, `background: '#111111'`
- Notion content area (`notion-page-content`) is **not restyled** — `react-notion-x` CSS stays as-is
- Dark mode default; dark mode toggle (existing) remains in footer

---

## Out of Scope (explicitly excluded)

- Resource type badges (Article / Video / Book) — adds complexity, low value for minimal design
- "Open all in tabs" button — not needed for minimal UX
- Backend/database for progress — localStorage is sufficient
- User authentication
- Custom domain
- Animations beyond Tailwind transitions

---

## Content Refresh (Editorial — not code)

Done by Aagreet directly in Notion, independent of the engineering work:

- **Remove:** Resources published pre-2023 that are now outdated
- **Update:** Chapter 11 "AI Tools & Future Trends" — rewrite with current landscape (Figma AI, Cursor, v0, Galileo, etc.)
- **Review:** Chapter 3 "Tools of the Trade" — verify current Figma/FigJam/Framer landscape
- **Add:** Any significant new resources published 2023–2026

This is a Notion editing task, not blocked by or blocking the frontend work.

---

## Deployment

- Host: **Vercel** (free tier, `.vercel.app` subdomain)
- `pnpm deploy` triggers Vercel CLI deploy
- Update `domain` in `site.config.ts` once Vercel project name is set
- No environment variable changes needed beyond what already exists
