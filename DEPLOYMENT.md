# Povlex Deployment Runbook

# Password-protected full GEO pilot — 22 September 2026

The next pilot keeps `Caddyfile.pilot` basic authentication and the noindex
header. It does not open Povlex to the public. Application membership and
payments remain disabled, while controlled AI visibility measurement is enabled
only inside the password-protected pilot.

Pilot configuration:

```dotenv
AUDITPRO_DEPLOYMENT_MODE=pilot
AUDITPRO_PUBLIC_ANALYSIS_ENABLED=true
AUDITPRO_PUBLIC_PAGE_LIMIT=250
AUDITPRO_RENDERED_PAGE_LIMIT=25
AUDITPRO_SIGNUP_ENABLED=false
AUDITPRO_AI_VISIBILITY_ENABLED=true
AUDITPRO_PILOT_AI_ENABLED=true
AUDITPRO_PILOT_AI_BUDGET_EUR=10
AUDITPRO_PILOT_AI_MAX_SCANS=10
AUDITPRO_PILOT_AI_MAX_DOMAINS=5
AUDITPRO_PILOT_AI_SCANS_PER_DOMAIN=2
AUDITPRO_PILOT_AI_RESERVED_EUR_PER_SCAN=1
```

Each pilot AI run uses the fixed ten-prompt set across ChatGPT, Gemini,
Perplexity and Claude: 40 observations per round. The persistent pilot budget
table allows at most five domains and two rounds per domain. It reserves one
euro per run before any provider call; failed runs retain their reservation so
failures cannot bypass the ten-euro ceiling. AI responses, token totals and the
estimated cost are stored with the run. Provider-side hard budget controls must
also remain enabled.

“Full site” means all same-origin HTML pages discovered through sitemaps and
internal links up to the explicit 250-page ceiling. Redirects, HTTP errors,
noindex declarations and canonical conflicts remain evidence. Non-HTML assets,
external origins and crawl-trap URL variants are excluded. If discovery reaches
the ceiling, the report must say coverage is incomplete rather than claim a
complete-site audit. HTTP, HTML, metadata, content, schema, robots, canonical
and link checks run across that full discovered inventory. Browser-only checks
use up to 25 diverse pages across five viewports; the report exposes that
separate render coverage and must not imply that every crawled page was rendered.

No paid scan is authorized merely by this configuration change. Run the
database migration and all offline tests first, then start with one explicitly
approved single-domain round before using the remaining pilot allowance.

# Public account-free SEO/GEO launch candidate — 22 September 2026

The product now has an explicit account-free launch mode. Set
`AUDITPRO_PUBLIC_ANALYSIS_ENABLED=true` and keep
`AUDITPRO_AI_VISIBILITY_ENABLED=false`. The PostgreSQL-backed analysis queue
remains active, but the public UI and analysis-job endpoints do not require an
account or organization. `AUDITPRO_PUBLIC_PAGE_LIMIT` bounds each public job
(default: 25; hard maximum: 250). The normal Caddy boundary returns HTTP 403 for
`/api/billing/*` and `/api/webhooks/stripe`.

The original 199 controls remain the complete audit/reference library. Public
URL analysis publishes a smaller evidence-backed core instead of implying that
all 199 controls were automatically measured:

- Online SEO score: 12 weighted checks.
- GEO readiness score: 8 weighted checks.
- Every score includes evidence coverage, open checks, remediation text and
  affected URLs where the crawler produced URL-level evidence.

Unavailable checks are excluded from the score and reduce the separately shown
coverage. GEO readiness measures technical discoverability and answer-source
readiness; it is not a ranking, traffic, Search Console, live model mention or
citation score. No paid model call is made by this flow. Competitor URL
comparison remains a later evidence source and must not be represented as part
of this score until implemented and calibrated.

Launch configuration:

```dotenv
AUDITPRO_PUBLIC_ANALYSIS_ENABLED=true
AUDITPRO_PUBLIC_PAGE_LIMIT=25
AUDITPRO_SIGNUP_ENABLED=false
AUDITPRO_AI_VISIBILITY_ENABLED=false
```

Required verification includes `npm run test:online-score`,
`npm run test:access-policy`, `npm run test:analysis-job-route`, the analysis API
matrix, browser app flow and production build. This entry does not authorize or
record a production deployment by itself.

## External GEO internal-link cluster publication, wave 2 — 21 September 2026

This was a `tonguckaracay.com` content release, not a Povlex application
release. Commit `f3cc393` added visible, locale-matched consulting and training
links to eight previously claim-cleaned use-case pages: the Turkish/English
digital-marketing agent, Claude MCP content-calendar, Reels analysis and
small-business AI-training pairs. The regression fixture now protects eight
matched use-case pairs in total. The production build generated 208/208 pages;
the protected preview and all eight live URLs had one H1 and both expected
links, and production reached `READY`. Representative Turkish and English
pages had no horizontal overflow at a 390 px viewport. No fixed-prompt
baseline was run, so no visibility or causality claim is attached to this
release. The VPS pair and broader AI/UI/free-tool pages were deliberately not
linked: they require a separate editorial and claim-hygiene pass first. The
known GTM image/CSP warning and locale-cookie redirect case remain technical
debt. Povlex remains on TECH67; general AI and payments remain off; no paid
model call was made and recovery remains last.

## External GEO internal-link cluster publication — 21 September 2026

This was a `tonguckaracay.com` content release, not a Povlex application
release. Commit `281f709` completed the first P2 internal-link package for the
AI consulting cluster. The Turkish and English consulting and training pages
now explain which offer fits which need and link to each other. Four matched
TR/EN use-case pairs covering customer-service agents, patient follow-up,
chatbot token cost and ecommerce product descriptions now link directly to the
locale-matched consulting and training pages in visible server HTML. No new
performance or visibility claim was added. All GEO regression tests passed and
the production build generated 208/208 pages. Vercel production reached
`READY`; all 12 live URLs returned 200 with one H1 and the expected direct
link. Browser checks found no horizontal overflow at 1440 or 390 px. No new
fixed-prompt baseline was run, so the release does not claim a causal visibility
change. The existing GTM image/CSP warning and locale-cookie redirect case
remain technical debt. Povlex remains on TECH67; general AI and payments remain
off; no paid model call was made and recovery remains last.

## External GEO-checklist claim-hygiene publication, final wave — 21 September 2026

This was a `tonguckaracay.com` content release, not a Povlex application
release. Commit `d83e5d9` rebuilt the matched Turkish and English GEO checklist
guides around documented crawler access, source boundaries, answer-ready
evidence blocks, semantic structure and a reproducible measurement contract.
Unsupported market percentages, undocumented client outcomes, fixed update
cadences, ideal-length rules and claims that schema or crawler access guarantees
citation were removed. The replacement links current primary Google, OpenAI,
Perplexity and GEO-study sources and explicitly bounds the 10,000-query research
benchmark to its study configuration. Vercel production reached `READY`. Both
live pages have one H1, eight semantic tables, a visible review marker, the
correct language and self-canonical, and no horizontal overflow at 1440 or
390 px. The production build generated 208/208 pages and the new claim fixture
is part of `test:geo-pages`. This closes both CLM-007 and the remaining CLM-008
inventory: zero files remain. No topic-specific pre-publication fixed-prompt
baseline exists, so no causal visibility claim is made. The existing Google Tag
Manager image/CSP warning and locale-cookie redirect case remain technical debt.
Povlex remains on TECH67; general AI and payments remain off; no paid model call
was made and the recovery work order is unchanged.

## External infrastructure, income, local SEO and AI-tools claim-hygiene publication, wave 4 — 21 September 2026

This was a `tonguckaracay.com` content release, not a Povlex application
release. Commit `15015e0` rebuilt five English/Turkish guides covering AI-agent
hosting, prompt-engineering services, ecommerce local SEO and AI-tool selection.
Fixed prices and income promises, unsupported client results, ranking timelines,
product-plan claims and universal performance percentages were removed. The
replacement uses official Google, NIST, OWASP, OpenAI, Anthropic and FTC sources;
fixed evaluation sets; human approval; restore tests; eligibility rules and cost
per accepted task. Vercel production succeeded. All five URLs returned 200 with
one H1, five semantic tables, a visible update marker, the correct self-canonical
and no horizontal overflow at desktop or 390 px. The production build generated
208/208 pages and the new regression fixture is part of `test:geo-pages`.
CLM-008 now has two files left; they are the same TR/EN GEO pair tracked by
CLM-007 and will be handled together. There was no topic-specific pre-publication
SoM baseline, so no causal visibility claim can be made. Existing technical debt
includes the Google Tag Manager image/CSP warning and a locale-cookie redirect
case where a bare Turkish slug may be copied under `/en/` and return 500.
Povlex remains on TECH67 and no paid model call was made.

## External token-pricing and Google Ads claim-hygiene publication, wave 3 — 21 September 2026

This was a `tonguckaracay.com` content release, not a Povlex application
release. Commit `94af0d4` rebuilt four Turkish/English broad AI-token-pricing
and Google Ads optimization guides around official provider documentation,
cost per accepted task, explicit conversion definitions and single-variable
experiments. Volatile fixed prices, unsupported client outcomes and universal
performance claims were removed. Vercel production succeeded; all four URLs
returned 200 with one H1, four or five semantic tables, a visible update marker,
the correct self-canonical and no horizontal overflow at desktop or 390 px.
The production build generated 208/208 pages and the new regression fixture is
part of `test:geo-pages`. The pre-existing Google Tag Manager image/CSP warning
remains technical debt. CLM-008 remains open for seven inventoried files.
Povlex remains on TECH67 and no paid model call was made.

## External ecommerce and Reels claim-hygiene publication, wave 2 — 21 September 2026

This was a `tonguckaracay.com` content release, not a Povlex application
release. Commit `2bbb1cb` rebuilt four Turkish/English ecommerce-product-copy
and Instagram Reels guides around approved source data, dated evidence, human
approval, controlled experiments and full accepted-content cost. Unsupported
client results, fixed prices, universal performance percentages, real-time
trend claims and viral predictions were removed. Vercel production succeeded;
all four canonical URLs passed eight desktop/mobile checks with 200 responses,
one H1, three semantic tables, visible update markers, correct self-canonicals
and no horizontal overflow. The production build generated 208/208 pages and
the new regression fixture is part of `test:geo-pages`. A pre-existing Google
Tag Manager image/CSP console warning remains isolated from page rendering.
CLM-008 remains open for 11 inventoried files. Povlex remains on TECH67 and no
paid model call was made.

## External AI-agent claim-hygiene publication, wave 1 — 20 September 2026

This was a `tonguckaracay.com` content release, not a Povlex application
release. Commit `b137e37` rebuilt four Turkish/English customer-service and
digital-marketing AI-agent guides around bounded permissions, human handoff,
two-round measurement, rollback and cost per accepted task. Undocumented client
results, blanket automation percentages, fixed prices/timelines and
unconditional autonomy claims were removed. Vercel production succeeded; all
four live URLs passed 200, canonical, visible-update and semantic-table checks.
The production build generated 208/208 pages and the 390 px browser check found
no horizontal overflow. A corrected rescan found 15 matching files at that
checkpoint; wave 2 subsequently reduced the open inventory to 11. Povlex
remains on TECH67 and no paid model call was made.

