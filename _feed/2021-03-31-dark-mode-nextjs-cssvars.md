---
title: Simple light/dark mode using NextJS anc CSS variables
category: Code
date: "2021-03-31"
image:
  format: gif
  width: 1440
  height: 900
---

TL;DR: You can visit [`mamuso/nextjs-simple-darkmode`](https://github.com/mamuso/nextjs-simple-darkmode) if you want to take a look at this post's code.

---

I wanted to find an easy recipe for implementing dark mode for this web, and the codebase migration to Next.js was the perfect excuse to make it happen. There are already many options available for this task: you could add [`xeoneux/next-dark-mode`](https://github.com/xeoneux/next-dark-mode) to your dependencies, or go the [Tailwind way](https://tailwindcss.com/docs/dark-mode), just to name a couple.

In this case:

- I want to **avoid adding one more dependency**.
- The solution should not get in my way. I use a `Theme.js` file for many of my projects, and I expect to manage colors from there.
- I don't need a toggle; the operating system preference seems the simplest way to go, and the media feature [`prefers-color-scheme`](https://drafts.csswg.org/mediaqueries-5/#prefers-color-scheme) is widely supported by modern browsers.

Joshua Comeau published [this amazing post](https://www.joshwcomeau.com/react/dark-mode/) a while back. The explains how to implement in Gatsby an incredibly elegant and uncomplicated solution using CSS variables, so that was the inspiration for taking this direction.

### Setting up `Theme.js`

```javascript
export const defaultTheme = {
  colors: {
    light: {
      "bg-primary": "#EDF1F1",
      "outer-border": "#FFFFFF",
      "text-primary": "#333333",
      "text-link": "#4c82d7",
    },
    dark: {
      "bg-primary": "#182335",
      "outer-border": "#141B2A",
      "text-primary": "#d6deeb",
      "text-link": "#ed64a6",
    },
  },
};
```
