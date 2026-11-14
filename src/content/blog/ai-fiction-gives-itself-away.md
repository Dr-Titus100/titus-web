---
title: "AI fiction gives itself away through its stories"
description: "A study of 61,608 stories found that the choices a story makes, such as how it ends and who drives the plot, separate AI fiction from human fiction even after an AI model polishes the prose."
date: 2026-11-13T21:00:00Z
tags: ["Research", "AI writing"]
---

Most advice about spotting AI writing focuses on words: "delve", "tapestry", em dashes, "It's not X, it's Y". A new study asks a harder question. If you ignore the wording completely and look only at the choices a story makes (who drives the plot, how time moves, how it ends), can you still tell a human story from an AI one?

Most of the time, you can. The study, StoryScope, comes from researchers at the University of Maryland and Google DeepMind: Jenna Russell, Rishanth Rajendhran, Chau Minh Pham, Mohit Iyyer and John Wieting. The paper appeared at COLM 2026, a conference on language models ([arXiv 2604.03136](https://arxiv.org/abs/2604.03136)). Here's what they did, what they found and what it means for anyone who writes or edits with AI. Every number below comes from the paper.

## Why this matters now

AI fiction has already reached readers. In March 2026, the publisher Hachette pulled the horror novel *Shy Girl* after it was flagged as about 78% AI-generated. The paper calls it the first commercially published novel canceled over AI allegations. In a sample of 14,000 self-published novels on Amazon, the detection company Pangram flagged nearly 20% as largely AI-generated, up 41% from the year before.

Most AI detectors look at surface clues, such as word choice and sentence patterns. Those clues change every time the models change, and a quick edit can remove them. The StoryScope team wanted to know whether the deeper choices in a story leave clues of their own.

## How the study worked

**Six versions of every story.** The team started with 10,272 short stories written by people and published in books. For each story, an AI model wrote a short prompt describing its basic idea. Five AI models then wrote their own story from each prompt: Claude, GPT, Gemini, DeepSeek and Kimi. Together with the human original, that gave six versions of every story, 61,608 stories in all, averaging about 4,750 words each.

**Stripping out the wording.** Next, an AI model turned each story into a structured summary covering ten aspects of storytelling, such as characters, relationships, plot, setting, time and point of view. The summary kept what happens in the story and dropped how it's worded. That let the team compare story choices without style getting in the way.

**Writing a checklist.** An AI model compared the six versions of 100 stories side by side and noted where they differed. From those notes, it drafted questions about story choices, and the team trimmed the list to 304. One example: "How explicitly does the story articulate its themes or morals?", answered on a scale of 1 to 5. An AI model answered every question for every story. Its answers were consistent from run to run, and they matched closely with answers from human checkers.

**Training a detector.** Finally, the team trained a detector on most of the stories and tested it on stories it had never seen. For the main tests, they removed every question about writing style, so the detector could judge only the story choices. They also picked out 30 "core" features that separate human stories from all five AI models, and 75 "fingerprint" features that point to one AI model in particular.

## What they found

The paper measures detection with a score called macro-F1. It runs from 0 to 100, where 100 means the detector labeled every story correctly.

**Story choices alone give AI away.** With no style information at all, the detector scored 93.2 at telling human stories from AI ones. Adding style raised that to 96.0. So the story choices carry about 97% of the signal on their own. The 30 core features alone scored 84.8.

**Length isn't the explanation.** When the team matched the AI stories to the human stories in length, the score stayed at 93.2.

**Polishing the prose doesn't hide it.** This is the result I find most useful. The team took 278 stories written by Gemini and had Gemini revise them with LAMP, an editing method built from professional writers' examples. LAMP targets seven kinds of AI writing problems, such as clichés, repeated explanations and overly flowery prose. Before the edit, the detector scored 95.5 on these stories. After the edit, it scored 93.9. The polished stories were almost as easy to catch, because, in the paper's words, editing the prose "does not alter the structural narrative choices" the detector relies on.

**Tools that read the sentences still do better.** Detectors trained on the actual text scored between 99.7 and 99.9. Binoculars, a detector that isn't trained on these stories, scored only 55.9. StoryScope's strength is that it can explain itself. Each of its decisions traces back to a specific story choice, and those choices should hold up longer than surface clues as AI models change.

## How AI stories differ from human stories

The 30 core features fall into a few clear patterns.

**AI explains the lesson.** In 77% of AI stories, the narrator spells out the story's theme, against 52% of human stories. A story about grief often ends with the narrator stating what the character learned. Characters in AI stories debate big philosophical questions more often (59% against 34%), and when AI hints at another work, it tends to stay vague (72% against 50%). In the authors' words, AI "spells out meaning rather than trusting the reader to infer it."

**Human writers take more detours.** AI stories run in a straight line from cause to effect. They usually end because the main character makes a choice (69% against 46%), and they often end with the character reaching some inner understanding or acceptance (47% against 27%). Most AI stories have no subplots at all (79%, against 57% of human stories). Human writers use more flashbacks, time jumps and stories told out of order, and they're more willing to leave an ending open. The paper's example: a human mystery might open at the funeral and move backward through decades, while an AI tells it in order, from the first clue to the big reveal.

**AI describes the body and the senses.** AI shows emotion through physical sensations far more often (81% against 38%). Where a person might write that a character "felt afraid", AI writes a tightening chest, cold sweat and a dimming lamp. Human writers name the feeling directly 29% of the time, against 8% for AI. AI also leans more on smell (82% against 57%) and on weather or rooms that mirror a character's mood.

**Human writers mention the real world.** People name specific books and authors nearly twice as often (47% against 24%). AI tends to avoid naming real brands, places or works. People also break the fourth wall more often (67% against 39%) and speak to the reader directly more often (28% against 7%). As the authors put it, AI "writes as though no one is watching."

**Human stories are more varied.** They move through more places, use more dialogue, tie more subplots back to the theme (42% against 21%) and give more of their main characters mixed morals (59% against 38%).

## AI stories all land in the same place

The researchers placed every story on a map based on its story choices. Stories from all five AI models bunched together in one tight area, and human stories sat apart from them. Even the AI model closest to human writing was farther from the human stories than the two most different AI models were from each other.

Human stories were also more unusual. About a quarter of them (24.7%) ranked among the rarest 10% of all the stories, against 7.1% of AI stories. When the team compared the six versions written from the same prompt, the human version was the most unusual one 57.8% of the time. By chance alone, that would happen one time in six (16.7%).

## Each AI model has its own habits

Telling the six sources apart is harder. Using only story choices, the detector scored 68.4 at naming which of the six wrote a story, and 77.3 with style added. Random guessing would score about 16.7. Human stories were the easiest to pick out, followed by Claude and GPT. Gemini, DeepSeek and Kimi were often mistaken for one another, and the most common mix-up was between Gemini and DeepSeek.

The paper describes each model's habits:

- **Claude keeps it cool.** It stands out the most of the five. Its stories build the least tension, its narrative voice is the most even, and it follows storytelling traditions more than it breaks them (62% of its stories, against 39% to 56% for the others). It likes epilogues, avoids dream sequences and prefers quiet endings.
- **GPT likes to gossip.** It uses gossip and rumor to drive the plot more than the others (64% against 44% to 55%). It often tells a story as a look back at events from years or decades earlier, and it writes large casts the way people do. It also breaks expectations more than the other models (41% against 27% to 36%) and leaves reconciliations unresolved.
- **Gemini, DeepSeek and Kimi are "triplets",** but each has quirks. DeepSeek gives away important background early, where others hold it back. Gemini writes the neatest endings, with long wrap-ups, and the darkest settings (88% tagged bleak and oppressive). Kimi has the fewest quirks and sits in the middle of the AI pack.

## What this means for writers and editors

The study is about detection, but its findings work as an editing checklist. If a draft started with AI, or if you just want a story to feel less generic, look at these places:

- Cut the line where the narrator explains the lesson, and end on the event, image or decision.
- Name a feeling plainly instead of stacking body sensations.
- Drop smells and weather that exist only to set a mood.
- Name the book, the place or the song when you mean a specific one.
- Leave a thread open, let an outside event shape the ending, or tell part of the story out of order.
- Keep your odd details and your asides to the reader. They're among the most human things in a draft.

The LAMP test shows why this matters. Polishing the sentences left these choices in place, and the detector still caught the edited stories almost as well as the originals.

I built Part 6 of [titus-humanizer](https://github.com/Dr-Titus100/titus-humanizer) on these findings. In a normal rewrite, it cuts stated morals, stacks of body sensations, decorative smells and weather that mirrors the mood. Bigger changes, such as adding a subplot, reordering events or opening up an ending, change the story itself. So the skill suggests those and makes them only when the writer asks.

## The data is open

The team shared their code, the 10,272 writing prompts, the 51,336 AI-written stories and the checklist answers for every story at [github.com/jenna-russell/storyscope](https://github.com/jenna-russell/storyscope). The human stories aren't included, because of copyright. The authors note that they used the book collection only for academic research, and that they don't support using it to train AI models or to generate text for sale.

## What the study shows

AI fiction differs from human fiction in its sentences, and also in the story underneath them. AI models keep making the same choices: explain the theme, keep the plot on one track, end with the hero's inner change, and show feelings through the body. Human stories cover a much wider range, and more of them are unusual. As the authors conclude, newer models and simple edits keep wiping out the surface clues, while changing these story choices "requires significant structural rewrites."

*Source: Jenna Russell, Rishanth Rajendhran, Chau Minh Pham, Mohit Iyyer and John Wieting. "StoryScope: Investigating idiosyncrasies in AI fiction." COLM 2026. [arXiv 2604.03136](https://arxiv.org/abs/2604.03136).*
