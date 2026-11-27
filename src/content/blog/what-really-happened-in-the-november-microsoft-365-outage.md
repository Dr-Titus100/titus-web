---
title: "What really happened in the November Microsoft 365 outage"
description: "For almost a full day, much of the world couldn't open Outlook. Here is what caused it, who it hit hardest, what it put at risk and what it cost."
date: 2026-11-27T09:15:00Z
tags: ["Tech"]
---

On Thursday, November 12, 2026, at 4:20 PM UTC (11:20 AM on the US East Coast), Microsoft's systems flagged that people were having trouble reaching their email. Within two hours, Outlook and Exchange Online had stopped working for most users around the world. Microsoft declared the main impact over at 4:10 PM UTC on Friday, November 13, 23 hours and 50 minutes after it began. Its last update to customers came early on Saturday.

Microsoft says no attacker played a part. A months-old software bug, a surge of traffic and a shortage of spare servers came together on a busy afternoon, and the failure spread from there.

## What caused it

Microsoft published a preliminary post-incident report on November 15 and a final one on November 20. Both sit in the Microsoft 365 admin center, which only customers can sign in to, and IT news sites have published copies and summaries. The reports describe four problems that lined up at once.

### A hidden bug from July

In July, Microsoft rolled out a change to the gateway servers that sit between users and Microsoft 365. Under heavy load, the change caused processes inside the servers to fight over the same locks, which used up the servers' processor time and memory. For more than three months nothing went wrong. The bug was worse on newer machines with more processor cores, and Microsoft's load tests had been run on older hardware with fewer cores, so the tests never caught it.

### A traffic surge from Teams

About 15 hours before the outage, at 1:07 AM UTC on November 12, Teams automatically failed over and moved its traffic onto the main gateway, the same one that serves Exchange Online email. Microsoft's final report says the problem started in its US East region, and the switch moved Teams traffic from around the world onto that gateway.

### Less spare capacity

Nearly 14% of the gateway servers were already out of service. The preliminary report blamed an unrelated issue from the day before. The final report, as summarised by TechBag, says those servers were out as part of a routine software deployment.

### The US afternoon peak

All of this hit during the busiest stretch of the day for US users.

### How one failure became a global one

As servers became overwhelmed, the system sent their traffic to healthy servers, which then became overwhelmed too. Within two hours, more than 80% of the gateway servers had stopped responding. The barriers that normally keep a failure in one region from spreading to others didn't hold.

Recovery was slow. When engineers restarted servers, waiting traffic swamped them and they failed again. A normal rollback was hard because the faulty change was months old. Engineers eventually returned the connection code to its earlier working version, fixed each server one at a time, and added capacity. Asia-Pacific recovered first, then Europe, and webmail was back to normal worldwide by 2:17 PM UTC on Friday.

## What stopped working

Exchange Online was hit hardest. Most people couldn't open their mailboxes in Outlook or other mail apps, and email arrived hours late. Features in Teams, SharePoint, OneDrive and Copilot that rely on Exchange Online also broke. The final report adds that most users couldn't launch the Copilot desktop apps or load the web apps, and that two Microsoft security tools fell behind. Purview sent its alerts late, and Defender was slow to remove harmful emails that had already reached inboxes.

Microsoft hasn't said how many people lost access. About 430 million people use Microsoft 365. Downdetector received reports from 74 countries and territories within an hour of the start, and Outlook reports alone peaked at about 130,000.

## Who was hit hardest

Hospitals, governments and schools felt it most, because they run so much of their daily work through email and calendars.

In health care, some NHS staff in England couldn't use NHS.net email, some switched to paper records, and hospitals cancelled some operations. In Toronto, Unity Health declared a "code grey" for an infrastructure failure, and several other city hospitals reported email problems. A Montreal hospital reported delays to appointment requests.

Among governments, the outage reached Australia's federal police and its intelligence agency ASIO, government systems in Japan and Singapore, and the Supreme Court of the Philippines. In the US House of Representatives, staff said they lost a day of legislative work. England's Department for Education, the exam regulator Ofqual and many schools reported disruption too.

VIA Rail in Canada warned passengers that trip emails might not arrive. The Indian airlines IndiGo and Akasa Air had problems with their customer support email. Brokers, insurers and fund managers in Taiwan reported disruption, and one firm cancelled a planned bond repurchase deal. Richemont delayed its quarterly results, and Workhorse Group moved its results call from November 12 to November 16.

AI tools went down with it. OpenAI's Microsoft connectors and Anthropic's Microsoft 365 connector, including the Claude for Outlook add-on, stopped working for most requests, though ChatGPT and Claude themselves stayed up.

## Was it a cyberattack?

No. Microsoft said it was "a technical issue not related to cyber or AI / agents." Copilot broke because it depends on the same services as email.

## What security risks it created

Even without an attack, the outage opened several gaps.

### Phishing that used the outage as bait

On November 13, Microsoft Threat Intelligence spotted fake outage notices. The subject lines began with "Outage -" and the emails quoted Microsoft's real incident number, EX1550543. They told people that Microsoft would delete email held during the outage within 24 hours unless they clicked a "Restore Messages" button, which led to a fake Microsoft sign-in page. Microsoft said the campaign looked like an attempt to steal passwords but couldn't confirm that any were stolen. The security firm Fortra found that some of these emails got past Microsoft's own filters.

### Security teams lost sight of their systems

Defender and Purview features ran late, and many security alerts reach staff through Outlook. Security experts told TechTarget and Infosecurity Magazine that a quiet dashboard during the outage didn't mean nothing was happening, and that suspicious sign-ins or new mail-forwarding rules from those hours deserve a second look.

