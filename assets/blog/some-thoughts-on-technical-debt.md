---
title: "A few thoughts on technical debt in Software Engineering"
slug: "some-thoughts-on-technical-debt"
date: "2026-06-11"
lastmod: "2026-06-11"
description: "A personal view on technical debt as a delivery risk. It can lead to unplanned work, postponed features, delayed deliveries, and frustrated teams when it is not visible enough."
keywords: ["technical debt","software engineering","architecture debt","code quality","delivery risk","refactoring", "bad code", "unplanned work"]
author: "Raffael Kaas"
readingTime: 6
titleImage: "/assets/blog/img/title/some-thoughts-on-technical-debt.webp"
titleImageAlt: "Stylized scrum planning board with one team planning discussion, blocked technical debt work, an empty Done column, and a delayed release plan."
ogImage: "/assets/blog/img/title/some-thoughts-on-technical-debt.webp"
canonical: "https://rkaas.de/blog/some-thoughts-on-technical-debt/"
tags: ["software-engineering","technical-debt","architecture"]
language: "en"
draft: false
---

Technical debt is a term almost everyone in software engineering has heard before. Nevertheless, I think it is often not treated as seriously as it should be. People know about it and talk about it, but often in a very vague way.

Choosing quick solutions to meet deadlines, adding temporary workarounds that stay forever, and building small architectural balconies are part of daily life for almost every developer and project manager.

The cost is often not directly visible but accumulates over the years, just like a stock savings plan, but for the worse. Technical debt should be visible and, if needed, we should pay it down like a mortgage.

<div class="section-break"></div>

## Definition and symptoms

For me, technical debt is the accumulated cost of past engineering decisions that make future changes slower and riskier.

As a developer, you normally see it directly while working on the codebase. You feel slow and frustrated. Technical debt affects your motivation. Most developers like working in a clean codebase where they can move fast. If technical debt is high, this is definitely not the case.

All other people who are involved in the project can feel it too. If the following symptoms are present in your project, technical debt has most likely reached a serious level:

- Developers are busy all the time, but new features regularly get delayed.
- Small changes take days to be merged back.
- The bug rate is high.
- A lot of unplanned work comes up during development. Estimates become less reliable.

<div class="section-break"></div>

## Types of technical debt

You cannot avoid technical debt completely. It is not a problem as long as you are aware of it, track it, and fix it at some point. Cleanups are not only about pretty code. Instead, paying down technical debt reduces future project costs. The following two types of technical debt are very common in code and architecture.

**Deliberate technical debt** is debt you take on consciously. Workarounds, quick fixes, and architectural balconies all increase technical debt. I mean, this is not always bad. Sometimes it is the right decision to ship something on time, but it should be tracked in the backlog and fixed properly later if necessary.

**Accidental or naive technical debt** is different. It can come from missing experience, missing best practices, rushed work or unseen disadvantages. This way, some hidden and unknown technical debt almost always enters the codebase. Same story here: Clean it up once it becomes visible.

<div class="section-break"></div>

## The Engineer's responsibility

Not every workaround or quick fix comes with a high cost later. In my opinion, engineers need to decide what impact it has on maintainability, scalability, or whatever is relevant in the specific context. There is acceptable debt and there is harmful debt. We need to classify it.

As engineers, we should try to avoid emotional arguments about "bad code", even when we are frustrated. I sometimes tend to do that myself instead of making the issue concrete and visible.

If a bigger cleanup or refactoring is needed, the debt needs to show up in planning. For smaller cleanups, I like the "boy scout rule". If you work on a part of the codebase anyway, leave it a bit better than before. This helps to reduce small debt over time. I think most reviewers will appreciate this more than being confused by the additional changes.

<div class="section-break"></div>

## Technical debt and unplanned work

Can we measure technical debt? In my opinion, the amount of unplanned work highly correlates with the amount of technical debt. If a team is never able to estimate sprint work properly, it is probably because a lot of unplanned work comes up during development. Paying down technical debt should reduce this unplanned work and help the team estimate sprints more reliably.

Deadlines are great. In my experience, development teams need some pressure in order to progress efficiently. But there also needs to be room for the trade-off between a quick fix and a proper long-term solution. If you always force the quick solution, you allow harmful debt that comes back with high costs later.
