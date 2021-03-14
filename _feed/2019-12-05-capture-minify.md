---
title: Capture and minify
path: /2019-12-05-capture-minify
category: Code
date: "2019-12-05"
image:
  format: png
  width: 3360
  height: 2056
---

The action now iterates over a few devices and a list of URLs. It is slow, but that was expected.

I'm worried about the size of each run, to the point where I'm considering implementing the storage layer straight away. I also implemented minification, but I wonder if it is going to mess with pixelmatch.
