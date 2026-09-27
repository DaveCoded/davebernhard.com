# Card-suit markers: research and editorial brief

Research checked 27 September 2026. These are source-backed findings and demo candidates, not a finished article. No site styles were changed.

## TL;DR

For four repeating decorative bullets, the four `:nth-of-type()` rules are a perfectly reasonable solution. The distinction is **decorating sibling positions versus defining how an integer is written**. `@counter-style` provides reusable numbering systems; `symbols()` makes a useful subset available inline, without declaring a name. Neither newly invents counting in CSS.

The deeper motivation is international typography. The entertaining consequences include repeating footnote symbols, medals followed by ordinary numbers, numbers written as combinations of dice faces, and configurable bullet sequences passed through custom properties. Most of the capability comes from custom counter styles; `symbols()` primarily improves convenience and composition.

Suggested thesis: **“I wanted four fancy bullets. I found CSS’s toolkit for writing numbers.”**

## The three opening examples

Treat these as alternatives, not consecutive additions to the same stylesheet. An explicit marker `content` overrides the marker that `list-style-type` would generate.

### 1. Decorate positions

```css
.prose ul > li:nth-of-type(4n + 1)::marker { content: "♠︎  "; }
.prose ul > li:nth-of-type(4n + 2)::marker { content: "♥︎  "; }
.prose ul > li:nth-of-type(4n + 3)::marker { content: "♦︎  "; }
.prose ul > li:nth-of-type(4n)::marker     { content: "♣︎  "; }
```

This already handles arbitrary list lengths and DOM insertions/removals. Do not claim it requires JavaScript to maintain the sequence. Adding colors directly to these four rules is especially straightforward.

### 2. Define a reusable representation

```css
@counter-style card-suits {
  system: cyclic;
  symbols: "♠︎" "♥︎" "♦︎" "♣︎";
  suffix: "  ";
}

.prose ul {
  list-style-type: card-suits;
}
```

