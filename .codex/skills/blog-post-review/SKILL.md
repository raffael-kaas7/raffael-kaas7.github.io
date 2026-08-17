---
name: blog-post-review
description: "Review and conservatively copy-edit Raffael's Markdown blog drafts. Use when Codex is asked to correct typos, grammar, spelling, punctuation, or only lightly review a post while preserving Raffael's own wording and personal phrasing; also use for checking whether a draft fits the site's writing philosophy, reviewing blog frontmatter metadata, proposing SEO tags or keywords, adding obvious internal links to existing posts, or suggesting verified external links for assets/blog/*.md drafts."
---

# Blog Post Review

## Overview

Review finished or nearly finished blog drafts for Raffael's personal website. Default to editing the draft in-place, unless the user explicitly asks for suggestions only.

Default editing mode is preservation-first copy-editing: keep Raffael's sentences, rhythm, personal wording, and slightly non-native phrasing when the meaning is clear. Make the smallest change that fixes a typo, grammar issue, punctuation issue, spelling issue, or objectively broken phrase.

## Required Context

Before editing or reviewing a post, read these local files when present:

- `hidden/my-writing-style.md`
- `backlog/brand.md`
- `backlog/backlog.md`

Then read the target draft. If no target path is clear, ask for the draft path.

For link review, scan existing posts in `assets/blog/*.md` for titles, slugs, summaries, tags, and related phrases. Use `/blog/<slug>/` for internal blog links.

If metadata behavior is unclear, inspect `scripts/build-blog.mjs` to confirm how frontmatter fields are used by the site generator.

## Editing Rules

Use three editing levels:

- **Default:** typo, grammar, spelling, punctuation, and clearly broken phrase fixes only.
- **Light rewrite:** only when the user explicitly asks for rephrasing/flow/polish, or when a sentence is genuinely hard to understand.
- **Heavy rewrite:** only when the user explicitly asks for a heavier edit.

Preserve the author's voice. Fix typos, grammar, punctuation, spelling, and clearly broken phrasing, but keep the text simple, direct, personal, and slightly non-polished when that feels natural.

Do not replace understandable personal phrasing with smoother, more generic phrasing. Do not remove phrases just because they sound a bit unusual, repetitive, emotional, or non-native. These are often part of the author's voice.

Do not turn the post into corporate English, life-coach writing, financial guru content, productivity advice, a manifesto, or a polished personal-brand performance.

Avoid adding certainty that was not in the draft. Keep phrases such as "for me", "what I noticed", "what worked for me", "my current view is", and "I am still figuring this out" when they fit the sentence.

Preserve Markdown structure, frontmatter delimiters, headings, links, images, code spans, code blocks, HTML blocks, and factual claims. Do not rewrite whole sections unless the user asks for a heavier edit.

If a sentence is grammatically acceptable and understandable, leave it alone even if a more polished sentence is possible. If a sentence is awkward but personal and clear, prefer leaving it unchanged and mention an optional suggestion in the final response instead of silently rewriting it.

Example preservation rule:

- Keep: "That way, I am trying to intentionally fight against my confirmation bias and not only let the positive scenarios sink in."
- Fix only obvious errors around it, such as "THat way" -> "That way" or "positve" -> "positive".
- Do not rewrite it to a smoother sentence like "This helps me avoid confirmation bias" unless the user explicitly asks for rephrasing.

Use sentence case for blog titles and Markdown headings. Do not convert titles or headings to title case just for consistency; preserve the draft's natural casing unless fixing an obvious typo.

Do not use full stops after short image captions.

When editing in-place, keep changes closely scoped. If in doubt, preserve the original and report the possible improvement separately.

## Philosophy Review

Flag paragraphs, headings, or metadata that clash with the website direction. Pay special attention to:

- universal advice from personal experience
- self-help certainty around health, money, happiness, success, purpose, or relationships
- "I figured it all out" framing
- influencer-like titles or claims
- excessive optimization language
- wording that tries too hard to impress
- vague AI-sounding transitions or dramatic phrasing listed in `hidden/my-writing-style.md`

Do not silently rewrite the author's philosophy. Report these items separately with paragraph or heading references, a short reason, and a suggested direction.

Do not remove personal framing, imperfect-but-clear phrasing, or subjective ownership while fixing philosophy/style issues. If wording sounds too absolute or influencer-like, flag it or make the smallest possible local edit.

## Metadata Review

Check frontmatter for meaningful and consistent:

- `title`
- `slug`
- `date`
- `summary`
- `area`
- `tags`
- `keywords`
- `readingTime`
- `titleImage`
- `titleImageAlt`
- `ogImage`
- `language`
- `draft`

Fix obvious metadata mistakes in-place, such as typos, generic summaries, mismatched area, stale or vague tags, clearly wrong reading time, missing or weak image alt text when the image is clear, or `ogImage` not matching `titleImage` without a reason.

Do not change `slug`, `date`, or `draft` unless the user asked for it or the mistake is unambiguous.

Use `summary` as the single post preview field. It feeds article metadata and card/list copy, so keep it concrete, useful, and not keyword-stuffed. Do not add a separate `description` field to blog post frontmatter.

Use `area` values that match the generator: `engineering`, `health`, `money`, `travel`, `life`, or `books`.

Propose optional SEO tags and `keywords` separately. Add them to the file only when the current metadata is clearly broken or the user asks for direct SEO updates.

## Link Review

Add only obvious internal links in-place. A link is obvious when the post names or strongly overlaps another existing post, and the link helps the reader without feeling promotional. Usually link only the first relevant mention and avoid self-links.

Use natural anchor text and `/blog/<slug>/` URLs. Do not over-link generic terms such as "money", "travel", "running", or "software" without a specific related article.

For external public URLs, propose links separately by default. Use web browsing when available to verify that the URL is relevant, current, and public. If browsing is unavailable, mark the suggestion as unverified and do not insert it.

## Final Response

After editing or reviewing, report:

- Edited file path, or state that suggestion-only mode was used.
- Copy-edit summary.
- Metadata changes made and optional SEO proposals.
- Internal links added and external links suggested.
- Philosophy/style flags, or "none found".
- Any uncertain items or checks that were skipped.
- Validation or tests run, if any.
