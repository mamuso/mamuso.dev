---
title: Building a time machine
path: /2019-12-03-timesled
category: Code
date: 2019-12-03
image: ./screen_shot_2019-12-04_at_1_02_33_am.png
---

I'm starting a little project to automate the screenshoting of a bunch of endpoints. I want to be able to compare them and go back in time.

A long time ago, I imagined a simpler version of this project, and even registered uihop.com with the intention of builidng a decent service behind it. Years later, during my time at Yammer, Brendan McKeon impressed the whole company with the many uses of his "time machine". I was impressed and inspired by his work, and bummed because that piece of technology wasn't available for more designers. 

For now, I started the project creating a very simple action that launches puppeteer inside a docker container and parses a config file with resolutions and a list of URLs.