The built-in `list-item` counter supplies the integer; `card-suits` supplies its representation. The same name can also be used with `counter()` and `counters()` in generated content. See the [Counter Styles specification](https://drafts.csswg.org/css-counter-styles-3/).

### 3. Define an anonymous representation where it is used

```css
.prose ul {
  list-style-type: symbols(cyclic "♠︎" "♥︎" "♦︎" "♣︎");
}
```

This produces the same suit sequence, but not exactly the same spacing: its suffix is a single space, rather than our two-space custom suffix. It has no suffix-setting argument. Keep `cyclic` explicit: the default system is `symbolic`, which repeats each symbol more times on subsequent passes.

`symbols()` supports `cyclic`, `fixed`, `symbolic`, `alphabetic`, and `numeric`. Use a named rule for `additive`, `extends`, or descriptor customization. The [Chrome 155 announcement](https://developer.chrome.com/blog/chrome-155-beta) confirms the inline function also works as the style argument to `counter()` and `counters()`.

## A difference that matters even for suits

I tested these cases in Chrome 153.0.8010.53 using an isolated headless profile. Results were extracted from the browser's accessibility tree; this verifies generated marker text, not screen-reader speech or visual spacing.

| Case | Position-based marker rules | Named cyclic counter style |
| --- | --- | --- |
| Four ordinary items | ♠︎ ♥︎ ♦︎ ♣︎ | ♠︎ ♥︎ ♦︎ ♣︎ |
| Second item has `display: none` | ♠︎ ♦︎ ♣︎ | ♠︎ ♥︎ ♦︎ |
| `<ol reversed start="4">` | Still follows sibling positions | ♣︎ ♦︎ ♥︎ ♠︎ |
| First `<li value="3">` inside an `<ol>` | Still follows sibling positions | ♦︎ ♣︎ ♠︎ |

Hidden elements still occupy DOM sibling positions, but `display: none` elements do not increment CSS counters. `visibility: hidden` is different and does not suppress counting. The counter behavior is specified in [CSS Lists: counters in elements that do not generate boxes](https://drafts.csswg.org/css-lists-3/#counters-without-boxes).

This is not evidence that selectors are bad. They express a different policy. A selector can deliberately preserve each hidden item's place, and more selective selectors can accommodate known filtering conventions. Counter styles naturally follow counter values, including HTML numbering controls.

There is a related color trap: `:nth-of-type()` rules for red hearts/diamonds can get out of sync with counter-generated suits after hiding items or changing an ordered list's starting value. Neither counter-style syntax associates a CSS color with an individual symbol. For an ordinary, unfiltered `ul` starting at one, positional coloring remains fine.

## Why the features exist

### Extensibility for real writing systems

The specification editor's [2013 Last Call announcement](https://lists.w3.org/Archives/Public/public-pfwg-comments/2013JulSep/0001.html) describes numbering systems inadequately served by CSS2/2.1. Chromium's [2021 implementation discussion](https://groups.google.com/a/chromium.org/g/blink-dev/c/kC8b-dZ8uBQ/m/Ngopo8S2AgAJ) explicitly identifies internationalization as a benefit.

Instead of waiting for browser vendors to hard-code another spelling of numbers, authors can describe one. This is a genuine capability increase over a fixed menu of built-in styles, and avoids manually generating every marker in markup or application code.

The Internationalization Working Group's [Ready-made Counter Styles](https://www.w3.org/TR/predefined-counter-styles/) contains 181 styles covering more than 45 writing systems. It documents practical details such as Myanmar punctuation and alternative affixes for different contexts. Some entries describe already-built-in styles; do not imply every script shown needs custom CSS. Appropriate fonts are still required.

### Less ceremony for local choices

The [2026 Chromium `symbols()` proposal](https://www.mail-archive.com/blink-dev@chromium.org/msg17319.html) explicitly emphasizes avoiding a named rule for a one-off style. The [review discussion](https://www.mail-archive.com/blink-dev@chromium.org/msg17341.html) characterizes it as a quality-of-life addition. This is primarily ergonomics and interoperability, not a more powerful replacement for the at-rule.

An additional practical benefit is ordinary property-value composition. This was verified in the local browser experiment:

```css
.fancy-list {
  /* Fallback for browsers without the function. */
  list-style-type: card-suits;
  --bullet-symbols: "♠︎" "♥︎" "♦︎" "♣︎";
}

.fancy-list.celestial {
  --bullet-symbols: "☀︎" "☾";
}

@supports (list-style-type: symbols(cyclic "*")) {
  .fancy-list {
    list-style-type: symbols(cyclic var(--bullet-symbols));
  }
}
```

One component rule now handles symbol sequences of different lengths. With positional rules, both the number of rules and their modulus change. With named counter styles, each distinct sequence needs a corresponding definition. The named approach can still switch between existing styles using a custom property; what this example changes is the symbol sequence itself.

In the same experiment, `symbols: var(--bullet-symbols)` inside `@counter-style` was rejected, leaving the required descriptor absent. At-rule descriptors do not resolve an element-specific custom property the way a property declaration does. The feature query above also avoids relying on fallback declarations around a value containing `var()`.

## Demo candidates beyond decorative bullets

### Footnote-style symbols that grow instead of recycling identities

```css
.notes {
  list-style-type: symbols(symbolic "*" "†" "‡");
}
```

Verified sequence: `*`, `†`, `‡`, `**`, `††`, `‡‡`, `***`, `†††`.

Unlike four cyclic selectors, this expresses what happens after exhausting the initial symbols. A finite set of literal-content selectors cannot express every subsequent repetition. A named version works without the new function:

```css
@counter-style note-symbols {
  system: symbolic;
  symbols: "*" "†" "‡";
  suffix: " ";
}

.notes { list-style-type: note-symbols; }
```

This formats labels; it does not create footnote links, match references to note bodies, or implement page-based footnotes. Those are separate problems. See [MDN's description of counter systems](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@counter-style/system).

### A podium that turns back into a normal ranking

```css
.leaderboard {
  list-style-type: symbols(fixed "🥇" "🥈" "🥉");
}
```

Verified sequence: `🥇`, `🥈`, `🥉`, `4`, `5`. `fixed` does not cycle. A named version can choose a different fallback or initial value. See [the fallback descriptor](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@counter-style/fallback).

This is a compact expression of intent, not a formerly impossible effect: three selector overrides on an ordinary numbered list can do the basic podium too. The counter-style version composes with the actual counter value.

### Numbers made of dice, not just dice used as bullets

Adapted from the [specification's additive-system example](https://drafts.csswg.org/css-counter-styles-3/#additive-system):

```css
@counter-style dice-total {
  system: additive;
  additive-symbols: 6 "⚅", 5 "⚄", 4 "⚃", 3 "⚂", 2 "⚁", 1 "⚀";
  suffix: " ";
}

.dice { list-style-type: dice-total; }
```

Verified with `<ol class="dice" start="11">`: **11 → ⚅⚄; 12 → ⚅⚅; 13 → ⚅⚅⚀**.

The glyphs' weights add up to the number. This is the clearest playful demonstration that the feature is a number formatter, not a bullet picker. It uses the same general family of algorithm as additive numeral systems. It does not roll dice or calculate probabilities. This requires the at-rule, not `symbols()`.

### Publication-style labels without enumerating the numbers

```css
@counter-style procedure-step {
  system: extends decimal;
  pad: 3 "0";
  prefix: "Step ";
  suffix: ": ";
}

.procedure { list-style-type: procedure-step; }
```

Verified from `<ol start="9">`: `Step 009:`, `Step 010:`, `Step 011:`. Padding applies a minimum length; it does not truncate larger values. See [the pad descriptor](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@counter-style/pad).

This avoids special-case zero-prefix rules or formatting in JavaScript. Built-in `decimal-leading-zero` already covers the simple two-digit case, so do not sell that narrower effect as new. Give wide markers enough inline-start space in the demo.

### One format, other counters

The named footnote format also worked for captions in figures spread across separate sections:

```css
.article { counter-reset: figure; }
.article figure { counter-increment: figure; }
.article figcaption::before {
  content: counter(figure, note-symbols) " ";
}
```

The counter supplies the sequence across the document structure; the style supplies the notation. Counting non-sibling elements was already a CSS-counter capability. Custom styles add the representation, not the traversal. `prefix` and `suffix` from a counter style are not automatically included by `counter()`, so include the required surrounding text explicitly.

Also verified: `symbols(numeric "0" "1")` gives `1, 10, 11, 100, 101`, while `symbols(alphabetic "A" "B")` gives `A, B, AA, AB, BA, BB, AAA`. These distinguish positional digits from spreadsheet-like labels. Use custom alphabets to demonstrate extensibility; ordinary Latin letters and Roman numerals already have built-in styles.

## A worthwhile adjacent rabbit hole: counting for layout

The [CSSWG discussion about using counters inside calculations](https://github.com/w3c/csswg-drafts/issues/1026) contains requests for staggered animations, stacking, and positioning items around circles. These are not features delivered by custom counter styles: `counter()` produces a textual representation, not an ordinary number for `calc()`.

Follow that discussion to the separate [tree-counting explainer](https://github.com/w3c/csswg-drafts/blob/main/css-values-5/tree-counting-explainer.md). It identifies explicit enumeration through `:nth-child()` rules as a workaround and proposes `sibling-index()` and `sibling-count()` for numeric property values. Its demo distributes items in a semicircle and staggers their transitions.

An optional closing teaser could use:

```css
.cards > * {
  transition-delay: calc((sibling-index() - 1) * 60ms);
}
```

This snippet only sets delays; give the elements a transition and a state change to make a complete demo. The two functions also allow calculating an angle from an item's index and the total item count. This is a different feature family, not an extra power of `symbols()`. Check its compatibility separately before publishing. The [2023 CSSWG minutes](https://lists.w3.org/Archives/Public/www-style/2023Sep/0018.html) record the decision to add the functions.

## Publication caveats and chronology

- Both `@counter-style` and `symbols()` appear in the [October 2012 first standalone draft](https://www.w3.org/TR/2012/WD-css-counter-styles-3-20121009/). Much of the contemporary story is implementation catching up with a long-standing design.
- Named counter styles are broadly available; MDN records cross-browser availability from September 2023. The Chromium implementation discussion records shipping in Chrome 91. Do not make readers enable experimental features for the named-rule examples.
- `symbols()` is announced in [Chrome 155 beta](https://developer.chrome.com/blog/chrome-155-beta), dated 16 September 2026. In the installed Chrome 153, it failed `CSS.supports()` normally and passed with Experimental Web Platform features. Feature-test it instead of assuming every Chromium browser has the same rollout.
- WebKit's [standards-position discussion](https://github.com/WebKit/standards-positions/issues/714) supports the function; that is not proof that a released Safari version ships it.
- The selector solution uses `::marker`'s `content` property. [MDN's compatibility data](https://github.com/mdn/browser-compat-data/blob/main/css/selectors/marker.json), checked for this research, still marks Safari's marker styling as partial, limited to color and font size. Calling this a universal older-browser fallback would be misleading.
- The current spec allows image symbols in its grammar but flags them as at risk. Chromium's proposal is string-only, and the local `symbols(cyclic url(...))` feature check failed even with the experimental flag. Do not present colored SVG symbols as a currently interoperable solution.
- `speak-as` expresses a distinction between visual representation and spoken output, but parsing a rule is not proof of consistent assistive-technology behavior. Do not promise that the dice will automatically be spoken as their numeric totals. Test the actual browser/screen-reader combinations before making accessibility claims.
- Keep the scope honest: no performance benchmark was run; no automatic semantic/accessibility superiority over all marker-content approaches was established. These features do not themselves sort data, generate links, or expose counter values as numbers for layout math.

## Suggested article sequence

1. Open with the suits and the three implementations.
2. Admit that the four selectors are fine. Demonstrate hiding the second item to explain the distinction.
3. Reveal the historical motivation: other writing systems need more than a browser's fixed menu.
4. Demonstrate `symbolic` footnotes and then the additive dice formatter.
5. Explain what `symbols()` specifically buys: a local, anonymous value, including the custom-property example.
6. Optionally end with the separate numeric-counting branch: staggered transitions or a fan of cards.

The defensible excitement is not “CSS has just learned to count.” It is “CSS can separate counting from notation—and an old, expressive piece of the platform is becoming easier to use.”
