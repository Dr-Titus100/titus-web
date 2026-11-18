---
title: "AI is learning to build software"
description: "Coding assistants have grown from autocomplete tools into agents that can inspect a project, change many files, run tests and hunt for bugs."
date: 2026-11-18T12:15:00Z
tags: ["AI"]
---

The first popular AI coding tools behaved like very fast typists. A developer wrote a comment or started a function, and the tool suggested the next few lines. Today's coding agents take on a bigger assignment. They explore a codebase, propose a plan, edit several files, run commands, read the errors and try again.

Money has followed. Menlo Ventures estimates that companies spent $34 billion on AI coding tools in the year to September 2026, nearly eight times the year before, and that Anthropic's Claude Code and OpenAI's Codex took about 70% of it. In McKinsey's 2026 State of AI survey, about one in five organizations said they were using coding agents at scale. At its Ignite conference in November 2026, Microsoft introduced its own family of agentic coding models for GitHub Copilot.

This matters even to people who never write software. Code runs banks, hospitals, schools, cars and public services, so changes in how people produce it will affect the speed, cost and safety of almost every industry.

## What coding agents do well

Agents help most with repetitive, well-defined work. They can explain unfamiliar code, write tests, update documentation, find the likely cause of an error or make the same structured change across a large project. They also help experienced developers move quickly between programming languages and tools.

For small organizations and individuals, this makes building software more accessible. A person can describe a simple internal tool in plain language and get a working prototype much sooner than before.

## A working program can still be wrong

Software quality is more than whether a program runs. Code must be secure, maintainable, accessible and faithful to the real business rules. An AI agent may introduce a security hole, depend on a library that doesn't exist, remove an important check or "solve" a failing test by weakening the test.

These risks show up in research. Veracode's 2025 study of AI-generated code found security weaknesses in 45% of the samples it tested. In a 2025 study from the University of Texas at San Antonio, about one in five of the software packages that AI models recommended didn't exist, which gives attackers a chance to publish fake packages under those names.

The danger grows when an agent can run commands or reach outside services. A malicious instruction hidden in documentation or online content may try to redirect the agent. Developers respond with sandboxes, limited permissions, code reviews and logs.

AI-generated code also raises a long-term maintenance question. If a team produces more software than it understands, every future change becomes riskier. Speed at the start can create costly cleanup later.

## How the developer's job changes

Developers now spend more of their time describing goals, splitting up work, reviewing changes, designing systems and checking results. Deep knowledge still matters, because someone has to recognize a plausible but dangerous implementation.

Entry-level work may change the most. Agents now handle many of the routine tasks that once taught junior developers the craft. Companies will need deliberate apprenticeships that ask newer workers to review AI output, trace failures and explain design decisions.

Coding agents will almost certainly make software faster to build. Whether they make it better depends on the people and processes around them. The strongest teams treat AI output as a contribution that still needs review, the same as code from a new colleague.

## Further reading

- [Microsoft: Ignite 2026, building the frontier ecosystem](https://blogs.microsoft.com/blog/2026/11/17/ignite-2026-building-the-frontier-ecosystem/)
- [Menlo Ventures: 2026, the state of enterprise AI](https://menlovc.com/perspective/2026-the-state-of-enterprise-ai/)
- [McKinsey: The state of AI in 2026](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai)
- [GitHub Blog: AI and ML](https://github.blog/ai-and-ml/)
- [OpenAI Codex](https://openai.com/codex/)
- [Anthropic Claude Code](https://www.anthropic.com/claude-code)
