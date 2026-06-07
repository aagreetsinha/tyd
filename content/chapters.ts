import { uuidToId } from 'notion-utils'

export interface ChapterMeta {
  index: number
  pageId: string
  title: string
  description: string
  slug: string
}

export const chapters: ChapterMeta[] = [
  {
    index: 0,
    pageId: 'cb449c29b3e647f9a02cf6af605d606f',
    title: 'Welcome to Teach Yourself Design',
    slug: '0-welcome',
    description:
      'Mindset, motivation, and how to use this curriculum. Start here before diving into the material.'
  },
  {
    index: 1,
    pageId: '5d4c21d8fde5418f9d691c334157d266',
    title: 'Introduction to UI/UX Design',
    slug: '1-introduction',
    description:
      'The history of design, what UI and UX actually mean, and the vocabulary every designer needs to know.'
  },
  {
    index: 2,
    pageId: '519fcb31f0284a11b60b801e08285572',
    title: 'Design Foundations',
    slug: '2-foundations',
    description:
      'The design process from first principles — information architecture, wireframing, visual design, and prototyping.'
  },
  {
    index: 3,
    pageId: '73e53922122f40838f393af69ce02226',
    title: 'Tools of the Trade',
    slug: '3-tools',
    description:
      'Figma from zero to confident, plus the full toolkit of apps, plugins, and resources modern designers rely on.'
  },
  {
    index: 4,
    pageId: '2fa4e6702aec443e84d7519acc2de9a4',
    title: 'Advanced Visual Design',
    slug: '4-visual-design',
    description:
      'Typography, colour theory, icons, accessibility, design systems, and motion — the craft details that separate good from great.'
  },
  {
    index: 5,
    pageId: '5cd9ef3d3c4946e097c370e043a9d4a2',
    title: 'UX Research & Psychology',
    slug: '5-ux-research',
    description:
      'How users think, research methods that surface real insights, and the psychology principles behind great UX.'
  },
  {
    index: 6,
    pageId: 'c3bd3e66847b43eb956cc9fed1d66f79',
    title: 'Web & Interaction Design',
    slug: '6-web-design',
    description:
      'Designing for the browser — responsive layouts, grids, interaction patterns, and conversion-focused thinking.'
  },
  {
    index: 7,
    pageId: 'c0cb50e4e7fe47c1a1b502702463a545',
    title: 'Practical Examples & Redesigns',
    slug: '7-practical',
    description:
      'Learning by doing: UI redesigns, design challenges, and how to approach your first real-world project.'
  },
  {
    index: 8,
    pageId: 'fe2533278bc04dfaa63cf15a15ca29c2',
    title: 'Design & Development',
    slug: '8-design-dev',
    description:
      'Design handoff, developer collaboration, and just enough code to design things that can actually be built.'
  },
  {
    index: 9,
    pageId: 'f5a02b870dcc42d0a08f79cbe73c14ab',
    title: 'Communicating Product Decisions',
    slug: '9-communication',
    description:
      'UX metrics, giving and receiving feedback, iterating on designs, and making the case for your decisions.'
  },
  {
    index: 10,
    pageId: 'aaf28a4c6bcb405ab77a58c66d286ee4',
    title: 'Career Design',
    slug: '10-career',
    description:
      'Portfolio, case studies, interviews, salary negotiation, internships, freelancing, and building a design career.'
  },
  {
    index: 11,
    pageId: 'bb10f6396ffb4c45972096dcc81dbbd8',
    title: 'AI Tools & Future Trends',
    slug: '11-ai-tools',
    description:
      "How AI is reshaping the designer's workflow — tools, techniques, and what to learn to stay relevant."
  },
  {
    index: 12,
    pageId: 'f8f67aa52bf64aa2b105e88a54e4fc4c',
    title: 'Additional Resources',
    slug: '12-resources',
    description:
      'Curated YouTube channels, design inspiration, community repositories, and ongoing learning to keep growing.'
  }
]

export const TOTAL_CHAPTERS = chapters.length

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
