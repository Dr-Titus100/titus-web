---
title: "What 31 years of rain records say about Tamale"
description: "My undergraduate thesis used statistics to describe how much rain falls in Tamale, Ghana, whether it is changing, and what the next few years might bring."
date: 2026-11-19T15:30:00Z
tags: ["Research"]
---

In 2018 I finished a BSc in Actuarial Science at the University for Development Studies in Ghana. My final-year project, supervised by Dr. Ernest Zamanah in the Department of Statistics, asked a simple question about my surroundings. How much rain does Tamale get, and can we predict it?

This post walks through what I did and what I found, in plain language. The full title of the thesis is "Gamma distribution modelling and time series analysis and forecasting on rainfall in Tamale Metropolitan Assembly."

## Why rain matters so much in Tamale

Tamale is the capital of Ghana's Northern Region. The metropolis covers about 647 square kilometres, and farmers work much of its rural land. Most farmers in the north depend on rain to water their crops, with little or no irrigation. A late or weak rainy season can mean a poor harvest.

Rain also fills the city's water sources. The Tamale metropolitan area has few permanent rivers. Its streams shrink in the dry season, and people rely on dugouts, dams and wells, which all depend on rainfall to refill. Heavy downpours can also flood parts of the city.

So a good forecast of rainfall is useful to farmers, to water planners and to the local meteorological office.

## The data

I worked with monthly rainfall totals from the Tamale meteorological office, covering January 1987 to December 2017. That is 31 years, or 372 months. Three months had no record. I filled those three gaps with a standard method called expectation maximisation, which estimates a missing value from the pattern in the rest of the data. Three gaps out of 372 is less than 1% of the record.

Northern Ghana has one rainy season a year. In my data, every month from March to October had at least some rain in every one of the 31 years. I called those the wet months. November to February were the dry months, when many years recorded no rain at all.

## How much rain falls in a wet month

Across all wet months, the average was about 132 mm of rain. The median was about 122 mm, which means half of the wet months got less than that and half got more. The wettest month in the record had 495.8 mm.

The numbers were lopsided (i.e. unequal distribution). Most wet months landed in a moderate range, and a handful were far wetter than the rest. A typical month varied from the average by about 85 mm. Three separate tests confirmed that the data did not follow the familiar bell curve (i.e. not symmetrical or normally distributed).

## A better shape for rainfall: the gamma distribution

Statisticians often describe rainfall with a curve called the gamma distribution. It suits amounts that can't go below zero and that have a long tail on the high side. That matches rainfall distribution in the Tamale metropolis well.

I fitted a gamma curve to the wet-month totals. Its two settings came out as a shape of 1.78 and a scale of 73.87. Multiply them and you get about 131.5 mm, which matches the observed average.

I then checked the fit with three goodness-of-fit tests (chi-square, Kolmogorov-Smirnov and Anderson-Darling). Each one compares the curve with the real data and asks whether the gap between them is bigger than chance would produce. All three accepted the gamma curve at the usual 95% confidence level. In plain words, the gamma curve describes Tamale’s wet-month rainfall well enough to use for working out rainfall probabilities.

In practice, this curve lets you attach a probability to a rainfall amount. For example, you can ask how often a wet month in Tamale gets more than 200 mm.

## Is Tamale getting drier?

I looked for a long-term trend in several ways.

First, I fitted a few simple trend lines to the 31 years of monthly data. The best fit was a gentle curve that rose slightly in the early years and drifted down after that.

Next, I ran formal trend tests, which ask whether a pattern is strong enough to rule out chance. The Mann-Kendall test, a common choice for climate data, gave a p-value of 0.967. In plain terms, a downward drift this small would show up by chance almost all the time even if nothing were changing. A version of the test that accounts for the seasons gave the same answer (p = 0.966). Two simpler tests also found no clear trend.

So the slight decline in the fitted curve is not statistically significant. Over 1987 to 2017, the records gave no solid evidence that Tamale's rainfall was going up or down. That agrees with an earlier study of northern Ghana (Amankwa, 2014), which used the same Mann-Kendall test on 50 years of data and also found no significant rainfall trend.

Even without a trend, the city's water supply leans heavily on rain. In the thesis I recommended that residents and planners should keep developing other water sources as a safeguard.

## Forecasting the next three years

Rain in Tamale follows a strong yearly cycle, so I used a forecasting method built for repeating seasons. It is called a seasonal ARIMA model, or SARIMA. It predicts each month from two things: the months just before it, and the same month in earlier years.

I compared 12 candidate versions of the model. The winner, written as SARIMA(4,0,4)(3,1,3)[12], had the best score on the Akaike information criterion, a standard measure that rewards a model for fitting well and penalizes it for being too complicated. I then checked its leftover errors. They showed no remaining pattern over time, which is what we want to see if the model fits the data well. 

The model forecast rainfall for every month of 2018, 2019 and 2020. In 2018 it put August and September at about 187 mm each. In 2019 September came out highest at 214.7 mm, with August at 176.2 mm. In 2020 September again led at 209.8 mm, followed by August at 191.5 mm and July at 179.4 mm.

Each year, July, August and September came out as the wettest months. The forecasts for December and January were zero or close to it in every year.

The gamma curve helps put these numbers in context. By the fitted curve, a September with 214.7 mm, the 2019 forecast, would be wetter than about 83% of wet months in Tamale. The August 2018 forecast of 186.8 mm would beat about 77% of them. So the model expected the late rainy season to be heavy, though not extreme.

Those three years have now passed. I made these forecasts in 2018 and haven't yet compared them with the rain that actually fell. That check would be the real test of the model.

## What the study couldn't do

The gamma curve can't handle a month with zero rain. That is why I fitted it only to the wet months, and a different distribution could cover the whole year.

The forecasts used past rainfall alone. Humidity, temperature and larger climate patterns also shape the rainy season, and the model knew nothing about them.

My rule for a wet month was simple: I called a month wet if it got at least some rain in every one of the 31 years. March, for example, never came up completely dry, so it counted as wet. This mattered because the gamma curve can't handle a month with zero rain. Keeping only the months that always had some rain gave the curve data it could work with. Other studies set a higher bar, such as at least 102 mm in a month.

The data also came from a single station. It describes Tamale and may not hold for the rest of the north.

## What I recommended

At the end of the thesis I recommended several next steps:

- Use the SARIMA model for rainfall planning in Tamale and refit it as new data arrives, so it stays accurate.
- Build models that include other climate factors, such as humidity and temperature.
- Use Markov chains, a method that models the switch between wet and dry periods, to define wet and dry months more carefully.
- Try the gamma model in other parts of Ghana, to see how well it fits elsewhere.
- Compare SARIMA with other forecasting tools, such as Fourier series and neural networks.
- Test other probability distributions that can handle months with no rain.

## Sources

- Nde, T. N. (2018). *Gamma distribution modelling and time series analysis and forecasting on rainfall in Tamale Metropolitan Assembly.* BSc project, Department of Statistics, University for Development Studies, Ghana.
- Rainfall data: monthly totals from the Tamale meteorological office, 1987 to 2017.
- Amankwa, E. (2014). *Rising temperature and declining rainfall -- A threat to water security in Northern Region of Ghana.* British Journal of Applied Science & Technology, 4(34), 4721–4730.
