---
title: "Everyone should use Git — My simple day-to-day workflow (CLI only)"
slug: "git-made-simple"
date: "2026-03-24"
lastmod: "2026-03-24"
description: "A minimal Git CLI workflow for clean history: commit early, amend, rebase, squash, and push safely."
keywords: ["git","git cli","rebase","merge","squash","amend","clean history","ai coding workflow"]
author: "Raffael Kaas"
readingTime: 6
ogImage: "/assets/img/me.png"
canonical: "https://rkaas.de/blog.html?post=git-made-simple"
tags: [“git workflow”, “git cli”, “git basics”, “git commit”, “git commit --amend”, “git squash”, “git rebase -i”, “git force-with-lease”, “version control for beginners”]
language: "en"
draft: false
---


There’s a noticeable shift happening right now: more and more people are building things. Not necessarily only software engineers — but also people who use AI to create scripts, websites, small helper tools, or just text-based content. You prompt something. You get the code (or text). You test it, you tweak it, and you continue.

This change is actually visible in numbers. [GitHub’s Octoverse 2025 report](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/) shows that, in the last year, GitHub saw its biggest absolute growth ever. On average, one new developer joined GitHub every second (!) — and the trend is continuing.

What’s clear for software engineers isn’t yet clear for everyone. Once you start iterating with AI-generated code/content, you can progress fast — but it can also get messy fast without proper version control. Git becomes relevant for a lot more people.
<div class="section-break"></div>


## Git and why I prefer the command line interface (CLI)

In simple terms, Git is just a way to save project states, compare them, and go back if something breaks. Not file-by-file. Not like “track changes” in Word, but snapshots of your project over time. It is lightweight and really simple to use (without knowing all the internal details about objects, trees, blobs, etc.). You can really go without.

Although it is simple, I’ve seen people mess up branches with accidental rebases, unexpected merge commits, and weird cherry-picks. Mistakes that can only happen when using a GUI (like SmartGit) and are almost impossible to reproduce via the CLI.

I use Git — only Git — and I strongly recommend every beginner start with the CLI. Below is my favorite workflow and a set of copy-paste commands that solve more than 95% of my daily use cases.
<div class="section-break"></div>

## My day-to-day Git workflow

It works whether you write everything yourself or start from AI-generated code/content. I personally use `git commit --amend` a lot on my local repository.

- Prompt / make a change
- Review the change
- Commit
- Test and fix
- Amend the last commit or create a new one
- Repeat
- If appropriate, clean up and squash multiple commits into a single one
- Push to the remote repository if available

---
<div class="section-break"></div>

**1. Initialize a repository** 

If I already created a remote repository (recommended for most cases, e.g., on GitHub), I just clone it.
If I start locally without a remote:

```
git init
```

---

**2. Stage changes**

I normally use VS Code to stage specific files, but that’s just convenience. If you want to add all files to the staging area, that’s usually enough.


```
git add .
```

---

**3. Commit**

This creates a new commit — a named snapshot of your current project state. Keep messages short but meaningful, and think in functional units, not file changes. Here is a [good reference](https://cbea.ms/git-commit/) for proper commit messages.

```
git commit -m "your message"
```

---

**4. Amend the last commit**

If you forgot something or want to amend the last commit, use this. The commit message stays the same. Very useful when small fixes happen constantly. Be careful using this on commits already pushed to the remote when working on shared branches. But for local commits, I love it.

```
git commit --amend --no-edit
```

---

**5. Squash commits**

Sometimes it makes sense to clean up the Git history and combine multiple commits into a single one, e.g., when you have multiple “fix ...” commits, or tiny iterations that all belong to one functional change. I prefer doing this via interactive rebase. It lets you combine multiple (`n`) commits into one:

```
git rebase -i HEAD~n
```

---

**6. Push**

If you are working with a remote repository, you can push your changes like this:

```
git push

```

Only if you rebased / rewrote history after pushing (e.g., squashed after push):

```
git push --force-with-lease
```
---

**7. Update your branch**

Here one could start a big discussion on when to rebase vs. when to merge. I don’t want to do this, since it also depends a lot on your hooks and merge-back strategy. If I simply want to update my branch with changes that were performed in the meantime on main, `git merge` is the command I can always apply easily (after `git fetch`):

```
git merge origin/main
```

<div class="section-break"></div>

## Final thoughts

I’ve spent enough time with Git to know there’s a lot of depth under the hood — and sometimes it’s worth understanding, especially when something gets messed up. But in day-to-day work, I mostly stick to the simple loop and the handful of commands above. Most of the time, that’s all you need for powerful version control.