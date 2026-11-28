---
title: "From the cosmos to the canopy: what my Ph.D. dissertation found"
description: "My dissertation covered three projects at very different scales, from galaxy clusters to desert shrubs to mountain snow. What links them is a single question: how sure can we be of what the data tell us? This blog is a high level explanation of my Ph.D. dissertation, so all the technical details have been skipped."
date: 2026-11-28T13:10:00Z
tags: ["Research", "AI"]
---

In December 2025 I defended my Ph.D. dissertation in Computing at Boise State University, and I received the degree in May 2026. Professor Nancy Glenn chaired my committee, with Professors Alejandro Flores and Jodi Mead as members. The dissertation is titled "From the Cosmos to the Canopy: Quantifying Uncertainty Across Cosmological and Environmental Systems."

The three projects look unrelated at first. One weighs galaxy clusters. One measures plant height from space. One maps how much sunlight snow reflects. All three combine data from several sources, use computer models or machine learning, and focus on uncertainty, meaning how far off an answer might be and why. A result without that is hard to trust.

## Project 1: galaxy clusters that look heavier than they are

Galaxy clusters are the largest objects held together by gravity. Astronomers count them to learn what the universe is made of, but that only works if they know each cluster's mass.

Surveys find clusters by counting their galaxies, then estimate mass from weak gravitational lensing, the slight bending of light from galaxies behind the cluster. Using two computer simulations of the universe, I showed that galaxies lined up along the line of sight inflate both the galaxy count and the lensing signal at once. As a result, masses come out 20 to 50% too high, and up to 80% too high on large scales. That makes it the biggest known source of error in weighing clusters found by their galaxies.

The dissertation adds one more result. Two other known errors, called miscentering (picking the wrong center for a cluster) and dilution (cluster galaxies watering down the lensing signal), behave like a cluster that is less concentrated toward its center. In practice, this means estimates of cluster concentration will tend to come out too low.

This project was published in *Physical Review D* in 2026, and it has [its own post on this blog](../galaxy-cluster-mass-selection-bias/) with the full details.

## Project 2: measuring sagebrush from space

Drylands cover about 40% of Earth's land and store a lot of carbon. Their plants are short and sparse, and the ground is often steep, which makes vegetation height very hard to measure from space.

I studied the Reynolds Creek Experimental Watershed in southwest Idaho using two NASA laser instruments in orbit:

- **GEDI** (Global Ecosystem Dynamics Investigation), on the International Space Station, which measures the ground in circles about 25 m across
- **ICESat-2** (Ice, Cloud, and land Elevation Satellite-2), which records individual photons along tracks that its land and vegetation product groups into 100 m segments

I compared both with airborne lidar, laser scans from aircraft that map the ground at 1 m detail.

**The instruments agree on height.** After putting all three datasets on the same reference system, statistical tests at Reynolds Creek and at a second site near Twin Falls found no significant difference in ground elevation between the space and aircraft measurements. Where GEDI and ICESat-2 overlapped in place and time (within 25 m and 120 days), their elevations matched almost one to one.

**Space instruments miss the slopes.** GEDI's footprints spread more evenly across the watershed than ICESat-2's tracks. Even so, neither captured the full range of slopes in this rugged watershed.

**Machine learning predicts plant height well.** I tested four machine learning methods that also estimate their own uncertainty: random forest, Monte Carlo dropout, deep ensembles and AutoDEUQ. All four predicted the vegetation measures closely, with correlations above 0.9. Deep ensembles did best, with typical errors of about 0.6 to 0.8 m and an R-squared of about 0.88. Monte Carlo dropout gave the widest, most cautious uncertainty ranges. AutoDEUQ was less accurate but gave uncertainty estimates that responded most to local conditions.

