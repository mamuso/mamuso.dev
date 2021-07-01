---
title: Light/Dark mode, the CSS-variable way
category: Code
date: "2021-06-30"
image:
  format: gif
  width: 1440
  height: 900
---

Choosing colors is hard. Adapting the color mode of your website to your users' preferences is (it should) not.

For this deceivingly short recipe, you will need a couple of ingredients: [CSS variables](https://www.w3.org/TR/css-variables-1/) and the media feature [`prefers-color-scheme`](https://www.w3.org/TR/mediaqueries-5/#prefers-color-scheme).

1. You can define your color variables and their values for light (default) and dark modes in your CSS file:

```css
:root {
  --text: #333333;
}

@media (prefers-color-scheme: dark) {
  :root {
    --text: #ffffff;
  }
}
```

2. Then you can use those variables in your CSS declarations:

```css
element {
  color: var(--text);
}
```

3. **And that's it!** Your website will react to the user's color theme preference.

You can play with a simple but functional example in [this Codepen](https://codepen.io/mamuso/pen/jOmEjeQ); fidget with your OS appearance preferences to see colors change. This foundation also works like a charm in more complex scenarios:

- Check [Joshua Comeau's post](https://www.joshwcomeau.com/react/dark-mode/). He implements light/dark mode in Gatsby using CSS variables.
- Or [this example](https://github.com/mamuso/nextjs-simple-darkmode) using CSS variables with next.js and styled-components.