### Risky workarounds

Employees who couldn't reach their work email turned to personal email, personal file sharing and messaging apps, which sit outside company security controls. Some IT teams relaxed rules or granted temporary admin rights and MFA exceptions to keep people working. Experts advised reviewing and removing those exceptions afterward.

### Phone scams

Experts warned that attackers could call or text staff posing as IT support and ask for password resets or MFA approvals.

### Lost email

Microsoft says no business email went missing for good, because it extended the time it keeps retrying delivery from 24 to 48 hours. Some delayed messages to consumer mailboxes that nobody had opened in more than 30 days expired, and the senders got bounce notices.

## Did businesses lose money?

Yes, mostly through lost work time, although no one can measure it exactly. The estimates vary widely:

- About $7 billion in lost productivity, from the think tank Anderson Economic Group, as CNN reported it. The group hasn't published its method.
- About $16 billion in economic losses, from the cyber risk firm Kovrr, which Reuters described as a "back-of-an-envelope" figure. Kovrr put insured losses at about $700 million.
- Probably under $100 million in insured losses, with an upper limit of $350 million, from the insurance modeller CyberCube. It noted that email isn't part of the payment process for most businesses, so many could keep trading.

The gap between these figures comes from what each one counts. The productivity estimates count hours of lost work. The insurance estimates count only losses that cyber policies would pay for, and many policies don't cover an outage at a cloud provider.

The sources I read don't report any lawsuits or a drop in Microsoft's share price.

### Refunds from Microsoft

Microsoft's service agreement for Exchange Online offers credits when uptime falls below set levels. Someone who couldn't use email for the whole outage lost almost 24 hours, so the service worked for them about 96.7% of November. At that level, Microsoft refunds half of that month's Exchange Online fee. Customers have to claim the credit through the admin center or their reseller by the end of December. The agreement says the credits don't cover lost revenue or other business losses.

## What Microsoft says it will change

The final report lists 13 follow-up actions, 9 of them with deadlines running to early 2027. They include:

- making Teams fail over only in the affected region
- splitting gateway servers into separate pools so a failure can't spread across the whole fleet
- spotting a long loss of capacity before spare room runs out
- load testing on the newest, highest-core hardware at peak traffic
- bringing servers back gradually after a failure so waiting traffic doesn't knock them over again
- telling customers faster

The first notice to customers went out about 20 minutes after the broad impact began. Four of the dated fixes are due by the end of December 2026 and the other five by the end of March 2027.

## Sources

- Microsoft, preliminary post-incident review for EX1550543 and MO1550821, dated November 15, 2026, as reproduced by [Office Watch](https://office-watch.com/2026/microsoft-365-outage-explained/).
- Microsoft, final post-incident review, dated November 20, 2026, as summarised by [TechBag](https://www.thetechbag.com/blog/microsoft-365-final-report-teams-traffic-newer-servers) and [Xcelocloud](https://www.xcelocloud.com/resources/microsoft-365-outage-final-report).
- [Microsoft service health record EX1550543](https://www.cloudadminhub.com/microsoft-365-service-health/ex1550543/), Cloud Admin Hub.
- [ABC News](https://abcnews.com/US/outlook-outage-cause-microsoft-reason-teams-down/story?id=138174626), "Microsoft identifies issues leading to global Outlook outage."
- [TechRadar live coverage](https://www.techradar.com/news/live/outlook-outage-nov-2026), November 12 to 13, 2026.
- [AscenWork](https://www.ascenwork.com/blogs/microsoft-365-outage-november-2026-explained/), "Microsoft 365 outage November 2026 explained."
- [ACS Information Age](https://ia.acs.org.au/article/2026/microsoft-says-months-old-bug-caused-global-outage.html), "Microsoft says months-old bug caused global outage."
- [Office 365 for IT Pros](https://office365itpros.com/2026/11/16/exchange-online-outage-nov26/), on the outage and service credits.
- [Al Jazeera](https://aljazeera.com/news/2026/11/13/microsoft-hit-by-global-outages-what-happened-and-why), "Microsoft hit by global outages: What happened and why?"
- [Wikipedia, 2026 Microsoft outage](https://en.wikipedia.org/wiki/2026_Microsoft_outage), for the NHS, US House, school and Richemont reports and the Anderson Economic Group estimate.
- [ForkLog](https://www.forklog.com/en/global-microsoft-365-outage-affects-governments-businesses-and-ai-firms/) and [IBTimes Singapore](https://www.ibtimes.sg/A000P1W), on governments, airlines, Taiwan's finance firms and AI tools.
- [Streamline](https://streamlinefeed.co.ke/news/microsoft-outlook-outage-disrupts-hospitals-and-rail-worldwide), on Canadian hospitals and VIA Rail.
- [SecurityWeek](https://securityweek.com/microsoft-rules-out-cyberattack-in-outage-warns-of-phishing-campaign), on Microsoft's statement and the phishing campaign.
- [Fortra](https://www.fortra.com/blog/threat-actors-exploit-microsoft-365-outage-credential-phishing-campaign), on the phishing emails.
- [TechTarget](https://www.techtarget.com/news/microsoft-outage-puts-security-monitoring-recovery-under-review/874793/) and [Infosecurity Magazine](https://www.infosecurity-magazine.com/news/microsoft-365-outage-security/), on security monitoring and workarounds.
- [FourWeekMBA](https://fourweekmba.com/ai-microsoft-365-outage-explained-cause-cost-and-7-numbers/), for the Kovrr and CyberCube estimates as reported by Reuters and CyberCube.
