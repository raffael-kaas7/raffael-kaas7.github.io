---
title: "Regex patterns I actually use when searching log files"
slug: "regex-for-searching-in-logfiles"
date: "2025-11-26"
lastmod: "2026-05-19"
description: "A collection of practical regex patterns for searching log files effectively."
keywords: ["regex","log files","logfiles","search patterns", "easy regex","regular expressions"]
author: "Raffael Kaas"
readingTime: 7
titleImage: "/assets/blog/img/title/regex-for-searching-in-logfiles-terminal.webp"
titleImageAlt: "Stylized terminal window showing regex searches in a log file with highlighted matches for errors, failed tasks, process names, and non-zero error counts."
ogImage: "/assets/blog/img/title/regex-for-searching-in-logfiles-terminal.webp"
canonical: "https://rkaas.de/blog.html?post=regex-for-searching-in-logfiles"
tags: ["software-engineering","log files","search patterns"]
language: "en"
draft: false
---

Sometimes regex feels like this mysterious thing you only touch when you really, really have to. At least for me, it's rarely part of my daily work. In the few cases where I need to implement a feature with regex, I usually Google the specific pattern I need or ask Copilot, quickly verify it, and move on. For this, I like using the [regex101](https://regex101.com/) website to test, visualize, and understand patterns.

There is one place where knowing a few regex basics pays off almost every week for me: searching log files.

Log files, depending on the context, can easily have hundreds of thousands of lines. When something in the build goes wrong, or you just want to verify whether the correct work products are used or the right steps are executed, searching through those large files is inevitable.

In this post I want to share a few very small, practical patterns that I use all the time. No regex hell, just things you can directly copy into grep, Ctrl+F search boxes, or your favorite log viewer/editor.

<div class="section-break"></div>

## Multiple keywords at once

Searching for multiple keywords at once is useful. You might not need it when searching through a static log file, where you can check each keyword one after another. It becomes helpful when you want to grep for specific keywords during execution. For example, we can search for 'failed', 'error', or 'exception' at the same time with an easy-to-remember pattern by separating the words with a pipe <span class="mark-alt">|</span>:

<pre>
Regex example: <span class="mark-alt">error|fail|fatal|exception</span>
</pre>

In the shell (e.g. grep -E):

```bash
grep -E "error|fail|fatal|exception" app.log

```
Here is an example where you can see what the pattern will catch:

<pre>
2025-11-17 10:02:31 [INFO ] Starting worker...
2025-11-17 10:02:32 [WARN ] Retry <span class="mark">fail</span>ed for task 8421
2025-11-17 10:02:33 [<span class="mark">ERROR</span>] <span class="mark">Fatal</span> <span class="mark">exception</span> in PaymentService
2025-11-17 10:02:34 [INFO ] Worker stopped.
</pre>


<div class="section-break"></div>

## Anything in between - given start and end patterns

Searching for a specific prefix or suffix is common and easy without regex. But what if you want to search for symbol names that have a specific prefix and suffix, with anything in between? Imagine you want to find all symbol names for process_x on core 0, like the following examples:

```text
process_x_task_5ms_core_0
process_x_task_10ms_core_0
process_x_task_100ms_core_0
```

In such a case, regex plays very well with <span class="mark-alt">.*</span> (dot-star): 
<pre>
Regex example: <span class="mark-alt">process_x_.*_core_0</span>
</pre>

Explanation:

- **'process_x_'** sets a fixed literal prefix  
- **'.*'** allows any character, any number of times (also zero) in between  
- **'_core_0'** sets a fixed literal suffix  

Here is an example where you can see what the pattern catches, and which lines we're not interested in:

<pre>
[DEBUG] <span class="mark">process_x_task_5ms_core_0</span> processed
[DEBUG] <span class="mark">process_x_task_10ms_core_0</span> processed
[DEBUG] start_unrelated thing
[DEBUG] process_y_task_10ms_core_0 processed
[DEBUG] something_else
[DEBUG] process_x_task_10ms_core_1 processed
</pre>

<div class="section-break"></div>

## Word boundaries - only the real error

In most codebases we have variables like 'errorCount', 'last_error_code', 'ERROR_STATE', etc. Sometimes, when searching logs, we want to ignore those and only match real words (error, ERROR, Error(s)) that signal actual build or runtime issues. That's where word boundaries <span class="mark-alt">\b</span> help. They're easy to remember and easy to apply in any Ctrl+F search:

<pre>
Regex example: <span class="mark-alt">\berror\b</span>
</pre>

Example log:
<pre>
2025-11-17 11:02:10 [INFO ] errorCount=3, last_error_code=E42
2025-11-17 11:02:11 [<span class="mark">ERROR</span>] <span class="mark">error</span> occurred in AuthService
2025-11-17 11:02:12 [INFO ] user_error_state=false
</pre>

With a simple search for 'error', all three lines match. In the example above this wouldn't be too bad, but in larger log files with thousands of lines, it quickly becomes annoying.

<div class="section-break"></div>

## Find tests that actually failed (non-zero numbers)

The last one is a bit specific, but very helpful. Imagine you want to search for any number except zero. I know unit test frameworks that love to print summary lines like '0 error(s)', '2 error(s)', etc. When searching for failed tests, you usually only care about the non-zero ones, but you don't know how many tests failed. The following pattern is easy to remember once you read it with the explanation:

<pre>
Regex example: <span class="mark-alt">[1-9][0-9]* error</span>
</pre>

Explanation:

- **[1-9]** - first digit must be 1-9 (so not 0),
- **[0-9]*** - any number of more digits (maybe none)
- **error** - fixed literal

Imagine you run lots of tests. Hundreds are with '0 error(s)', but only a few failed with an unknown number of test cases. The log snippet could look like this:

<pre>
0 error(s)
...
0 error(s)
...
<span class="mark">2 error</span>(s)
..
0 error(s)
...
<span class="mark">102 error</span>(s)
</pre>

<div class="section-break"></div>


## Final thoughts

In my daily work I almost never need regex for complex one-time tasks. When that happens, I search online for the correct pattern. When debugging and digging through huge log files, though, a few easy patterns are worth remembering. They can make it much faster to find the right information.
