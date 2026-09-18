This is an unlisted specimen for reviewing the note template. It uses the same rendering as published notes, but stays out of the archive and feed. Everything below is sample content, gathered here so we can check typography, spacing, and media together.

## Paragraphs and inline styles

A good reading layout makes room for both a passing thought and a longer argument. This paragraph has enough words to wrap across several lines, letting us judge the measure of the column, the space between lines, and the way one sentence leads into the next. The system font should feel just as comfortable here as it does throughout the rest of the site.

A short paragraph, for comparison.

Here is **bold text**, *italic text*, ***bold italic text***, ~~deleted text~~, and `inline code`. There is an [ordinary link to the notes archive](/notes), a [reference-style link][reference], and an automatic link: <https://mamuso.dev/notes>.

An explicit line break ends here.  
The next line belongs to the same paragraph.

Escaped punctuation stays literal: \*asterisks\*, \_underscores\_, \[brackets\], and \# a hash. Typographic characters include “double quotes,” ‘single quotes,’ an apostrophe’s curve, an em dash — and an ellipsis…

## The heading scale

The next six headings exercise every heading level. The first is intentionally an extra H1 for this specimen; normal notes should use the post title as their only H1.

# Heading one: a large section

A paragraph after heading one.

## Heading two: a main idea

A paragraph after heading two.

### Heading three: a supporting idea

A paragraph after heading three.

#### Heading four: a smaller distinction

A paragraph after heading four.

##### Heading five: a fine detail

A paragraph after heading five.

###### Heading six: the smallest heading

A paragraph after heading six.

## Lists

- A short unordered item.
- A longer item with enough text to wrap onto another line, so we can inspect indentation, alignment, and the distance between the bullet and its text.
- An item containing **emphasis** and a [link](/notes).
  - A nested item.
  - Another nested item.
    - A third level of nesting.

1. Start with a clear observation.
2. Consider more than one explanation.
   1. Try the simplest possibility first.
   2. Compare the result with the original.
3. Write down what changed.

7. An ordered list can start at a different number.
8. Its numbering should continue from there.

- A loose list item with multiple paragraphs.

  This second paragraph belongs to the first item and should stay aligned with its text.

- Another item, separated by a blank line in the source.

### Task lists

- [x] Read a short note.
- [x] Compare desktop and mobile widths.
- [ ] Review every element on this page.

## Quotations

> The purpose of a specimen is to make small differences easy to see.

> A longer quotation can run across multiple lines, with enough room to judge its indentation and the relationship between the rule and the text.
>
> This is a second paragraph inside the same quotation.
>
> > A quotation inside a quotation.
>
> — An imaginary editor

## Code

Inline code such as `formatPostMonth('2023-12-22')` should sit comfortably inside a sentence.

```ts
function readingTime(words: number): string {
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min read`
}

console.log(readingTime(840))
```

```text
A deliberately long code line: /notes/a-very-long-example-path/with-several-segments/that-should-scroll-inside-the-code-block/without-widening-the-reading-column
```

    This is an indented code block.
    Whitespace and <literal markup> should survive.

## Tables

| Element | Alignment | Example |
| :--- | :---: | ---: |
| Body text | Center | 18 |
| Reading column | Center | 704 |
| Media width | Center | 960 |
| **Emphasis** and `code` | Center | 24 |

## A horizontal rule

A paragraph before the divider.

---

A paragraph after the divider.

## Images

This image uses ordinary Markdown syntax. It should extend beyond the text column and remain centered.

![An early interface sketch showing a list of screenshot repositories](/assets/feed/2020-04-26-designing-fluxcapacitor.png)

The text returns to the reading column after the image.

### A linked image

[![The same interface sketch, linked to its original note](/assets/feed/2020-04-26-designing-fluxcapacitor.png)](/note/2020-04-26-designing-fluxcapacitor)

### A figure with a caption

<figure>
  <img src="/assets/feed/2020-04-26-designing-fluxcapacitor.png" alt="An interface sketch used to inspect image and caption alignment" width="1120" height="700" loading="lazy" />
  <figcaption>A caption beneath a wide image. This is raw HTML inside Markdown.</figcaption>
</figure>

## Embedded video

The same YouTube clip used in the Bill Hader note, shown at the wider media size.

<div class="video-embed">
<iframe src="https://www.youtube.com/embed/766IQ3nkR3Y?clip=Ugkxk8No7rSd3qel18hSzw5_uDMHQQzjre78&amp;clipt=ELqfJhjp3yk" title="Bill Hader on writing and feedback" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>

## Footnotes

A sentence can carry a small aside without interrupting the main argument.[^aside] Another sentence can refer to the same footnote.[^aside]

## Additional HTML elements

These elements are HTML extensions, rather than standard Markdown: <mark>highlighted text</mark>, <small>small print</small>, H<sub>2</sub>O, x<sup>2</sup>, <abbr title="HyperText Markup Language">HTML</abbr>, and <kbd>⌘</kbd> + <kbd>K</kbd>.

<details>
<summary>A disclosure to open and close</summary>
<p>This paragraph is tucked inside a native disclosure. It lets us check the summary marker, keyboard interaction, and spacing when expanded.</p>
</details>

<dl>
<dt>Measure</dt>
<dd>The width of a column of text.</dd>
<dt>Leading</dt>
<dd>The space between successive lines of type.</dd>
</dl>

## Wrapping and edge cases

This intentionally long inline token should wrap instead of pushing the page sideways: `a_deliberately_long_identifier_for_checking_how_inline_code_wraps_on_narrow_mobile_screens_without_changing_the_column_width`.

A final short paragraph marks the end of the specimen.

[reference]: /notes "Browse the notes archive"
[^aside]: A footnote with *emphasis* and a [link back to notes](/notes).
