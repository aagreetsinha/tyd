# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm test         # Run linting + prettier check
pnpm test:lint    # ESLint only
pnpm test:prettier # Prettier check only
pnpm deploy       # Deploy to Vercel
pnpm analyze      # Bundle analysis (sets ANALYZE=true)
```

No unit tests exist — `pnpm test` runs only lint/prettier.

## Architecture

This is a **Next.js + Notion-as-CMS** site. Notion is the source of truth for all content; the app renders it via `react-notion-x`.

### Configuration layers

1. [site.config.ts](site.config.ts) — user-facing config (Notion page IDs, site name, feature flags)
2. [lib/site-config.ts](lib/site-config.ts) — typed schema + `siteConfig()` helper
3. [lib/config.ts](lib/config.ts) — runtime config consumed throughout the app (reads from `site.config.ts` + env vars)

All config changes start in `site.config.ts`.

### Request / data flow

```
URL → pages/[pageId].tsx (getStaticProps)
        → lib/resolve-notion-page.ts
            → lib/get-site-map.ts   (builds slug→pageId map)
            → lib/notion.ts         (wraps Notion API)
                → lib/notion-api.ts (NotionAPI client)
                → lib/preview-images.ts  (LQIP generation, optional Redis cache)
                → lib/get-tweets.ts
        → components/NotionPage.tsx  (renders via NotionRenderer)
```

### URL scheme

- **Dev**: `/page-title-slug-<notionId>` (ID always visible for debugging)
- **Prod**: `/page-title-slug` (clean URLs; controlled by `includeNotionIdInUrls` which defaults to `!!isDev`)

URL resolution in `resolve-notion-page.ts` checks in order: direct Notion page ID → `pageUrlOverrides` from config → Redis URI cache → `getSiteMap()` canonical map.

Custom slugs can be set per-page with a `Slug` property in the Notion database.

### Key files

| File | Purpose |
|------|---------|
| [lib/resolve-notion-page.ts](lib/resolve-notion-page.ts) | Core URL→page resolution logic |
| [lib/get-site-map.ts](lib/get-site-map.ts) | Builds the full slug→pageId map at build time |
| [lib/map-page-url.ts](lib/map-page-url.ts) | Generates canonical URLs for pages |
| [lib/map-image-url.ts](lib/map-image-url.ts) | Rewrites Notion image URLs for Next.js |
| [lib/db.ts](lib/db.ts) | Redis client (Keyv) — used for URI→pageId caching |
| [components/NotionPage.tsx](components/NotionPage.tsx) | Main render component; wires `NotionRenderer` with custom components |
| [pages/api/](pages/api/) | API routes: search, social-image (OG), notion-page-info |

### Heavy components are dynamically imported

`NotionPage.tsx` lazy-loads `Code`, `Collection`, `Equation`, `Pdf`, and `Modal` from `react-notion-x` to keep the initial bundle small.

### Optional features (toggled in site.config.ts)

- **Preview images** (`isPreviewImageSupportEnabled`): LQIP blur-up via `lqip-modern`; add Redis (`REDIS_HOST`, `REDIS_PASSWORD`) for caching
- **Analytics**: Fathom (`NEXT_PUBLIC_FATHOM_ID`) or PostHog (`NEXT_PUBLIC_POSTHOG_ID`)
- **Custom navigation** (`navigationStyle: 'custom'`): requires `navigationLinks` array with Notion page IDs
- **Search**: enabled by default (`isSearchEnabled`); uses Notion's built-in search API

### Styles

Notion content styles live in [styles/notion.css](styles/notion.css). Target individual Notion blocks with `.notion-block-<id>` selectors. Global component styles use CSS Modules (`*.module.css`).

---

## Known Issues & Fixes

### Blank page / `NotionRenderer` renders empty

**Symptom:** The site loads but the main content area is blank. Server logs show `"Unsupported block type undefined"`. No JS errors in the browser console.

**Root cause:** Notion's API v3 wraps every record as `{ spaceId, value: { value: actualBlock, role } }` but `react-notion-x@7.4.2` expects `{ role, value: actualBlock }`. The renderer silently skips blocks whose `.type` resolves to `undefined`.

**Fix location:** `normalizeRecordMap()` in [lib/notion.ts](lib/notion.ts) — flattens the double-nested `value` right after the API call, before the data reaches the renderer.

**How to diagnose:**
```bash
# Check the block structure in the server-rendered HTML
curl -s http://localhost:3000 | python3 -c "
import sys, json, re
html = sys.stdin.read()
m = re.search(r'<script id=\"__NEXT_DATA__\"[^>]*>(.*?)</script>', html, re.DOTALL)
data = json.loads(m.group(1))
blocks = data['props']['pageProps']['recordMap']['block']
first = list(blocks.values())[0]
print('Block keys:', list(first.keys()))
print('Block value keys:', list(first.get('value', {}).keys()))
"
# If you see value.value nesting, normalizeRecordMap needs to handle the new format
```

**If this breaks again** (Notion changes format): update the condition in `normalizeRecordMap` to unwrap whatever new nesting Notion introduced. The function is at [lib/notion.ts:45](lib/notion.ts).

**Permanent fix (not yet done):** Upgrade `notion-client`, `notion-types`, `notion-utils`, `react-notion-x` to `^7.10.0`. Those versions use `getBlockValue()` from `notion-utils` which recursively unwraps any nesting. Requires recreating the patch in `patches/react-notion-x@7.4.2.patch` for the new version and updating `pnpm-workspace.yaml`.

---

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
