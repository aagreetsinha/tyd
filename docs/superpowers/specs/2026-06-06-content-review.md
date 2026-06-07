# Content Review — Teach Yourself Design

**Date:** 2026-06-06  
**Author:** Claude (based on Notion MCP review of all 13 chapters)  
**Status:** For Aagreet to action in Notion

---

## Overview

Reviewed all 13 chapters + 8 key sub-pages via Notion API. The curriculum structure is solid. Most chapters hold up well in 2026; the main problem is **Chapter 11 (AI Tools)**, which is 100% 2023-era content and needs a full rewrite. A handful of other chapters need targeted additions.

Content itself is not changing (editing happens in Notion, not code). This doc is purely editorial guidance.

---

## Chapter-by-Chapter Review

### Chapter 0 — Welcome
**Status: Minor update needed**

Good structure. Sets up the curriculum well.

- **Remove:** The "Course Schedule" sub-page if it contains specific time estimates — these become stale and cause anxiety for self-paced learners
- **Update:** Any references to specific tool versions (Figma version numbers, pricing)
- **Keep:** The motivational framing, the "how to use this guide" structure

---

### Chapter 1 — Introduction to UI/UX Design
**Status: Solid, keep as-is**

"Understanding UI/UX" sub-page has good numbered bookmark links to foundational articles. Well-organized, evergreen content.

- **Keep:** All of it. UI/UX definition articles don't expire.
- **Consider adding:** One or two articles from 2024-2025 on "UX in the age of AI" to bridge to Chapter 11

---

### Chapter 2 — Design Foundations
**Status: Solid, minor additions**

Core design process content. Wireframing and IA resources hold up well.

- **Keep:** The wireframing progression, the IA resources
- **Consider adding:** Figma FigJam resources for collaborative wireframing (FigJam has grown significantly since 2023)

---

### Chapter 3 — Tools of the Trade
**Status: Needs targeted updates**

Figma section is strong (official playlists, auto-layout content). The tools list is where things date.

**Remove or replace:**
- Midjourney in the "useful tools" list → replace with Figma AI + Framer AI
- Copy.ai → much less relevant now; replace with Claude/ChatGPT for UX writing with prompt examples
- Ensure any Figma tutorial links still work (Figma has reorganized their docs)

