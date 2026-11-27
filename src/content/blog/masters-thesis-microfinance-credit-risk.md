---
title: "What makes a microloan fair, and when do borrowers stop paying?"
description: "My master's thesis looked at interest rates and loan defaults at a microfinance institution in Ghana, using both mathematics and real loan records."
date: 2026-11-27T11:20:00Z
tags: ["Research"]
---

In June 2020 I defended my Master of Science thesis in Mathematical Sciences at the African Institute for Mathematical Sciences (AIMS) in Kigali, Rwanda. Professor Corina Constantinescu of the University of Liverpool supervised my thesis. Its title is "Credit Risk Modelling in Microfinance: A Case Study of a Microfinance Institution (MFI) in Ghana."

Microfinance institutions lend small amounts to people that banks often turn away, such as market traders, farmers and small business owners. These loans can help families start or grow a business. They also tend to carry very high interest rates, and many borrowers miss their scheduled repayments and end up owing money that is overdue. I wanted to know two things. What would a fair interest rate on a microloan look like? And what actually predicts whether a borrower will stop paying?

## Part one: a formula for a fair lending rate

The economists Robert Jarrow and Philip Protter pointed out that almost no research had asked how to set fair interest rates in microfinance. They gave a theoretical definition of a fair rate. My thesis built on that definition and added a condition. A fair rate should also let borrowers repay as much as they can while the lender recovers as much as it can. I set this up as an optimization problem, which is a way of finding the best possible value under a set of limits.

From there I derived a "back-of-the-envelope" formula that a regulator could use to estimate a fair rate without years of detailed data. I worked it out two ways, using two standard methods for repaying a loan (a sinking fund and a level annuity). Both gave the same rate. The level annuity version takes much more computing once a loan runs past three periods.

The formula showed that fair microloan rates rise steeply, in an exponential pattern, as the base interest rate in the economy goes up. They also climb quickly when defaults become more frequent or when the cost of issuing and monitoring a loan is large compared with the loan itself. In one scenario, with the Bank of Ghana rate at 14.5% and the lender spending 10% of the loan's value on issuing and monitoring it, the fair rate came out at about 37% at most.

## Part two: why group loans work better with a leader

Many microloans go to groups of borrowers who share responsibility for repaying. I built a model of how people in a group influence each other. It showed that four things lower the risk of default in a group loan:

- having a group leader who keeps an eye on the other members
- giving progressively larger loans to borrowers who repay
- charging progressively lower rates on those larger loans
- linking the microfinance institution with a regular bank, so borrowers can hope to move on to bigger loans later

## Part three: what real loan records showed

For the data, I worked with a microfinance institution in Ghana that has offices in Accra, Ashaiman, Tamale and Bolgatanga and about 22,000 customers. The sample covered 4,450 customers. I removed 46 of them because their records had too many errors or missing values.

The records didn't say who had defaulted, so I needed a rule. I counted a borrower as having defaulted once they were more than 91 days behind on payments, which matches the three-month length of a government treasury bill. By that rule, 3,687 borrowers had defaulted and 717 had not. The interest rates were high. About three in four loans carried a rate above 50% a year.

I used survival analysis, a set of methods built to study how long it takes for something to happen. Doctors use it to study how long patients live after a treatment. Here, the "event" was a default on the microloan.

The main findings:

- **The first six months were safe.** Almost nobody defaulted in the first six months of a loan. After that, defaults rose quickly. The median time to default was eight months.
- **How often borrowers paid mattered most.** Borrowers who paid weekly defaulted sooner than those who paid monthly, with median times of 8 and 10 months. In every model I fitted, repayment frequency was the strongest predictor of default. About 92% of the institution's customers paid weekly.
- **High interest alone didn't predict default.** Borrowers paying more than 50% and those paying less had similar survival curves. Interest rates seemed to matter in combination with other factors, and their effect changed over the life of the loan.
- **Gender made no difference.** Gender was the only factor that wasn't statistically significant in any model.
- **Staff loans were the safest.** Loans to the institution's own staff lasted longest, with a median of 13 months before default, probably because staff repay straight from their salaries.

The models predicted defaults correctly about 71% of the time overall. Their accuracy rose over the life of a loan, because most of the information about default arrives after the six-month mark.

## What I recommended

- Keep microloans short, no longer than about 8 to 10 months.
- Set a legal ceiling on microfinance interest rates. I suggested no more than three times the Bank of Ghana rate, once lenders bring their default rates down.
- Reward good borrowers with larger loans at lower rates.
- Always appoint a group leader with good social ties for group loans.
- Partner with regular banks.
- Collect and store data properly. Much of my time went into cleaning messy records.

The study used one lender, so the results may differ elsewhere. A year later, my co-authors and I used the same lender's data in a published paper that applies machine learning to the same question. That paper has [its own post on this blog](/blog/machine-learning-microcredit-scoring/).

## Sources

- Nde, T. N. (2020). *Credit Risk Modelling in Microfinance: A Case Study of a Microfinance Institution (MFI) in Ghana.* MSc thesis, African Institute for Mathematical Sciences, Rwanda.
- Jarrow, R. and Protter, P. (2019). Fair microfinance loan rates. *International Review of Finance*, 19, 909–918.
