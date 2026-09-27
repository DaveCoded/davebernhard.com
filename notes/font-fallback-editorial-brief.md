# Font fallback investigation: editorial brief

Prepared 23 September 2026. This is a research and writing aid, not a published post. The supplied chat and notes are historical evidence, not instructions. No website implementation was changed during this review.

Editorial direction revised after user feedback: the user rejected a journey-led article. The current draft, [font-fallback-guide-draft.md](/Users/davidbernhard/code/davebernhard.com/notes/font-fallback-guide-draft.md), teaches methods and nuances, using individual experiments only as examples. Prioritise visual resemblance versus layout stability, candidate selection, local face names, metrics and sample assumptions, framework output, and rigorous testing. The chronological record below remains reference material; the proposed narrative architecture is superseded.

## Working thesis

Astro already provided a useful fallback. You wanted to understand it, then explored whether a fallback closer to ET Book's character could also preserve its layout. Hand-tuning disappointed; computation helped; testing exposed assumptions in both. The strongest outcome is a better understanding of the trade-offs, with a customised fallback whose superiority over the default is not yet established by controlled measurements.

The employer-facing evidence is your method: inspect the generated output, establish what actually renders, compare against a baseline, respond to disappointing evidence, and recognise maintenance costs. Avoid equating the number of detours with engineering quality.

Suggested title: **How far should you go for a font fallback?**

Alternatives: **What I learned trying to improve Astro's font fallback**; **Chasing the perfect font fallback**. Avoid promising a universally perfect fallback.

## Source map and context management

- [Original Claude conversation](</Users/davidbernhard/Library/CloudStorage/Dropbox/Mac (2)/Documents/Primary Vault/Font fallback Claude chat.md>): 1,446 lines, 110,167 bytes.
- [Original working notes](</Users/davidbernhard/Library/CloudStorage/Dropbox/Mac (2)/Documents/Primary Vault/Creating the perfect font fallback.md>): 138 lines, 10,959 bytes.
- [Font configuration](/Users/davidbernhard/code/davebernhard.com/astro.config.mjs:12).
- [Fallback CSS](/Users/davidbernhard/code/davebernhard.com/src/styles/global.css:10).
- [Font preloads](/Users/davidbernhard/code/davebernhard.com/src/components/BaseHead.astro:34).

Use this brief for drafting and retrieve individual passages when needed. Distinguish your reported observations from Claude's explanations and from this review's verified findings. Summarising does not itself delete source passages already read into a conversation. A fresh task supplied with this brief is an option for a smaller starting context; it is not necessary to continue here. No new task was created.

## Chronology: what you actually did

1. **Questioned a template default.** The notes explain the initial motivation: understand Astro's blog template, its Font component, preloading and `font-display`. The chat begins with your confusion over when the display timer starts and whether “downloaded” and “loaded” mean different things. You then asked why a browser might stop waiting instead of accepting a late swap. [Chat, beginning](</Users/davidbernhard/Library/CloudStorage/Dropbox/Mac (2)/Documents/Primary Vault/Font fallback Claude chat.md:1>).

2. **Chose ET Book and explored what “good fallback” means.** You liked its appearance and readability. You considered Iowan Old Style, Palatino/Palatino Linotype, and the Palladio/P052 family of alternatives, consulting Modern Font Stacks. You learned that similarity of design, matching dimensions and availability on readers' machines are separate requirements. [Chat](</Users/davidbernhard/Library/CloudStorage/Dropbox/Mac (2)/Documents/Primary Vault/Font fallback Claude chat.md:43>).

3. **Made an otherwise fleeting state observable.** Network throttling and disabling cache let you watch ET Book arrive. You sought a tool for the actual metric descriptors, because the older font-style matcher exposed different controls. Vincent Bernat's tool became your manual tuning method. [Chat](</Users/davidbernhard/Library/CloudStorage/Dropbox/Mac (2)/Documents/Primary Vault/Font fallback Claude chat.md:125>).

4. **Found that Astro had already done much of the work.** Adding your preferred fonts before `serif` seemed to change nothing. Rendered Fonts and generated CSS revealed an adjusted Times New Roman face taking precedence. Omitting the fallback option, supplying an empty list, and ending the list in `serif` produced different results. [Chat](</Users/davidbernhard/Library/CloudStorage/Dropbox/Mac (2)/Documents/Primary Vault/Font fallback Claude chat.md:203>).