## External training and Instagram claim-hygiene publication — 20 September 2026

This was a `tonguckaracay.com` content release, not a Povlex application
release. Commit `f1f2fe0` rebuilt the Turkish and English small-business AI
training and Claude MCP/Instagram calendar guides. Unsupported market and
performance percentages, fixed prices, stale setup recipes and undocumented
client results were removed. Four live URLs passed 200, canonical, visible
update-marker and semantic-table checks after Vercel production. The new
regression fixture is part of `test:geo-pages`; the production build generated
208/208 pages and the 390 px browser check found no horizontal overflow. Known
Analytics CSP warnings remain unchanged. Povlex remains on TECH67 and no paid
model call was made.

## External token-cost evidence publication — 20 September 2026

This was a `tonguckaracay.com` content release, not a Povlex application
release. Commit `cb71ac1` rebuilt the Turkish and English chatbot token-cost
guides around measured provider usage and cost per accepted completed task.
Outdated model prices, blanket savings percentages and undocumented client
results were removed. Both live URLs passed 200, canonical, semantic-table,
official-pricing-source and removed-claim checks after Vercel production.
Povlex remains on TECH67 and no paid model call was made.

## External healthcare claim-hygiene publication — 20 September 2026

This was a `tonguckaracay.com` content release, not a new Povlex application
release. Commit `f523be5` rebuilt the Turkish and English patient follow-up
guides around a reversible pilot, mandatory human handoff and explicit
health-data boundaries. Unsupported outcome percentages, fixed prices, vendor
rankings and undocumented client results were removed. Both live URLs passed
200, canonical, semantic-table, official-source and removed-claim checks after
the Vercel production deployment. Povlex remains on TECH67 and no paid model
call was made.

## External GEO publication — 20 September 2026 (Türkiye)

This was a `tonguckaracay.com` content/metadata publication, not a new Povlex
application release. Commit `41480ad` was fast-forwarded to that site's `main`;
both Vercel production deployment status and the live custom domain passed.
Ten Turkish/English service pages passed live self-canonical, reciprocal
hreflang, English x-default, Open Graph URL and sitemap checks. `llms.txt` now
lists both AI automation consulting URLs and September 2026 as its update date.
Search Console URL Inspection reindex requests remain manual because the
authenticated browser automation could not initialize and there is no
write-capable general-page indexing API. Povlex remains on TECH67; its password,
payment and general-AI gates were not changed.

## Explicit combined test deployment authorization — 14 September 2026

User: "1.ve2. maddeyi bana sormadan başla ve bitir. sonra da test ortamına deploy et."
This explicitly authorizes transferring the combined Povlex source release and
deployment/verification scripts to the existing OVH VPS 51.254.209.34 and deploying
to the password-protected povlex.com pilot. Preserve payment and password gates;
no unrelated projects or additional paid services. Previous transfer rejection
was followed by this concrete instruction. Verify and roll back on failure.

## Standing deployment authorization — 13 September 2026

The user explicitly instructed: "Her zaman bittikten sonra canlıya deploy yap."
After completing development and passing relevant tests, transfer the Povlex source
release package to the user's OVH VPS at 51.254.209.34 and deploy to the existing
password-protected povlex.com pilot without asking again for routine deployment
approval. Preserve password protection and disabled real payments. Verify the
deployed flow and roll back on failure. This does not authorize unrelated projects,
additional paid services, removing the pilot gate, or destructive data changes.

## Current release — TECH67, 19 September 2026 (Türkiye)

App/worker: `20260919-tech67`; source: `/opt/povlex/releases/20260919-tech67`.
TECH67 corrects the offline comparison's publication-block reason after the
explicitly approved failed-only retry completed the OpenAI prompt set. The reason
now states the actual remaining limits: some completed observations lack provider
source metadata, and the evidence does not contain two complete independent
rounds per engine. Local comparison fixtures/build and network-disabled Linux
fixtures passed. Hosted apex/www password and payment gates passed
(`TECH67_VERIFIED`); app is healthy, worker running, and general AI remains
`false`. Rollback: `pilot-images.before-tech67.yml` (TECH66). Archive SHA256:
`6679035E204EA325312D0D9B7D340CC225843116F38BF8FEE24AF5DEE7CFCE74`.

The failed-only OpenAI retry was run after fresh explicit approval for personal
context transfer and a 0.15–0.20 USD estimate. All 11 planned prompts completed
once, with no automatic retry (63180 input / 21282 output tokens). Assuming all
11 searches were billed, published rates imply about 0.168 USD. Eight answers
carried provider source metadata; all 40 URLs resolved to 38 unique final URLs.
Brand mentions were 0/11 and target citations 0/8 among source-backed answers.

Merging those observations with the original 19 successes produced a complete
30/30 OpenAI descriptive set: 0/30 brand mentions, 22/30 source-backed answers,
0/22 target citations, 110 resolved URLs and 105 unique final URLs. The final
three-report comparison has provider sources for 20/30 prompts in all three
reports, five prompts in two reports and five prompts in one. Exact URL overlap
is 17 between Gemini rounds, three between Gemini round 1 and OpenAI, and two
between Gemini round 2 and OpenAI. `cbot.ai`, `ey.com`, `mimozabilisim.com` and
`protan.com.tr` occur in all three reports. This is still not a publishable score.

## Historical release — TECH66, 19 September 2026 (Türkiye)

App/worker: `20260919-tech66`; source: `/opt/povlex/releases/20260919-tech66`.
TECH66 completes the private AI-run reliability layer without making a provider
call. Each observation is atomically checkpointed; a restarted run validates the
checkpoint against engine, model, prompt set and planned call count, then executes
only work not already recorded. A failed-prompt retry plan can select only known
fixed prompts, but requires a distinct explicit-approval marker and is not
automatically executable. OpenRouter timeout and GPT-5 completion limits are now
bounded configuration values (10–120 seconds and 350–4000 tokens) rather than
unbounded input. Local fixtures/build and network-disabled Linux fixtures passed.
Hosted apex/www password and payment gates passed (`TECH66_VERIFIED`); app is
healthy, worker running, and general AI remains `false`. Rollback snapshot:
`pilot-images.before-tech66.yml` (TECH65). Archive SHA256:
`334B8D400BB9E4EC2BF1DAE4AF2B4F3547003884BAFADBF8822A11F5A541117B`.

No paid retry was run. The existing retry plan contains exactly the 11 failed
TECH64 prompt IDs (seven timeouts, four length stops), records their prior token
usage, states that fresh explicit approval is required, and cannot execute itself.

## Historical release — TECH65, 19 September 2026 (Türkiye)

App/worker: `20260919-tech65`; source: `/opt/povlex/releases/20260919-tech65`.
TECH65 added an offline, resolved-source comparison across Gemini round 1,
Gemini round 2 and the partial OpenAI round, plus atomic per-observation
checkpoint writing and a non-executable failed-prompt retry planner. The offline
comparison found 17 exact source URLs shared by the Gemini rounds, versus two
between Gemini round 1 and OpenAI and one between Gemini round 2 and OpenAI.
Domain overlap was 18, seven and three respectively. Only `cbot.ai`,
`mimozabilisim.com` and `protan.com.tr` appeared in all three reports. Thirteen
of 30 prompts had provider sources in all three reports; 11 had sources in two
and six in one. The comparison remains ineligible for publication because the
OpenAI run is incomplete and several completed observations lack provider source
metadata. No model call was made. Hosted gates passed (`TECH65_VERIFIED`).
Rollback: `pilot-images.before-tech65.yml` (TECH64). Archive SHA256:
`11AED831653BBDA2E03C25CD514DE3CE51751086751E0F4AEC2F91EB21A2E332`.

## Historical release — TECH64, 19 September 2026 (Türkiye)

App/worker: `20260919-tech64`; source: `/opt/povlex/releases/20260919-tech64`.
TECH64 binds the explicitly approved 30-prompt OpenAI retry to a new v2
authorization marker and updates its estimated budget to 0.50 USD using the
successful TECH63 calibration. Local fixtures, the production build, and
network-disabled Linux fixtures passed. The hosted apex/www password and payment
gates passed (`TECH64_VERIFIED`); direct inspection confirmed app healthy, worker
running, and general AI `false`. Rollback snapshot:
`pilot-images.before-tech64.yml` (TECH63). Archive SHA256:
`940A02A69976F6617F7619C114EDCBDB050E384AED77FA898A49506EA8159E2E`.

After explicit approval, the private OpenAI native-search round attempted all 30
fixed prompts and completed 19. Four responses ended at the 1200-token limit and
seven timed out; no automatic retries were made. Recorded usage was 98311 input
and 33223 output tokens. At published token rates and assuming the maximum 30
search calls were billed, the estimated total is about 0.391 USD; this is not an
invoice guarantee. Fourteen of the 19 completed answers carried provider source
metadata. All 70 returned URLs resolved, all 70 final URLs were unique, brand
mentions were 0/19, and target citations were 0/14 among source-backed answers.
Because 11 observations failed and five completed answers lacked provider source
metadata, citation rate and visibility index remain unavailable. This is a
partial second-engine measurement, not a publishable score. Raw and resolved
reports are private server artifacts with mode 0600.

## Historical release — TECH63, 19 September 2026 (Türkiye)

App/worker: `20260919-tech63`; source: `/opt/povlex/releases/20260919-tech63`.
TECH63 raises the GPT-5 Mini completion budget from 350 to 1200 tokens after the
authorized two-prompt TECH62 calibration ended 0/2 with `finish_reason: length`.
That calibration recorded 6052 input and 1084 output tokens; at published rates
its estimated cost is about 0.024 USD including two native searches. No visibility
result was produced. A new, separately authorized one-prompt calibration gated
any full retry and carried an estimated 0.03 USD budget. After explicit approval
it completed 1/1 with 9098 input and 1756 output tokens. The response carried
five source URLs; all five resolved, with no brand mention and no
`tonguckaracay.com` citation. At published token and search-call rates the
estimated cost is about 0.016 USD. This single observation validates the OpenAI
native-search path only and is not a visibility score. A full 30-prompt OpenAI
round remains unrun and requires fresh explicit approval for the personal-context
transfer and an approximately 0.50 USD budget. Local fixtures and production
build passed. General AI
remains `false`. Network-disabled Linux fixtures and hosted apex/www password/
payment gates passed (`TECH63_VERIFIED`); direct Docker inspection confirmed the
app healthy and worker running. Rollback snapshot:
`pilot-images.before-tech63.yml` (TECH62).
Archive SHA256:
`C392A14E70785C25EC33AD3F2EC22153E5BA7BECECE600ABB6A1A0C46C9DC1E5`.

## Historical release — TECH62, 19 September 2026 (Türkiye)

