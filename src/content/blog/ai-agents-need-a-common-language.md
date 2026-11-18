---
title: "AI agents need a common language"
description: "The next phase of AI may depend less on one brilliant model and more on whether different agents, tools and services can work together safely."
date: 2026-11-18T12:00:00Z
tags: ["AI"]
---

Imagine hiring a capable assistant who can't open your calendar, can't read the files you share with them and can't talk to anyone outside the office. Intelligence alone wouldn't make that assistant very useful.

AI agents have the same problem. A model may reason well about a task, but it also needs structured ways to reach data, call tools, find other agents and prove what it's allowed to do. That's why technical standards with names such as MCP, A2A and Agent Skills keep coming up in conversations about AI.

## The plumbing behind an AI agent

The Model Context Protocol, or MCP, gives AI applications a common way to connect to tools and information. Anthropic released it as open source in November 2024. An MCP connection might let an assistant search an approved document library, query a database or work inside a software development environment.

Agent2Agent, usually called A2A, handles a different job: communication between independent agents. Google created it and later donated it to the Linux Foundation. Agent Skills, which Anthropic also started, packages task instructions, scripts and resources into a folder that an agent loads only when a task calls for it.

Most people will never see these details. The benefit will feel familiar, though. Shared web and email standards let people communicate across devices and companies. Agent standards could do something similar for AI, so an organization could switch models without rebuilding every connection from scratch.

## Compatibility doesn't create trust

A universal connector also raises a universal security question. If an agent can reach an inbox, a customer database or a payment system, a malicious instruction hidden in a document might try to misuse that access. Security researchers call this prompt injection. A poorly designed agent could leak information or take an action its user never wanted.

So standards need identity, permissions, consent and logs on top of compatibility. An agent should get the least access a task requires. Sensitive actions should need a person's confirmation. And an organization should be able to see which agent asked for an action, which tools it used and what happened.

## Why the standards race matters

Without shared standards, companies can get locked into one AI vendor's products. With too many competing standards, developers face a confusing patchwork. One answer has been to hand major projects to a neutral home.

In December 2025, the Linux Foundation launched the Agentic AI Foundation (AAIF) with three founding projects: MCP from Anthropic, goose from Block and AGENTS.md from OpenAI. Amazon Web Services, Google, Microsoft, Bloomberg and Cloudflare joined as top-tier members. By October 2026 the foundation hosted ten projects, including A2A and Agent Skills, so the main protocols from rival companies now sit under one roof.

The standards that win will shape who controls the market for AI agents. They'll decide whether people can move their workflows between services, whether smaller developers can compete, and whether security rules sit in the foundation from day one or get added after something goes wrong.

These quiet protocols will help decide the future of AI as much as the models do, because they set what models can reach, whom they can talk to and when they must stop and ask a person for permission.

## Further reading

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Agent2Agent Protocol](https://a2a-protocol.org/)
- [Linux Foundation: Formation of the Agentic AI Foundation (December 2025)](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)
- [Linux Foundation: Agent Skills and three other projects join the AAIF (October 2026)](https://www.linuxfoundation.org/press/agentic-ai-foundation-announces-four-new-projects-agent-skills-open-responses-openenv-and-opensandbox)
- [Agentic AI Foundation](https://aaif.io/)
