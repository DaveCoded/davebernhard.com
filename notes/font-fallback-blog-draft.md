# How far should you go for a font fallback?

I tried to improve my website's font fallback. My first attempt made it worse.

This was slightly embarrassing, because the website had been doing a perfectly respectable job before I got involved. I'd started rebuilding it with Astro's blog template, and wanted to understand what the template had given me. One of those things was its font-loading setup. Another was this:

```css
font-display: swap;
```

Following that declaration led me through browser rendering, font metrics, performance measurement and the surprisingly consequential difference between a font family and a font face. Eventually I had a script, nine fallback declarations and a much better appreciation of the default I'd started with.

I was using [ET Book](https://edwardtufte.github.io/et-book/), a typeface developed for Edward Tufte's books. I love how it looks on a page of prose. I wanted the text shown while it loaded to feel like it belonged on the same website.

*[Visual: a short, replayable recording of the same paragraph swapping from fallback to ET Book. Show the generated Times fallback and the custom Palatino fallback under identical conditions. Label the artificial network delay; let readers pause on either font.]*

The first thing I needed to understand was why there was a swap at all.

A browser can need a font before that font is ready. `font-display` determines how it handles the wait: whether text is initially hidden, when a fallback becomes visible, and how long the browser will accept a replacement.

MDN describes `swap` as giving the font an:

> extremely small block period and an infinite swap period.

That means readable fallback text appears almost immediately, and the web font can replace it whenever it becomes available. Other choices make different compromises: `fallback` limits the swap period; `optional` can leave the reader with the fallback for that visit. [MDN's font-display reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-display) describes the alternatives.

I initially imagined this timer starting after the file had downloaded. It starts when the browser first attempts to use the face. Fetching and using a font are separate concerns: preloading can begin fetching earlier, and the data still needs to be parsed and activated before use. [The CSS Fonts specification](https://www.w3.org/TR/css-fonts-4/#font-display-timeline) separates those stages.

For my chosen strategy, the practical question was straightforward: what should readers see while ET Book is unavailable?

*[Optional diagram: a schematic font-display timeline with an adjustable font-ready marker. Contrast swap, fallback and optional. Label it as an explanation of the policies, not a promise of exact browser timings; keep it collapsed for readers who want to follow the main story.]*

Before choosing a fallback, I needed to see the one I already had. On my development machine, the transition was easy to miss.

In Chrome's Network panel, I enabled throttling and disabled cache, then reloaded with DevTools open. Now I could watch the fallback appear before ET Book arrived. Disabling cache mattered: slowing the network achieves little if the browser already has the file.

To identify the fallback, I selected a paragraph and checked **Rendered Fonts** in the Computed panel. The `font-family` declaration tells you what you requested. Rendered Fonts tells you what painted the selected text.

That distinction became rather important.

I'd been exploring old-style serif stacks, using [Modern Font Stacks](https://modernfontstacks.com/) as a starting point. Palatino appealed to me as a companion to ET Book. But choosing a similar-looking typeface only addresses part of the problem.

Two fonts at `20px` can occupy different amounts of space. Their letters can have different widths; their vertical metrics can differ. A slightly wider word can push the next word onto another line, adding height to the paragraph and moving what follows.

CSS lets us describe an adjusted version of a locally available font. Here is the regular Palatino face from my eventual implementation:

```css
@font-face {
  font-family: 'ET Book Mac and Windows Fallback';
  src: local('Palatino'), local('Palatino Linotype');
  font-weight: 400;
  font-style: normal;
  size-adjust: 90.5593%;
  ascent-override: 98.9403%;
  descent-override: 34.0764%;
}
```

The new family name gives me an alias I can put in a font stack. Its source is a font already on the reader's machine.

`size-adjust` scales the glyphs and their metrics. At roughly 90.6%, this face renders smaller than unadjusted Palatino at the same CSS font size. It scales width and height together; it cannot independently reshape the letters. [MDN explains what size-adjust scales](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/size-adjust).

The ascent and descent overrides change the vertical metrics used in layout. A fourth descriptor, `line-gap-override`, controls the font's line-gap metric. These values interact with the page's `line-height`, so inspecting a font in isolation only gets you so far. [Katie Hempenius's explanation of font metric overrides](https://developer.chrome.com/blog/font-fallbacks/) is a useful reference.

*[Interactive illustration: overlay ET Book and the fallback in different colours. Give readers separate controls for size-adjust and the vertical metrics, with baselines and line boxes visible. Provide a reset button and a static annotated example. If the chosen local font is unavailable, say so instead of silently demonstrating a different font.]*

Armed with an increasingly elaborate list of candidates, I returned to Astro. I put the fonts I preferred before the final `serif` fallback and inspected the result.

Times New Roman.

I changed the list. Still Times New Roman. Astro appeared entirely unmoved by my typographic opinions.

The generated CSS explained why. With a trailing `serif`, Astro's optimiser created a fallback based on Times New Roman and placed it ahead of the named fonts I'd supplied. Simplifying the generated names, the result looked like this:

```text
What I supplied:
Palatino → Palatino Linotype → serif

Fallback order after optimisation:
Adjusted Times New Roman → Palatino → Palatino Linotype → serif
```

This behaviour is present in the Astro 7.2.0 implementation used by my project. A [GitHub report](https://github.com/withastro/astro/issues/16127) shows the same ordering surprise; that issue is now closed. The output was valid CSS, but the priority was different from the one I'd intended.

And it worked quite well. That was the inconvenient part. Astro had already adjusted Times to reduce movement when ET Book arrived. I had a reasonable solution before I'd touched the sliders.

I carried on because I wanted to understand the mechanism, and because I preferred Palatino's appearance. I disabled automatic optimisation, declared my own adjusted faces, and copied Astro's generated Times adjustments into a named fallback further down the chain. I kept Astro's font API for registering and preloading ET Book.

*[Screenshot: place the requested stack beside the generated CSS, highlighting the inserted Times face. Include a crop of Rendered Fonts showing which face actually resolved. This is evidence of the behaviour, rather than another picture of two similar paragraphs.]*

For the manual adjustments, I used [Vincent Bernat's interactive tuning tool](https://vincent.bernat.ch/en/blog/2024-cls-webfonts). It lets you overlay fonts and change the descriptors directly. I adjusted the scale, then worked on the vertical alignment.

The result looked promising. Measuring it was less flattering.

| Fallback | Layout-shift value recorded during my experiment |
|---|---:|
| My hand-tuned Palatino | 0.16609 |
| Astro's generated Times New Roman | 0.06680 |

In that comparison, my lovingly adjusted fallback produced roughly two and a half times the shift.

These were values from `layout-shift` entries observed in the browser. They are worth distinguishing from **Cumulative Layout Shift**, or CLS. CLS groups eligible shifts into session windows and takes the largest window's total. It isn't an average, and one logged entry isn't necessarily the complete metric. [The CLS documentation](https://web.dev/articles/cls) explains the calculation.

Lighthouse had initially reported zero for both versions, which added another question. Its default simulated throttling differs from applying a delay to actual requests. That makes the test conditions worth investigating, but I didn't preserve enough evidence to establish the cause of my discrepancy. [Lighthouse's throttling documentation](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md) explains the distinction.

I wouldn't publish those two numbers as a universal verdict on either font. They were, however, sufficient reason to question my tuning and try a more systematic approach.

*[Evidence to add before publication: repeat this comparison with identical content, viewport, zoom, cache, preload and throttling settings. Verify the rendered face, attribute the shifts and record several runs. Keep individual shift values distinct from complete CLS scores. Replace or supplement this historical table with those results.]*

[Jeremy Keith's account of his font strategy](https://adactio.com/journal/22450) pointed me towards Hempenius's calculations. The percentages I'd been nudging could be derived from measurements.

I used [fontkit](https://github.com/foliojs/fontkit) to read the font files and lay out a sample string. Palatino came in a `.ttc`, a collection containing multiple faces, so selecting the intended face was part of the job.

The calculation starts by comparing the width of the same text in both fonts. Font files use their own coordinate systems; dividing by each font's units-per-em makes the widths comparable.

```js
function normalisedWidth(font, text) {
  return font.layout(text).advanceWidth / font.unitsPerEm;
}

const scale =
  normalisedWidth(primary, sample) /
  normalisedWidth(fallback, sample);
```

If the fallback takes more space, the ratio is below one, and we shrink it. Multiplying `scale` by 100 gives the CSS percentage.

For the vertical adjustments, the calculation uses the primary font's metrics and compensates for that scaling:

```js
const ascent = primary.ascent / primary.unitsPerEm / scale;
const descent = Math.abs(primary.descent) / primary.unitsPerEm / scale;
const lineGap = primary.lineGap / primary.unitsPerEm / scale;
```

Again, multiply by 100 when writing percentages. Dividing by `scale` matters because `size-adjust` also scales the overridden metrics. For an illustrative target ascent of `0.9em` and a scale of `0.9`, the override is 100%: applying the scale brings it back to the desired `0.9em`. These calculations follow the relationship described in [Hempenius's formula](https://developer.chrome.com/blog/font-fallbacks/#calculating_size-adjust_and_font_metric_overrides).

There was one apparently small choice in the script: `sample`.

The first version, developed with Claude's help, used:

```text
BESJQKXZgqvw0O
```

There are tall letters in there. Descenders. A number. It looks usefully varied.

It looks considerably less like a paragraph from my blog.

The first computed version gave me a shift value around **0.029**, but Palatino still made paragraphs longer than ET Book. Replacing the sample with actual prose from the Astro welcome page improved the visual match.

The calculation had answered the question I'd given it: how much should this font be scaled to match the width of *this string*? A sample dominated by capitals gives those capitals considerable influence over the answer.

And even a representative sample has limits. Two fonts don't differ by one uniform factor. The scale that matches one word may be slightly wrong for another; a small difference near a line ending can change the wrap. Bernat makes the limitation explicit when discussing proportional fonts:

> it is not possible to achieve a perfect match.

[His tuning instructions](https://vincent.bernat.ch/en/blog/2024-cls-webfonts#interactive-tuning-tool) had contained that warning all along.

My later notes record shift values around **0.05–0.07**, varying with the browser width, and describe the result as broadly similar to the Times fallback. That doesn't form a neat progression from bad score to good score. The earlier 0.029 was lower, yet I preferred the later rendering. I was examining related qualities, and I hadn't kept every test condition fixed.

The next useful test would be different prose from the text used to calculate the adjustment. Matching a sample is the beginning of validation.

*[Interactive demo: let readers edit a paragraph and change its container width. Compare ET Book with fallbacks calculated from the original sample and from representative prose. Display line breaks and paragraph heights, with an overlay option. Label this as a geometry comparison, not a live CLS benchmark. Include a second paragraph that was not used in either calculation.]*

I repeated the work for regular, italic and bold text, then extended the stack. This brought another kind of mismatch: the font I thought I'd named wasn't necessarily the face the browser could find.

For the Linux-oriented fallback I explored P052, from the [URW base-35 font family maintained by Artifex](https://github.com/ArtifexSoftware/urw-base35-fonts). I installed a copy on my Mac for testing. It appeared in Font Book. My inspection script reported its family name as `P052`.

Chrome still rendered Times.

Restarting Chrome didn't fix it. Checking that the font was activated didn't fix it. This did:

```css
src: local('P052 Roman');
```

The CSS specification describes a `local()` name as identifying:

> a single font, not an entire font family.

For OpenType and TrueType fonts, the relevant identifiers are the full font name or PostScript name. A family name reported by a tool isn't sufficient evidence that the same string will work in `local()`. [CSS Fonts: the src descriptor](https://www.w3.org/TR/css-fonts-4/#src-desc).

That distinction also made me less confident about an earlier detour. I'd abandoned Iowan Old Style after its local lookup failed. At one point I set its adjustment to 244%, just to make success unmistakable. Nothing became enormous. The cause wasn't established, though; I would test its actual face names before attributing that failure to an operating-system restriction.

There are real restrictions to consider. WebKit documents that it exposes OS fonts while excluding user-installed fonts as a fingerprinting defence. Palatino worked in my Safari test, but installing another font myself doesn't give it the same status. [WebKit's tracking-prevention documentation](https://webkit.org/tracking-prevention/) explains the policy.

Likewise, successfully loading P052 on my Mac doesn't establish its availability or behaviour on someone else's Linux installation. My broader platform testing remained unfinished.

The intended final stack was ET Book, adjusted Palatino or Palatino Linotype, adjusted P052/Palladio, adjusted Times New Roman, then a generic serif. I appended that last safety net in ordinary CSS:

```css
font-family: var(--font-etbook), serif;
```

The generic lets the browser choose a suitable available serif. That choice can't inherit adjustments calculated for a different, specifically named font.

By then I had nine fallback declarations: three tiers, each with regular, italic and bold variants. I had also acquired a small maintenance obligation. The percentages depended on particular font files and assumptions about their use. Adding a variant or changing ET Book would mean revisiting them. Copying Astro's generated Times rules had given me control over ordering, but those copied values would no longer update themselves.

So would I recommend doing all of this?

For a site whose generated fallback already behaves well, I'd start by keeping it. If there is a visible problem, reproduce it under meaningful conditions, identify the font actually being rendered and measure the effect of a change. A custom fallback can be worthwhile when it addresses a specific requirement. Its appearance can also matter if the web font never arrives.

I'd reconsider the loading strategy alongside the fallback. The choice to accept a late swap is itself a design decision. So is which font to preload: Astro's documentation recommends [preloading sparingly](https://docs.astro.build/en/guides/fonts/#preloading-fonts), since those requests compete with other resources.

For my own site, curiosity was a sufficient reason to continue. I now understand what those percentages are doing, why the sample text matters and why an installed font can fail to resolve. I also know how easily a pleasant visual impression can outrun the evidence.

My custom stack is still there. I haven't demonstrated that it universally outperforms Astro's default, and the tests I'd need to make a narrower claim are now much clearer to me.

I started by wanting to understand a line in a template. I can now explain the font that appears before my font, the work involved in making it fit, and why I'd usually be happy to let a framework do that work for me.
