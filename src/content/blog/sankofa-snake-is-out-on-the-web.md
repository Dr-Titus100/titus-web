---
title: "Sankofa Snake is out on the web"
description: "Sankofa Snake, a free snake game with nine levels drawn from Ghanaian culture, is now ready to play in your browser on a computer, phone, or tablet."
date: 2026-11-21T13:45:00Z
tags: ["Release"]
---

Sankofa Snake is now ready to play on the web. It's a free snake game that runs in your browser on a computer, a phone or a tablet, with nothing to install and no account to make. You steer a snake made of woven kente blocks around the board and collect cowrie shells. The game has nine levels, and each one takes you to a new world with one new rule to learn.

You can play it now at [titusnyarkonde.com/games/sankofa-snake](https://titusnyarkonde.com/games/sankofa-snake/).

<img src="../../media/sankofa-snake-gameplay.gif" alt="The woven snake winding between market stalls to collect cowrie shells" width="400" height="485" style="height: auto" loading="lazy">

## Where the name comes from

Sankofa is an Akan word from Ghana. It means "go back and get it." The Sankofa bird is one of the Adinkra symbols, and it shows a bird turning its head back to pick up an egg from its back. That bird is the game's logo. It's a snake game, but the logo is a bird. Yes, think of it like the snake turning around to bite its tail. However, the main reason is to link the game to the Ghanaian culture, and the Sankofa symbol is the closest thing I could think of. Sankofa signifies the act of going back to the past to pick lessons from there. Thus, there is nothing wrong with learning from the past.

The rest of the game draws on Ghana too. The snake and the board frame use the colors and the crossing bands of kente cloth. The snake eats cowrie shells, which people in West Africa once used as money. The vehicles on the road are trotros, the shared minibuses you see all over Ghana, and taxis. The last level is a weaving village full of looms.

I drew every picture in the game myself, in code, and made every sound in code as well. The game loads no image files, no sound recordings and no stock art. The kente patterns follow the way kente is woven, but they don't copy any named cloth design, and the bird is a new drawing of the Sankofa idea.

The game started as a small snake game I built in R Shiny during my master's study in Kigali, Rwanda, which grew out of [Adam Spannbauer's shiny_snake_loader (MIT license)](https://github.com/AdamSpannbauer/shiny_snake_loader.git). However, Sankofa Snake is a new game, written from scratch for the web, and it shares no code with that first one.

## How to play

The idea is simple. Steer the snake to a cowrie shell and eat it. The snake grows one block longer with every shell, so the board gets more crowded as you go. Eat 20 cowries to clear a level and open the next one.

The run ends if the snake runs into its own tail, an obstacle or a vehicle. On the first three levels, the snake can leave one side of the board and come back on the other. From the City on, the edge of the board is a wall.

**On a computer**, steer with the arrow keys or with W, A, S and D. Press Space, P or Escape to pause, and M to turn the sound off or on.

**On a phone or tablet**, press the arrow buttons under the board, or swipe on the board in the direction you want the snake to go. Tap the board to pause. If you rotate the screen of your phone or tablet to landscape, the arrows move beside the board.

The game pauses on its own when you switch to another tab or app, so a phone call or a message never costs you a run.

## Stars and scores

Clearing a level earns one star. You can earn up to two more stars with a high score and a fast finish. Each cowrie is worth more points once the snake has sped up, and the game adds a time bonus when you clear a level quickly. If you want all three stars, you'll need to be quick and steady at the same time.

## The nine levels

| Level | World | What's new |
| --- | --- | --- |
| 1 | Farm | You learn the controls here. The edges wrap around, and the snake keeps the same speed the whole time. |
| 2 | Park | The snake speeds up after every 5 cowries. |
| 3 | Market | Market stalls block parts of the board, so you have to steer around them. |
| 4 | City | The edge of the board is now a solid wall. Hitting it ends the run. |
| 5 | Road | Trotros and taxis drive across the board. They stop for the snake, so you cross the road in front of them or behind them. |
| 6 | Lab | Power-ups appear on the board for a short time. |
| 7 | Maze | Narrow corridors leave little room to turn, so you have to plan your way to each cowrie. |
| 8 | Ocean | Currents push the snake one square sideways when it swims across them, and make it faster when it swims along them. |
| 9 | Weaving village | It puts every challenge together at top speed, with walls, looms, trotros, currents and power-ups. |

The board changes every time you play. Each run puts the stalls, buildings, roads, lab benches, currents, canoes and looms in new places, and the Maze is a brand new maze each time. The game always keeps the cells in front of the snake clear at the start, and it makes sure the snake can reach every open cell on the board. No part of the board is ever cut off.

### Power-ups

From the Lab on, power-ups appear for a short time after some of the cowries. Each one does something different:

- The **gold hourglass** is slow motion. The snake moves slower for a while.
- The **red arrows** shrink the snake, so it takes up less of the board.
- The **green loop** lets the snake pass through its own tail once.

### Currents

The Ocean and the Weaving village have currents, which show up as arrows on the board. When the snake swims across a current, the water pushes it one square the way the arrows point. When it swims along a current, in the same direction as the arrows, the snake moves one and a half times as fast. When it swims against a current, in the opposite direction as the arrows, it moves at half its speed. Either way, it goes back to its own speed as soon as its head leaves the current. You can use the currents to get to a cowrie faster, but swimming against them costs you time, and a push at the wrong moment can send the snake into a canoe if you aren't careful.

## Three more ways to play

**The daily challenge** changes every day. The date picks one of the nine worlds, whether the edges wrap around or are walls, how fast the snake goes, and whether power-ups appear. Everyone in the world gets the same challenge on the same date, with the cowries in the same places, so you can compare scores with your friends. A new challenge starts at midnight where you are. Clear it on days in a row to build a streak.

**Free play** is the classic snake game, in any world you've opened so far, with wrap-around edges or walls. There's no goal. You keep going until the snake crashes, and the game remembers your best count of cowries for each world.

**Practice** opens all nine levels at a slower, steady speed. Running into something only stops the snake until you choose a new direction, so the run never ends. It's a good way to learn a hard level, and it works well for a demo in a classroom.

## Sound

Each world has its own instrument. Every cowrie you eat plays the next note up a five-note scale on that instrument, so a good run sounds like a short tune.

| World | Instrument |
| --- | --- |
| Farm | The gyil, a wooden xylophone from the Upper West of Ghana |
| Park | A bamboo flute |
| Market | An iron bell |
| City | A guitar string |
| Road | A horn |
| Lab | A glass chime |
| Maze | A low log drum |
| Ocean | Water drops |
| Weaving village | The gyil and the bell together |

There are also short sounds for a power-up, a current, a crash and a cleared level. On phones that support it, mostly Android phones, eating a cowrie, crashing and clearing a level also give a short buzz. You can turn the sound and the vibration on or off on the How to play screen.

## Playing with a keyboard or a screen reader

You can play the whole game with a keyboard alone, menus included. The game also tells screen reader users what's happening, such as each cowrie eaten, a power-up appearing, a crash or a cleared level, along with the score.

## Your privacy

Your scores, stars, cleared levels, daily streak and settings stay in your own browser, on your own device. The game sends nothing to any server, and it has no ads and no trackers. If you want to start over, the Reset progress button on the How to play screen deletes your progress after it asks you to confirm.

The game's page on my website also has a place for reviews, where you can say what you think of the game and name your favorite level. My website keeps those reviews, as its Privacy page explains.

## Resources

Here's where to find the game, its code and the guides that come with it.

- [The game's page](https://titusnyarkonde.com/games/sankofa-snake/) on my website has the game itself, a How to play page and the community reviews.
- [The code on GitHub](https://github.com/Dr-Titus100/sankofa-snake) is open for anyone to read, along with the level files and the tests. You can also see every change I've made.
- The teaching guides are six lessons that use the game's own code to teach programming. They cover the grid and how the snake moves, rules as functions, levels as data, randomness and seeds, the game loop and timing, and collision checks. Each lesson starts with something students see while they play, then has questions to answer on paper, exercises at the keyboard and notes for the teacher with the answers. They suit an upper secondary class, a first university course or a coding club.
- The game also comes as a desktop version in Python, made with Pygame, and as a browser version in R, made with Shiny. Both play exactly like the web game, with the same nine levels, the same daily challenge and the same sounds. The teaching guides come in TypeScript for the web game, and in Python and R for the Pygame and Shiny versions, respectively.
- The [changelog](https://github.com/Dr-Titus100/sankofa-snake/blob/main/CHANGELOG.md) lists every change in every release. The website runs version 0.10.2 as at the time of this post.

## The license

Sankofa Snake is free to play, and the code is free to read, copy, change, share and teach with under the Sankofa Snake License. It works like the well-known MIT license, with two limits. Without my written permission, nobody may publish the game or a version of it in an app store, and nobody may make a 3D version of it. I've kept those two for myself because they're exactly what I'm working on next.

The name "Sankofa Snake" and the bird logo stay with the official game, so if you make your own version, give it its own name and logo.

## What's next

The web version is the first step. I have two more planned.

**Phone apps.** I'm bringing Sankofa Snake to the App Store and Google Play, so you can install it on your phone like any other app. The game already works well on phones in the browser, with the arrow buttons, swipes and vibration, so the apps will build on what's already there. The apps will use the same rules as the web game, so the levels and the daily challenge will be the same everywhere.

**A 3D version.** I also plan to build a 3D version of Sankofa Snake later.

## Where to start

Open [the game](https://titusnyarkonde.com/games/sankofa-snake/), start on the Farm and see how far you get. Try the daily challenges and see if you can start a streak. If you enjoy it, or if something doesn't work the way you expect, leave a review on the game's page. I'd love to hear which level is your favorite.