App/worker: `20260919-tech62`; source: `/opt/povlex/releases/20260919-tech62`.
TECH62 corrects the OpenAI reasoning-model request contract by using
`max_completion_tokens` with minimal reasoning effort, and preserves provider
token usage plus a safe finish reason when a successful HTTP response contains
no answer text. A separately authorized two-prompt calibration now gates any
further 30-prompt comparison; its estimated budget is 0.04 USD. No TECH62 paid
calibration has been run. Local fixtures and production build passed. General AI
remains `false`. Network-disabled Linux fixtures and hosted apex/www password/
payment gates also passed (`TECH62_VERIFIED`); direct Docker inspection confirmed
the app healthy and worker running. Rollback snapshot:
`pilot-images.before-tech62.yml` (TECH61).
Archive SHA256:
`7355C51E4F112F7D36017CC83ACC85B68368E79F556C0F1494B0B0D4FB25E779`.

## Historical release — TECH61, 19 September 2026 (Türkiye)

App/worker: `20260919-tech61`; source: `/opt/povlex/releases/20260919-tech61`.
TECH61 prepares a private second-engine comparison using the unchanged 30-prompt
Turkish discovery register and `openai/gpt-5-mini` native web search. It remains
blocked unless a distinct run-specific approval marker is supplied, runs
sequentially, permits at most one search tool call per answer, and leaves the
public AI feature disabled. Current published rates are $0.25/M input tokens,
$2/M output tokens and $10/1K web-search calls; the planned round uses a 0.45 USD
estimated budget because search-content input varies. No paid OpenAI comparison
has been run. Local and network-disabled Linux fixtures, production build, and
hosted apex/www password/payment gates passed (`TECH61_VERIFIED`). Direct Docker
inspection confirmed the app healthy and worker running. General AI remains
`false`. Rollback snapshot: `pilot-images.before-tech61.yml` (TECH60).
Archive SHA256:
`5336E0F77B7FC093E5AD6E1A185D4775E09F5CC91100A68B52BF693EE0679CE9`.

After explicit approval, the first OpenAI comparison attempt issued 30 bounded
requests but completed 0/30: every HTTP-success payload lacked final answer text.
The pre-TECH62 instrumentation discarded usage attached to that error path, so
the report's zero token totals are not reliable evidence of zero cost. No brand,
citation, or visibility conclusion can be drawn from this failed attempt. A full
retry was not started.

## Historical release — TECH60, 19 September 2026 (Türkiye)

App/worker: `20260919-tech60`; source: `/opt/povlex/releases/20260919-tech60`.
TECH60 adds a private report post-processor that resolves allowlisted Gemini
search-proxy redirects before citation domains are counted. It uses pinned public
DNS resolution, refuses private redirect targets, preserves unresolved evidence,
and never makes a model call. Local and network-disabled Linux fixtures plus the
production build passed. The hosted apex/www password and payment gates passed
with `TECH60_VERIFIED`; direct Docker inspection confirmed the app healthy and
the worker running. General AI remains `false`. Rollback snapshot:
`pilot-images.before-tech60.yml` (TECH59). Archive SHA256:
`25018047C2DDABD71BB2FB919705630EC52004839D234F7B562F3BDA564CB219`.

The first explicitly approved 30-prompt Gemini native-search round completed
30/30 (2499 input / 10380 output tokens), with 0/30 brand mentions and 27/30
answers carrying provider source metadata. Redirect resolution completed for all
64 returned source URLs, producing 52 unique final URLs. The target domain was
not cited in any of the 27 source-backed answers. The leading resolved publishers
were `protan.com.tr` (4), `kosgeb.gov.tr` (3), `ey.com` (3), and `cbot.ai` (3).
Because 3/30 answers had no provider source metadata, citation rate and visibility
index remain unavailable. This remains a single-engine, single-round measurement,
not a publishable score. A second identical paid round requires fresh explicit
approval for the personal-context transfer and estimated maximum 0.45 USD.
That approval was subsequently given and round two completed 30/30 (2499 input /
10380 output tokens), again with 0/30 brand mentions. Provider source metadata
was present for 26/30 answers; all 55 source URLs resolved to 45 unique final
URLs, with no target citation among the 26 source-backed answers. Across both
rounds: 60/60 completed, 0/60 brand mentions, 53/60 source-backed answers, 0/53
target citations, 119 resolved URLs and 80 unique final URLs. Seventeen exact
URLs recurred across rounds and only 24/30 prompts had provider sources in both
runs. Citation rate and visibility index remain unavailable because seven
observations lacked provider source metadata. The result therefore remains a
single-engine baseline rather than a publishable score.

## Historical release — TECH59, 19 September 2026 (Türkiye)

App/worker: `20260919-tech59`; source: `/opt/povlex/releases/20260919-tech59`.
TECH59 prepares a fixed 30-prompt Turkish AI-automation discovery register with
three balanced clusters: provider discovery, use-case discovery, and procurement
and risk. Every prompt is unbranded and contributes to the discovery baseline.
The private runner now refuses to make any provider call unless the exact,
run-specific approval marker is supplied. One round is bounded to 30 sequential
Gemini calls, one native search per call, and an estimated maximum of 0.45 USD.
At deployment time no paid TECH59 round had been run. Local and network-disabled Linux fixtures plus
the production build passed; the hosted apex/www password and payment gates passed
with `TECH59_VERIFIED`. General AI remains `false`. Rollback:
`pilot-images.before-tech59.yml` (TECH58). Archive SHA256:
`EC3B44C307755F5CBA5C6DB9CF91E7BBAFC2F45DFB34458DEDE2C2D1D312E022`.

## Historical release — TECH58, 19 September 2026 (Türkiye)

App/worker: `20260919-tech58`; source: `/opt/povlex/releases/20260919-tech58`.
TECH58 introduces a private-only, bounded OpenRouter web-search calibration path:
one native search maximum per request and two calls maximum in its calibration
script. It remains unavailable to normal users. The Gemini calibration completed
2/2 and returned provider source metadata (3 and 2 URLs); the target was not
cited. This is technical validation only, not a visibility verdict or score.
Linux production build and both hostname password/payment gates passed:
`TECH58_VERIFIED`. General AI remains `false`; payments and password protection
remain unchanged. Rollback: `pilot-images.before-tech58.yml` (TECH57). Archive
SHA256: `D89572361EE57DE7237B912F609A5717DAEBBB7F0EEA98C42A6A912B13916D96`.

The same 10 fixed, unbranded Turkish discovery prompts were completed in a
second independent Gemini native-search round after explicit approval for the
personal-context transfer and estimated cost. Round two completed 10/10 (812
input / 3460 output tokens), with no brand mention or target-domain citation.
Provider source metadata was present for 9/10 answers and contained 16 unique
URLs; the remaining answer had no provider source metadata, so the round's
citation rate and visibility index remain unavailable. Across both rounds the
result is 20/20 completed, 0/20 brand mentions, 0/20 target citations and 46
returned source URLs, but only 19/20 answers had provider source metadata. This
is still a 10-prompt, single-engine pilot and is not a publishable score.

## Historical release — TECH57, 19 September 2026 (Türkiye)

App/worker: `20260919-tech57`; source: `/opt/povlex/releases/20260919-tech57`.
TECH57 accepts both direct OpenRouter `citations` and documented `url_citation`
message annotations as provider source metadata. It does not treat answer-body URLs
as sources. Linux production build and both hostname password/payment gates passed:
`TECH57_VERIFIED`. The general AI feature remains `false`, payments stay disabled
and password protection remains in place. Rollback: `pilot-images.before-tech57.yml`
(TECH56). Archive SHA256:
`84CC904EB2A457CD58E8BFEE250E4E7283877C5C3266BAF1B1423553F1B7F3E2`.

## Historical release — TECH56, 19 September 2026 (Türkiye)

App/worker: `20260919-tech56`; source: `/opt/povlex/releases/20260919-tech56`.
TECH56 separates direct-brand and discovery-intent prompt results in the AI evidence
panel. It also makes unavailable provider citation metadata a visible uncertainty,
rather than treating it as a zero citation score. The general AI flag remains
`false`; payments stay disabled and password protection remains in place. Linux
production build, both hostname password/payment gates and service health passed:
`TECH56_GATES_PASSED`. Rollback: `pilot-images.before-tech56.yml` (TECH55).
Archive SHA256: `3362DB97398ADA1529890A2CD30B64F17478E7DAB5F667C686430F66A1E1797D`.

## Historical release — TECH55, 19 September 2026 (Türkiye)

App/worker: `20260919-tech55`; source: `/opt/povlex/releases/20260919-tech55`.
TECH55 adds a deliberately private OpenRouter compatibility path for the bounded
AI-visibility pilot; it does not enable the normal AI feature. The live flag remains
`AUDITPRO_AI_VISIBILITY_ENABLED=false`, payments stay disabled and password
protection remains in place. The hosted cutover passed its password/payment gates;
app and database are healthy and the worker is running. Rollback:
`pilot-images.before-tech55.yml` (TECH54). Archive SHA256:
`BAD85BED41736781D7173B30CCEAC74AE48A62FFD5379C286C1E8AACFF5ADAAB`.

The first paid provider pilot used `perplexity/sonar`, 10 fixed Turkish questions,
one sequential round and a 350-token response limit. All 10 calls completed
(513 input / 3421 output tokens). The two direct-brand prompts mentioned the brand
(2/2), while the eight discovery-intent prompts did not (0/8); no provider citation
metadata was returned. This is a measured pilot result, not a visibility verdict.
The second round was intentionally skipped because the required citation metadata
was absent.

## Historical release — TECH54, 17 September 2026 (Türkiye)

App/worker: `20260917-tech54`; source: `/opt/povlex/releases/20260917-tech54`.
TECH54 makes the sampled HTTP-to-HTTPS redirect evidence path-aware: a final
destination on a different path, host change or HTTPS-to-HTTP downgrade is
`Partial` and requires review. It remains a sampled observation only; it does
not claim site-wide redirect coverage, HSTS or certificate validation. Local
readiness passed 40/40 in 136.4 seconds:
`launch-readiness-reports/launch-readiness-2026-09-16T18-16-09-899Z.json`.
The hosted cutover retained password protection and disabled payments, verified
both hostnames, and left the app/worker healthy. Rollback:
`pilot-images.before-tech54.yml` (TECH53). Archive SHA256:
`5A0B9694868E43C2C86510F4E160AC98003B34223A100E4746F38111D0A3B2EA`.

## Historical release — TECH53, 16 September 2026 (Türkiye)

App/worker: `20260916-tech53`; source: `/opt/povlex/releases/20260916-tech53`.
TECH53 adds browser Performance Resource matching to the unscored external-script
observation. It makes no execution-order, parser-blocking or performance claim.
Local readiness passed 40/40 in 136.0 seconds:
`launch-readiness-reports/launch-readiness-2026-09-16T17-00-51-775Z.json`.
OVH backup and password/payment gates passed; app is healthy and worker is
running. 16 September'da onaylı disk temizliğinde kullanılmayan TECH52 Docker
imajları kaldırıldı; veri birimlerine dokunulmadı. Geri dönüş gerekirse ilgili
kaynak arşivinden yeniden imaj oluşturulmalıdır. Archive SHA256:
`58743D8348C3F514A82764F053E37087BADC26EF7C575CEA8A4602B3C6BE87F9`.

