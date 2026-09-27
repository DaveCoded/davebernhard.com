# An unnecessarily thorough guide to font fallbacks

Astro's blog template gave me an optimised font fallback before I understood what one was. This seemed like a good reason to find out.

I was using ET Book, a serif I particularly like for reading. Astro could adjust Times New Roman to reduce movement when ET Book loaded. I wondered whether I could have that stability with a fallback I liked looking at more. Several experiments later, I had learned enough to make this a much less simple question.

You probably don't need to handcraft your font fallbacks. But doing so exposes some useful details about how browsers choose fonts, how text occupies space, and what performance measurements actually tell you. Here is the method I'd use, including the traps worth knowing about before touching the percentages.

**Decide what you are optimising.** A fallback has at least three jobs: keep the text readable, preserve the layout, and look acceptable while the intended font is unavailable.

Those jobs overlap, but they aren't interchangeable. A font can resemble ET Book and still make a paragraph a line longer. Another can look quite different while occupying almost the same space.

You do **not** need a similar-looking font to reduce Cumulative Layout Shift, or CLS. The relevant question is whether the replacement moves visible content. Similar letterforms are an aesthetic benefit; suitable dimensions are what help preserve the layout. That doesn't make every pair of fonts equally easy to match, either. Their relative character widths still matter.

In the Astro 7.2.0 installed in my project, automatic selection uses a fixed mapping: `serif` leads to Times New Roman, `sans-serif` to Arial, with known fallback metrics. It doesn't examine ET Book's appearance and decide which installed serif would best complement it.

