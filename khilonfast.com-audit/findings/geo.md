# GEO / AI-Search Readiness Findings — khilonfast.com

Audited: 2026-07-11

## GEO Health Score: 48 / 100

| Dimension | Weight | Score | Weighted |
|---|---|---|---|
| Citability | 25% | 78/100 | 19.5 |
| Structural Readability | 20% | 70/100 | 14.0 |
| Multi-Modal Content | 15% | 30/100 | 4.5 |
| Authority & Brand Signals | 20% | 35/100 | 7.0 |
| Technical Accessibility | 20% | 15/100 | 3.0 |

Technical Accessibility is the dimension that drags the whole score down: the content/markup work (llms.txt, answer boxes, schema) is genuinely good, but a live edge-level block is preventing two of the four priority AI crawlers from ever reading it.

---

## CRITICAL

### 1. Cloudflare edge WAF is hard-blocking ClaudeBot and PerplexityBot with HTTP 403 — independent of and overriding the robots.txt "Allow" rules
Live verification (direct HTTP requests with spoofed User-Agent headers, 2026-07-11):

| User-Agent sent | HTTP status |
|---|---|
| GPTBot | 200 |
| OAI-SearchBot | 200 |
| Google-Extended | 200 |
| Applebot-Extended | 200 |
| CCBot | 200 |
| meta-externalagent / Meta-ExternalAgent | 200 |
| **ClaudeBot** | **403** |
| **PerplexityBot** | **403** |
| **Perplexity-User** | **403** |
| **anthropic-ai** | **403** |
| **cohere-ai** | **403** |
| Amazonbot | 403 |
| Bytespider | 403 |
| Mozilla/5.0 (normal browser) | 200 |