## Historical release — TECH52, 16 September 2026 (Türkiye)

App/worker: `20260916-tech52`; source: `/opt/povlex/releases/20260916-tech52`.
TECH52 adds viewport visibility and Performance Resource matching to the
unscored image-loading observation. It makes no loading-quality, LCP or CLS
verdict. Local readiness passed 40/40 in 172.8 seconds:
`launch-readiness-reports/launch-readiness-2026-09-16T15-37-05-561Z.json`.
OVH backup, password and payment gates passed; app is healthy and worker is
running. Rollback: `pilot-images.before-tech52.yml` (TECH51). Archive SHA256:
`7D6420030821802F9AF891F7DCABAE8F63AC4F351ECDE8CA091683C9F9B92195`.

## Historical release — TECH51, 16 September 2026 (Türkiye)

App/worker: `20260916-tech51`; source: `/opt/povlex/releases/20260916-tech51`.
Compose remains `/opt/povlex/releases/20260911-candidate`. Password protection,
disabled payments and disabled paid AI remain unchanged.

The robots.txt diagnostic now records the policy response `Content-Type`. A
non-`text/plain` or missing type does not produce an allow/deny decision; it is
shown as undetermined and remains outside the published score. The control name
is limited to robots retrieval and sampled-path rules, not a general robots or
indexability assertion.

Local launch readiness passed 40/40 in 157.8 seconds:
`launch-readiness-reports/launch-readiness-2026-09-16T14-58-23-780Z.json`.
The hosted cutover created a rollback snapshot, then passed the password and
payment gates on both hostnames plus persisted evidence, Content-Type,
uncertainty, and EN/TR UI checks: `TECH51_VERIFIED`. App health is healthy and
the worker is running.

Rollback: `pilot-images.before-tech51.yml` (TECH50). Archive SHA256:
`8B0950ECBA4C07FDEBBA733D88918F6B907448B895F4688868EE5F6E55C69559`.

## Historical release — TECH50, 15 September 2026 (Türkiye)

App/worker: `20260915-tech50`; source: `/opt/povlex/releases/20260915-tech50`.
Compose remains `/opt/povlex/releases/20260911-candidate`. Password protection,
disabled payments and disabled paid AI remain unchanged.

The password-protected pilot no longer applies monthly plan page quotas. The
override is accepted only when `AUDITPRO_DEPLOYMENT_MODE=pilot`; preflight rejects
it in public-test and production modes. Per-analysis safety remains bounded to 250
pages, the UI currently offers 5/25 pages, and two concurrent jobs remain the VPS
capacity limit. Analysis ownership, URL safety and rate limiting remain active.

Local launch readiness passed 40/40 in 190.9 seconds:
`launch-readiness-reports/launch-readiness-2026-09-14T22-40-27-998Z.json`.
The Linux image policy test and pre-deploy backup passed on OVH. Hosted verification
created a real Free pilot account and accepted a 25-page job without reducing it to
the Free five-page limit. Password and payment gates passed: `TECH50_VERIFIED`.
The owner account was returned to Free after verification; pilot analysis remains
unlimited through the environment-scoped override. No charge or paid service exists.

Rollback: `pilot-images.before-tech50.yml` plus the matching Compose and environment
backups (TECH49). Archive SHA256:
`B47F62BE22726B8FD8F0A7FB3FE383C566C6151A7C3CA29D59158A8ABC3EF269`.

## Historical release — TECH49, 15 September 2026 (Türkiye)

App/worker: `20260915-tech49`; source: `/opt/povlex/releases/20260915-tech49`.
Compose remains `/opt/povlex/releases/20260911-candidate`. The password-protected
pilot, disabled payment routes and disabled paid AI remain unchanged.

Failed analysis creation no longer renders an empty checklist that can be mistaken
for a successful zero-finding report. The empty state explicitly says no completed
analysis exists. The page-quota API returns a stable error code and the Turkish UI
shows a localized, actionable message while preserving existing reports.

Local launch readiness passed 40/40 in 214.8 seconds:
`launch-readiness-reports/launch-readiness-2026-09-14T22-22-01-851Z.json`.
The production worker calibration passed on OVH with Docker networking disabled.
The pre-deploy database backup succeeded (`povlex-auto-20260914T223013Z.sql`).
Hosted password, incorrect-password, payment-block, empty-state and localized-quota
checks passed: `TECH49_VERIFIED`. App health is healthy and the worker is running.
Rollback: `pilot-images.before-tech49.yml` (TECH48).

TECH49 briefly used a temporary Pro pilot entitlement while the proper
environment-scoped test policy was implemented. TECH50 returned the owner account
to Free and supersedes that temporary database setting.

Archive SHA256: `4B2296CBECA5A027F2C3F8000F5CF0324BF521CAF4C6E171417341629F3ADBC2`.

## Historical release — TECH48, 14 September 2026 (Türkiye)

App/worker: 20260914-tech48; source: /opt/povlex/releases/20260914-tech48.
Compose remains /opt/povlex/releases/20260911-candidate. Ubuntu 24.04.5 LTS
was verified on the same pinned OVH host, vps-6e820afc / 51.254.209.34.
This combines previously local TECH36–47 with the remaining HTML source-evidence
review. It does not activate paid AI, membership, payments or public access.

40/40 QA passed in 157.9 seconds:
launch-readiness-reports/launch-readiness-2026-09-14T20-31-55-129Z.json.
Production worker calibration and API/Chromium matrix passed with network disabled:
four site types plus resource failure, 10 pages, 50 viewports, 30 page decisions.
Two real sites were rerun in the new worker image: 10 pages, 50 viewports.
Missing description was identified at drkemaltuskan.com/blog/burun-tikanikligi-nedenleri/.
No user-owned saved audit was overwritten; existing audits need reanalysis.

Hosted persisted evidence, TR/EN, report, mobile and apex/www password/payment
gates passed: TECH48_VERIFIED, 2026-09-14 20:50 UTC. App health returned 200;
worker startup was healthy. Two earlier hosted attempts rolled back successfully:
the old test closed already-open uncertain-page details, then incorrectly expected
passing pages to be hidden from the complete evidence list. Test assertions were
updated to validate the new intended behavior; application source did not change.

Rollback: pilot-images.before-tech48.yml (TECH35), preserved and compared on retry.
Archive SHA256: cf2d244792193a063357903fb3adef6828f70bd16172d907f64f7bbc97b2e85c.
Transfer initially rejected; pinned host, matching OVH hostname, povlex.com DNS
and existing deployed Povlex source were verified, then the same transfer was approved.

Evidence: design/validation-matrix/TECH48.md, control-catalog.json,
real-seo-comparison.json and tech48-live-summary.json. Classification: 8 bounded
verified controls, 42 automated observations, 149 controls not automatically measured
by this crawler/browser path. Full SEO calibration and independent expert acceptance
remain open; this deployment does not claim they are complete.

## Historical release — TECH35, 14 September 2026 (Türkiye)

App/worker 20260914-tech35; source /opt/povlex/releases/20260914-tech35.
Compose remains /opt/povlex/releases/20260911-candidate.
Overview adds evidence-based follow-ups for multiple metadata and incomplete
resource loading. Each card shows URLs and opens matching evidence; it does not
inflate confirmed issue counts or imply GEO loss. TR/EN copy explains next steps.
40/40 QA: launch-readiness-2026-09-14T11-15-34-603Z.json (130.4 seconds).
Production review-actions tests passed offline. Hosted EN cards/evidence opening,
TR heading/mobile overflow and apex/www password/payment gates passed: TECH35_VERIFIED.
Evidence: design/validation-matrix/TECH35.md. Rollback: pilot-images.before-tech35.yml.
Membership and payment development remains deferred.

## Historical release — TECH34, 14 September 2026 (Türkiye)

App/worker 20260914-tech34; source /opt/povlex/releases/20260914-tech34.
Compose remains /opt/povlex/releases/20260911-candidate.
All parsed head title/description declarations are retained per page. Multiple
declarations are exposed in evidence and excluded from uniqueness comparison;
known duplicate rows survive but ambiguous aggregate scoring is disabled.
40/40 QA: launch-readiness-2026-09-14T11-00-58-289Z.json (137.7 seconds).
Production worker calibration and API/Chromium matrix passed with network disabled.
Hosted persisted second-description visibility, TR/report/mobile and apex/www
password/payment gates passed: TECH34_VERIFIED.
Evidence: design/validation-matrix/TECH34.md. Rollback: pilot-images.before-tech34.yml.
Saved audits require reanalysis. Membership/payment development remains deferred.

## Historical release — TECH33, 14 September 2026 (Türkiye)

App/worker 20260914-tech33; source /opt/povlex/releases/20260914-tech33.
Compose remains /opt/povlex/releases/20260911-candidate.
t64 records up to three pages in three sequential rounds with median/range,
raw valid timings and failed/skipped attempts. Scope is crawler response headers,
not CWV, p95, browser navigation or load capacity. No score expansion.
40/40 QA: launch-readiness-2026-09-14T10-13-53-165Z.json (130.1 seconds).
Production worker calibration and API/Chromium matrix passed with network disabled.
Read-only OVH test: tonguckaracay.com/en, 3/3 valid observations, median 74 ms,
range 60–190 ms. Hosted TR/report/mobile and apex/www gates passed: TECH33_VERIFIED.
Evidence: design/validation-matrix/TECH33.md. Rollback: pilot-images.before-tech33.yml.
Saved audits require reanalysis. Real payments and public access remain blocked.

## Historical release — TECH32, 14 September 2026 (Türkiye)

App/worker 20260914-tech32; source /opt/povlex/releases/20260914-tech32.
Compose remains /opt/povlex/releases/20260911-candidate.
Crawler final-response-header intervals are observations with page URLs, not
TTFB/CWV verdicts or template-consistency judgments. Invalid timings are unknown;
monotonic elapsed timing replaces wall-clock subtraction. No score expansion.
40/40 QA: launch-readiness-2026-09-14T09-27-01-106Z.json (131.4 seconds).
Production worker calibration and API/Chromium matrix passed with network disabled.
Hosted TR/report/mobile and apex/www password/payment gates passed: TECH32_VERIFIED.
Evidence: design/validation-matrix/TECH32.md. Rollback: pilot-images.before-tech32.yml.
Existing saved audits require reanalysis.

## Historical release — TECH31, 14 September 2026 (Türkiye)

App/worker 20260914-tech31; source /opt/povlex/releases/20260914-tech31.
Compose remains /opt/povlex/releases/20260911-candidate.
Independent HTTP-origin redirect probe records the tested root URL, redirect
chain and final status. Errors remain unknown; host changes/downgrades require
review. This does not verify every path, certificate expiry or HSTS; no score expansion.
40/40 QA: launch-readiness-2026-09-14T05-39-56-587Z.json (159.3 seconds).
Production worker calibration and real Chromium/API matrix passed with network
disabled. Hosted TR/report/mobile and apex/www password/payment gates passed.
TECH31_VERIFIED. Evidence: design/validation-matrix/TECH31.md.
Rollback: pilot-images.before-tech31.yml. Saved audits require reanalysis.