**Add:**
- **Figma AI** (first-party AI features, introduced 2024): `Make Designs`, first draft generation
- **Figma Dev Mode** (important for design-to-dev handoff)
- **Figma Variables** (design tokens in Figma)
- **v0.dev** — quick UI prototyping with AI (Vercel's tool; highly relevant for designers who want to test ideas in code)
- **Framer** — Framer AI for building production sites without code

---

### Chapter 4 — Advanced Visual Design
**Status: Evergreen, keep as-is**

Typography, colour, accessibility — this content doesn't expire. One of the strongest chapters.

- **Keep:** Everything
- **Consider adding:** Any resources on designing for OLED/high-contrast screens (accessibility on modern displays)

---

### Chapter 5 — UX Research & Psychology
**Status: Solid, keep as-is**

Psychology principles (Hick's Law, Fitts' Law, etc.) are timeless. Research method resources hold up.

- **Keep:** All of it
- **Consider adding:** Resources on AI-assisted research analysis (using Claude/ChatGPT to synthesise user interview transcripts)

---

### Chapter 6 — Web & Interaction Design
**Status: Needs content depth**

This chapter currently has direct YouTube video embeds without structured sub-pages — thinner than other chapters.

**Add sub-pages for:**
- **CSS for Designers** — not coding, but understanding `flexbox`, `grid`, `gap`, `min-width` so you can have accurate conversations with developers and design for what actually renders
- **Responsive Design** — breakpoints, mobile-first thinking, how designs translate across screen sizes
- **Micro-interactions & Motion** — when motion helps UX, Figma prototyping for motion, Lottie files

**Add resources:**
- web.dev/learn/design — Google's free responsive design course
- Every Layout (every-layout.dev) — intrinsic web design concepts

---

### Chapter 7 — Practical Examples & Redesigns
**Status: Solid structure**

Design challenge resources and redesign examples are good for learning by doing.

- **Keep:** The challenge-based learning resources
- **Add:** Brief section on using AI to generate design brief ideas ("give Claude a product category, get 10 design challenge prompts")

---

### Chapter 8 — Design & Development
**Status: Solid, targeted additions**

Design handoff content is strong.

- **Keep:** Developer collaboration resources, Zeplin/Figma Inspect workflows
- **Add:** Figma Dev Mode as the current standard for handoff
- **Add:** Brief mention of design tokens and how they connect to code (Style Dictionary, Figma Variables → CSS custom properties)

---

### Chapter 9 — Communicating Product Decisions
**Status: Keep as-is**

UX metrics, feedback frameworks, and stakeholder communication — evergreen professional skills content.

- **Keep:** Everything

---

### Chapter 10 — Career Design
**Status: Good, verify links**

Strong structure with multiple levels of depth (portfolio → case studies → interview prep → job boards).

- **Keep:** Most of it — job portals list, case study structure, salary negotiation resources
- **Verify:** Remote job portals are still active (some shut down post-2023)
- **Add:** AI-assisted portfolio tools — Framer (AI site builder), Webflow (AI layout suggestions)
- **Add:** Brief note on AI in design interviews — interviewers now ask about how you use AI in your process

---

### Chapter 11 — AI Tools & Future Trends
**Status: NEEDS FULL REWRITE — Priority 1**

All content is from 2023. The Midjourney chapter is a single YouTube video. The ChatGPT tutorial is in Hindi from 2023. "AI Masterclass" is generic Midjourney/ChatGPT hype content. "Spatial Design" is entirely Apple Vision Pro content that has not aged well (Vision Pro adoption is minimal).

**Delete entirely:**
- "Learn Midjourney" (single 2023 video)
- "Learn ChatGPT" (basic 2023 tutorial)
- "AI Masterclass" (generic clickbait-adjacent content, e.g. "Make Money using AI")

**Rewrite with these new sub-pages:**

#### 1. AI in Your Design Workflow
*How to actually use AI day-to-day as a designer — not "will AI replace you?"*
- Using Claude/ChatGPT for UX writing (microcopy, error messages, onboarding flows)
- Using AI to analyse user research (upload interview transcripts, ask for themes)
- Figma AI features — Make Designs, first draft, rename layers
- AI for accessibility checks (using AI to spot contrast, copy, and flow issues)
- Resources: Figma AI documentation, practical prompt templates for designers

#### 2. AI Design Generation Tools
*Tools that generate UI and visuals from prompts*
- **v0.dev** — generate React components from a description, paste into Figma or ship directly
- **Galileo AI** — generate Figma mockups from text
- **UXPilot** — AI for UX research and synthesis
- **Framer AI** — full web pages generated from prompts
- Resources: comparison of current tools, what each is best for

#### 3. AI for Visual Creation
*When you need a mood board, illustration, or image asset*
- Midjourney v6 (updated) — for mood boards and visual direction, not production UI
- Adobe Firefly — integrated into Creative Cloud, commercially safe
- DALL-E 3 — quick conceptual images
- Note: AI images are for ideation, not final assets

#### 4. Emerging Interfaces
*Replace the Vision Pro-only focus with broader emerging design contexts*
- Voice UI design (Alexa, Siri, custom LLM voice interfaces)
- Conversational UX (designing chat interfaces, LLM product experiences)
- Wearables and small screens
- visionOS design — keep one section but not the whole chapter focus

#### 5. Staying Current
*How to keep learning as the landscape changes*
- Following Figma's changelog (biggest signal for what designers need to know)
- Newsletters: Dense Discovery, Pointer, UX Collective
- How to evaluate a new AI tool (what to try, what to skip)

---

### Chapter 12 — Additional Resources
**Status: Verify and clean**

Curated channels and inspiration sources. Good structure.

- **Verify:** YouTube channels are still active
- **Remove:** Any channels that pivoted to low-quality content or stopped posting
- **Add:** Design-specific AI newsletters (Dense Discovery, Pointer)
- **Add:** Figma Community as a resource (freebies, UI kits, icon sets)
- **Add:** Awwwards and Mobbin as current UI inspiration sources

---

## Summary: Priority Actions for Aagreet

| Priority | Chapter | Action |
|----------|---------|--------|
| 🔴 P1 | Ch. 11 | Full rewrite — delete all 2023 sub-pages, create 5 new ones above |
| 🟠 P2 | Ch. 3 | Remove Midjourney/Copy.ai from tools list, add Figma AI/v0/Framer |
| 🟠 P2 | Ch. 6 | Add CSS for Designers, Responsive Design, Micro-interactions sub-pages |
| 🟡 P3 | Ch. 0 | Review/remove Course Schedule sub-page |
| 🟡 P3 | Ch. 10 | Verify job portal links, add AI portfolio tools note |
| 🟢 P4 | Ch. 1 | Add 1-2 articles bridging to AI era |
| 🟢 P4 | Ch. 8 | Add Figma Dev Mode + design tokens resources |
| 🟢 P4 | Ch. 12 | Verify YouTube channels, add Figma Community |

---

## What NOT to Change

- The chapter ordering — it's a logical curriculum progression
- The Figma content in Ch. 3 — official Figma playlists and auto-layout resources are still the best
- Typography and colour content in Ch. 4 — these are timeless
- The psychology/research content in Ch. 5
- The career structure in Ch. 10 — case study and portfolio guidance is strong

---

## Note on Content vs. Engineering

All of the above is Notion editing work — open each page in Notion and add/remove content directly. The frontend engineering work is independent and can proceed in parallel. The only connection is that `content/chapters.ts` has the chapter titles and descriptions, which should be updated to match whatever titles you settle on in Notion.
