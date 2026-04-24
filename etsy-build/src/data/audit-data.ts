export type Priority = 'Critical' | 'High' | 'Medium' | 'Low'
export type Status   = 'Pass' | 'Partial' | 'Fail' | 'N/A' | null

export interface AuditItem {
  id:       string
  num:      number
  item:     string
  howTo:    string
  priority: Priority
  lite?:    boolean
}

export interface AuditSection {
  id:    string
  label: string
  items: AuditItem[]
}

export interface AuditCategory {
  id:       string
  label:    string
  icon:     string
  color:    string
  sections: AuditSection[]
}

// ─── TECHNICAL SEO (65 items) ─────────────────────────────────────────────────
const technicalSEO: AuditCategory = {
  id: 'technical', label: 'Technical SEO', icon: '⚙️', color: '#0EA5E9',
  sections: [
    {
      id: 'crawl', label: 'Crawlability & Indexation (Items 1–14)',
      items: [
        { id:'t1',  num:1,  item:'robots.txt file exists & is correct',             howTo:'Visit /robots.txt — ensure it exists and does not block important pages.',                                   priority:'Critical' },
        { id:'t2',  num:2,  item:'XML sitemap exists & is submitted to GSC',        howTo:'Check /sitemap.xml — submitted in Google Search Console.',                                                   priority:'Critical' },
        { id:'t3',  num:3,  item:'Sitemap is up-to-date (< 30 days)',               howTo:'Check lastmod dates in sitemap. Regenerate if stale.',                                                        priority:'High'     },
        { id:'t4',  num:4,  item:'No important pages are noindex',                  howTo:'GSC → Coverage → Excluded. Check meta robots tags on key pages.',                                             priority:'Critical' },
        { id:'t5',  num:5,  item:'Canonical tags correctly implemented',             howTo:'Check self-referencing canonicals. No conflicting or missing canonicals.',                                   priority:'Critical' },
        { id:'t6',  num:6,  item:'No orphan pages (0 internal links)',               howTo:'Screaming Frog → filter pages with 0 inlinks.',                                                              priority:'High'     },
        { id:'t7',  num:7,  item:'Crawl depth ≤ 3 clicks from homepage',            howTo:'Screaming Frog crawl depth report. Key pages ≤ 3.',                                                         priority:'High'     },
        { id:'t8',  num:8,  item:'Pagination handled correctly',                     howTo:'Check rel="prev/next" or canonical approach for paginated content.',                                         priority:'Medium'   },
        { id:'t9',  num:9,  item:'No redirect chains (max 1 hop)',                  howTo:'Screaming Frog → 3xx. Chains waste crawl budget.',                                                           priority:'High'     },
        { id:'t10', num:10, item:'No broken internal links (404s)',                  howTo:'Screaming Frog → 4xx. Every broken link hurts crawlability.',                                               priority:'Critical', lite: true },
        { id:'t11', num:11, item:'International / hreflang tags correct',            howTo:'Check hreflang for correct lang codes and self-referencing.',                                                priority:'Medium'   },
        { id:'t12', num:12, item:'GSC shows no crawl anomalies',                     howTo:'GSC → Coverage → check Errors and Valid with warnings.',                                                     priority:'Critical' },
        { id:'t13', num:13, item:'JavaScript not blocking key content',              howTo:"Google's URL Inspection → 'View Crawled Page' — is content visible?",                                       priority:'High'     },
        { id:'t14', num:14, item:'URL structure is clean and descriptive',           howTo:'No query strings, IDs, or stop words in URLs for key pages.',                                               priority:'Medium'   },
      ]
    },
    {
      id: 'cwv', label: 'Core Web Vitals (Items 15–26)',
      items: [
        { id:'t15', num:15, item:'LCP ≤ 2.5s (Largest Contentful Paint)',           howTo:'PageSpeed Insights or GSC Core Web Vitals report.',                                                          priority:'Critical', lite: true },
        { id:'t16', num:16, item:'FID / INP ≤ 200ms (Interaction to Next Paint)',   howTo:'CrUX data in GSC. Lab: Lighthouse INP score.',                                                              priority:'Critical' },
        { id:'t17', num:17, item:'CLS ≤ 0.1 (Cumulative Layout Shift)',             howTo:'PageSpeed Insights. Look for images without dimensions, late-loading fonts.',                               priority:'Critical' },
        { id:'t18', num:18, item:'Mobile PageSpeed score ≥ 70',                     howTo:'PageSpeed Insights → Mobile tab.',                                                                           priority:'Critical' },
        { id:'t19', num:19, item:'Desktop PageSpeed score ≥ 85',                    howTo:'PageSpeed Insights → Desktop tab.',                                                                          priority:'High'     },
        { id:'t20', num:20, item:'Images use WebP / AVIF format',                   howTo:'Check Network tab → filter images. PNG/JPG served = opportunity.',                                          priority:'High'     },
        { id:'t21', num:21, item:'Images have width & height attributes',            howTo:'Prevents CLS. Audit with Lighthouse.',                                                                       priority:'High'     },
        { id:'t22', num:22, item:'Lazy loading on below-fold images',                howTo:'Check loading="lazy" attribute on img tags below fold.',                                                     priority:'Medium'   },
        { id:'t23', num:23, item:'Render-blocking JS/CSS minimized',                 howTo:'Lighthouse → Eliminate render-blocking resources.',                                                          priority:'High'     },
        { id:'t24', num:24, item:'TTFB < 800ms (Time to First Byte)',               howTo:'Chrome DevTools Network tab → first document request.',                                                      priority:'High'     },
        { id:'t25', num:25, item:'Font loading optimized (font-display: swap)',      howTo:'Check CSS @font-face rules and font loading strategy.',                                                     priority:'Medium'   },
        { id:'t26', num:26, item:'Third-party scripts deferred or async',            howTo:'Audit script tags — analytics, chat, ads. Use async/defer.',                                               priority:'Medium'   },
      ]
    },
    {
      id: 'https', label: 'HTTPS & Security (Items 27–34)',
      items: [
        { id:'t27', num:27, item:'SSL certificate valid and not expiring soon',      howTo:'Check SSL Labs or browser padlock. Expiry > 30 days.',                                                      priority:'Critical' },
        { id:'t28', num:28, item:'All pages served over HTTPS',                     howTo:'No HTTP pages. Check for mixed content warnings in console.',                                                priority:'Critical', lite: true },
        { id:'t29', num:29, item:'HTTP → HTTPS redirect in place',                  howTo:'Visit http://yourdomain.com — should 301 redirect to HTTPS.',                                              priority:'Critical' },
        { id:'t30', num:30, item:'www / non-www canonicalized',                     howTo:'Both versions resolve to one canonical version.',                                                            priority:'High'     },
        { id:'t31', num:31, item:'HSTS header present',                             howTo:'Check response headers: Strict-Transport-Security.',                                                        priority:'Medium'   },
        { id:'t32', num:32, item:'No mixed content (HTTP resources on HTTPS pages)', howTo:'Browser console → check for mixed content warnings.',                                                      priority:'High'     },
        { id:'t33', num:33, item:'Security headers present (CSP, X-Frame-Options)', howTo:'securityheaders.com — check for missing headers.',                                                         priority:'Medium'   },
        { id:'t34', num:34, item:'No sensitive data exposed in source or URLs',     howTo:'Check page source and URL parameters for API keys, tokens.',                                               priority:'High'     },
      ]
    },
    {
      id: 'schema', label: 'Structured Data / Schema (Items 35–43)',
      items: [
        { id:'t35', num:35, item:'Organization schema implemented',                  howTo:'Google Rich Results Test. schema.org/Organization on homepage.',                                            priority:'High',    lite: true },
        { id:'t36', num:36, item:'WebSite schema with SearchAction',                 howTo:'Enables sitelinks searchbox in Google SERPs.',                                                             priority:'Medium'   },
        { id:'t37', num:37, item:'BreadcrumbList schema on inner pages',             howTo:'Rich Results Test on category/product pages.',                                                              priority:'Medium'   },
        { id:'t38', num:38, item:'Product schema on product pages',                  howTo:'Check price, availability, reviews in schema. Rich Results Test.',                                         priority:'Critical' },
        { id:'t39', num:39, item:'Article/BlogPosting schema on blog posts',         howTo:'Check datePublished, author, headline fields.',                                                            priority:'High'     },
        { id:'t40', num:40, item:'FAQ schema on FAQ pages',                          howTo:'Rich Results Test — enables FAQ rich results in SERPs.',                                                   priority:'Medium'   },
        { id:'t41', num:41, item:'Review/Rating schema correct',                     howTo:'Ensure aggregate rating is genuine. No review gating.',                                                    priority:'High'     },
        { id:'t42', num:42, item:'No schema markup errors in GSC',                   howTo:'GSC → Enhancements — check for errors in all schema types.',                                              priority:'High'     },
        { id:'t43', num:43, item:'LocalBusiness schema if applicable',               howTo:'Name, address, phone, opening hours. Google Business profile aligned.',                                   priority:'Medium'   },
      ]
    },
    {
      id: 'mobile', label: 'Mobile & Technical UX (Items 44–52)',
      items: [
        { id:'t44', num:44, item:'Mobile-first indexing compatible',                 howTo:'GSC → Settings → confirm mobile-first indexing active.',                                                   priority:'Critical' },
        { id:'t45', num:45, item:'Viewport meta tag correct',                        howTo:'<meta name="viewport" content="width=device-width, initial-scale=1">',                                    priority:'Critical' },
        { id:'t46', num:46, item:'No horizontal scroll on mobile',                   howTo:'Test on real device or Chrome DevTools mobile view.',                                                      priority:'High'     },
        { id:'t47', num:47, item:'Touch targets ≥ 48px (Google standard)',           howTo:'Lighthouse accessibility — tap target size check.',                                                        priority:'High'     },
        { id:'t48', num:48, item:'No intrusive interstitials on mobile',             howTo:'No full-screen pop-ups on page load on mobile.',                                                           priority:'High'     },
        { id:'t49', num:49, item:'AMP implemented if news/article site',             howTo:'Check for <link rel="amphtml"> on articles if relevant.',                                                  priority:'Low'      },
        { id:'t50', num:50, item:'404 page is helpful and links back to site',       howTo:'Visit /nonexistent-page. Should have nav and search.',                                                     priority:'Medium'   },
        { id:'t51', num:51, item:'Thin content pages handled (noindex or improved)', howTo:'Pages < 300 words with no clear purpose — noindex or improve.',                                           priority:'High'     },
        { id:'t52', num:52, item:'Duplicate content managed via canonicals',         howTo:'No identical or near-identical pages competing for same keywords.',                                        priority:'Critical' },
      ]
    },
    {
      id: 'intl', label: 'International & Advanced (Items 53–65)',
      items: [
        { id:'t53', num:53, item:'Site language correctly declared in HTML tag',     howTo:'<html lang="en"> — correct ISO language code.',                                                            priority:'Medium'   },
        { id:'t54', num:54, item:'International targeting configured in GSC',        howTo:'GSC → Legacy tools → International targeting → Country tab.',                                             priority:'Medium'   },
        { id:'t55', num:55, item:'CDN in use for static assets',                    howTo:'Check response headers — X-CDN or served from CDN domain.',                                               priority:'Medium'   },
        { id:'t56', num:56, item:'Server response codes correct for all pages',     howTo:'No 200s for deleted content, no soft 404s.',                                                               priority:'High'     },
        { id:'t57', num:57, item:'Log file analysis shows no crawl waste',          howTo:'Server logs — bots crawling low-value pages = crawl budget waste.',                                        priority:'Medium'   },
        { id:'t58', num:58, item:'Internal search result pages blocked from index', howTo:'robots.txt or noindex on /search?q= pages.',                                                               priority:'High'     },
        { id:'t59', num:59, item:'Faceted navigation handled correctly',            howTo:'Parameters like ?color=red — canonicalized or crawl-blocked.',                                             priority:'High'     },
        { id:'t60', num:60, item:'Print CSS pages not indexed',                     howTo:'No ?print=1 or print-specific URLs indexed.',                                                              priority:'Low'      },
        { id:'t61', num:61, item:'Session IDs or tracking params not indexed',      howTo:'No ?sessionid= or UTM params in index.',                                                                   priority:'High'     },
        { id:'t62', num:62, item:'Breadcrumb navigation present',                   howTo:'Aids crawlability and user orientation. Schema aligned.',                                                  priority:'Medium'   },
        { id:'t63', num:63, item:'XML sitemap excludes noindex and redirect URLs',  howTo:'Sitemap should only contain canonical, indexable URLs.',                                                   priority:'High'     },
        { id:'t64', num:64, item:'Site speed consistent across all templates',      howTo:'Test homepage, category page, product page — all should pass.',                                            priority:'High'     },
        { id:'t65', num:65, item:'No AI-generated content penalties (GSC traffic)', howTo:'Check GSC for sudden ranking drops correlated with AI content.',                                           priority:'Medium'   },
      ]
    },
  ]
}