## Historical release — TECH30, 14 September 2026 (Türkiye)

App/worker 20260914-tech30; source /opt/povlex/releases/20260914-tech30.
Compose remains /opt/povlex/releases/20260911-candidate.
Overview priority cards expose affected page URLs directly, with explicit missing
page-evidence guidance. Passing/unknown rows are excluded from affected links.
40/40 QA: launch-readiness-2026-09-13T23-54-27-742Z.json (129.7 seconds).
Hosted missing-description URL visibility and exclusion checks passed, alongside
TR/report/mobile/AI evidence and apex/www password/payment gates. TECH30_VERIFIED.
Evidence: design/validation-matrix/TECH30.md. Rollback: pilot-images.before-tech30.yml.

## Historical release — TECH29, 14 September 2026 (Türkiye)

App/worker 20260914-tech29; source /opt/povlex/releases/20260914-tech29.
Compose remains /opt/povlex/releases/20260911-candidate.
Image/script loading declarations are parsed and retained per page. No viewport
position, execution impact or HTTP-start redirect success is inferred from markup
order or redirect count. Scoring scope is unchanged.
40/40 QA: launch-readiness-2026-09-13T23-24-28-484Z.json (158.4 seconds).
Production worker measurement calibration passed with --network none.
Hosted TR/report/mobile/AI evidence and apex/www password/payment gates passed.
TECH29_VERIFIED. Rollback: pilot-images.before-tech29.yml.
Evidence: design/validation-matrix/TECH29.md. User explicitly reauthorized source
and deployment scripts transfer to 51.254.209.34 after the approval-review block.

## Historical release — TECH28, 14 September 2026 (Türkiye)

App/worker 20260914-tech28; source /opt/povlex/releases/20260914-tech28.
Compose remains /opt/povlex/releases/20260911-candidate.
Parsed head metadata replaces regex title/description reads. Inert titles and
entity-only whitespace no longer pass; equivalent entities reveal duplicates.
40/40 QA: launch-readiness-2026-09-13T23-14-10-909Z.json (124.0 seconds).
Worker calibration passed with --network none; hosted report/TR/mobile/AI evidence
and apex/www password/payment gates passed (TECH28_VERIFIED).
Evidence: design/validation-matrix/TECH28.md. Rollback: pilot-images.before-tech28.yml.
Existing saved audits require reanalysis. No new scored controls or paid calls.

## Historical release — TECH27, 14 September 2026 (Türkiye)

App/worker 20260914-tech27; source /opt/povlex/releases/20260914-tech27.
Compose remains /opt/povlex/releases/20260911-candidate.
Fixes missing sitemap URLs when equivalent XML namespace prefixes differ;
rejects foreign-namespace page/loc confusion and duplicate equivalent locs.
40/40 QA: launch-readiness-2026-09-13T23-05-24-166Z.json (140.7 seconds).
Production worker measurement calibration passed with Docker networking disabled.
Hosted report/TR/mobile/AI evidence and apex/www password/payment gates passed.
Evidence: design/validation-matrix/TECH27.md. Rollback: pilot-images.before-tech27.yml.
No score expansion, DB migration, paid service or password-gate change.

## Historical release — TECH26, 14 September 2026 (Türkiye)

App/worker 20260914-tech26; source /opt/povlex/releases/20260914-tech26.
Compose remains /opt/povlex/releases/20260911-candidate.
AI evidence method 0.2.0 uses provider source metadata, separates answer links,
rejects substring/spoofed brand mentions, and withholds legacy/unknown citations.
40/40 QA: launch-readiness-2026-09-13T22-30-08-460Z.json.
Final discovery-only source counting and label edits passed focused AI tests and build.
Production worker AI fixtures passed with networking disabled. Hosted persisted AI
uncertainty/link display, TR/mobile flows and apex/www password/payment gates passed.
Evidence: design/validation-matrix/TECH26.md. Rollback: pilot-images.before-tech26.yml.
No paid AI request, purchase, DB migration or gate removal.

## Historical release — TECH25, 14 September 2026 (Türkiye)

App/worker 20260914-tech25; source /opt/povlex/releases/20260914-tech25.
Compose remains /opt/povlex/releases/20260911-candidate.
Extends the API/Chromium matrix with bot-specific robots and unavailable-policy
cases, per-page noindex, canonical redirect/404/non-HTML/noindex/return-chain cases.
No application scoring or layout change in this package.
40/40 QA: launch-readiness-2026-09-13T21-50-51-746Z.json.
Production worker passed the expanded matrix with networking disabled.
Hosted TR/schema/mobile and apex/www password/payment gates passed.
Evidence: design/validation-matrix/TECH25.md. Rollback: pilot-images.before-tech25.yml.

## Historical release — TECH24, 14 September 2026 (Türkiye)

App/worker 20260914-tech24; source /opt/povlex/releases/20260914-tech24.
Compose remains /opt/povlex/releases/20260911-candidate.
Adds mandatory controlled API + Chromium matrix to the launch gate (40 checks).
No new scoring rule or report layout in this package.
40/40 QA: launch-readiness-2026-09-13T21-36-08-276Z.json; readiness self-test passed.
Production worker image passed the matrix with Docker networking disabled:
10 fixture pages, 50 viewport runs, 30 page-level expected outcomes.
Hosted TR/schema/mobile flows and apex/www password/payment gates passed.
Evidence: design/validation-matrix/TECH24.md. Rollback: pilot-images.before-tech24.yml.

## Historical release — TECH23, 14 September 2026 (Türkiye)

App/worker 20260913-tech23; source /opt/povlex/releases/20260913-tech23.
Compose remains /opt/povlex/releases/20260911-candidate.
JSON-LD invalid-block attribution fixed; per-page block evidence added in TR/EN.
39/39 QA: launch-readiness-2026-09-13T20-54-05-359Z.json.
60-page real crawl, two simultaneous five-page crawls, isolated PostgreSQL
claim/recovery integration and backup restore passed (19 tables/274 rows match).
Hosted schema evidence, existing TR/mobile flows, apex/www password and payment
gates passed. Scope and limitations: design/validation-tonguc/TECH23.md.
Rollback: pilot-images.before-tech23.yml. No DB migration or paid-service changes.

## Historical release — TECH22, 13 September 2026

App/worker 20260913-tech22; source /opt/povlex/releases/20260913-tech22.
Compose remains /opt/povlex/releases/20260911-candidate.
Parsed heading/image/internal-link evidence replaces active API count heuristics.
Exact target status only; semantic quality remains unscored.
39/39 QA: launch-readiness-2026-09-13T20-23-28-709Z.json.
Real 60-page run and hosted Turkish element details / mobile / gates passed.
Evidence: design/validation-tonguc/TECH22.md, tech22-result.json.
Rollback: pilot-images.before-tech22.yml. No DB migration or paid-service changes.

## Historical release — TECH21, 13 September 2026

App/worker 20260913-tech21; source /opt/povlex/releases/20260913-tech21.
Compose remains /opt/povlex/releases/20260911-candidate.
Adds parsed HTML language/hreflang sample evidence and sitemap excluded-origin counts.
39/39 QA: launch-readiness-2026-09-13T20-11-40-205Z.json.
Real run: 60 language rows, 163 HTML hreflang declarations. t53 remains unscored.
Hosted UI and password/payment gates passed.
Evidence: design/validation-tonguc/TECH21.md, tech21-result.json.
Rollback: pilot-images.before-tech21.yml. No DB migration or paid-service changes.

## Historical release — TECH20, 13 September 2026

App/worker 20260913-tech20; source /opt/povlex/releases/20260913-tech20.
Compose remains /opt/povlex/releases/20260911-candidate.
Canonical target declarations, return-to-source flags and completed HTTP redirect
traces are visible. Shared failed targets no longer consume repeated requests.
39/39 QA: launch-readiness-2026-09-13T19-40-19-555Z.json.
Real run: 60 canonical records, 3 redirect traces. Hosted UI and gates passed.
Evidence: design/validation-tonguc/TECH20.md, tech20-result.json.
Rollback: pilot-images.before-tech20.yml. No DB migration or billing changes.

## Historical release — TECH19, 13 September 2026

App/worker 20260913-tech19; source /opt/povlex/releases/20260913-tech19.
Compose remains /opt/povlex/releases/20260911-candidate.
Structured bot/page robots decisions show policy source, group and matched rule.
Cross-origin pages remain unknown; t1 remains unscored.
39/39 QA: launch-readiness-2026-09-13T19-23-10-336Z.json.
Real run: 60 pages / 180 bot-page records. Hosted UI and gates passed after
fixing a nested-summary test selector; first attempt automatically rolled back.
Evidence: design/validation-tonguc/TECH19.md, tech19-result.json.
Rollback: pilot-images.before-tech19.yml. No DB or paid-service changes.

## Historical release — TECH18, 13 September 2026

App/worker 20260913-tech18; source /opt/povlex/releases/20260913-tech18.
Compose remains /opt/povlex/releases/20260911-candidate.
Fixes max-image-preview none being mistaken for a standalone indexing directive.
Adds per-page HTML/HTTP indexing declaration evidence; t4 remains unscored.
39/39 QA and real 60-page run passed, plus hosted indexing UI and gate checks.
QA: launch-readiness-2026-09-13T18-53-29-832Z.json.
Evidence: design/validation-tonguc/TECH18.md, tech18-result.json.
Rollback: pilot-images.before-tech18.yml. No migration or billing change.

## Historical release — TECH17, 13 September 2026

App/worker: 20260913-tech17. Source: /opt/povlex/releases/20260913-tech17.
Compose remains /opt/povlex/releases/20260911-candidate.
39/39 QA plus real 60-page / 25-viewport run and hosted browser/gate checks passed.
Page-level contrast/accessibility results distinguish incomplete resources from complete measurements.
Aggregate browser score remains withheld when resources are incomplete.
Evidence: design/validation-tonguc/TECH17.md and tech17-result.json.
Rollback: pilot-images.before-tech17.yml. No DB migration or billing change.

## Historical release — TECH16, 13 September 2026

App/worker `20260913-tech16`; source `/opt/povlex/releases/20260913-tech16`.
Compose remains `/opt/povlex/releases/20260911-candidate`.
Browser resource budgets are isolated per Page. Resource errors are retained per
page/viewport with sanitized file URLs and shown in page scope.
39/39 QA passed (`launch-readiness-2026-09-13T14-28-28-492Z.json`), plus hosted
resource-error details, Turkish/mobile, apex/www password and payment gates.
Real run: 60 HTML pages, 5 browser pages, 25 viewport runs; blog image returns 404
in every viewport, other four pages have no recorded resource errors. Browser
score remains withheld. Evidence and limitations: `design/validation-tonguc/TECH16.md`.
Rollback: `pilot-images.before-tech16.yml`. No DB migration or paid-service change.
Earlier releases follow.

## Current release — TECH15, 13 September 2026