A framework could offer curated visual matches. This implementation simply doesn't make that choice. And a build running on my machine cannot know the exact fonts available on every reader's device. Calculating adjustments for known candidates and letting the browser try them is a practical approach. You can see the mapping in [Astro's system fallback provider](https://github.com/withastro/astro/blob/main/packages/astro/src/assets/fonts/infra/system-fallbacks-provider.ts); these details should always be checked against the version you use.

*[Interactive comparison: show ET Book beside unadjusted Palatino and adjusted Times New Roman. Let readers switch between the letterforms and an outline-only view of text positions and paragraph bounds. Use a verified example to demonstrate that resemblance and stability are different qualities.]*

**Choose the loading policy before refining the substitute.** With `font-display: swap`, the browser shows fallback text after an extremely brief blocking period, then accepts the web font whenever it becomes ready. With `fallback`, that opportunity expires; with `optional`, there is no swap period after the brief block. `block` has a longer initial block and an unlimited swap period. `auto` leaves the policy to the browser. [MDN documents these behaviours](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-display).

The display timer starts when the browser first attempts to use the font face. It doesn't start after a completed download. A preload can start the fetch earlier, and fetching bytes is only part of making a font usable.

This gives you two separate ways to improve the experience: change when a replacement is allowed, and improve how well the two fonts fit. A fallback also deserves attention when the web font never arrives, because it may become the reader's font for the whole page.

*[Interactive timeline: choose a display policy and drag a “font ready” marker. Show when text is invisible, rendered in fallback, or eligible to use the web font. Include an independent fetch-start marker to explain preloading. Label timings as schematic rather than exact cross-browser promises.]*

**Choose fonts the reader has a reasonable chance of having.** [Modern Font Stacks](https://modernfontstacks.com/) is a useful place to start. It groups system-font stacks by visual category, so you can explore an old-style serif stack, a humanist sans, or something else appropriate to your design.

Treat a stack as a set of candidates to verify. It isn't a guarantee that a particular font exists on every device, nor that similarly named versions have identical metrics. Palatino and Palatino Linotype can share a place in your design without being identical font files. P052 and older URW Palladio distributions also deserve inspection rather than assumptions based on their relationship.

Keep a generic family such as `serif` at the end. It expresses a category the browser can resolve according to its environment. It does not mean Times New Roman everywhere, and adjustments calculated for Times cannot automatically apply to whichever font that generic selects.

There are also two different meanings of “local” to keep straight. Astro's [local font provider](https://docs.astro.build/en/reference/font-provider-reference/#local) reads files from your project for the website to serve. CSS `local()` asks for a font available on the **reader's** machine. Putting Palatino on your development machine doesn't put it on theirs.

**Give each adjusted fallback its own name.** This lets you use altered metrics without changing the ordinary font family throughout the page. For example, here are the main values from my regular Palatino fallback:

```css
@font-face {
  font-family: 'ET Book Palatino Fallback';
  src: local('Palatino'), local('Palatino Linotype');
  font-weight: 400;
  font-style: normal;
  size-adjust: 90.5593%;
  ascent-override: 98.9403%;
  descent-override: 34.0764%;
}

body {
  font-family: 'ET Book', 'ET Book Palatino Fallback', serif;
}
```

This assumes ET Book has been registered under that name. With Astro's generated families, use its CSS variable instead. The percentages belong to this particular pairing and calculation; they are not general recommendations for Palatino.

There are two ordered lists here. `font-family` supplies candidate families. The `src` list supplies alternative sources for **one declared face**. Both Palatino sources therefore receive exactly the same adjustments. The browser does not calculate a different scale for each source. If the files need different values, declare separate fallback families. [MDN explains source selection](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/src).

The controls are easiest to understand separately:

| Descriptor | What it changes |
|---|---|
| `size-adjust` | Scales glyph outlines and font metrics, including character advances |
| `ascent-override` | Replaces the ascent metric used above the baseline |
| `descent-override` | Replaces the descent metric used below the baseline |
| `line-gap-override` | Replaces the font's line-gap metric |

`size-adjust: 90%` makes the font smaller in both dimensions. It cannot narrow letters while preserving their height. The vertical overrides change layout metrics; increasing the ascent does not redraw a taller capital A. See the references for [size-adjust](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/size-adjust) and [ascent-override](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/ascent-override).

Nor is `line-gap-override` another spelling of `line-height`. With `line-height: normal`, font metrics help determine line height. An explicit value changes the situation: in a simple paragraph, `font-size: 20px; line-height: 1.5` gives a 30px used line height. Metrics still affect baseline positioning, and mixed inline content can complicate the line box. Most obviously, equal line heights won't help if the fallback adds an extra line. [MDN's line-height reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-height) covers the distinction.

The example above retains the fallback's native line gap. When generating a complete set of overrides, choose that value deliberately too; setting it to zero is appropriate only if that matches the target metrics.

There is also a separate property called [`font-size-adjust`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-size-adjust). It can preserve a chosen measure, such as x-height, across fonts. That is useful for perceived size and readability, but matching x-height alone doesn't guarantee matching word widths. Don't confuse it with the `@font-face` descriptor `size-adjust` used here.

*[Interactive explainer: overlay two lines of text, their baselines and their line boxes. Provide the four descriptor controls and a switch between normal and explicit line-height. Let readers see which controls change the letters, which change the layout metrics, and why another wrapped line defeats matching line heights.]*

**Verify the source before tuning it.** `local()` is especially easy to misunderstand. The CSS Fonts specification says it identifies:

> a single font, not an entire font family.

For OpenType and TrueType, the lookup uses the full font name or PostScript name. These may differ from the family name shown in a font picker or reported by an inspection tool. [The specification describes the naming rules](https://www.w3.org/TR/css-fonts-4/#src-desc).

My P052 installation illustrates the difference. Its family name was `P052`, but the local source that resolved in my test was:

```css
src: local('P052 Roman');
```

Inspect the file's actual names instead of constructing them by concatenating a family and a style. If you provide both full and PostScript names for compatibility, verify both identifiers.

Check each weight and style too. A regular face labelled `font-style: italic` doesn't become the font's designed italic. Missing faces can lead to approximation or synthesis, so merely seeing slanted or heavier text proves little. [Font synthesis](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-synthesis) is another part of the browser's behaviour to account for.

Don't assume a missing bold face makes the browser proceed to the next family, either. It can select a different available weight within the current family. Your stack isn't a search for the first family with an exact weight match. [The font-matching algorithm](https://www.w3.org/TR/css-fonts-4/#font-style-matching) explains that ordering.

Availability also depends on browser policy. WebKit documents that its fingerprinting protections exclude user-installed fonts while retaining fonts supplied with the operating system. A font visible in Font Book may therefore be unavailable to a website in Safari. [WebKit's policy](https://webkit.org/tracking-prevention/) is the primary reference.

An unsuccessful lookup doesn't tell you its cause. Check the identifier, installation, browser policy and resulting rendered face. When my Iowan Old Style lookup failed, an explanation involving its macOS status sounded plausible; I hadn't established that diagnosis. The face name needed checking too.

**You can find the percentages by eye or by calculation.** Manual tuning is useful for understanding the controls and exploring a particular font pair. [Vincent Bernat's tool](https://vincent.bernat.ch/en/blog/2024-cls-webfonts#interactive-tuning-tool) lets you supply fonts and manipulate the relevant descriptors.

Start with `size-adjust` to bring text widths closer. Then adjust ascent and descent while watching baselines and paragraph bounds. Check the line gap where relevant. Repeat against the actual page styles, including its line height, rather than assuming a match inside the tool transfers unchanged.

Keep several samples and widths in view. [Bernat's instructions](https://vincent.bernat.ch/en/blog/2024-cls-webfonts#interactive-tuning-tool) make the limitation explicit: for proportional fonts,

> it is not possible to achieve a perfect match.

Two designs won't generally have the same width ratio for every character. A slider that aligns one line beautifully can still misalign the next.

Computation makes the assumptions easier to repeat and inspect. [Katie Hempenius describes the underlying formulas](https://developer.chrome.com/blog/font-fallbacks/#calculating_size-adjust_and_font_metric_overrides). My implementation used fontkit to measure the same sample text in the primary and fallback fonts.

First normalise those widths by each font's units-per-em. Font coordinates aren't necessarily expressed on the same scale: a measurement of 900 units has a different meaning in a 1000-unit font and a 2048-unit font.

```js
const widthInEms = (font, text) =>
  font.layout(text).advanceWidth / font.unitsPerEm;

const scale =
  widthInEms(primary, sample) /
  widthInEms(fallback, sample);

const ascent = primary.ascent / primary.unitsPerEm / scale;
const descent = Math.abs(primary.descent) / primary.unitsPerEm / scale;
const lineGap = primary.lineGap / primary.unitsPerEm / scale;
```

These are ratios; multiply by 100 to emit CSS percentages. The code assumes `primary` and `fallback` are the intended faces opened with [fontkit](https://github.com/foliojs/fontkit).

Why divide the vertical overrides by the scale? Because `size-adjust` scales those overridden metrics as well. If the target ascent is `0.9em` and the scale is `0.9`, an override of 100% becomes the desired `0.9em` after scaling. Applying 90% twice would produce `0.81em`.

One subtle consequence: without scaling, the target vertical overrides come from the primary font. Once you introduce different scales for different fallbacks, their percentage values must differ too.

**The sample is part of the algorithm.** This deserves more scrutiny than the number of decimal places in the output.

One version of my script used `BESJQKXZgqvw0O`. It contained a pleasing selection of letter shapes, but wasn't representative of running prose. Replacing it with a paragraph improved the visual result.

A width ratio calculated from that string is exactly a ratio for that string. Capital-heavy headings, lowercase prose, dates and another language can produce different compromises. And matching the total width of a paragraph laid out as one long run doesn't guarantee matching its line breaks: the widths of the successive words determine where wrapping happens.

You can use a representative corpus, frequency-weighted character widths or an existing tool's metric estimate. What matters is understanding which choice you made and evaluating it on text that wasn't used to derive the values. Browser shaping, font features and CSS spacing also need to agree closely enough with the measurement setup.

Astro's installed optimiser uses an average-width metric; my script measures a shaped string. Both produce adjustments, but they need not produce identical values. “Calculated” does not imply one universal answer.

*[Interactive experiment: choose a training sample—capitals, prose or numerals—and calculate an adjustment. Apply it to a separate editable test paragraph. A width slider should reveal wrap changes; show both total width error and line count so readers can see why a good average can still produce a different paragraph.]*

Font files introduce another layer of detail. A `.ttc` is a collection, so inspect its faces rather than assuming the first is regular. Record the full name, PostScript name, style and weight used in each calculation.

And an ascent is not always one unambiguous field. OpenType contains several sets of vertical metrics; flags such as `USE_TYPO_METRICS` influence which values applications use. A library's convenient `ascent` property doesn't establish identical rendering in every environment. [The OpenType metrics specification](https://learn.microsoft.com/en-us/typography/opentype/spec/os2#stypoascender) explains these fields. If results disagree across platforms, checking the metric tables is a better next step than adding more decimal places.

You don't need to write a generator to use these techniques:

| Resource | Useful when you want to… |
|---|---|
| [Modern Font Stacks](https://modernfontstacks.com/) | Find system-font candidates by visual category |
| [Bernat's tuning tool](https://vincent.bernat.ch/en/blog/2024-cls-webfonts#interactive-tuning-tool) | Explore the descriptors visually using supplied fonts |
| [Fontaine](https://github.com/unjs/fontaine) | Generate fallback rules through a build integration |
| [Fontpie](https://github.com/pixel-point/fontpie) | Generate CSS from a command-line tool; its documented fallback option selects a category |
| [Capsize](https://github.com/seek-oss/capsize#createfontstack) | Generate an adjusted stack from font metrics |
| [fontkit](https://github.com/foliojs/fontkit) | Inspect font files and implement your own measurements |

Check that a tool can obtain metrics for your chosen fallback. Accepting a font name in configuration doesn't mean it can discover arbitrary font data on your computer. Also inspect its generated sources and styles; an impressive number of decimal places cannot rescue the wrong face.

**Inspect what your framework emits.** In Astro 7.2.0, a trailing generic fallback triggers optimisation using a known representative. The generated face is inserted ahead of the names you supplied. A simplified example is:

```text
Configured: Palatino → serif
Generated:  adjusted Times New Roman → Palatino → serif
```

That explains why adding preferred fonts can appear to have no effect. [Issue #16127](https://github.com/withastro/astro/issues/16127), now closed, includes an example of this ordering. A named-only list or an empty list doesn't trigger this optimisation in the installed version; omitting the option uses Astro's default sans-serif fallback.

For explicit control, declare your adjusted faces yourself and configure their aliases:

```js
// Within the relevant Astro font configuration
optimizedFallbacks: false,
fallbacks: [
  'ET Book Palatino Fallback',
  'ET Book P052 Fallback',
  'ET Book Times Fallback',
],
```

Each alias needs its own CSS declarations. Append the generic separately:

```css
font-family: var(--font-etbook), serif;
```

You can retain Astro for your primary font. I copied its generated Times adjustments into the last named tier, but copying freezes those values. Keeping a reproducible generator would make later font changes easier.

**Test identification, geometry and loading as separate questions.** Otherwise it's easy to spend an hour refining a fallback that never rendered.

For identification, block the web-font requests and inspect the fallback without racing the download. Select the actual text in DevTools and examine Rendered Fonts. Check regular, bold and italic runs separately. A deliberately absurd adjustment, such as my temporary 244%, can make it obvious whether the adjusted alias is active.

For geometry, compare fully loaded faces at identical container widths and font sizes. Examine line breaks, paragraph height, baselines and mixed styles. A manual toggle is useful here because you control exactly what changes.

For loading, restore the requests, disable cache, apply throttling and record a reload. Confirm the fallback was actually painted before the web font became available. A zero shift from a load that never displayed fallback doesn't establish that the metrics match.

*[Visual: an annotated DevTools capture linking the font request, the fallback frame, the rendered face and the eventual swap. Pair it with a paused view of the fallback. Make the caption distinguish “this font resolved” from “this transition was measured”.]*

Use the current generated fallback as your baseline. Compare it with your custom candidate while keeping content, viewport, zoom, browser, cache state and preload settings constant. Repeat at several widths, especially near a heading or paragraph's wrapping threshold. In one of my early comparisons, hand-tuned Palatino produced an individual shift value around 0.166 versus 0.067 for generated Times. Those historical observations aren't a controlled benchmark, but they were a useful warning against trusting appearance alone.

For diagnostics, observe individual shifts:

```js
if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log({
        value: entry.value,
        hadRecentInput: entry.hadRecentInput,
        sources: entry.sources,
      });
    }
  }).observe({ type: 'layout-shift', buffered: true });
} else {
  console.info('Layout-shift observation is unavailable here.');
}
```

The [supported-entry check](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver/supportedEntryTypes_static) prevents silence from being mistaken for success. The affected nodes and a performance trace help identify what moved; a shift entry alone doesn't prove the font caused it.

CLS combines eligible shifts into session windows, with less than a second between shifts and a maximum window length of five seconds, then takes the largest total. It isn't an average or necessarily one entry's value. Scores depend on movement relative to the viewport, which is another reason to keep dimensions fixed during a comparison. [The CLS definition](https://web.dev/articles/cls) explains the calculation.

CLS measures visible instability. Extra lines farther down a long article may change its total height without moving anything in the viewport. A low score and visibly different wrapping can therefore coexist. Keep inspecting the typography as well as the number.

There's a trap for interactive demos here: shifts within 500ms of qualifying user input are excluded from CLS. Clicking a font-toggle button can therefore produce visible movement that doesn't count. Use toggles to study geometry; use an actual loading test to assess the swap.

For the metric itself, use the [web-vitals library](https://github.com/GoogleChrome/web-vitals) rather than treating a diagnostic observer as a complete CLS implementation. For example, in bundled browser code:

```js
import { onCLS } from 'web-vitals';

onCLS(console.log, { reportAllChanges: true });
```

That reports changes to the metric, not every shift. Also record how Lighthouse was configured: its default simulated throttling is different from delaying real requests. [Lighthouse's documentation](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md) describes the distinction. Investigate disagreements between tools rather than choosing whichever number is more reassuring.

Finally, test the failure case and the environments you claim to support. Disable the preferred local candidate as well as blocking the web font, so you can inspect later tiers. Use real devices or representative environments to verify names and rendering; installing a Linux-associated font on a Mac only tests that installation. Include the scripts, characters and styles your content uses, because a successful Latin paragraph doesn't establish glyph coverage for everything else.

*[Before publication: run and preserve a small comparison matrix—generated fallback versus custom fallback, several widths, multiple text samples and repeated loads. Record exact font faces and versions. Add Windows, Linux and Android observations if making claims about those platforms; otherwise state the limits.]*

The practical stopping point is a fallback that is readable, available in the environments you support, and demonstrably stable enough for your pages. Visual refinement can be a reason to continue, provided you measure its consequences and accept the maintenance.

If you do keep custom values, save the font identities, sample text, generator version and test conditions alongside them. A percentage is much easier to maintain when you know where it came from.

I went further because I wanted to understand what Astro had already done for me. The useful result is a method for deciding when a fallback needs attention—and for knowing whether an adjustment helped.
