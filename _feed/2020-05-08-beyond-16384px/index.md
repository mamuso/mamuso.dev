---
title: Capturing beyond 16384px
path: /2020-05-08-beyond-16384px
category: code
date: "2020-05-08"
image: ./2020-05-08_21_56_56.gif
poster: ./2020-05-08_21_56_56.png
---

I'm screenshotting programmatically a bunch of very very long pages, and I noticed that some captures [were coming back full of white patches](https://fluxcapacitorprod.blob.core.windows.net/fluxcontainer/2020-05-06/desktop/enterprise.png). For days I tried to find the source of the problem. Do images have enough time to load? Is there any CSS property in the page that is causing a misrender? What about animations?

It turns out [chromium has a hard time processing images over 16384px](https://github.com/puppeteer/puppeteer/pull/937), so you need to capture-scroll-repeat and stitch [the result](https://fluxcapacitorprod.blob.core.windows.net/fluxcontainer/2020-05-07/desktop/enterprise.png).

This approach brings other fun problems to the table:

- Capturing sticky headers and footers (solved!)
- Fixed sidebar repetition (no clue how to work around this problem sustainably)
- Animations loops in the seams of captures (🤷🏼‍♂️)
