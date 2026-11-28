---
title: "Measuring the shape of something we can't see: dark matter halos"
description: "For my Ph.D. comprehensive exam, I reviewed how scientists describe the invisible clouds of dark matter around galaxies, and I tested whether machine learning could do the job with honest error bars."
date: 2026-11-28T12:50:00Z
tags: ["Research", "AI"]
---

Most of the universe is invisible to us. According to the standard model of cosmology, about 68% of the universe is dark energy, which drives the universe's expansion faster and faster. About 27% is dark matter, which makes up roughly 85% of all matter. Ordinary matter, the stuff of stars, planets and people, is only about 5%.

Nobody has observed dark matter directly. We know it's there because of its gravity. Stars at the edges of spiral galaxies orbit too fast to be held in place by visible matter alone. Galaxies in clusters move so fast that they would fly apart without extra mass holding them together.

Dark matter gathers into huge clumps called halos. Galaxies and galaxy clusters form and live inside them. How dense a halo is at different distances from its center is called its density profile, and it carries clues about what dark matter is and how cosmic structures grew.

In November 2022, as part of the Computing Ph.D. program at Boise State University, I wrote a synthesis paper on this topic for my comprehensive exam. A synthesis paper reviews a field, identifies its open problems and proposes ways forward. Mine was titled "Dark Matter Halo Density Profile Calibration."

## How we "see" a halo

Since we can't see halos, we measure them indirectly. The most reliable method uses weak gravitational lensing. A massive cluster bends the light from galaxies behind it, slightly stretching their shapes, by about 1%. By measuring this stretching across many background galaxies, astronomers can work out how mass is spread through the cluster and its halo.

Scientists then compare these measurements with formulas that describe a halo's density. The best known are the NFW profile and the Einasto profile, plus a newer and more flexible one called DK14. They also compare with computer simulations that follow billions of particles of dark matter as the universe evolves.

## What earlier studies found

I built the review around four key papers and the wider literature. A few points stood out.

**The standard formulas fall short.** Several studies found the Einasto profile fits better than NFW, but both fit poorly in many conditions. One study found both underestimated cluster masses. A likely reason is that a halo's inner and outer parts depend on different things. The inner part depends on how a halo's boundary is defined, while the outer part depends on how fast the halo is gathering new matter. A single simple formula can't capture both.

**Halos have a newly found edge.** Simulations and, more recently, observations have revealed a feature called the splashback radius. It marks the farthest point that orbiting matter reaches before falling back in, which makes it a more physical boundary for a halo than older definitions. Researchers have found it in both lensing data and galaxy counts, and the two methods agree on its location. Scientists still don't fully understand it, though.

**Different surveys give different numbers.** Major surveys of the universe, such as WMAP and Planck, disagree on some basic cosmological values, and some of those differences are too large to ignore. Simulations built on different values can give different halo profiles.

## Open problems I identified

- **Small halos are hard to study.** Lensing mass estimates are biased for low-mass halos, simulations can't resolve them well, and they're hard to observe. I suggested combining small, very detailed simulations with large, coarser ones.
- **Subhalos get little attention.** Smaller halos inside a larger one make its profile bumpy, and it's often unclear which particles belong to which halo.
- **Ordinary matter may matter more than we think.** Gas and stars clearly affect small halos. If they also reshape the biggest halos, methods that assume only dark matter would need revising.
- **Measurement errors are hard to untangle.** I suggested using simulations to inject known errors into data and test whether analyses can recover them.
- **Samples are either small or messy.** Detailed simulations with gas physics, and observations selected by X-rays or the Sunyaev-Zeldovich effect, cover a few hundred to about 1,400 clusters. Optically selected samples run to millions but suffer more from measurement problems.

## Trying machine learning

The second part of the paper tested a new approach. I trained neural networks to predict halo density profiles directly from simulation data, with error bars on each prediction.

The data came from the Buzzard simulation, a synthetic sky built for the Dark Energy Survey. After cleaning and balancing, it held 630,458 halos, each with densities at 18 distances from its center, about 11.3 million data points in all. I trained on 80% and tested on the remaining 20%, about 2.2 million points.

I used two methods that let a neural network say how confident it is:

- **Monte Carlo dropout:** one network that randomly switches off some of its neurons each time it makes a prediction. Running it many times gives a spread of answers, and that spread becomes the error bar.
- **Deep ensembles:** many copies of the same network, each trained from a different random starting point. Their disagreement becomes the error bar.

The results:

- Most of the error bars from both methods contained the true values, and a chi-square check showed the error bars were realistic.
- Deep ensembles fit best (the highest adjusted R-squared) but took longer to train.
- Both machine learning models beat the NFW, Einasto and DK14 formulas, measured by mean squared error. Among the formulas, DK14 did best.

As far as I knew at the time, this was the first use of deep learning to predict dark matter halo density profiles. I shared the code and notebooks in a public GitHub repository.

## Why it matters

New telescopes are giving astronomers far more data than ever before. When I wrote the paper, the James Webb Space Telescope had just launched, and the Vera C. Rubin Observatory in Chile and NASA's Nancy Grace Roman Space Telescope were on the way. Turning that data into answers about dark matter requires halo models that are accurate and honest about their uncertainty. This review set the direction for my dissertation, which went on to study a major source of bias in weighing galaxy clusters.

## Sources

- Nde, T. N. (2022). *Dark Matter Halo Density Profile Calibration.* Ph.D. comprehensive exam synthesis paper, Computing Ph.D. program, Boise State University.
- Diemer, B. and Kravtsov, A. V. (2014). Dependence of the outer density profiles of halos on their mass accretion rate. *The Astrophysical Journal*, 789, 1.
- Shin, T. et al. (2021). The mass and galaxy distribution around SZ-selected clusters. *Monthly Notices of the Royal Astronomical Society*, 507, 5758.
- Diemer, B. (2022). A dynamics-based density profile for dark haloes. I. Algorithm and basic results. *Monthly Notices of the Royal Astronomical Society*, 513, 573.
- Henson, M. A. et al. (2017). The impact of baryons on massive galaxy clusters: halo structure and cluster mass estimates. *Monthly Notices of the Royal Astronomical Society*, 465, 3361.
