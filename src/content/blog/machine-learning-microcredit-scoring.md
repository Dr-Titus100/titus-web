---
title: "Can machine learning judge a borrower who has no credit history?"
description: "In a paper published in 2021, my co-authors and I showed that common machine learning tools can sort microloan borrowers into risk groups using basic facts like age, loan size and interest rate."
date: 2026-11-27T11:30:00Z
tags: ["Research", "AI"]
---

When you apply for a loan in many countries, the lender checks your credit history. A credit bureau keeps a record of your past loans and whether you repaid them. A World Bank report from 2017 found that almost a third of adults worldwide had no bank account. Many of them borrow from microfinance institutions instead, and most have no credit history at all. That leaves the lender guessing about who will repay, which makes fair pricing hard.

Our paper, "A Machine Learning Approach for Micro-Credit Scoring," asked whether machine learning could fill that gap. I wrote it with Apostolos Ampountolas of Brunel University London, Paresh Date of Brunel and Corina Constantinescu of the University of Liverpool. The journal *Risks* published it in March 2021. The research grew out of my master's thesis at AIMS Rwanda.

## The data

Innovative Microfinance Limited, a microlender in Ghana, shared records on loans it made from January 2012 to July 2018, a period when Ghana's economy and politics were stable. The extract covered 4,450 customers. We removed 46 rows that had too many missing values.

We used seven facts about each loan:

- the borrower's age, gender and marital status
- the loan amount (we used its logarithm to tame the very wide spread of amounts)
- whether the borrower repaid weekly or monthly
- the interest rate, converted to a yearly rate so loans of different lengths could be compared
- the number of repayments needed to clear the loan

We sorted borrowers into three risk groups based on how far behind they were:

- **Good:** not behind, or less than 30 days behind
- **Average:** between 30 and 91 days behind
- **Poor:** more than 91 days behind

## A lopsided dataset (an imbalanced dataset)

About 84% of the borrowers fell in the poor group. That creates a trap. A model can score well just by predicting "poor" for everyone, while learning nothing useful. To avoid it, we used a technique called SMOTENC, which creates realistic synthetic examples of the smaller groups. After balancing, the largest group made up about 36% of the data. We then trained each model on 80% of the data and tested it on the other 20%, which the models never saw during training.

## Which models worked best

We tested seven models. Here is how often each one placed a borrower in the right group on the test data:

| Model | Accuracy |
| --- | --- |
| AdaBoost | 81.2% |
| XGBoost | 81.0% |
| Random forest | 80.8% |
| Extra trees | 79.8% |
| Decision tree | 78.5% |
| k-nearest neighbours | 77.8% |
| Neural network (multilayer perceptron) | 71.6% |

The top three are all ensemble methods. Each one combines many simple decision trees and lets them vote. They finished within 0.4 percentage points of each other, so any of them would do the job. The neural network came last, and adding more layers or nodes didn't improve it.

Most mistakes happened between the good and average groups. The line between a borrower who is a few weeks late and one who is a month late is blurry, so this makes sense. The models were most reliable for the poor group. For example, when XGBoost labeled a borrower poor, it was right 94% of the time.

## What predicts default

We measured how much each fact helped the models by shuffling it and checking how much accuracy dropped. For all three top models, the three most useful predictors were:

1. the borrower's age
2. the size of the loan
3. the yearly interest rate

The interest rate result fits earlier work arguing that very high rates push microfinance borrowers into default. Gender was the least useful fact, most likely because nearly all the borrowers were women. That matches what microfinance studies find worldwide, where about three in four clients are women. Numerical variables, such as age and amount, mattered more than categorical ones, such as marital status.

The number of repayments also mattered, which agrees with [my master's thesis](/blog/masters-thesis-microfinance-credit-risk/). There I found that defaults on these loans rose sharply after about six months.

## Why it matters

These models are free, well known and cheap to run. A small lender in a developing country could use them to judge new borrowers without a credit bureau, using information it already collects. The three-group setup also helps lenders in practice. They can approve the good group, decline the poor group and take a closer look at borrowers in the average group.

## Limits and next steps

The data came from one lender in one country during a calm economic period, so the exact results may not carry over elsewhere. The models also take a snapshot. They don't predict how long a borrower will stay in a risk group before moving to another. In future work we planned to look at fair lending rates, add economic factors such as inflation and unemployment, and study the effect of economic shocks such as the COVID-19 pandemic.

## Sources

- Ampountolas, A., Nyarko Nde, T., Date, P. and Constantinescu, C. (2021). A Machine Learning Approach for Micro-Credit Scoring. *Risks*, 9(3), 50. [https://doi.org/10.3390/risks9030050](https://doi.org/10.3390/risks9030050)
