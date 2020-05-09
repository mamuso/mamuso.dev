---
title: Capturing beyond 16384px
path: /2020-05-08-beyond-16384px
category: code
date: 2020-05-08
image: ./2020-05-08_21_56_56.gif
poster: ./2020-05-08_21_56_56.png
---

I'm screenshotting programmatically a bunch of very very long pages, and I noticed that some captures [were patchy](https://fluxcapacitorprod.blob.core.windows.net/fluxcontainer/2020-05-06/desktop/enterprise.png). For a few days, I tried to find the reasons why. Is it because images don't have time to load? Is there any property in the page that is causing a misrender? Animations? Transforms?

It turns out [chromium has a hard time processing images over 16384px](https://github.com/puppeteer/puppeteer/pull/937), so you need to capture-scroll-repeat and stitch [the result](https://fluxcapacitorprod.blob.core.windows.net/fluxcontainer/2020-05-07/desktop/enterprise.png).

This approach brings other problems to the table:

- Avoiding sticky headers and footers (solved!)
- Fixed sidebar repetition (no clue how to work around this problem sustainably)
- Animations loops in the seams of captures (🤷🏼‍♂️)
