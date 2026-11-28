---
title: "Why galaxy clusters can look heavier than they are"
description: "In a paper published in Physical Review D in 2026, my co-authors and I measured how a hidden selection effect makes astronomers overestimate the mass of galaxy clusters by 20 to 50%."
date: 2026-11-28T13:00:00Z
tags: ["Research"]
---

Galaxy clusters are the largest objects in the universe held together by gravity. A big one contains hundreds or thousands of galaxies, hot gas and a much larger amount of invisible dark matter. Counting how many clusters of each mass exist at different times in cosmic history is one of the best ways to measure what the universe is made of. That count is sensitive to the total amount of matter, how clumpy it is and the nature of dark energy.

The method only works if we know each cluster's mass accurately. And we can't weigh a cluster directly. This paper is about one reason those weights come out wrong.

The paper, "Impact of projection-induced optical selection bias on the weak lensing mass calibration of galaxy clusters," appeared in *Physical Review D* in March 2026. I wrote it with Hao-Yi Wu, Shulei Cao, Gladys Muthoni Kamau, Andrius Tamosiunas, Chun-Hao To and Conghao Zhou. It also forms the first chapter of my Ph.D. dissertation.

## How astronomers find and weigh clusters

Large sky surveys, such as the Dark Energy Survey, find clusters by looking for crowds of galaxies. Each cluster gets a number called its richness, which roughly means how many galaxies belong to it. Richer clusters tend to be heavier.

To turn richness into mass, astronomers use weak gravitational lensing. A cluster's gravity bends light from galaxies behind it, slightly distorting their shapes. The stronger the distortion, the more mass the cluster has. By averaging the lensing signal over many clusters of similar richness, astronomers calibrate how richness relates to mass.

## The problem: looking through a crowd

Picture looking down a long street at night. Lights from buildings far behind each other can line up and look like one bright cluster. The same thing happens in the sky. A survey can't measure distances to galaxies precisely, so galaxies that sit in front of or behind a cluster, along the same line of sight, can be counted as members. That makes the cluster look richer than it is.

Here's the catch. That same extra matter along the line of sight also adds to the lensing signal, because lensing responds to all the mass along the path of the light. So a cluster that happens to sit in a crowded line of sight gets both a richness boost and a lensing boost at the same time. Clusters can also be stretched shapes, like a rugby ball, and one pointing toward us shows the same double boost.

There's a second effect. Small clusters vastly outnumber big ones. So when you pick all clusters within a richness range, the sample contains many small clusters whose richness got boosted, and only a few big clusters whose richness came out low. This means that when you select every cluster that seems to have a certain number of galaxies, you get many small clusters that only look that big because of extra galaxies counted by mistake. You also get only a few truly big clusters that look smaller than they really are. Put together, the clusters selected by richness show a stronger average lensing signal than their true mass would produce. When astronomers convert that signal to mass, the mass comes out too high.

## What we did

We used two independent computer simulations of the universe, each built a different way:

- **MiniUchuu:** a simulation of the universe, which uses each clump's mass, to decide how many galaxies each clump of dark matter should hold. We then counted galaxies inside a long cylinder along the line of sight, mimicking a survey's distance blur.
- **Cardinal:** a detailed synthetic sky made for the Dark Energy Survey, covering about 5,000 square degrees. It has realistic galaxy colors, so we could run redMaPPer, the cluster-finding tool the survey actually uses.

In both, we knew every cluster's true mass. We grouped clusters into four richness ranges, computed their lensing signals and then ran a mock mass measurement the way a real survey would, with the uncertainties expected from the Dark Energy Survey's first year of data. Comparing the measured mass with the true mass showed the size of the bias.

## What we found

- **MiniUchuu:** masses came out about 25% too high on small scales (within about 3 million parsecs of the cluster center) and about 50% too high on large scales. Combining all scales gave about 25%, and the bias barely changed with richness.
- **Cardinal:** masses came out 20 to 40% too high on small scales and 20 to 80% too high on large scales, or 20 to 50% with all scales combined. The worst case, about 80%, came from the least rich and most distant clusters, where distance estimates are fuzziest.

The two simulations disagreed in size because they model galaxies and find clusters differently. They agreed on the main point.

For comparison, a study of about 1,000 clusters found with the South Pole Telescope, which picks clusters by their hot gas and so avoids this problem, found that other known sources of error shift lensing masses by about 5 to 10%, and 16% at most. The selection bias we measured is several times larger. It is the most damaging known source of error in weighing clusters found by their galaxies.

Our MiniUchuu setup may even understate the problem. To mimic the distance blur, we counted galaxies within a window about 140 million light-years deep (30 h⁻¹ comoving megaparsecs). Recent studies suggest the real blur reaches farther.

## What can be done

The bias can't be ignored, but it can be handled. We discussed several approaches:

- **Better distances.** Spectroscopic measurements give precise distances to member galaxies and help separate true members from galaxies that only line up by chance.
- **More than one kind of data.** Comparing clusters found by their galaxies with clusters found by their hot gas, in X-rays or microwaves, can reveal how big the bias is.
- **Self-calibration.** Combining lensing with how clusters and galaxies cluster around each other can measure the bias from the data.
- **Forward modeling.** Running simulations that mimic the full survey, from the universe's makeup through to the final measurements, builds the bias into the model from the start. We see this as the most promising route, because the size of the bias depends on the galaxy model, the cluster finder and the scales used.

This matters because upcoming surveys, such as the Vera C. Rubin Observatory's Legacy Survey of Space and Time, Euclid and the Roman Space Telescope, will find far more clusters than ever. With so many clusters, random noise shrinks, and biases like this one become the main limit on what we can learn.

Boise State University's Borah computing cluster provided much of the computing power for this work.

## Sources

- Nyarko Nde, T., Wu, H.-Y., Cao, S., Kamau, G. M., Tamosiunas, A., To, C.-H. and Zhou, C. (2026). Impact of projection-induced optical selection bias on the weak lensing mass calibration of galaxy clusters. *Physical Review D*, 113, 063559. [https://doi.org/10.1103/h9xq-k9gh](https://doi.org/10.1103/h9xq-k9gh)
