---
title: Building a time machine
path: /2019-12-03-timesled
category: code
date: 2019-12-03
image: ./screen_shot_2019-12-04_at_1_02_33_am.png
---i

I'm starting a little project to automate the screenshoting of a bunch of endpoints, compare them and be able to go back in time.

The project is highly inspired by the work that Brendan McKeon did during our time at Yammer. I was impressed with the many uses of his "time machine" and bummed that the technology wasn't available for more websites, or more openly configurable.

For now, I started the project creating a very simple action that launches puppeteer inside a docker container and parses a config file with resolutions and a list of URLs.