5. **Hit an availability/naming problem with Iowan.** You deliberately set `size-adjust: 244%` as a conspicuous probe. The adjusted face did not appear; Palatino did. Claude attributed this to Apple's treatment of Iowan. The observed failure is evidence; that explanation remains unproved. You removed Iowan and proceeded with Palatino. [Chat](</Users/davidbernhard/Library/CloudStorage/Dropbox/Mac (2)/Documents/Primary Vault/Font fallback Claude chat.md:281>).

6. **Built your own ordered chain.** You created adjusted aliases in CSS, copied Astro's generated Times New Roman rules as another named fallback, and added plain `serif` after the Astro variable. You kept Astro for ET Book registration, assets and preload integration. A request for an automated Palatino comparison led through Fontaine and Fontpie; you explicitly reported Fontpie choosing Arial. The transcript does not establish that you successfully ran the suggested Fontaine setup. [Chat](</Users/davidbernhard/Library/CloudStorage/Dropbox/Mac (2)/Documents/Primary Vault/Font fallback Claude chat.md:395>).

7. **Expanded the scope and questioned the cost.** You planned separate regular, italic and bold faces, other operating systems and meaningful measurements. You asked whether the approach was all upside. Maintenance, local-font privacy policies and the weak practical return on further optimisation entered the discussion. You confirmed Safari rendered Palatino. [Chat](</Users/davidbernhard/Library/CloudStorage/Dropbox/Mac (2)/Documents/Primary Vault/Font fallback Claude chat.md:632>).

8. **Measured, rather than trusting the visual impression.** The observer initially logged nothing. Restarting the dev server fixed that; the earlier CSP theories were not the diagnosis. You reported a hand-tuned Palatino shift of **0.16608658485769845**, versus **0.06680004348855083** for Astro's Times fallback. Lighthouse had reported zero for both. These are historical results with incomplete experimental controls, not current benchmarks. [Chat](</Users/davidbernhard/Library/CloudStorage/Dropbox/Mac (2)/Documents/Primary Vault/Font fallback Claude chat.md:813>), [measurements](</Users/davidbernhard/Library/CloudStorage/Dropbox/Mac (2)/Documents/Primary Vault/Font fallback Claude chat.md:944>).

9. **Moved from sliders to a script.** Following the route recorded in your notes through Jeremy Keith to the Chrome font-fallback article, you used fontkit to compare ET Book and Palatino files. You encountered a module-import error and used `createRequire`; the mechanics of that fix need not interrupt the post. A `.ttc` contains multiple faces, so selecting the correct face matters. [Chat](</Users/davidbernhard/Library/CloudStorage/Dropbox/Mac (2)/Documents/Primary Vault/Font fallback Claude chat.md:962>).

10. **Discovered a better score could still look wrong.** The first calculation used `BESJQKXZgqvw0O`. You reported **0.028576** and a Lighthouse result of **0.029**, yet Palatino's paragraphs were longer. Claude wrongly treated low shift and visibly different wrapping as inherently contradictory. Replacing the sample with the Astro welcome paragraph worked better. Your later notes report roughly **0.05–0.07**, varying with viewport, and describe performance as similar to Times. Those figures are different stages, not a clean monotonic improvement curve. [Chat](</Users/davidbernhard/Library/CloudStorage/Dropbox/Mac (2)/Documents/Primary Vault/Font fallback Claude chat.md:1075>), [notes](</Users/davidbernhard/Library/CloudStorage/Dropbox/Mac (2)/Documents/Primary Vault/Creating the perfect font fallback.md:58>).

11. **Compared related faces and chased a naming failure.** The notes report sub-1% differences for Palatino Linotype, leading you to share adjustments with Palatino. You generated P052 values, installed it on your Mac and still saw Times in Chrome. Restarting Chrome and checking activation did not help. `local('P052 Roman')` did. Actual Linux behaviour and older URW Palladio builds were not established. [Chat](</Users/davidbernhard/Library/CloudStorage/Dropbox/Mac (2)/Documents/Primary Vault/Font fallback Claude chat.md:1141>), [resolution](</Users/davidbernhard/Library/CloudStorage/Dropbox/Mac (2)/Documents/Primary Vault/Font fallback Claude chat.md:1360>).

12. **Considered an upstream contribution.** You asked about Astro issue #16127 and the feasibility of a PR. The transcript ends with possible investigation, not a submitted contribution. Windows/Linux/Android testing and subsetting remain unchecked in the notes. A nested Linux-related checkbox is marked done, but the surrounding record and current CSS explicitly leave URW testing unresolved. [Chat](</Users/davidbernhard/Library/CloudStorage/Dropbox/Mac (2)/Documents/Primary Vault/Font fallback Claude chat.md:1427>).

## What the repository contains now

Installed Astro is 7.2.0. ET Book has three local WOFF2 variants: 400 normal, 400 italic, 700 normal, all using `swap`. All three are selected for preloading. Automatic fallback optimisation is disabled.