// ─── ON-PAGE & CONTENT (50 items) ────────────────────────────────────────────
const onPage: AuditCategory = {
  id: 'onpage', label: 'On-Page & Content', icon: '📝', color: '#8B5CF6',
  sections: [
    {
      id: 'title', label: 'Title Tags & Meta Data (Items 1–9)',
      items: [
        { id:'o1',  num:1,  item:'Title tag exists on every page',                  howTo:'Screaming Frog → Page Titles — filter missing.',                                                           priority:'Critical', lite: true },
        { id:'o2',  num:2,  item:'Title tag length is 50–60 characters',            howTo:'Screaming Frog → Page Titles — check Over 60 and Under 30.',                                              priority:'High'     },
        { id:'o3',  num:3,  item:'Primary keyword appears in title tag (near start)',howTo:'Check title starts with or contains primary keyword.',                                                    priority:'Critical', lite: true },
        { id:'o4',  num:4,  item:'Each page has a unique title tag (no duplicates)', howTo:'Screaming Frog → Page Titles → sort by duplicate.',                                                      priority:'Critical' },
        { id:'o5',  num:5,  item:'Meta description exists on every key page',       howTo:'Screaming Frog → Meta Description — filter missing.',                                                     priority:'High',    lite: true },
        { id:'o6',  num:6,  item:'Meta description includes primary + secondary keyword', howTo:'Check meta descriptions contain target keywords naturally.',                                         priority:'High'     },
        { id:'o7',  num:7,  item:'Meta description has a clear call-to-action',     howTo:'Descriptions should entice click. "Learn more", "Get started", etc.',                                    priority:'Medium'   },
        { id:'o8',  num:8,  item:'No duplicate meta descriptions across pages',     howTo:'Screaming Frog → Meta Description → sort by duplicate.',                                                  priority:'High'     },
        { id:'o9',  num:9,  item:'Open Graph / Twitter Card tags present',          howTo:'Check <meta property="og:title"> etc. Use Facebook Debugger.',                                            priority:'Medium'   },
      ]
    },
    {
      id: 'headings', label: 'Headings & Structure (Items 10–17)',
      items: [
        { id:'o10', num:10, item:'Every page has exactly one H1',                   howTo:'Screaming Frog → H1 → filter missing or multiple.',                                                       priority:'Critical', lite: true },
        { id:'o11', num:11, item:'H1 contains primary keyword',                     howTo:'H1 should match search intent and include target keyword.',                                               priority:'Critical' },
        { id:'o12', num:12, item:'H1 differs from title tag (but aligned)',         howTo:'Title = SERP optimized. H1 = UX optimized. Should not be identical.',                                    priority:'Medium'   },
        { id:'o13', num:13, item:'Heading hierarchy correct (H1→H2→H3)',            howTo:'No skipping from H1 to H3. Logical document outline.',                                                   priority:'High'     },
        { id:'o14', num:14, item:'H2s contain secondary keywords',                  howTo:'H2 headings naturally incorporate related terms.',                                                        priority:'High'     },
        { id:'o15', num:15, item:'Headings are descriptive (not "Section 1")',      howTo:'Each heading tells user and Google what the section is about.',                                           priority:'Medium'   },
        { id:'o16', num:16, item:'FAQ sections use H2/H3 for questions',            howTo:'FAQ schema + heading structure for featured snippet opportunity.',                                        priority:'Medium'   },
        { id:'o17', num:17, item:'No keyword stuffing in headings',                 howTo:'Headings read naturally. No forced repetition of keywords.',                                              priority:'High'     },
      ]
    },
    {
      id: 'keywords', label: 'Keyword Optimization (Items 18–26)',
      items: [
        { id:'o18', num:18, item:'Primary keyword in first 100 words',              howTo:'Check body copy — keyword should appear early.',                                                           priority:'High'     },
        { id:'o19', num:19, item:'Keyword density natural (1–2%, no stuffing)',     howTo:'Use SurferSEO or manual check — not forced, reads naturally.',                                           priority:'High'     },
        { id:'o20', num:20, item:'LSI / semantic keywords used throughout',         howTo:'Related terms appear naturally in copy. Use Google NLP API to check.',                                   priority:'High'     },
        { id:'o21', num:21, item:'No keyword cannibalization',                      howTo:'Multiple pages targeting same keyword — consolidate or differentiate.',                                  priority:'Critical' },
        { id:'o22', num:22, item:'Target keyword in image alt text (where relevant)',howTo:'Not every image — only where contextually appropriate.',                                                 priority:'Medium'   },
        { id:'o23', num:23, item:'Target keyword in URL slug',                      howTo:'URL contains keyword: /best-seo-tools not /page?id=123',                                                 priority:'High'     },
        { id:'o24', num:24, item:'Long-tail keyword variations covered',            howTo:'Check if content covers question variants (who, what, how, best).',                                      priority:'Medium'   },
        { id:'o25', num:25, item:'Featured snippet optimization attempted',         howTo:'Direct answers, tables, lists at top of content for snippet targets.',                                  priority:'Medium'   },
        { id:'o26', num:26, item:'Search intent matched correctly',                 howTo:'Informational / commercial / transactional intent matched by page type.',                               priority:'Critical' },
      ]
    },
    {
      id: 'content', label: 'Content Quality (Items 27–36)',
      items: [
        { id:'o27', num:27, item:'Content length appropriate for query type',       howTo:'Informational: 1000+ words. Product: comprehensive spec + benefits.',                                    priority:'High'     },
        { id:'o28', num:28, item:'Content is original (no duplicate or spun)',      howTo:'Copyscape or manual check. No syndicated content without canonical.',                                    priority:'Critical' },
        { id:'o29', num:29, item:'Content updated regularly (freshness)',           howTo:'Blog/news: posts within 90 days. Evergreen: review dates visible.',                                     priority:'Medium'   },
        { id:'o30', num:30, item:'Thin content pages improved or consolidated',     howTo:'< 300 words with no clear purpose — bulk up or merge.',                                                  priority:'High'     },
        { id:'o31', num:31, item:'Content uses data, stats, or original research',  howTo:'Citing credible sources or original data increases E-E-A-T.',                                           priority:'Medium'   },
        { id:'o32', num:32, item:'Content covers topic comprehensively (topical authority)', howTo:'Compare with top-ranking pages. Are key subtopics covered?',                                   priority:'High'     },
        { id:'o33', num:33, item:'Readability score appropriate for audience',      howTo:'Hemingway App — Grade 7–9 for general audiences.',                                                      priority:'Medium'   },
        { id:'o34', num:34, item:'Images, video, or visual content included',       howTo:'Visual content increases dwell time and reduces bounce rate.',                                           priority:'Medium'   },
        { id:'o35', num:35, item:'Content answers common user questions',           howTo:'Check People Also Ask in SERPs. Cover those questions.',                                                 priority:'High'     },
        { id:'o36', num:36, item:'No AI-generated content without human review',    howTo:'AI content must be reviewed, edited, and add genuine value.',                                            priority:'High'     },
      ]
    },
    {
      id: 'links', label: 'Internal Links (Items 37–44)',
      items: [
        { id:'o37', num:37, item:'Internal linking strategy in place',              howTo:'Key pages receive internal links from relevant content.',                                                 priority:'High'     },
        { id:'o38', num:38, item:'Anchor text is descriptive (not "click here")',   howTo:'Anchor text describes destination page content.',                                                        priority:'High'     },
        { id:'o39', num:39, item:'No broken internal links',                        howTo:'Screaming Frog → Response Codes → 4xx inlinks.',                                                        priority:'Critical' },
        { id:'o40', num:40, item:'Important pages linked from homepage',            howTo:'Top-priority pages should be 1–2 clicks from homepage.',                                                priority:'High'     },
        { id:'o41', num:41, item:'Content links to relevant internal resources',    howTo:'Blog posts link to product/service pages where relevant.',                                              priority:'Medium'   },
        { id:'o42', num:42, item:'No excessive internal links on single page',      howTo:'< 100 links per page guideline. Too many dilutes PageRank.',                                            priority:'Medium'   },
        { id:'o43', num:43, item:'Navigation links consistent across site',         howTo:'Header/footer nav same across all pages.',                                                               priority:'High'     },
        { id:'o44', num:44, item:'External links open in new tab & are relevant',  howTo:'outbound links use target="_blank" rel="noopener". No spammy outbound.',                                priority:'Medium'   },
      ]
    },
    {
      id: 'eeat', label: 'E-E-A-T Signals (Items 45–50)',
      items: [
        { id:'o45', num:45, item:'Author bios present on all blog/article content', howTo:'Name, credentials, photo, social links on each author.',                                                priority:'High'     },
        { id:'o46', num:46, item:'About page is comprehensive and credible',        howTo:'Company history, team, mission, contact details.',                                                      priority:'High'     },
        { id:'o47', num:47, item:'Contact information visible on every page',       howTo:'Footer: address, phone, email. Contact page linked from nav.',                                          priority:'High'     },
        { id:'o48', num:48, item:'Trust signals present (awards, press, clients)',  howTo:'Logos, badges, testimonials on key landing pages.',                                                     priority:'High'     },
        { id:'o49', num:49, item:'Privacy policy and terms of service present',     howTo:'Linked from footer. Required for GDPR compliance.',                                                     priority:'Critical' },
        { id:'o50', num:50, item:'External links point to authoritative sources',   howTo:'Cite .edu, .gov, established industry sources.',                                                        priority:'Medium'   },
      ]
    },
  ]
}