This is **not** a robots.txt parsing question — it is a network-layer 403 returned before any content is served. Since the response varies purely by the User-Agent string on an otherwise identical request (same IP, same path), this is a Cloudflare **WAF/Bot-Management rule matching on User-Agent substrings** (most likely Cloudflare's "AI Scrapers and Crawlers" managed toggle under Security → Bots, or a leftover custom WAF rule), separate from the "Cloudflare Managed content" block visible in robots.txt.

Effect: **ClaudeBot (Anthropic/Claude) and PerplexityBot/Perplexity-User (Perplexity) — two of the four crawlers your own memory/config explicitly intends to allow for AI search visibility — cannot fetch the site at all.** Every page (home, services, training, product, consultancy) returns 403 to these two engines. All the citability/schema/answer-box work is invisible to Claude's and Perplexity's indexes as long as this is active. GPTBot/OAI-SearchBot (ChatGPT/ChatGPT search) and Google-Extended (Gemini/AI Overviews) currently pass through fine (200), so ChatGPT and Google AI Overviews are not affected — only Anthropic and Perplexity surfaces are blocked.

**Fix (effort: low, ~15 min):** In the Cloudflare dashboard, go to Security → Bots (or Security → WAF → Managed Rules / Custom Rules) and locate whatever rule is producing 403 for these UAs — likely the "Block AI Scrapers and Crawlers" toggle (which blocks by category, including Anthropic and Perplexity's crawlers, independent of robots.txt) or a custom WAF rule targeting these tokens. Set the desired bots to "Allow" there, not just in robots.txt. Re-test with `curl -A "ClaudeBot" -A "PerplexityBot"` after the change to confirm 200s.

### 2. robots.txt contains directly contradictory groups for the same user-agent tokens (independent of the WAF issue above)
The file has, in order:
1. A "Cloudflare Managed content" block: `Disallow: /` for Amazonbot, Applebot-Extended, Bytespider, CCBot, ClaudeBot, CloudflareBrowserRenderingCrawler, Google-Extended, GPTBot, meta-externalagent.
2. Further down, a manually-added block: `Allow: /` for GPTBot, ClaudeBot, anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, Amazonbot, Meta-ExternalAgent, cohere-ai, OAI-SearchBot.

RFC 9309 does not define behavior when a file contains two separate groups for the identical exact user-agent token — this is parser-dependent:
- **Google** (documented, and the closest thing to a public reference algorithm): merges all groups matching an exact user-agent and, on a tie in specificity (both rules are `/`, i.e. equal length), the **least restrictive rule (Allow) wins**. Under Google's own published algorithm, Google-Extended and GPTBot would end up **allowed** — this matches what we observed via direct fetch (200 for both), so Google's crawler is very likely reading the file "correctly" per its own spec.
- **OpenAI, Anthropic, Perplexity** do not publish an equivalent merge/precedence algorithm. Most third-party robots.txt libraries (Python `urllib.robotparser`, `reppy`, `protego`, Node `robots-parser`) do **not** implement Google's "merge + least-restrictive-wins" logic — many instead honor whichever exact-match group they encounter first, or the last one, depending on implementation, making the outcome unpredictable across vendors. Given that ClaudeBot and PerplexityBot are additionally hard-blocked at the WAF layer (Critical #1), it is currently impossible to determine from the live site which reading of robots.txt Anthropic/Perplexity's crawlers would apply even if the WAF block were lifted.

**Recommendation:** Regardless of parser behavior, having two contradictory groups for the same user-agent in one file is a config smell that should be eliminated. Remove the redundant Cloudflare-managed `Disallow: /` group for GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, Amazonbot, meta-externalagent (these are already covered, unambiguously, by the later explicit `Allow: /` groups) — this requires disabling whatever Cloudflare feature auto-injects the "Cloudflare Managed content" block, then re-adding only the bots you actually want blocked (CCBot? Bytespider?) as single, unambiguous groups. One user-agent should appear in the file exactly once. Effort: low, ~15 min once the WAF root cause in #1 is fixed at the same dashboard location.

---

## HIGH

### 3. Content-Signal header (`ai-train=no, use=reference`) blocks AI training but conflicts with the intent of citation-driven visibility
robots.txt declares: `Content-Signal: search=yes,ai-train=no,use=reference` for `User-agent: *`. This is likely intentional (protects proprietary content from being used to train foundation models) and does not, by itself, block retrieval-augmented citation (RAG/AI Overviews/ChatGPT browsing), since `ai-train=no` only restricts training use and `use=reference` is compatible with citation-style consumption. This is a reasonable stance and not a blocker for AI-search visibility — flagged as High only because it should be a deliberate business decision (confirm with the site owner that "we don't want our content used for model training but we do want it cited" is the correct policy), not an accidental default.

### 4. Brand entity signals are thin — no Wikipedia, YouTube, or Reddit presence
Organization schema's `sameAs` currently lists only LinkedIn and Instagram:
```
"sameAs": ["https://www.linkedin.com/company/khilon/", "https://www.instagram.com/khilonagency"]
```
Per the brand-mention/AI-citation correlation data, YouTube mentions (~0.737 correlation) and Reddit presence are the strongest predictors of AI citation — stronger than backlinks/Domain Rating (~0.266). khilonfast currently has no detectable YouTube channel, Reddit presence, or Wikipedia entity referenced in schema or elsewhere on the crawled homepage. This is the single highest-leverage authority gap once the crawler-access issues are fixed.
**Recommendation:** stand up and link a YouTube channel (even short case-study/explainer videos) and add it to `sameAs`; seed a couple of genuine, non-promotional Reddit mentions/discussions (e.g., in relevant B2B marketing subreddits) — effort: medium, ongoing.

### 5. Multi-modal content is minimal
No video content detected on the crawled homepage/answer-box sections, no downloadable data assets, no visible author bylines with credentials on blog/insight content. Combined with Finding #4, this caps the Authority and Multi-Modal dimensions. Effort: medium-high (content production).

---

## MEDIUM

### 6. llms.txt and llms-full.txt are present, well-formed, and current — good foundation
- `https://khilonfast.com/llms.txt` (200): clean, well-structured llms.txt with site identity, canonical URL rules (TR root / EN under `/en/`), sitemap pointer, content-type taxonomy, and an explicit non-index list (admin/dashboard/checkout/etc.) — this is a high-quality implementation, above typical llms.txt quality seen in the wild.
- `https://khilonfast.com/llms-full.txt` (200, 2,303 lines): full content dump for 170 pages (88 TR + 82 EN), each with URL, H1, meta summary, and FAQ Q&A pairs, generated 2026-07-10 (one day before this audit — current). This directly feeds AI agents with extractable, self-contained Q&A pairs, which is excellent for citability.
- No RSL 1.0 (`<link rel="license">` / `license.xml`) licensing file was found — not present, but RSL adoption is still nascent industry-wide; low priority.

### 7. Passage-level citability — good pattern, verify site-wide consistency
The homepage's `AiAnswerBox` ("KHILONFAST nedir?") renders in the initial server HTML (confirmed via raw fetch, not JS-dependent) with a ~45-word direct-answer passage under a question-style heading — this is within/near the optimal citation range once combined with surrounding context, though slightly short of the ideal 134-167 word passage length. The llms-full.txt FAQ blocks (e.g., "khilonfast hangi hizmetleri sunar?") are better-sized self-contained answers (60-90 words) and well-formed for extraction. Memory indicates 146 of 170 pages have these AI Answer Boxes — recommend spot-checking the 24 pages that don't, and lengthening the shortest boxes toward the 134-167 word sweet spot where it doesn't hurt UX.

### 8. Technical accessibility (SSR) is solid where the WAF isn't blocking
Direct raw HTTP fetch of the homepage (no JS execution) returns fully populated content inside `<div id="root">` — confirms prerendering/SSR is working and page content is accessible to crawlers that don't execute JavaScript. This is a genuine strength and should be preserved. The only accessibility failure is the WAF issue in Critical #1, which happens at the network layer before HTML is ever served.

---

## LOW

### 9. Only 2 sameAs entities; no Wikidata/Wikipedia entity
Covered in more depth under Finding #4; noted separately as a low-effort quick win to at least register a Wikidata entry if a Wikipedia article isn't yet notable enough, since Wikidata is often used directly as a knowledge-graph source by LLMs independent of Wikipedia notability requirements.

---

## Brand Mention Analysis Summary

| Signal | Status | Correlation w/ AI citation |
|---|---|---|
| YouTube mentions | Not detected | ~0.737 (strongest) |
| Reddit presence | Not detected | High |
| Wikipedia/Wikidata entity | Not detected | High |
| LinkedIn | Present (`sameAs`) | Moderate |
| Domain Rating / backlinks | Not assessed in this pass | ~0.266 (weak) |

---

## Platform-Specific Access Status (verified live, 2026-07-11)

| Platform / Crawler | HTTP Status | Verdict |
|---|---|---|
| ChatGPT search (GPTBot, OAI-SearchBot) | 200 | Accessible |
| Google AI Overviews / Gemini (Google-Extended) | 200 | Accessible |
| Perplexity (PerplexityBot, Perplexity-User) | **403** | **Blocked — Critical #1** |
| Claude / Anthropic (ClaudeBot, anthropic-ai) | **403** | **Blocked — Critical #1** |
| Bing Copilot (uses Bingbot, not separately tested but not in Cloudflare's blocked set) | Not tested this pass | Likely accessible — recommend explicit verification |
| Apple Intelligence (Applebot-Extended) | 200 | Accessible |
| Amazon (Amazonbot) | 403 | Blocked (may be intentional per Cloudflare defaults) |
| Common Crawl (CCBot) | 200 | Accessible (training-data crawler; confirm this is intended) |

Only ChatGPT and Google-based AI surfaces currently have unobstructed access; Perplexity and Claude — a large and fast-growing share of AI-referral traffic — are fully cut off at the infrastructure level regardless of any robots.txt/llms.txt work already done.

---

## Top 5 Highest-Impact Changes

1. **[Critical, ~15 min]** Fix the Cloudflare WAF/Bot-Management rule blocking ClaudeBot, PerplexityBot, Perplexity-User, anthropic-ai, cohere-ai with 403. This alone is worth more than every other item in this report combined — it is the difference between "invisible" and "visible" to Anthropic and Perplexity.
2. **[Critical, ~15 min]** Clean up robots.txt so each user-agent appears in exactly one group (remove the redundant Cloudflare-managed Disallow groups for bots you want to allow).
3. **[High, medium effort]** Launch a YouTube presence (even 3-5 short case-study videos) and add it to Organization `sameAs` — highest single correlation with AI citation per the brand-signal data.
4. **[High, low-medium effort]** Confirm the `ai-train=no` Content-Signal policy is an intentional business decision, and document it as such so it isn't "fixed" by mistake later.
5. **[Medium, low effort]** Audit the 24 pages in llms-full.txt without an AI Answer Box and add one to each; nudge the shortest existing answer boxes toward the 134-167 word optimal range.
