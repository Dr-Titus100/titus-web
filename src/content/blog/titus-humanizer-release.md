---
title: "titus-humanizer: plain rewrites that keep every fact"
description: "What the free titus-humanizer skill changes, what it leaves alone, how it scores text and four ways to use it."
date: 2026-11-13T20:00:00Z
tags: ["Release", "AI writing"]
---

titus-humanizer is now available, free and open source under the MIT license. It's an editing skill for Claude and ChatGPT that rewrites text so it reads like a careful, plain-spoken person wrote it. It keeps every fact, number and name from the original, strips hidden characters before it starts, and scores the text from 0 to 1 for AI-writing patterns before and after the rewrite, so you can see what changed.

The current release is v1.2.0. The code, the rules and the tests are on GitHub at [github.com/Dr-Titus100/titus-humanizer](https://github.com/Dr-Titus100/titus-humanizer), and you can try it without installing anything at [titusnyarkonde.com](https://titusnyarkonde.com/tools/titus-humanizer/).

## Why I made it

I've been working as an AI trainer for months now, and I've learned a lot about what makes AI models sound robotic. I can spot a lot of AI-written text by eye, sometimes after reading just the first few sentences. The truth is that people sometimes sound the same way and write like robots too. No wonder AI detectors return so many false positives. So I decided to add my voice and help people write plainer, better text.

A lot of writing now passes through an AI model at some point, and readers have learned to spot the result. The signs are familiar: an em dash in every other sentence, "It's not just a tool, it's a movement", "In today's fast-paced world", "plays a vital role", a closing offer to help further. Each one is small. Together they make a paragraph feel generic, and they make a reader trust it less.

Many tools that promise to fix this swap words for synonyms. That leaves the structure in place, and the structure is often the bigger problem. The StoryScope study (Russell, Rajendhran, Pham, Iyyer and Wieting, COLM 2026) shows how much. The researchers took 10,272 human-written short stories, had five models write a story from the same prompt as each one, and compared the two sets. A classifier that saw only narrative choices, with all style features withheld, separated AI stories from human ones at 93.2% macro-F1. When Gemini rewrote 278 of its own stories to remove clichés, purple prose and redundant explanation, detection fell only from 95.5% to 93.9%. Polishing the sentences left the story choices in place.

So titus-humanizer works at three levels: the word, the sentence and, for stories and reflective writing, what the text chooses to say.

## What it does

Every rewrite runs through the same five steps.

**1. Hidden-character cleanup.** Text copied from AI tools, PDFs and web pages often carries characters you can't see, such as zero-width spaces, byte-order marks, text-direction controls, odd spaces and look-alike letters like a Cyrillic "а" inside an English word. They break search, spell-check and word counts. The skill removes them and leaves emoji, other alphabets and code alone. Quoted text belongs to the author, so the skill never touches it. However, the cleanup still removes hidden characters inside a quote because they aren't part of the quoted words.

**2. Seven hard rules.** These patterns never appear in the output:

- em dashes, semicolons, dashes used as a break between clauses, and dots, bars or arrows between items on one line
- "it's not X, it's Y" framing and its variations
- passive voice that hides who acted
- command-style titles on slides and reports
- slogans such as "One team. One vision."
- hedges such as "illustrative" or "directional" on real numbers
- chatbot lines such as "I hope this helps" and "Let me know if you have any questions"

Date ranges such as "Jul 2020 – Jun 2021" and bullets at the start of a line pass these rules, so resumes keep their layout.

**3. Judgment calls on wording.** Weak wording falls into five categories: awkward, flowery, vague, unnecessary and illogical. Each comes with a test, such as "would you say this out loud to a colleague?" The skill also cuts inflated significance ("a pivotal moment"), promotional tone, unnamed authorities ("experts say"), stock AI vocabulary such as "delve", "leverage" and "seamless", and habits such as canned openings and endings.

**4. Story-level patterns.** For fiction, personal statements, essays and speeches, it applies what StoryScope found. AI stories tend to state their moral (77% of AI stories against 52% of human ones), show emotion through stacks of body sensations (81% against 38%), lean on smell (82% against 57%) and resolve the ending through the hero's choice and inner acceptance. The skill cuts the stated lesson, names the feeling plainly and drops decorative smells and weather that mirrors the mood. Bigger changes, such as adding a subplot or reordering events, change the story itself, so it suggests those and makes them only when you ask. It never invents events, characters or references.

**5. A score from 0 to 1.** A Python script, which uses only the standard library, scores the original and the rewrite. Most of the score comes from how densely the text uses the patterns above. Sentence rhythm, repeated sentence openings and word variety make up the rest. Scores of 0.60 and up count as high, and when a rewrite still scores high, the skill takes another pass at the flagged spots.

## What it leaves alone

Some text isn't yours to rewrite. Quotations, block quotes and dialogue keep their exact wording and punctuation, whoever wrote them. The skill rewrites the text around a quote and mentions any problem inside one in its notes. The score leaves quoted text out too, so a quotation full of AI phrasing doesn't count against your rewrite. Code, file paths, links and emoji also come through unchanged.

The report tells you this happened. When the text has quotations, code, paths, links or emoji, it adds a line such as "Left as-is: 3 quotations". If the rewrite changed any of them, a "Changed in the rewrite" line says which ones to restore.

## An example

Here is a short email with AI patterns both around and inside its quotations:

> I hope this message finds you well! I wanted to reach out to touch base regarding last week's feedback session, which was facilitated by our support team. The feedback underscores a pivotal moment for our scheduling tool, highlighting the need for a more seamless experience.
>
> Dr. Mensah wrote in her survey, "Our front desk told me, 'The new booking screen is robust; it just takes three clicks too many.' I agree with them." Moreover, she added that "the reminder texts are a game-changer — patients actually show up."
>
> Our account manager, Priya, summed it up in the debrief: 'When Dr. Mensah said "three clicks too many," she meant the reschedule flow, not the first booking.' It's not just a usability issue — it's a testament to how deeply rooted our workflows are in the clinic's day.
>
> In conclusion, the team is committed to leveraging these insights to elevate the experience. Please let me know if you have any questions!

The rewrite:

> Our support team ran a feedback session with the Harlow Clinic last week. The main finding is that the scheduling tool takes too many steps.
>
> Dr. Mensah wrote in her survey, "Our front desk told me, 'The new booking screen is robust; it just takes three clicks too many.' I agree with them." She also wrote that "the reminder texts are a game-changer — patients actually show up."
>
> Our account manager, Priya, summed it up in the debrief: 'When Dr. Mensah said "three clicks too many," she meant the reschedule flow, not the first booking.' So the reschedule flow is where the extra steps are, and the team plans to act on this feedback there.

And the report under it:

```
AI-pattern score: 0.80 (high) before, 0.03 (low) after
Patterns before: AI vocabulary x7, inflated significance x3, passive voice (heuristic) x2, em dash x1, reject-then-assert x1, chatbot residue x1
Patterns left after: none
Hidden characters removed: none
Left as-is: 3 quotations
```

The greeting, "underscores a pivotal moment", "Moreover", the "not just X, it's Y" line and the closing offer are gone. The three quotations, nested quotes included, came through word for word, semicolon and em dash intact.

## Four ways to use it

You don't need Claude or ChatGPT to start.

- **The Checker** at [titusnyarkonde.com](https://titusnyarkonde.com/tools/titus-humanizer/checker/) scores any text, marks each pattern where it appears and removes hidden characters. It runs in your browser with no account, and your text never leaves your computer.
- **The Rewrite page** sends your draft and the full rulebook to Gemini, Claude or OpenAI with your own API key, then scores the original and the rewrite. Google's free tier costs nothing, though Google may use free-tier text to improve its products.
- **Any chatbot.** Copy the rulebook from the site into Gemini, Copilot, Perplexity or whatever you already use, and ask it to humanize your text. A short version fits assistants with message limits.
- **Install it.** The simplest way is to give Claude, Claude Code, ChatGPT or Codex the repository link, https://github.com/Dr-Titus100/titus-humanizer.git, and ask it to install the skill. Each release also includes `titus-humanizer.zip`, which you can upload in claude.ai under Customize > Skills or in the ChatGPT app under Skills. In Claude Code, it installs as a plugin:

```
/plugin marketplace add Dr-Titus100/titus-humanizer
/plugin install titus-humanizer@titus-humanizer
```

The README has the full steps for each, plus a Custom GPT setup for plans without skills.

Once installed, you use it by asking. "Humanize this:" followed by your text returns the rewrite and the short report. "Rewrite this and tell me what you changed" adds a list of changes. "Does this sound like AI?" returns a review that quotes each problem, names its category and gives a plainer version. "Do a deeper rewrite of this story" allows the structural changes.

## What the score measures

The score counts the AI-writing patterns this skill targets, so a lower score means plainer, better writing. However, a low score doesn't prove a person wrote the text. The score isn't the output of GPTZero, Turnitin, or any other detector. The cleanup removes invisible characters, but it does not remove file metadata. This skill does not target AI watermarks, but it can help reduce them. AI watermarks are invisible to the eye and build up statistically throughout the text, so they are hard to target. A text can look completely normal and still contain AI watermarks, and the only way to fully detect them is with a detector that knows the AI company's secret key.

## How it's tested

The repository has 74 automated tests that run on Python 3.9 and 3.13 with every change. They include resume and prose examples with stored before-and-after output, so any change to the script shows up as a diff. They also check that plain human writing scores low, that dates and bullets on a resume pass, and that every quotation in an original survives word for word in its rewrite.

The quote detection misses two very rare cases: three levels of nested quotes that reuse straight double quotes, and an inch mark inside a quotation. In both, part of the quote may count toward the score, and the rewrite still leaves the quote untouched. The README lists both.

## Sources

The rules draw on professional writing standards for editing AI-generated text, Wikipedia's [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing), which the skill paraphrases, and the [StoryScope](https://arxiv.org/abs/2604.03136) study. All of the skill's examples are original.

## Feedback

Paste a draft into the [Checker](https://titusnyarkonde.com/tools/titus-humanizer/checker/), or install the skill and ask it to humanize something you wrote this week. If a rewrite drops a fact, misses a pattern or flags something it shouldn't, open an issue on [GitHub](https://github.com/Dr-Titus100/titus-humanizer/issues) with the draft and what you expected. Those before-and-after pairs help me improve the rules.