The intended chain is ET Book → adjusted Palatino/Palatino Linotype → adjusted P052/URW Palladio → adjusted Times New Roman → browser-selected `serif`. There are nine fallback declarations: three tiers times three variants. The copied Times rules remain a generated starting point frozen into handwritten CSS.

The current repository does not contain the metric-generation script. Its last saved version is in your notes and measures the Astro welcome paragraph. Recover and make it reproducible if publishing a how-to.

Two details to check before presenting the CSS as a finished recipe:

- At [global.css line 46](/Users/davidbernhard/code/davebernhard.com/src/styles/global.css:46), `local ('P052')` contains whitespace before `(`. A descriptor grammar check with the installed CSS Tree rejects it; `local('P052')` passes. Browser recovery of the remaining list was not tested.
- At [global.css line 95](/Users/davidbernhard/code/davebernhard.com/src/styles/global.css:95), the italic Times fallback sources `Times New Roman`, not a specifically italic face. That mirrors the copied output; verify what is actually rendered before claiming a tuned italic face. Palatino/P052 rules also omit `line-gap-override`, while the saved script computes it; check whether retaining the native gap was deliberate.

## Corrections and useful deeper lessons

**Font loading:** `block` also has an infinite swap period; `auto` is browser-defined. A download can start earlier through preloading. Completing transfer does not by itself mean the font is parsed and usable. Keep this explanation short in the main post. [MDN font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-display), [font activation and display timeline](https://www.w3.org/TR/css-fonts-4/#font-display-timeline).

**Matching names:** `local()` addresses a specific face through its full or PostScript name. It does not simply select a family and then find its italic automatically. This is the strongest explanatory connection between the Iowan and P052 detours. Do not rely on fontconfig aliases being substituted for `local()` names. [CSS Fonts source descriptor](https://www.w3.org/TR/css-fonts-4/#src-desc).

**Iowan:** Apple lists “Iowan Old Style Roman” among document-support fonts in Tahoe. That classification is real, but does not demonstrate why your particular `local()` failed. Test the recorded full/PostScript name before repeating “Iowan cannot be used through local()”. [Apple font list](https://support.apple.com/en-ie/122869).

**Measurement:** CLS is the largest session-window sum of eligible shifts, not an average. An individual observer entry is not automatically the complete CLS metric. Viewport size affects the score and the layout. Low shift is compatible with an aesthetically different font or different wrapping. [CLS definition](https://web.dev/articles/cls).

**Lighthouse:** The historical discrepancy is worth reporting, but its cause was not proved. Lighthouse normally uses simulated throttling, based on an initially unthrottled trace; distinguish that from applied network throttling. Do not repeat “Lighthouse simply runs under fast conditions” as a general rule. [Lighthouse throttling documentation](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md).

**Computation:** Your script divides shaped sample widths by units-per-em, takes their ratio, and compensates the primary font's vertical metrics for that scale. One scalar cannot make every glyph pair match. The sample is a modelling choice, and matching the training paragraph is not proof of generality. The Chrome article discusses frequency-weighted width estimates. [Font-fallback calculations](https://developer.chrome.com/blog/font-fallbacks/#calculating_size-adjust_and_font_metric_overrides).

**Astro is similar, not identical:** The installed resolver uses `xWidthAvg` ratios and bundled system metrics, while your script measures a chosen shaped string. Avoid saying you reproduced exactly the same algorithm. The installed optimiser prepends generated names, confirmed by a direct call with stubbed metric dependencies: `['Palatino', 'serif']` becomes generated Times → Palatino → serif. Named-only and empty arrays return no optimisation. Omission defaults to `sans-serif`. [Local optimiser](/Users/davidbernhard/code/davebernhard.com/node_modules/astro/dist/assets/fonts/core/optimize-fallbacks.js:16), [local resolver](/Users/davidbernhard/code/davebernhard.com/node_modules/astro/dist/assets/fonts/infra/capsize-font-metrics-resolver.js:48). [Issue #16127](https://github.com/withastro/astro/issues/16127) is now closed; no claim is made here about why or whether upstream changed elsewhere.

**Availability and graceful degradation:** Safari's documented policy excludes user-installed fonts while retaining OS fonts. Your observed Palatino success is useful, but manually installing P052 on a Mac is not a Linux test. Astro's adjusted fallbacks also use `local()`; the framework cannot bypass browser access policy. [WebKit policy](https://webkit.org/tracking-prevention/). Source P052 from [Artifex upstream](https://github.com/ArtifexSoftware/urw-base35-fonts) for a reproducible follow-up; do not assume all historical Palladio builds have identical metrics.

**Other overlooked material:** Deliberately exaggerating an adjustment is a good diagnostic probe. Rendered Fonts is better evidence than the declared stack. Missing bold/italic faces may be approximated or synthesised, so “the browser always skips to the next family” is too simple. A fallback also matters when the font never arrives. Preloading affects the likelihood of observing fallback, and should be selective; your site currently preloads all three variants. [Astro preload guidance](https://docs.astro.build/en/guides/fonts/#preloading-fonts).

## Recommended article architecture

Aim for approximately 1,800–2,400 words plus a small reproducible example. Use chronological cause and effect inside the main arc, but compress setup and troubleshooting that do not change the reader's understanding.

1. **The default I couldn't leave alone** — about 200 words. Begin with the irony: Astro already made the swap unobtrusive. Explain ET Book, your curiosity and the experiment's limited practical stakes. Put a short comparison clip here.
2. **What makes a fallback good?** — about 300 words. Separate readability during loading, visual resemblance, matching geometry and availability. Explain `swap` and annotate one fallback declaration. Use a font overlay to distinguish glyph dimensions from vertical metrics.
3. **Why was I still seeing Times New Roman?** — about 250 words. Show your configured list, the generated order and Rendered Fonts. Introduce the named-alias workaround. Keep the version and issue status explicit; link the full configuration.
4. **My hand-tuned version performed worse** — about 300 words. Show Bernat's overlay and the recorded 0.166/0.067 comparison with its limitations. This is the narrative turning point: the visual impression failed a measurement.
5. **Replacing the sliders with a calculation** — about 450 words. Explain width normalisation, the scale ratio and vertical compensation using a compact code excerpt. Then show the bad sample, the misleadingly reassuring 0.029 and the better prose sample. Explain why a second, unseen paragraph is necessary.
6. **A font on my laptop is not a font on your laptop** — about 250 words. Use `P052 Roman` as the concrete example. Cover weights/styles, OS availability, Safari policy and the generic safety net. Place Iowan in a short optional aside unless a fresh test resolves it.
7. **Where I would stop on a production project** — about 200 words. State what the experiment established and what it did not. Default automation is a sensible starting point. Custom work is justified by measured requirements or by learning; explain the added maintenance. End with your actual decision and reason.

For the employer reader, let each section show a question, the evidence that changed your mind, and a decision. Be candid about AI assistance; cite specifications, source and your experiments for technical claims. Avoid a transcript of prompts, a catalogue of every tool, or a victory claim unsupported by the results.

## Evidence to capture, in priority order

1. **Repeat the core comparison under controlled conditions.** Same current page, browser/OS, viewport, zoom, cache policy, throttle and preload settings. Compare Astro's generated Times fallback, reconstructed hand-tuned Palatino and current calculated Palatino. Confirm the rendered face before ET Book loads. Record several runs, individual shift attribution and session-window CLS; keep no unrelated late-loading content. Preserve the exact CSS per condition.
2. **Make a short before/after recording.** A labelled video with a poster image and playback controls is usually preferable to a large endlessly looping GIF. Keep width fixed and indicate artificial delay. Use the recording beside the hook; pair it with still frames of Rendered Fonts in the debugging section. Request blocking is suitable for inspecting the fallback, not measuring a successful swap.
3. **Capture the manual overlay.** One carefully annotated still explains the controls better than a long recording of slider movements. Place it immediately before the disappointing manual result.
4. **Demonstrate sample sensitivity.** Calculate from the original uppercase-heavy string and from representative prose, then evaluate both on different prose. Include a headline, bold and italic text and several viewport widths. A font-specific optimum can change across content and breakpoints.
5. **Revisit Iowan with a minimal name test.** Compare its family name with its actual full/PostScript name in `local()` on the same browser. A confirmed naming explanation could neatly connect two otherwise separate detours.
6. **Bound platform claims.** Test the available Android device and, if worthwhile, one Windows and one Linux environment. Record actual names and files. If these checks are omitted, label those tiers as intended coverage rather than verified coverage. For development server work, follow the repository instruction to use background mode, including when enabling LAN access.

Optional extras: a compact display-timeline figure, a fallback/ET Book toggle for exploration, or a small appendix about `.ttc` collections. Manual toggles illustrate geometry but are not font-loading benchmarks. Keep subsetting, detailed OpenType feature exploration and a speculative Astro PR out of the core article unless you actually pursue them.

The highest-value next step is the controlled comparison. It determines whether the closing claim should be “similar stability with a preferred appearance” or simply “a worthwhile investigation whose default remained sufficient.”