// ─── UX HEURISTICS (40 items) ────────────────────────────────────────────────
const uxHeuristics: AuditCategory = {
  id: 'ux', label: 'UX Heuristics', icon: '🎯', color: '#10B981',
  sections: [
    {
      id: 'nielsen15', label: 'Nielsen Heuristics 1–5 (Items 1–14)',
      items: [
        { id:'u1',  num:1,  item:'H1: System status always visible (loading, progress)', howTo:'Loading spinners, progress bars, success/error states — users must always know what is happening.', priority:'Critical' },
        { id:'u2',  num:2,  item:'H1: Forms show inline validation feedback',       howTo:'Inline validation reduces form abandonment by 22%. Show errors in real time, not just on submit.',      priority:'High'     },
        { id:'u3',  num:3,  item:'H1: Async operations show clear loading state',   howTo:'Any action taking >1 second needs a loading indicator. >3 seconds needs progress feedback.',           priority:'High'     },
        { id:'u4',  num:4,  item:'H2: UI language matches user language (no jargon)', howTo:'No technical jargon, error codes, or developer-speak in UI text. Use user\'s own language.',         priority:'Critical', lite: true },
        { id:'u5',  num:5,  item:'H2: Icons have visible labels (no icon-only nav)', howTo:'Icon-only navigation fails usability testing consistently. Add labels below or beside icons.',        priority:'High'     },
        { id:'u6',  num:6,  item:'H3: Users can undo / go back from any action',    howTo:'Every action should be reversible or confirmable. Irreversible actions need explicit warnings.',       priority:'Critical' },
        { id:'u7',  num:7,  item:'H3: Browser back button works as expected',       howTo:'SPA frameworks often break back button. Test full navigation flow.',                                    priority:'Critical' },
        { id:'u8',  num:8,  item:'H4: UI visually consistent across all pages',     howTo:'Consistent colours, fonts, spacing across every page. Inconsistency erodes trust.',                   priority:'Critical' },
        { id:'u9',  num:9,  item:'H4: Terminology consistent (same words for same things)', howTo:'Button says "Submit" page 1, "Send" page 2, "Go" page 3 = confusing. Pick one term.',         priority:'High'     },
        { id:'u10', num:10, item:'H4: Button styles consistent (primary/secondary/danger)', howTo:'One primary button style, one secondary. Mixing styles confuses action hierarchy.',            priority:'High'     },
        { id:'u11', num:11, item:'H5: Destructive actions require confirmation',    howTo:'Delete, cancel subscription, clear cart — always require explicit confirmation step.',                  priority:'Critical' },
        { id:'u12', num:12, item:'H5: Forms have clear required field indicators',  howTo:'Asterisk (*) with legend. Don\'t rely on colour alone — fails accessibility.',                        priority:'High'     },
        { id:'u13', num:13, item:'H5: Password show/hide toggle available',         howTo:'Reduces password entry errors and improves login conversion. Simple to implement.',                    priority:'Medium'   },
        { id:'u14', num:14, item:'H5: Input fields show expected format (date, phone)', howTo:'Show MM/DD/YYYY placeholder in date fields. (000) 000-0000 in phone fields.',                     priority:'High'     },
      ]
    },
    {
      id: 'nielsen610', label: 'Nielsen Heuristics 6–10 (Items 15–24)',
      items: [
        { id:'u15', num:15, item:'H6: Navigation always visible (not hidden)',      howTo:'Primary navigation accessible without scrolling. Never hide behind ambiguous icon.',                   priority:'Critical', lite: true },
        { id:'u16', num:16, item:'H6: Search prominently placed and functional',    howTo:'Search in header, easy to find. Auto-suggestions significantly improve search UX.',                   priority:'High'     },
        { id:'u17', num:17, item:'H7: Keyboard shortcuts documented if present',   howTo:'If shortcuts exist, make them discoverable via ? key or help section.',                               priority:'Low'      },
        { id:'u18', num:18, item:'H7: Complex tasks have help/tutorial available',  howTo:'Contextual help, tooltips, or onboarding flow for complex features.',                                 priority:'Medium'   },
        { id:'u19', num:19, item:'H8: Minimal design — no unnecessary elements',   howTo:'Remove anything that doesn\'t serve user goals. Every element needs a reason.',                       priority:'High'     },
        { id:'u20', num:20, item:'H8: Page has clear visual hierarchy',             howTo:'Most important content visually dominant. F-pattern or Z-pattern layout.',                            priority:'Critical', lite: true },
        { id:'u21', num:21, item:'H9: Error messages explain what went wrong',      howTo:'Not "Error 404" — "Page not found. Here\'s what you can do next."',                                  priority:'Critical' },
        { id:'u22', num:22, item:'H9: Error messages suggest how to fix the issue', howTo:'Every error message should have a clear next step for the user.',                                     priority:'Critical' },
        { id:'u23', num:23, item:'H10: New users can complete core task without help', howTo:'5-second test and first-click test. Can new user achieve goal unaided?',                          priority:'Critical', lite: true },
        { id:'u24', num:24, item:'H10: Familiar UI patterns used where appropriate', howTo:'Shopping cart icon for cart. Hamburger for mobile menu. Don\'t reinvent conventions.',              priority:'High'     },
      ]
    },
    {
      id: 'navigation', label: 'Navigation & IA (Items 25–32)',
      items: [
        { id:'u25', num:25, item:'Navigation labels are clear and unambiguous',     howTo:'Users should predict what they\'ll find before clicking. No clever/obscure labels.',                  priority:'Critical' },
        { id:'u26', num:26, item:'Active navigation state clearly indicated',       howTo:'Current page/section highlighted in nav. Users know where they are.',                                 priority:'High'     },
        { id:'u27', num:27, item:'Breadcrumbs present on inner pages',              howTo:'Especially important for e-commerce and deep content sites.',                                         priority:'Medium'   },
        { id:'u28', num:28, item:'Footer navigation is comprehensive and useful',   howTo:'Footer: key pages, contact, social, legal. A second chance at navigation.',                          priority:'Medium'   },
        { id:'u29', num:29, item:'Search results are relevant and well-formatted',  howTo:'Test 5 searches. Results relevant? Filters available? No results handled?',                         priority:'High'     },
        { id:'u30', num:30, item:'404 page helps users recover',                    howTo:'404 page: explain what happened, provide search, link to key pages.',                                 priority:'High'     },
        { id:'u31', num:31, item:'Mega menu / dropdown usable on touch devices',    howTo:'Hover-only dropdowns fail on touch. Test on mobile and tablet.',                                      priority:'High'     },
        { id:'u32', num:32, item:'Information architecture tested with users',      howTo:'Card sorting or tree testing done. IA based on user mental models.',                                  priority:'Medium'   },
      ]
    },
    {
      id: 'accessibility', label: 'Accessibility (Items 33–37)',
      items: [
        { id:'u33', num:33, item:'Colour contrast ratio ≥ 4.5:1 (WCAG AA)',        howTo:'Chrome DevTools accessibility panel or Colour Contrast Analyser.',                                    priority:'Critical' },
        { id:'u34', num:34, item:'All images have descriptive alt text',            howTo:'Screen readers rely on alt text. Decorative images: alt="".',                                         priority:'Critical' },
        { id:'u35', num:35, item:'Site fully navigable by keyboard alone',          howTo:'Tab through entire site. Every interactive element must be reachable.',                               priority:'Critical' },
        { id:'u36', num:36, item:'Focus indicators visible on all interactive elements', howTo:':focus styles not removed. Blue outline or custom visible focus ring.',                         priority:'High'     },
        { id:'u37', num:37, item:'ARIA labels on icon buttons and form elements',   howTo:'aria-label on buttons with no text. Screen reader announces purpose.',                               priority:'High'     },
      ]
    },
    {
      id: 'mobileux', label: 'Mobile UX (Items 38–40)',
      items: [
        { id:'u38', num:38, item:'Mobile navigation is simple and thumb-friendly',  howTo:'Bottom nav or hamburger menu. Key actions within thumb reach zone.',                                  priority:'Critical' },
        { id:'u39', num:39, item:'Forms are optimized for mobile input',            howTo:'Correct input type (email, tel, number). No tiny date pickers.',                                     priority:'High'     },
        { id:'u40', num:40, item:'Content priority preserved on mobile',            howTo:'Most important content first on mobile. No key content hidden or collapsed.',                       priority:'High'     },
      ]
    },
  ]
}

