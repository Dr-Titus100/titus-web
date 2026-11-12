# Changelog

Notable changes to the titus-web site, newest first. The site has no version numbers, so entries are grouped by date.

## 2026-11-12

- New Privacy and Terms pages, linked from the footer, the contact form, the Checker and the Rewrite page.
- Rewrite keeps API keys in the page's memory by default, so a reload clears them. Remember my key saves a key for 30 days, and it's hidden while the site runs on github.io, where other project sites share the same origin. Keys that earlier versions saved are removed. A Forget my key button clears every saved key, and a Show key button reveals the masked field.
- Rewrite says exactly what goes to which provider, links each provider's data policy, notes that Google may use free-tier text, and warns that requests can be billed. The page hides its key field when another site shows it in a frame.
- Rewrite requests time out after two minutes and can be stopped. Errors now say what went wrong (a rejected key, a retired model, a rate limit, a provider outage or no connection) and never show the key.
- The suggested models moved to `src/data/providers.ts`, with the date they were last checked. OpenAI's gpt-5 and gpt-5-mini, which shut down on December 11, 2026, are replaced by gpt-5.6-sol and gpt-5.6-terra, and Gemini now suggests gemini-3.8-flash and gemini-3.5-flash-lite.
- Every page has a Content Security Policy, added at build time by `scripts/add-csp.mjs`. Inline scripts are allowed by hash, and outside hosts only on the pages that use them. Pages also send a strict-origin-when-cross-origin referrer policy.
- The footer's privacy line now matches what each part of the site does. The Checker note says your text stays in your browser and the site doesn't store or send it.
- The contact form says that Web3Forms delivers the message, adds Web3Forms' free hCaptcha check, gives up after 20 seconds and keeps your message when sending fails. The email address is built in the browser behind a Show my email address button, so bots can't read it from the page source.
- Links no longer open in new tabs site-wide. The provider key links on Rewrite still do, and they now show an icon and tell screen readers.
- The copy buttons on Any chatbot load the rulebook when the page opens, so copying works in Safari, and they show an error instead of copying a missing file.

## 2026-11-10 (evening)

- On the Checker, hovering over a highlight shows the same label as a click, and both outline the exact text the pattern matched, across every line it covers.
- In the Checker's Patterns found card, the quoted-text and hidden-character lines are bold. The quoted-text line always shows, and says "Quoted text: none." when there are no quotations. The Try a sample text now includes a quotation, so the sample shows how quotes are left out.
- The privacy note under the Checker's text box no longer mentions the Python download. It now says your text stays on your device and that the website keeps no copies.
- On the Checker, clicking or tapping a highlight shows the pattern's name in a small label. Before, only hovering did. The same works for the hidden-character badges.
- On the Checker, Highlighted patterns is selected when the results appear and after each new check. The color key now shows only with Highlighted patterns.
- The Short version card on Any chatbot gives its word count as well as its character count.
- The Cleaned text tab and the Copy cleaned text button are back on the Checker and work as before. They show and copy the text with hidden characters removed. The Checker's wording says it removes hidden characters again, on the Checker and on the Overview card.
- The Checker leaves quoted text out, the same way the titus-humanizer script does. Patterns inside a quotation are no longer highlighted, quotations get a dashed underline, and the Patterns found list says how many quotations it left as written.
- The Checker no longer has the Cleaned text tab or the Copy cleaned text button, since it scores text and doesn't change it. Its hidden-character line now says "found" instead of "removed".
- "Rewrite with your key" on the Checker uses the outline style, like "Use any chatbot".
- On Any chatbot, the Full rulebook and Short version cards say that both keep quotations as written. Their word and character counts now come from the release files.
- On the Overview, the Rewrite card says quotations stay as they were, and the Check any text card says the Checker finds hidden characters and leaves quoted text out of the score.

## 2026-11-10 (later)

- In "The exercise book", the defense room is full of friends and classmates, with more friends, classmates and family watching online, and the talk runs about forty-five minutes.
- In "The exercise book", the Panthers soccer team is no longer called "not good". The story now says the team reached the second-division final and finished second.
- "The exercise book" now names Titus's mother, Akosua Yentumi. The note at the top says she is real and the events are made up. The README headings and wording also got a titus-humanizer pass.
- The blog has its first post, "The exercise book", a short story told in first person about a fish seller's sales book and a dissertation defense. It's fiction, and it says so at the top.
- Blog posts can set `fiction: true`. Those posts show a "Fiction" label on the blog list, on the home page and on the post itself.
- The README explains the fiction label and asks visitors to type their correct email in the contact form. This file is new too.

## 2026-11-10

- The home page is now a general overview of the site. It has a short intro, cards for Tools, Blog and Experience, the latest posts and a short About me section.
- All the titus-humanizer content moved to Humanizer > Overview, with no repeats. It covers the demo, the four ways to use it, the video, how it works, the rules and the before-and-after examples.
- "Checker" in the top menu is now "Humanizer". Its tabs are Overview, Checker, Rewrite, Any chatbot and Install. Overview opens first.
- Watch video, Try it free and Install buttons sit under the Overview intro. Watch video jumps to the video and highlights the button you clicked.
- Most buttons now use the outline style. On the Checker, Check text, Try a sample and Clear are all outlined, and the one you click fills in. The view tabs start unselected.
- The score note says a lower score means plainer, better writing.
- The Experience page has the older roles, awards, workshops, leadership roles and skills from the third resume.
- The About page shows Titus's photo, and its chapters run newest first.
- The source line reads "MIT licensed".
- The README matches the current site.

## 2026-11-09

- The About and Experience pages are filled in from Titus's resumes, with his AI skills work.
- The About page has a contact form. Messages go to a private inbox, and the page shows only the public address.
- The current page is highlighted in both menu rows. Links to other sites open in a new tab.

## 2026-11-08

- First version of the site. It has the titus-humanizer Checker, Rewrite, Any chatbot and Install pages, and placeholder About, Experience and Blog pages.
- The site pulls titus-humanizer's files from its latest release on each build, and rebuilds when a new release comes out.
- The Install page lets your assistant install the skill for you, and it has the promo video.