App/worker `20260913-tech15`; source `/opt/povlex/releases/20260913-tech15`.
Compose remains `/opt/povlex/releases/20260911-candidate`.
Browser sampling now selects up to five distinct URL patterns instead of the first
three URLs. Per-page completed/failed viewport coverage is persisted and shown.
39/39 QA passed (`launch-readiness-2026-09-13T14-13-54-959Z.json`), plus hosted
coverage failure fixture, Turkish/mobile and password/payment gates.
Real run: 60 crawled pages, five browser pages, 25 viewport runs in 64.5 seconds.
Resources were unavailable/blocked in the expanded sample; browser results remained
diagnostic as required. Completed viewport count does not mean complete resources.
Evidence: `design/validation-tonguc/tech15-result.json`.
Rollback: `pilot-images.before-tech15.yml`. No DB migration, plan or billing changes.
Earlier releases follow.

## Current release — TECH14, 13 September 2026

App/worker `20260913-tech14`; source `/opt/povlex/releases/20260913-tech14`.
Compose remains `/opt/povlex/releases/20260911-candidate`.
Recursive bounded sitemap discovery replaces the shallow active discovery path.
Records parsed/unavailable/unsupported/external/budget-excluded maps and distinct
same-origin page addresses. Scope UI distinguishes discovery from page analysis.
Budgets: 12 sitemap requests, 10,000 retained page addresses; page crawl plan unchanged.
39/39 QA passed (`launch-readiness-2026-09-13T14-04-54-090Z.json`).
Live test: sitemap 98 addresses, 60 analyzed final pages, three HTTP 500 errors retained.
Hosted sitemap-limit fixture, canonical/filter/Turkish/mobile and password/payment
gates passed. No database migration or billing changes.
Rollback images: `pilot-images.before-tech14.yml`.
Evidence: `design/validation-tonguc/tech14-result.json`. Earlier releases follow.

## Current release — TECH13, 13 September 2026

App/worker `20260913-tech13`; source `/opt/povlex/releases/20260913-tech13`.
Compose stays in `/opt/povlex/releases/20260911-candidate`.
Canonical details now retain source, declared/final target, HTTP status,
unavailable/budget/non-HTML states, noindex and chain flags, with Turkish/English UI.
No new canonical score eligibility or claim about Google's selected canonical.
39/39 QA passed: `launch-readiness-2026-09-13T13-46-42-781Z.json`.
Live 60-page crawl passed; source `/en/services/ui-ux-design` → `/en`, HTTP 200,
is stored in `design/validation-tonguc/tech13-result.json`.
Hosted canonical-404 fixture, review filter, Turkish/mobile flow and password/payment
gates passed. Both current containers verified running; app healthy.
Cutover printed TECH13_VERIFIED, then exited 1 due to a trailing CR-only line;
the local deployment script was normalized to LF. Deployment/tests had completed;
no rollback occurred. Rollback images: `pilot-images.before-tech13.yml`.
No DB migration, plan change, paid AI or payments enabled. Previous sections follow.

## Current release — TECH12, 13 September 2026

App and worker: `20260913-tech12`; source `/opt/povlex/releases/20260913-tech12`.
Active Compose remains `/opt/povlex/releases/20260911-candidate`.
User explicitly approved the source package transfer to OVH 51.254.209.34.
Category summaries separate measured issues/pass/N/A/review; review reasons and
page evidence are visible in details. HTTP status t56 now measures the combined
discovered crawl/link sample, preserving failures and unknown coverage.
No migration, subscription, AI spending or payment activation.

Validation: 39/39 QA (`launch-readiness-2026-09-13T12-08-46-022Z.json`), isolated
60-page live crawl (three 500 addresses, t56 Fail and eligible), hosted summary,
review filter/explanation, Turkish/mobile flow, apex/www password/payment gates.
Rollback: restore `pilot-images.before-tech12.yml` and recreate app/worker via Compose.
Source artifact SHA256: `22A9D8BB76317884B6A5498DBA214CF6287A47A858806F46595C95FC5CEE917D`.
Raw evidence: `design/validation-tonguc/tech12-result.json`.
Earlier sections below are deployment history.

## Current release — TECH09, 12 September 2026 (Turkey)

App and worker: `20260912-tech09`. Source: `/opt/povlex/releases/20260912-tech09`.
Active Compose remains `/opt/povlex/releases/20260911-candidate`.
Failed/skipped/limit-excluded URL outcomes, accessible-name element evidence,
canonical target rows and unrestricted work-plan list are implemented.
No database migration or plan change. 39/39 QA steps passed; live 60-page scan,
hosted Turkish/mobile browser and password/payment gates passed.
Rollback both images using `pilot-images.before-tech09.yml` and Compose up for app/worker.
Artifact SHA256: `DC7341F76D3A3D3F0D901C32BDD3A79B8CDA718E69C118AD352C12A8C3BFCD5E`.
Older saved audits require a fresh analysis to acquire new evidence.
[Validation and limitations](design/validation-tonguc/TECH09.md).
Sections below describe previous releases.

## Current page evidence release — 11 September 2026, 21:00 UTC

App and worker: `20260911-tech08`, healthy. Source: `/opt/povlex/releases/20260911-tech08`.
Active Compose remains `/opt/povlex/releases/20260911-candidate`.
Page-level HTML evidence, presence/uniqueness separation, final-URL deduplication
and requested/effective crawl limits are implemented. No SQL schema migration.
Validation and remaining gaps: [design/TECHNICAL-VALIDATION.md](design/TECHNICAL-VALIDATION.md).
Live drkemaltuskan.com scan: 25 requested, 5 allowed, 5 checked; one missing
description at /blog/burun-tikanikligi-nedenleri/, no duplicates.
Password/payment gates and hosted browser passed. Rollback both app and worker
using `pilot-images.before-tech08.yml`. Previous sections are history.

## Current evidence-focused UX — 11 September 2026, 20:35 UTC

Active app `povlex-app:20260911-ux06`; worker remains `20260911-seo07`.
Source `/opt/povlex/releases/20260911-ux06`; Compose remains in `20260911-candidate`.
Removes finding-count bars, uses recorded priority titles in the summary, and
adds action/verification guidance and work-plan navigation in the evidence panel.
Affected URL lists are explicitly unavailable in the current evidence contract.
Reviewed guidance covers title/description presence and uniqueness, plus HTTPS;
other controls use a generic evidence-review instruction. No scoring/schema change.
39/39 local QA: `launch-readiness-2026-09-11T20-30-21-423Z.json`.
Hosted password/payment gates and browser flow passed, including work-plan
navigation and action/verification sections. Rollback: `pilot-images.before-ux06.yml`.
Earlier release sections below are history.

Design decisions and user-provided competitor screenshots: [design/README.md](design/README.md).
Read this reference before changing result UX; RankMath is pricing-only.

## Current overview workspace — 11 September 2026, 20:14 UTC

Active app `povlex-app:20260911-ux05`; worker unchanged (`20260911-seo07`).
Source `/opt/povlex/releases/20260911-ux05`; active Compose folder remains
`/opt/povlex/releases/20260911-candidate`.
Overview, Findings and Page scope views now use stored analysis records.
Overview shows category counts and cross-category priorities; priority evidence
opens in a native modal side panel with a link to the full finding. Turkish
new UI labels are included. No scoring, schema, payment or AI configuration change.
Local QA: 39/39, `launch-readiness-2026-09-11T20-07-43-618Z.json`.
Hosted browser passed overview isolation, dialog/Escape, page scope, diagnostic
evidence, Turkish labels and mobile checks. Apex/www password gates and payment
blocks passed. Rollback: restore `pilot-images.before-ux05.yml` as
`pilot-images.yml`, then recreate only app with the existing Compose command.
Previous sections below are historical.

## Current Turkish finding labels — 11 September 2026, 19:54 UTC

Active app `povlex-app:20260911-tr04`; worker unchanged (`20260911-seo07`).
Source `/opt/povlex/releases/20260911-tr04`; active Compose folder unchanged.
Turkish titles for all 199 active controls, section names and severity labels
are now localized by stable control ID. Raw evidence and legacy report prose
are not claimed fully translated. No analysis/scoring/schema change.
QA 39/39 passed (`launch-readiness-2026-09-11T19-49-47-818Z.json`), plus explicit
catalog translation coverage test. Hosted Turkish headings, severities, sections,
mobile and apex/www password/payment gates passed. Rollback override:
`pilot-images.before-tr04.yml`; restore as `pilot-images.yml`, recreate only app.

## Current category-first UI — 11 September 2026, 19:40 UTC

Active app `povlex-app:20260911-ux03`; worker remains `povlex-worker:20260911-seo07`.
Source `/opt/povlex/releases/20260911-ux03`; active Compose folder unchanged.
Completed audit settings collapse; summary is followed immediately by compact
category navigation, category-specific priorities and findings. Measurement
details move below findings. Scoring, billing, AI and database schema unchanged.
QA 39/39 passed: `launch-readiness-2026-09-11T19-35-51-881Z.json`.
Hosted authenticated browser verified category order, closed settings, evidence
and mobile layout. Apex/www password and payment gates passed.
Rollback override `pilot-images.before-ux03.yml`; restore it as `pilot-images.yml`
and recreate only app with the existing Compose command. Prior sections are history.

## Current results UX release — 11 September 2026, 18:59 UTC

Active app: `povlex-app:20260911-ux02`. Worker remains `povlex-worker:20260911-seo07`.
Source `/opt/povlex/releases/20260911-ux02`; active Compose directory unchanged.
Adds assessment summary, up to three priority actions with links to evidence,
collapsed finding details and collapsed score methodology on the audit page.
Removes the duplicate right-hand issue column. No scoring/schema changes.
Hosted authenticated browser passed summary, priorities, evidence disclosure,
priority navigation and mobile checks. Apex/www password and billing gates passed.
Rollback override: `pilot-images.before-ux02.yml`, recreate only app using the
same Compose command documented below. Prior release sections are historical.

## Current UI correction — 11 September 2026, 18:07 UTC

Active app image is now `povlex-app:20260911-review01`; worker remains
`povlex-worker:20260911-seo07`, measurement contract 0.7.0 unchanged.
Source: `/opt/povlex/releases/20260911-review01`. Active Compose directory is
still `/opt/povlex/releases/20260911-candidate`. The checklist now renders stored
diagnostic notes with evidence, without treating them as scored pass/fail results.
Five category cards expose finding counts; opening an audit starts in Technical SEO.
Local QA 39/39 passed, including a diagnostic visibility regression and mobile check.
Hosted authenticated browser verified cloud-persisted diagnostic evidence, five cards
and mobile layout. Both domain password gates and billing blocks passed.
Report: `launch-readiness-reports/launch-readiness-2026-09-11T17-59-54-537Z.json`.
Rollback this UI-only change with `pilot-images.before-review01.yml`, then
`docker compose -p povlex -f docker-compose.yml -f pilot-images.yml up -d --no-build --no-deps app`
under sudo. No database schema change. Earlier release details below are historical.

## Current verified release — 11 September 2026, 17:08 UTC