// ─── CONVERSION & CTA (35 items) ─────────────────────────────────────────────
const cro: AuditCategory = {
  id: 'cro', label: 'Conversion & CTA', icon: '⚡', color: '#F59E0B',
  sections: [
    {
      id: 'cta', label: 'CTA Design (Items 1–8)',
      items: [
        { id:'c1',  num:1,  item:'Primary CTA visible above the fold',              howTo:'Users should not scroll to find the main action. Test on 1280px and 375px.',                          priority:'Critical', lite: true },
        { id:'c2',  num:2,  item:'CTA copy is action-oriented and specific',        howTo:'"Get Free Audit" beats "Submit". "Start 14-day Trial" beats "Sign Up".',                             priority:'Critical' },
        { id:'c3',  num:3,  item:'CTA button has strong visual contrast',           howTo:'CTA must stand out from background. Color contrast + size + whitespace.',                             priority:'Critical' },
        { id:'c4',  num:4,  item:'Single primary CTA per page section',             howTo:'Multiple competing CTAs cause decision paralysis. One primary, one secondary max.',                  priority:'High'     },
        { id:'c5',  num:5,  item:'CTA repeated strategically for long pages',       howTo:'Long pages: repeat CTA at 1/3, 2/3, and bottom.',                                                    priority:'High'     },
        { id:'c6',  num:6,  item:'Hover/active states on all CTAs',                 howTo:'Visual feedback on hover and click. Not just cursor change.',                                         priority:'Medium'   },
        { id:'c7',  num:7,  item:'CTA above fold tested across device sizes',       howTo:'Test on iPhone 13 (390px), Samsung Galaxy (360px), iPad (768px).',                                   priority:'High'     },
        { id:'c8',  num:8,  item:'Sticky CTA or sticky header with CTA on mobile',  howTo:'Mobile users scroll — sticky CTA maintains conversion opportunity.',                                priority:'High'     },
      ]
    },
    {
      id: 'trust', label: 'Trust Signals (Items 9–16)',
      items: [
        { id:'c9',  num:9,  item:'Customer testimonials present on key pages',      howTo:'Real testimonials with name, company, photo. Not just star ratings.',                                priority:'Critical', lite: true },
        { id:'c10', num:10, item:'Social proof (customer count, logos, reviews)',   howTo:'"Trusted by 5,000+ agencies" or client logo strip significantly increases conversion.',              priority:'High'     },
        { id:'c11', num:11, item:'Trust badges (secure payment, guarantees)',       howTo:'SSL badge, money-back guarantee, industry certifications visible at decision point.',                 priority:'High'     },
        { id:'c12', num:12, item:'Pricing is clear with no hidden fees',            howTo:'All fees shown upfront. Surprise fees on checkout = #1 cart abandonment cause.',                    priority:'Critical' },
        { id:'c13', num:13, item:'Risk reversal offered (free trial, guarantee)',   howTo:'"30-day money-back guarantee" removes purchase barrier significantly.',                              priority:'High'     },
        { id:'c14', num:14, item:'Case studies or results data present',            howTo:'Specific results ("increased organic traffic by 340%") outperform generic claims.',                 priority:'High'     },
        { id:'c15', num:15, item:'Third-party review integration (G2, Trustpilot)', howTo:'Independent reviews more trusted than site testimonials.',                                           priority:'Medium'   },
        { id:'c16', num:16, item:'Contact info visible throughout conversion flow',  howTo:'Phone number and live chat visible reduces checkout abandonment.',                                   priority:'High'     },
      ]
    },
    {
      id: 'forms', label: 'Forms & Checkout (Items 17–23)',
      items: [
        { id:'c17', num:17, item:'Forms have minimal required fields',              howTo:'Every extra field reduces conversion. Ask only what is needed.',                                      priority:'Critical', lite: true },
        { id:'c18', num:18, item:'Form progress shown for multi-step forms',        howTo:'Step 2 of 3 reduces abandonment. Show progress bar.',                                               priority:'High'     },
        { id:'c19', num:19, item:'Auto-fill supported on all form fields',          howTo:'Correct autocomplete attributes. name="email", name="tel" etc.',                                    priority:'High'     },
        { id:'c20', num:20, item:'Form errors shown inline, not on submit',         howTo:'Real-time validation before submit. Red border + message on blur.',                                 priority:'High'     },
        { id:'c21', num:21, item:'Thank you / confirmation page provides next step', howTo:'After conversion: what should user do next? Onboarding, download, calendar.',                     priority:'High'     },
        { id:'c22', num:22, item:'Guest checkout available (e-commerce)',           howTo:'Forced account creation is #2 cart abandonment cause.',                                              priority:'Critical' },
        { id:'c23', num:23, item:'Checkout steps minimized (< 3 steps)',            howTo:'1-page checkout always outperforms multi-step for e-commerce.',                                     priority:'High'     },
      ]
    },
    {
      id: 'mobile_cro', label: 'Mobile Conversion (Items 24–28)',
      items: [
        { id:'c24', num:24, item:'Mobile checkout / conversion flow tested',        howTo:'Complete full purchase/signup flow on real mobile device.',                                           priority:'Critical' },
        { id:'c25', num:25, item:'Apple Pay / Google Pay available on mobile',     howTo:'1-tap payment massively improves mobile conversion rate.',                                            priority:'High'     },
        { id:'c26', num:26, item:'Phone number is click-to-call on mobile',        howTo:'<a href="tel:+1234567890"> on all phone numbers.',                                                   priority:'High'     },
        { id:'c27', num:27, item:'Mobile popups do not obstruct conversion flow',  howTo:'No full-screen overlays on mobile product/checkout pages.',                                          priority:'High'     },
        { id:'c28', num:28, item:'Mobile page load < 3s on 4G connection',         howTo:'WebPageTest with 4G throttling. 3s = 53% of mobile users abandon.',                                priority:'Critical' },
      ]
    },
    {
      id: 'analytics', label: 'Analytics & Testing (Items 29–32)',
      items: [
        { id:'c29', num:29, item:'Conversion tracking set up in GA4',               howTo:'Key goals: form submit, purchase, signup, call. All tracked as conversions.',                       priority:'Critical' },
        { id:'c30', num:30, item:'Heatmap / session recording tool in place',       howTo:'Hotjar or MS Clarity. 500+ sessions before drawing conclusions.',                                   priority:'High'     },
        { id:'c31', num:31, item:'A/B testing program active',                      howTo:'At minimum, test CTAs and headlines. Use VWO, Optimizely, or Google Optimize.',                    priority:'Medium'   },
        { id:'c32', num:32, item:'Funnel drop-off points identified and addressed', howTo:'GA4 funnel exploration report. Fix biggest drop-off first.',                                       priority:'High'     },
      ]
    },
    {
      id: 'page', label: 'Page-Level (Items 33–35)',
      items: [
        { id:'c33', num:33, item:'Hero section communicates value prop in < 5 secs', howTo:'5-second test: can new visitor understand what you offer and for whom?',                          priority:'Critical' },
        { id:'c34', num:34, item:'Pricing page has comparison table',               howTo:'Feature comparison between plans reduces sales friction.',                                           priority:'High'     },
        { id:'c35', num:35, item:'Exit intent strategy in place',                   howTo:'Exit popup with offer or content upgrade. Recovers 10–15% of abandoning visitors.',               priority:'Medium'   },
      ]
    },
  ]
}

