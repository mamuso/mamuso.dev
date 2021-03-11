---
title: Drafting interfaces
path: /2020-04-26-designing-fluxcapacitor
category: Design
date: "2020-04-26"
image: ./screen_shot_2020-04-26_at_11_15_32_pm.png
---

I spent most of the weekend working on [breaking the paparazzi pipeline into pieces](https://github.com/mamuso/fluxcapacitor/runs/621307378?check_suite_focus=true). It turns out that trying to run all the steps in a single process doesn't scale well, and the process stalls when we have many URLs in the config.

I drafted a first potential interface for consuming the screenshots. Not terribly happy about it, but we need to start somewhere.
