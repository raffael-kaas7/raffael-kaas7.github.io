---
title: "Regex patterns I actually use when searching log files"
slug: "regex-for-searching-in-log-files"
date: "2025-10-14"
lastmod: "2025-11-18"
description: "A collection of practical regex patterns for searching log files effectively."
keywords: ["regex","log files","search patterns", "easy regex","regular expressions"]
author: "Raffael Kaas"
readingTime: 7
ogImage: "/assets/blog/img/Gruppenbild.jpeg"
canonical: "https://rkaas.de/blog.html?post=regex-for-searching-in-log-files"
tags: ["software-engineering","log files","search patterns"]
language: "en"
draft: false
---

Sometimes regex feels like this mysterious thing you only touch when you really, really have to.
At least for me, it’s rarely part of my daily work when I implement a new feature. In those cases, I usually just Google the pattern I need or ask an AI and then immediately forget it again afterwards.

But there is one place where knowing a few regex basics pays off almost every single week: searching in log files.

Our logs easily have hundreds of thousands of lines. When something goes wrong in production and you’re hunting down a bug, good regex skills are like a small superpower.

In this post I want to share a few very small, practical patterns that I use all the time. No regex hell, just things you can directly copy into grep, rg (ripgrep), your IDE search, or log viewer.

Small HTML/CSS helper for highlighting regex (optional)

If you want to highlight regex snippets nicely in your blog or internal docs, you can use something like this:

<style>
  .regex {
    font-family: "Fira Code", Menlo, monospace;
    background: #222;
    color: #f5f5f5;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9rem;
  }
</style>


1. Multiple keywords at once

When a log file is still “work in progress” (e.g. during rollout or when a system is unstable), I often don’t know the exact error message yet. But I know typical words of pain:

error

fail

fatal

exception

Regex lets you search for all of them at once:

<span class="regex">error|fail|fatal|exception</span>

In the shell (with rg or grep -E):
```bash
grep -E "error|fail|fatal|exception" app.log
```

```text
2025-11-17 10:02:31 [INFO ] Starting worker...
2025-11-17 10:02:32 [WARN ] Retry failed for task 8421
2025-11-17 10:02:33 [ERROR] Fatal exception in PaymentService
2025-11-17 10:02:34 [INFO ] Worker stopped.
```

The pattern will match both failed and Fatal exception, because it just looks for the word part.

2. Optional parts: fail vs failed

Sometimes the log messages are not consistent:

Retry fail

Retry failed

Job failed

Instead of searching twice, you can make the last part optional:

<span class="regex">fail(ed)?</span>

Explanation:

fail – must be there

(ed)? – group that is optional (? means “0 or 1 time”)

So it matches:

fail

failed

But not failing or fails.

3. “Anything in between” – start and end anchor

Very often I know that a certain log line always starts and ends in a similar way, but the middle changes:

start_id_1234_end

start_id_9876_end

start_order_ABC_end

If I only know start_ and _end, I don't want to type every possible middle part.

Here regex plays very well with .* (dot-star):
<span class="regex">start_.*_end</span>

Explanation:

start_ – literal prefix

.* – “any character, any number of times (also zero)”

_end – literal suffix

Example log:
```text
[DEBUG] start_user-42_end processed in 20ms
[DEBUG] start_order-123_end processed in 30ms
[DEBUG] start_unrelated thing
[DEBUG] something_else_end
```

The pattern <span class="regex">start_.*_end</span> will match the first two lines, but not the last two.

If you want it to be a bit more “careful” and stop at the first _end, you can make it non-greedy (depends on the regex engine, but many support this):

<span class="regex">start_.*?_end</span>

Here .*? means: still “any characters”, but as few as possible until _end is found.


4. Word boundaries: only the real error

In many codebases we have variables like:

errorCount

last_error_code

has_error_flag

Sometimes, when searching logs, we want to ignore those and only match “real” words like:

error

ERROR

Error

That’s where word boundaries come in: \b

<span class="regex">\berror\b</span>

Example log:
```text
2025-11-17 11:02:10 [INFO ] errorCount=3, last_error_code=E42
2025-11-17 11:02:11 [ERROR] error occurred in AuthService
2025-11-17 11:02:12 [INFO ] user_error_state=false
```

With a simple search for error, all three lines match.
With <span class="regex">\berror\b</span> only this part matches:

```text
2025-11-17 11:02:11 [ERROR] error occurred in AuthService
                         ^^^^
```

5. Find tests that actually failed (non-zero errors)

This one is very practical when you run lots of tests or jobs and get summary lines like:

```text
0 error(s)
2 error(s)
102 error(s)
```

I usually only care about the non-zero ones. With regex, we can say:

“Match a number that does NOT start with 0, followed by error or errors”.

<span class="regex">\b[1-9][0-9]* error(s)?</span>

Explanation:

\b – word boundary, so we start at the beginning of the number

[1-9] – first digit must be 1–9 (so not 0)

[0-9]* – any number of more digits (maybe none)

space

error – literal

(s)? – optional s → matches error and errors


Tiny mental rules to remember

You don’t need to remember the whole regex syntax. For searching logs, a few mental rules are already enough:

“A or B or C”
→ Use |
→ <span class="regex">error|fail|fatal|exception</span>

“Make this part optional”
→ Put it in () and add ?
→ <span class="regex">fail(ed)?</span>

“Anything in the middle”
→ Use .*
→ <span class="regex">start_.*_end</span>

“Only the whole word, not inside variable names”
→ Wrap with \b
→ <span class="regex">\berror\b</span>

“Number > 0” (simple version)
→ Start with [1-9], then more digits [0-9]*
→ <span class="regex">[1-9][0-9]*</span>

If you combine just these tiny building blocks, you can already build quite powerful searches for your log files.

Final thoughts

In my daily work I almost never need regex for complex one-time tasks in the code – I just ask AI or search online. But when debugging and digging through huge log files, a few simple patterns in my head save me a lot of time every month.

Next time you open a 300 MB log file, don’t scroll.
Start with one or two of the patterns above, refine them, and let the regex engine do the boring work for you.