**Steeper ground means bigger errors.** When I added slope and vegetation height from the airborne lidar, errors grew steadily with slope. They were generally larger for ICESat-2 than for GEDI, which fits GEDI's more even coverage and smaller footprints. Errors were smallest on low, flat ground and largest on high, steep ground. Tests with different footprint sizes showed that GEDI's 25 m and ICESat-2's 100 m sizes already worked about as well as smaller ones at this site.

The practical lesson is that slope should come from high-resolution elevation data, such as airborne lidar, measured right under each laser footprint. Space instruments alone don't capture local terrain well enough.

## Project 3: sharper maps of snow brightness

How much sunlight a surface reflects is called its albedo. Fresh snow reflects about 92% of sunlight. Dusty snow can reflect as little as 20%, so it absorbs more energy and melts faster. In the Upper Colorado River Basin, where snowmelt feeds water supplies for millions of people, getting albedo right matters for predicting when and how fast the snow will melt.

The trouble is that no single satellite gives both fine detail and frequent coverage:

- **GOES-R**, a weather satellite in a fixed position above the Americas, images the area every few minutes but in 2 km pixels.
- **MODIS** gives 500 m pixels about once a day.
- **Sentinel-2** gives 20 m pixels, but only about every five days.

I built a two-step system using U-Net, a type of neural network designed for images, to combine them. The first step sharpens GOES-R albedo from 2 km to 500 m, using MODIS as the target. The second sharpens it from 500 m to 20 m, using Sentinel-2. Along the way I corrected the satellite data for viewing angle, terrain shading and cloud and snow confusion. I also used images from a ground-based sky camera to measure cloud cover and help tell clouds from snow. I checked the results against ground measurements from the U.S. Department of Energy's SAIL field campaign near Crested Butte, Colorado, which ran from September 2021 to June 2023. I spent the summer of 2025 at Lawrence Berkeley National Laboratory working on this project.

The results:

- **Step one worked well.** Trained on images from September 2021 to December 2022 and tested on 2023, the model reached an R-squared of 0.76 with an error (RMSE) of 0.20. Clouds were the main problem. Accuracy dropped as more of each image was hidden by cloud, and it peaked at about 0.80 when I allowed 25 to 30% cloud cover.
- **Step two was harder.** Sentinel-2's five-day gaps left too little clear-sky training data. The model only became reliable when I allowed up to 40% cloud cover, reaching an R-squared of 0.62 with an error of 0.16.
- **The final maps look right.** The 20 m maps reproduced sharp snow edges and fine terrain details seen in Sentinel-2.

The result is a continuous daily series of detailed albedo maps. These could feed snowmelt and water models such as iSnobal, Noah-MP, VIC and SUMMA, which currently often rely on fixed or average albedo values. That could improve forecasts of snowmelt timing, runoff and reservoir inflows. I've made the code and the albedo maps public.

## What ties it together

Two lessons ran through all three projects. First, hidden errors are easier to handle when you simulate the whole process from start to finish, from the physics up to what the instrument would actually record, than when you try to correct for them after the measurement. Second, models that report their own uncertainty turn gaps in data coverage or awkward sensor geometry into measurable error instead of hidden error. In the vegetation project, that let me see exactly how much steep terrain added to the uncertainty.

Whether the subject is a galaxy cluster, a desert shrub or a snowfield, better answers come from combining physical models with careful data science and reporting the uncertainty. The code for all three projects is available on GitHub.

## Sources

- Nyarko Nde, T. (2026). *From the Cosmos to the Canopy: Quantifying Uncertainty Across Cosmological and Environmental Systems.* Ph.D. dissertation, Computing, Boise State University.
- Nyarko Nde, T., Wu, H.-Y., Cao, S., Kamau, G. M., Tamosiunas, A., To, C.-H. and Zhou, C. (2026). Impact of projection-induced optical selection bias on the weak lensing mass calibration of galaxy clusters. *Physical Review D*, 113, 063559. [https://doi.org/10.1103/h9xq-k9gh](https://doi.org/10.1103/h9xq-k9gh)
