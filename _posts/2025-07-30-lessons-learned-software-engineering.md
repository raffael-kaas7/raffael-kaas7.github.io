---
layout: post
title: "My Lessons Learned from Building Complex Software Products"
date: 2025-07-30
categories: [Coding]
---

#### More Than Just Coding – Some of My Lessons Learned from Building Complex Software Products

Over the past few years, I’ve moved through many different phases of software engineering: solo student projects, agile startup-style development for autonomous driving, and now, process-heavy series production in the automotive industry. Along the way, I started by coding my own quadrocopter, deployed autonomous shuttles on the road in Rotterdam, and currently work on base software for power converters used in electric vehicles. I’ve implemented fancy KPI dashboards as well as low-level software for embedded systems.

Across these very different environments, I’ve learned a few things that stuck with me - about coding, teamwork, and managing complexity. Here are a few lessons you only learn through experience.


##### Collaboration and Its Impact on Coding Style

When you're working alone - like we often do in student projects - you can move fast. But that speed often comes at the cost of maintainability. I learned this the hard way when revisiting old code that was impossible to read, even though it worked. You tend to apply quick fixes and stack one workaround on top of another. So-called balconies that were definitely not part of your initial design.

Working in professional teams changed that. Suddenly, it matters how you structure commits, how readable your code is, and how clearly you communicate intent - because someone else will be reading it, debugging it, or building on top of it. I learned that good Git hygiene, meaningful commit messages, and more but simpler lines of code are sometimes better than clever tricks. It's key to protect your implementation from others unintentionally breaking it - through good design and regression tests.

##### Learning to Work Within ASPICE, the V-Model, and MISRA

In series development, working with coding guidelines like MISRA and ASPICE-compliant processes becomes mandatory. It adds overhead, but it also brings reliability. What I learned is that the pain is less when you embed these things early and use them smartly. When teams are experienced and project management understands the process from a developer’s point of view, ASPICE can actually speed things up. Yes, it really can! But if you're only building artifacts to "pass the audit," you're wasting time - and most likely also reducing software quality.

Well-defined requirements, thoughtful architecture, and early integration testing (… against your architecture) are critical to speeding things up at the actual implementation level (SWE.3). If you think a well-designed, consistent architecture is expensive, try working with a bad one - it’s far more costly in the long run.

Testing on the right side of the V-Model is just as important. If static code analysis is mandatory, the analysis must be accessible to developers quickly and easily - ideally integrated into the IDE. If the tooling or process doesn’t support that, the cost-benefit ratio is extremely poor compared to dynamic testing.

##### Alignment and a Great Team Spirit Boost You More Than Agile Tools 

Some of the most painful (and costly) mistakes I've seen didn’t come from bad code, but from unaligned teams. I’ve been in projects where two software teams didn’t even know who was working on the other side. I’ve also seen the opposite: well-aligned teams where goals were clear, integration worked smoothly, and problems were solved only once.

The difference often came down to roles like Scrum Master and Software Coordinator - people who keep the team talking and actively remove roadblocks that developers cannot or do not want to solve. Tools like Jira or Codebeamer help, but they don't fix anything without clear responsibilities and synchronized teams. Get the people aligned first. Sometimes, one honest sync between team leads or a well-run retrospective is worth more than weeks of perfectly maintained Kanban boards.

Never underestimate the power of informal team rituals. Simple icebreakers or check-ins can go a long way in keeping teams healthy and aligned. There are high performers and those still growing - this can shift over time. Let’s keep everyone on board, always.

##### Every Phase Has Its Joys (… and Pains)

I’ve enjoyed every phase: building quadrocopters solo, pushing autonomous shuttles into operation with an agile team, and now working in structured series development. Each phase brings its own challenges. Student work often lacks structure. Startup culture can be chaotic. Series development can make you forget that you're actually a software developer.

But all of it has made me a better engineer. I’ve learned a lot about the complexity of modern software projects. The key is to stay curious, enjoy solving problems every day, and surround yourself with people who challenge and inspire you.