Password-protected pilot at https://povlex.com, measurement contract `0.7.0`.
Active images: `povlex-app:20260911-seo07` and `povlex-worker:20260911-seo07`.
Compose project `povlex` still runs from `/opt/povlex/releases/20260911-candidate`
using `docker-compose.yml` and `pilot-images.yml`; source for the new images is
under `/opt/povlex/releases/20260911-seo07`. Keep the active Compose directory:
its database, Caddy configuration, secrets, report mounts and backup paths remain in use.

Absent/wrong site passwords return 401 on apex and www; the existing valid
password returns 200. Billing and Stripe webhook routes return 403. Paid AI is
disabled and its key is absent from the active configuration. Site credentials
remain outside the repository.

Verification: local QA 39/39, Linux image builds, Linux measurement calibration
and Chromium tests, database-enabled pilot preflight (10/10 migrations), hosted
signup/login, audit persistence, organization isolation and an example.com job
with contract 0.7.0 and five rendered viewport runs all passed. No schema change.
Fresh backup `backups/povlex-before-seo07.sql` was restored into the separate
`povlex_restore_seo07` database: migration/user/audit/job counts matched the source.
See `POVLEX-PILOT-YAYIN-20260911.md` for evidence and limitations.

Rollback from the active Compose directory, using pinned SSH:

```sh
cp pilot-images.before-seo07.yml pilot-images.yml
sudo -n docker compose -p povlex -f docker-compose.yml -f pilot-images.yml up -d --no-build --no-deps app worker
```

This image rollback needs no database restore because the schema is unchanged.
The historical public-test instructions below are NOT the active configuration.
Do not remove the site password without owner authorization.

## Historical public free test release (superseded)

The owner explicitly approved ordinary public domain access without the extra
site password. `povlex.com` now points to `51.254.209.34`; valid Let's Encrypt
certificates cover the apex and www, with www redirected to the apex.
Use `AUDITPRO_DEPLOYMENT_MODE=public-test`, `Caddyfile.test`, and Compose override
`test-images.yml` with project `povlex`. Free signup is enabled; Stripe/billing
credentials and paid AI remain absent/disabled. The edge blocks payment routes403
and serves `X-Robots-Tag: noindex, nofollow, noarchive` during testing.
App, database and worker remain on the private Docker network; only Caddy exposes
80/443. Public HTTPS signup/signin, audit persistence, organization isolation and
a completed example.com analysis passed. The browser showed the normal login UI.
DNS resolver caches may temporarily retain the previous GoDaddy parking address.

## Optional password-protected pilot

Use `AUDITPRO_DEPLOYMENT_MODE=pilot` with `Caddyfile.pilot` and server-side
`PILOT_AUTH_USER`/bcrypt `PILOT_AUTH_HASH`. The pilot preflight allows signup
only in this mode and requires billing secrets, Stripe prices and AI credentials
to be empty, with paid AI disabled. Validate the actual reverse-proxy gate as well
as the environment checks: anonymous requests must return401 and billing routes
must return403 even with the site password. App and database ports remain private.

The earlier private pilot used `pilot-images.yml` alongside `docker-compose.yml`,
project name `povlex`, under `/opt/povlex/releases/20260911-candidate`.
That earlier public test release used `test-images.yml`; it is no longer active.
Real signup/sign-in, audit persistence, organization isolation and a completed
example.com worker analysis passed behind the internal pilot gate.
Test access credentials are stored outside the source directory and must never
be committed, included in image build contexts or pasted into deployment reports.

`povlex-backup.timer` runs daily at22:45 UTC with up to120 seconds jitter;
it retains automatic SQL backups for at least7 days. The service was executed
successfully. On each future release, update the backup directory in
`/usr/local/sbin/povlex-backup`. Automated encrypted off-server copies are still
required before storing real customer data; the initial empty-schema backup
already has a verified local copy.

Povlex was previously named AuditPro. Existing `AUDITPRO_*` environment variables,
database names, storage keys, and API identifiers retain their names for compatibility.
The container uses Node.js 24 on Debian Bookworm and installs matching Playwright
Chromium binaries and system libraries for both app and worker. Verify rendered
measurements inside the Linux image, not only on the development computer.

Deployment target confirmed on 11 September 2026: OVH VPS
`vps-6e820afc.vps.ovh.net`, IPv4 `51.254.209.34`, Ubuntu 24.04.4 LTS,
2 vCores, 4 GB RAM, 40 GB disk. The confirmed domain is `povlex.com`,
registered at GoDaddy. Premium VPS backup is enabled, but a successful backup and
restore drill must still be verified. Do not enable public signup, live Stripe
payments, or paid AI calls without the owner's launch approval and passing tests.

This runbook is for operators preparing AuditPro for a customer-facing production launch.

## 1. Production Inputs

Collect these values before starting:

- `APP_DOMAIN`: public domain, for example `audit.example.com`
- `POSTGRES_PASSWORD`: strong database password used by Docker Compose
- `BETTER_AUTH_SECRET`: at least 32 random characters
- `AUDITPRO_ADMIN_SECRET`: long random secret for `/admin`
- `AUDITPRO_BILLING_SYNC_SECRET`: long random secret for billing sync calls
- `STRIPE_WEBHOOK_SECRET`: must start with `whsec_`
- `AUDITPRO_STRIPE_PRO_PRICE_ID`
- `AUDITPRO_STRIPE_AGENCY_PRICE_ID`
- `AUDITPRO_STRIPE_ENTERPRISE_PRICE_ID`
- `AI_GATEWAY_API_KEY` or Vercel OIDC configuration, only if AI Visibility is enabled

Generate secrets with:

```bash
openssl rand -base64 32
```

Never commit `.env`, `.env.local`, real Stripe IDs, database passwords, AI credentials, or local E2E bypass flags.

## 2. Environment File

Create a production `.env` on the server. Start from `.env.example`, then replace every placeholder.

Production defaults should include:

```env
APP_DOMAIN=audit.example.com
APP_URL=https://audit.example.com
BETTER_AUTH_URL=https://audit.example.com
AUDITPRO_DEFAULT_PLAN=free
AUDITPRO_SIGNUP_ENABLED=false
AUDITPRO_INLINE_ANALYSIS_JOBS=false
AUDITPRO_ALLOW_SEED=false
AUDITPRO_ALLOW_PRODUCTION_SEED=false
AUDITPRO_ALLOW_REMOTE_SEED=false
AUDITPRO_E2E_CLOUD_MOCK=false
AUDITPRO_E2E_CLOUD_MOCK_TOKEN=
AUDITPRO_REQUIRE_PDF_RENDER=true
AUDITPRO_PREFLIGHT_CHECK_DB=false
AUDITPRO_LAUNCH_READINESS_MAX_AGE_MS=86400000
AUDITPRO_BACKUP_MAX_AGE_MS=86400000
AUDITPRO_LOG_LEVEL=info
AUDITPRO_TRUSTED_PROXY_HOPS=1
AUDITPRO_AI_INPUT_EUR_PER_1K=0.002
AUDITPRO_AI_OUTPUT_EUR_PER_1K=0.006
AUDITPRO_AI_SEARCH_EUR_PER_CALL=0.007
AUDITPRO_EUR_PER_USD=1
AUDITPRO_AI_WEB_SEARCH_MODE=always
AUDITPRO_CRUX_API_KEY=
AUDITPRO_AI_OPENAI_MODEL=openai/gpt-5.6-luna
AUDITPRO_AI_GEMINI_MODEL=google/gemini-3.5-flash-lite
AUDITPRO_AI_PERPLEXITY_MODEL=perplexity/sonar
```

`APP_DOMAIN` is the hostname only, without `https://` or a path. It must match the hostname in `APP_URL` and `BETTER_AUTH_URL`. `POSTGRES_PASSWORD` must be set because Docker Compose uses it to create the PostgreSQL user and to build the internal service connection string.
Keep `AUDITPRO_E2E_CLOUD_MOCK=false` and `AUDITPRO_E2E_CLOUD_MOCK_TOKEN` empty in every production environment; they are only for local launch-gate browser tests.

Use `AUDITPRO_PREFLIGHT_CHECK_DB=true` only when the database is reachable and you want preflight to verify connectivity and applied migrations.
Set `AUDITPRO_REQUIRE_PDF_RENDER=true` in CI and hosting verification after installing Poppler so exported PDFs must raster-render before launch.
`AUDITPRO_LAUNCH_READINESS_MAX_AGE_MS` controls when `/admin` warns that the latest launch readiness report is stale.
`AUDITPRO_BACKUP_MAX_AGE_MS` controls when `/admin` warns that the latest local database backup is stale.
`AUDITPRO_TRUSTED_PROXY_HOPS` tells rate limiting how many reverse-proxy hops append to `X-Forwarded-For`; only those rightmost entries are trusted, so a client cannot rotate a spoofed prefix to reset its rate-limit bucket. Set it to your actual proxy chain depth (default `1`; `0` when no proxy adds the header).
Preflight validates `AUDITPRO_DEFAULT_PLAN`, `AUDITPRO_SIGNUP_ENABLED`, AI model IDs when AI Visibility is enabled, and positive AI input/output EUR rates so the cost ledger cannot launch with malformed pricing. Every AI usage event is stamped with `price_version` and `cost_basis` (`price-table`, `fallback-rate`, or `unknown`); unknown spend is never recorded as zero cost. `AUDITPRO_AI_SEARCH_EUR_PER_CALL` prices web-search calls (default derived from the verified USD 0.007 Exa-auto rate at `AUDITPRO_EUR_PER_USD` parity; set the rate to match your billing). The provider-reported charge (`usage.cost`, USD credits) is stored as `provider_cost_usd` for reconciliation and is never merged into the EUR estimate. `AUDITPRO_AI_WEB_SEARCH_MODE` controls the paid web-search tool: `pilot-only` keeps it inside the password-protected pilot, `always` lets production AI Visibility scans search the web (each search is billed at `AUDITPRO_AI_SEARCH_EUR_PER_CALL` and every result card labels the mode), `never` disables it entirely. Production web search was enabled on 2026-09-23 (`AUDITPRO_AI_WEB_SEARCH_MODE=always`) as an explicit budget decision backed by the cost ledger and the recalculated plan quotas. The AI-visibility publication threshold (30 fixed discovery prompts per engine across 2 separate runs) is enforced in code; the paid comparative runs are executed manually via `scripts/ai-visibility-comparative.ts` with `AUDITPRO_AI_COMPARATIVE_APPROVED=yes`. Field Core Web Vitals (t15/t16/t17) come from the Chrome UX Report when `AUDITPRO_CRUX_API_KEY` is set (origin-level p75, 28-day window, official thresholds); without the key the field claim stays unmeasured and lab values remain observations.

## 3. Preflight

Run the offline configuration check first:

```bash
npm run preflight
```

Expected result before production deploy: `AuditPro preflight: OK`.

If the database is already reachable, run:

```bash
AUDITPRO_PREFLIGHT_CHECK_DB=true npm run preflight
```

With the default Docker Compose topology, PostgreSQL is not published to the host. For the DB-connected preflight, run inside the Compose network after the database is healthy:

