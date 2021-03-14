---
title: Hi, fluxcapacitor!
path: /2020-04-23-hi-fluxcapacitor
category: Code
date: "2020-04-23"
image:
  format: png
  width: 3360
  height: 2100
---

WELL, WELL! Fluxcapacitor (formerly Timesled, I'm the worst naming projects) runs like a charm over GitHub Actions, and I rewrote a big chunk of the code for sustainability:

- It runs every three days
- The firs stable run (capture, process, compare, store) had 104 endpoints and 3 devices
- It took 1h 32m to finish
- Next run will process over 140 endpoints

The infra is more sophisticated than a few months ago. The images and the tgzs of the captures are blobs in Azure, and Prisma2 handles the data layer.

I'm really happy with the progress so far :)
