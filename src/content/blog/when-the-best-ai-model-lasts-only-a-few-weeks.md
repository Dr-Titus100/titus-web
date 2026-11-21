---
title: "When the \"best\" AI model lasts only a few weeks"
description: "The fast turnover of leading AI models is exciting for users and exhausting for anyone trying to build dependable systems."
date: 2026-11-21T12:00:00Z
tags: ["AI"]
---

Most technologies have a useful period of stability. A company buys software, trains its staff and expects the investment to last for years. AI moves to a different rhythm. New models appear constantly, prices change, and yesterday's leader can quickly become slower, pricier or weaker than a new rival.

Vercel, a company whose AI Gateway passes more than 100 trillion tokens a month between apps and AI labs, put numbers on this in November 2026. At the median, a new model version arrived every 61 days. A typical model hit its peak use within a month of launch, and a month after that peak, three in four of the teams using it had switched to something else. In October 2026, more than half of the language-model requests on the gateway went to models less than 60 days old. Before September, those new models had never handled more than 30% of requests. By October they handled more than half.

Vercel described the result as a "half-life" of about six weeks. The figure describes how quickly developers move their traffic to newer options. The older model keeps working. Older models don't vanish either. Seven in ten teams that use at least 10 million tokens a month still used a model at least ten months old, though for a typical team it handled less than 3% of the work.

## Why switching happens so quickly

AI models differ from one another. One may be strong at coding, another at reading images and another at fast, cheap answers. A new release can offer better results at a lower price, which makes switching worth the effort.

Developers can also put a routing layer between their app and several models. They can send simple requests to a low-cost model and hard ones to a frontier model, which makes switching easier still. Vercel found that the top 1% of teams by spending used a median of 29 different models.

## The hidden costs of constant upgrades

Changing models is riskier than installing a routine software update. The new system may read instructions differently, refuse different requests or format its answers in an unexpected way. An automated workflow that ran reliably yesterday can fail quietly after a switch.

So organizations have to test models against their own real tasks. A customer-service company should measure factual accuracy and tone. A hospital needs clinical validation and privacy safeguards. A bank must check security, fairness and regulatory compliance. A public leaderboard can't answer those questions.

Constant switching also makes accountability harder. If someone challenges a decision six months later, the organization needs to know which model version produced it, what instructions it received and what information it could see.

## Building for change

Chasing every release is a poor strategy. A better one is to plan for controlled change: keep model connections modular, maintain a set of realistic test tasks, record which version did what, and test a new model before moving sensitive work to it.

Consumers can follow a simpler rule. Pick the tool that does the job you need reliably. The newest model isn't automatically the best one, and a dramatic launch demo says little about how a tool performs day to day.

The short shelf life of AI models shows a young, competitive industry. It also suggests that the lasting advantage may belong to the people and organizations that can test, combine and replace models while staying in control of their work.

## Further reading

- [Vercel: AI Gateway Production Index, November 2026](https://vercel.com/blog/ai-gateway-production-index-november-2026)
- [TechRadar: Vercel data points to a six-week model half-life](https://www.techradar.com/pro/teams-are-moving-to-new-models-almost-as-fast-as-labs-release-them-vercel-data-reveals-ai-models-now-have-a-half-life-of-just-six-weeks-with-most-most-ai-traffic-running-on-models-less-than-two-months-old)
- [McKinsey: The state of AI in 2026](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai)