```bash
docker compose --env-file .env run --rm -e AUDITPRO_PREFLIGHT_CHECK_DB=true migrator ./node_modules/.bin/tsx scripts/preflight.ts
```

The `migrator` service uses `env_file: .env`, so this command receives the same production env values that preflight validates while still connecting to PostgreSQL through the Compose network.

Preflight must not print secret values. It reports missing, placeholder, malformed, or too-short values without echoing credentials.

## 4. Build And Tests

Run these checks before building the Docker image:

```bash
npm run test:launch-readiness
npm run launch:readiness
```

The launch readiness command runs the local release gate in a fixed order and ends with `npm run build`, `npm run test:admin-health-flow`, `npm run test:cloud-role-flow`, `npm run test:app-flow`, and `npm run test:smoke`.
Each run writes a JSON report under `launch-readiness-reports/` with per-step durations and exit codes. Set `AUDITPRO_LAUNCH_READINESS_REPORT_DIR` if CI should collect these reports from a different artifact directory.
When Poppler is installed, set `AUDITPRO_REQUIRE_PDF_RENDER=true` before `npm run launch:readiness` so `test:app-flow` fails if `pdftoppm` cannot render the first page of exported PDFs.

If you need to run the checks individually:

```bash
npm run test:preflight
npm run test:migrations
npm run test:healthz
npm run test:docker-health
npm run test:admin-health
npm run test:admin-health-ui
npm run test:billing
npm run test:billing-sync
npm run test:billing-route
npm run test:stripe-webhook
npm run test:stripe-route
npm run test:security-rate-limit
npm run test:analysis-rate-limit
npm run test:security-headers
npm run test:csp-report
npm run test:operation-log
npm run test:operation-routes
npm run test:public-url
npm run test:analysis-route
npm run test:online-score
npm run test:access-policy
npm run test:pilot-ai-policy
npm run test:site-api-matrix
npm run test:analysis-job-route
npm run test:audit-route
npm run test:audit-authorization
npm run test:worker
npm run test:worker-operations
npm run test:backup-runbook
npm run test:backup-behavior
npm run test:seed-guard
npm run test:ai-visibility
npm run test:geo-positioning
npm run test:geo-publication-gate
npm run test:deployment-docs
npm run test:measurement-calibration
npm run test:rendered
npm run build
npm run test:runtime-security-headers
npm run test:admin-health-flow
npm run test:cloud-role-flow
npm run test:app-flow
npm run test:smoke
```

Optional PostgreSQL integration test, using a disposable database:

```bash
AUDITPRO_INTEGRATION_DATABASE_URL=postgresql://user:password@localhost:5432/auditpro_test npm run test:integration:postgres
```

For a remote disposable integration database, also set:

```bash
AUDITPRO_ALLOW_REMOTE_INTEGRATION_DB=true
```

Do not point `AUDITPRO_INTEGRATION_DATABASE_URL` at the production database.

## 5. Deploy With Docker Compose

On the server:

```bash
docker compose build
docker compose up -d database
docker compose up migrator
docker compose up -d app worker caddy
docker compose ps
```

Expected startup order:

1. `database` becomes healthy.
2. `migrator` completes successfully.
3. `app` and `worker` start.
4. `app` becomes healthy through `/api/healthz`.
5. `caddy` starts after `app` is healthy.

The app container healthcheck uses:

```text
/api/healthz
```

This endpoint is public and intentionally minimal. It must not expose database hostnames, env status, migration versions, worker counts, Stripe state, or secret values.

Do not publish the app container's `3000` port directly to the internet. Keep public traffic behind Caddy so client IP forwarding, TLS, and response headers stay under the expected deployment boundary.

The Next.js app sends an enforced `Content-Security-Policy` header with violation reporting to `/api/security/csp-report`; keep `npm run test:security-headers` and `npm run test:csp-report` green before deploy.

The app service mounts `./launch-readiness-reports` and `./backups` read-only at `/app/launch-readiness-reports` and `/app/backups`, so `/admin` can verify the latest launch gate report and database backup without exposing file paths.

## 5.1. Operation Logs

AuditPro writes structured JSON operation logs to stdout/stderr with `type: "auditpro.operation"` and `x-auditpro-request-id` correlation IDs on critical API responses.

Use:

```env
AUDITPRO_LOG_LEVEL=info
```

Valid levels are `debug`, `info`, `warn`, `error`, and `off`. Keep production at `info` unless investigating a short-lived issue. Logs must not include request bodies, authorization headers, cookies, Stripe signatures, raw customer email addresses, or raw audited URLs.

## 6. Post-Deploy Smoke

Check the public health endpoint:

```bash
curl -fsS https://$APP_DOMAIN/api/healthz
```

Expected shape:

```json
{"status":"ok","checkedAt":"..."}
```

Check the admin panel:

```text
https://APP_DOMAIN/admin
```

Enter `AUDITPRO_ADMIN_SECRET`, then confirm:

- Database check is healthy
- Migration count is current
- Worker has no stale running jobs
- Stripe webhook and price mapping are configured
- AI gateway is configured when AI Visibility is enabled
- Latest launch readiness is visible and passed, or the artifact directory is mounted through `AUDITPRO_LAUNCH_READINESS_REPORT_DIR`
- Latest database backup is visible and fresh
- Usage ledger values render without errors

Run a customer smoke flow:

1. Open `https://APP_DOMAIN`.
2. Create or load a demo audit.
3. Run a small public URL audit.
4. Confirm report, proposal, presentation, settings, and QA views open.
5. Export CSV, Markdown, PDF, and JSON backup.
6. Confirm local/private URL rejection still works.

## 7. Stripe Setup

Configure Stripe webhook delivery to:

```text
https://APP_DOMAIN/api/webhooks/stripe
```

Required event families:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `checkout.session.completed`

After Stripe sends a test event:

- `/api/webhooks/stripe` should return `200`
- `/admin` should show Stripe webhook configured
- Subscription events should update organization access by provider event timestamp
- Duplicate events should not create duplicate billing events

## 8. Worker Operations

The production worker service runs:

```bash
npm run worker:analysis
```

Operational expectations:

- `AUDITPRO_INLINE_ANALYSIS_JOBS=false` in production
- `DATABASE_POOL_SIZE`, `AUDITPRO_DEFAULT_PLAN`, `AUDITPRO_STALE_JOB_MS`, and `AUDITPRO_WORKER_POLL_MS` are passed to both app and worker containers
- App writes jobs to PostgreSQL
- Worker claims queued jobs with `FOR UPDATE SKIP LOCKED`
- Stale running jobs can be reclaimed after `AUDITPRO_STALE_JOB_MS`
- `/admin` reports stale running jobs as a warning
- Analysis job creation reserves requested pages against the monthly allowance; the worker reconciles unused pages after completion and refunds the reservation after failure.

Worker shutdown is graceful: on `SIGTERM` or `SIGINT`, the worker stops claiming new jobs, lets the current `runAnalysisWorkerOnce` call finish, logs `analysis.worker.shutdown_requested`, and exits. Docker Compose gives the worker `stop_grace_period: 35m` to cover the default stale-job window; if the process is killed before finishing, stale running jobs are reclaimed only after their updated_at heartbeat is older than `AUDITPRO_STALE_JOB_MS`.

If jobs stop moving:

1. Check `docker compose logs worker`.
2. Check `/admin` worker section.
3. Confirm `DATABASE_URL` is identical for `app`, `worker`, and `migrator`.
4. Restart the worker:

```bash
docker compose restart worker
```

## 9. AI Visibility Operations

AI Visibility is billable. Keep it disabled until credentials and package limits are ready:

```env
AUDITPRO_AI_VISIBILITY_ENABLED=false
```

When enabling:

- Configure `AI_GATEWAY_API_KEY` or Vercel OIDC
- Confirm AI model IDs
- Confirm input and output EUR cost rates
- Confirm `/admin` shows AI gateway ready
- Run one controlled AI Visibility scan
- Confirm prompt credits, response credits, and estimated cost are recorded

## 10. Backup And Restore

Create a database backup before every production deploy and before enabling billing or AI Visibility changes:

```bash
npm run db:backup
```

The backup command uses Docker Compose to run `pg_dump` inside the `database` service and writes a timestamped SQL file under `backups/`.

Optional backup settings:

```env
AUDITPRO_BACKUP_DIR=backups
AUDITPRO_DB_SERVICE=database
AUDITPRO_DB_NAME=auditpro
AUDITPRO_DB_USER=auditpro
```

Store production backups outside the app server as soon as they are created. Do not commit backup files or launch readiness reports, and do not include them in Docker build contexts.

Restore is intentionally manual because it can overwrite production data. Never test a restore from the production Compose project. Create a disposable staging Compose project with its own env file and volume, then restore there first from a Linux shell on the server:

```bash
docker compose --project-name auditpro-restore-drill --env-file .env.staging up -d database
cat backups/auditpro-YYYY-MM-DD.sql | docker compose --project-name auditpro-restore-drill --env-file .env.staging exec -T database psql -U auditpro -d auditpro -v ON_ERROR_STOP=1 --single-transaction
```

Only after a staging restore has been verified should a production restore be considered. Before a production restore, record the Stripe event position, temporarily disable Stripe webhook delivery, stop `app` and `worker`, keep the database service running, restore the dump with `-v ON_ERROR_STOP=1 --single-transaction`, run preflight, start `app` and `worker`, replay missed Stripe events, and reconcile billing/customer state before re-enabling normal operations.

Do not restore a backup over production while Stripe webhooks or workers are actively writing.

## 11. Rollback

For a bad app release:

```bash
docker compose logs app
docker compose logs worker
docker compose up -d app worker caddy
```

If you have a previously tagged image, redeploy that image and keep the database running.

Do not roll back migrations by deleting tables or editing applied migration files. Create a new forward migration for schema fixes.

If Stripe webhook processing is failing:

1. Disable webhook delivery retries only if duplicate pressure is high.
2. Fix the app.
3. Re-enable webhook delivery.
4. Replay missed events from Stripe.

## 12. Launch Gate

Do not put a customer on production until all are true:

- `npm run preflight` returns OK with production env
- A fresh `npm run db:backup` backup exists and has been copied off the app server
- DB-connected preflight returns OK inside the Compose network:
  `docker compose --env-file .env run --rm -e AUDITPRO_PREFLIGHT_CHECK_DB=true migrator ./node_modules/.bin/tsx scripts/preflight.ts`
- `docker compose ps` shows healthy app and running worker
- `https://APP_DOMAIN/api/healthz` returns `status: ok`
- Public hostname responses include enforced `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, and `X-Content-Type-Options` headers
- `/admin` has no error checks
- Stripe webhook test event succeeds
- A small public audit completes
- Export CSV, Markdown, PDF, and JSON backup work
- AI Visibility is either disabled or verified with cost ledger entries
- Rollback image or recovery path is known

Before deploying measurement contract 0.4.0, run npm run test:measurement-calibration and npm run launch:readiness. The latter includes HTML calibration and browser fixtures. Old evidence requires a fresh analysis; uncalibrated controls are diagnostic only. Score gates remain unchanged, so no overall grade is expected without sufficient validated evidence.