// ─── AI & SERP VISIBILITY ─────────────────────────────────────────────────────
// Powered by SerpApi real data — 5th audit category
const aiSerp: AuditCategory = {
  id: 'serp', label: 'AI & SERP Visibility', icon: '🤖', color: '#8B5CF6',
  sections: [
    {
      id: 'serp_visibility', label: 'SERP Performance',
      items: [
        { id:'serp1', num:1,  item:'Site appears in Google top 10 for main keyword',    howTo:'Run target keyword in Google. If not in top 10, focus on content depth, backlinks, and on-page SEO.',   priority:'Critical' },
        { id:'serp2', num:2,  item:'SERP intent matches content type',                  howTo:'Check top 10 results: informational/commercial/transactional? Your content format must match.',            priority:'Critical' },
        { id:'serp3', num:3,  item:'Content depth ≥ competitor average (top 3)',        howTo:'If top 3 competitors avg 1500 words and your page has 400, add depth. Use SerpApi competitor data.',      priority:'High'     },
        { id:'serp8', num:4,  item:'Title tag has emotional trigger or power word',     howTo:'Add "best", "ultimate", "proven", year, or number to title. Compare title pattern vs SERP competitors.',  priority:'Medium'   },
      ]
    },
    {
      id: 'aeo', label: 'AEO — Answer Engine Optimization',
      items: [
        { id:'serp4', num:5,  item:'Featured snippet / answer box opportunity detected', howTo:'If featured snippet present in SERP, structure content with direct Q&A format, 40–60 word answers.',     priority:'High',    lite: true },
        { id:'serp5', num:6,  item:'People Also Ask (PAA) detected → FAQ schema added', howTo:'PAA in SERP = FAQ opportunity. Add FAQ schema markup and answer PAA questions in content.',               priority:'High',    lite: true },
        { id:'serp6', num:7,  item:'Content answers a clear, specific question',         howTo:'Every page should answer ONE clear question. Use it as the H1. Helps AI/SGE summarization.',             priority:'High',    lite: true },
        { id:'serp7', num:8,  item:'Content structured in short, scannable chunks',      howTo:'Use H2/H3 headers every 200–300 words. Short paragraphs (2–3 lines). Helps AI extract answers.',         priority:'Medium'   },
      ]
    },
    {
      id: 'aio', label: 'Google AI Overview (AIO)',
      items: [
        { id:'serp9',  num:9,  item:'Google AI Overview detected for this keyword',       howTo:'AIO appears for many informational queries. If present, optimize for direct concise answers and strong E-E-A-T.',  priority:'High'     },
        { id:'serp10', num:10, item:'Site cited as source in Google AI Overview',          howTo:'Add author bios, cite sources, use structured data. AIO sources favor authoritative, well-structured content.',    priority:'Critical' },
        { id:'serp11', num:11, item:'Content structured for AI answer extraction',         howTo:'Use short intro paragraphs that directly answer the query. Lists, tables, and clear H2 questions help AIO pick up your content.', priority:'High' },
      ]
    },
  ]
}

export const AUDIT_CATEGORIES: AuditCategory[] = [
  technicalSEO,
  onPage,
  uxHeuristics,
  cro,
  aiSerp,
]

export const WEIGHTS: Record<string, number> = {
  technical: 0.25,
  onpage:    0.25,
  ux:        0.20,
  cro:       0.17,
  serp:      0.13,
}
