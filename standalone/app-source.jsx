const { useState, useEffect, useRef, useMemo } = React;

// Inject keyframe for auto-advance progress bar
(function() {
  const s = document.createElement('style');
  s.textContent = '@keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }';
  document.head.appendChild(s);
})();

// ─── AUDIT DATA ───────────────────────────────────────────────────────────────

const technicalSEO = {
  id: 'technical', label: 'Technical SEO', icon: '⚙️', color: '#0EA5E9',
  sections: [
    { id: 'crawl', label: 'Crawlability & Indexation (Items 1–14)', items: [
      { id:'t1',  num:1,  item:'robots.txt file exists & is correct',             howTo:'Visit /robots.txt — ensure it exists and does not block important pages.',                                   priority:'Critical' },
      { id:'t2',  num:2,  item:'XML sitemap exists & is submitted to GSC',        howTo:'Check /sitemap.xml — submitted in Google Search Console.',                                                   priority:'Critical' },
      { id:'t3',  num:3,  item:'Sitemap is up-to-date (< 30 days)',               howTo:'Check lastmod dates in sitemap. Regenerate if stale.',                                                        priority:'High'     },
      { id:'t4',  num:4,  item:'No important pages are noindex',                  howTo:'GSC → Coverage → Excluded. Check meta robots tags on key pages.',                                             priority:'Critical' },
      { id:'t5',  num:5,  item:'Canonical tags correctly implemented',             howTo:'Check self-referencing canonicals. No conflicting or missing canonicals.',                                   priority:'Critical' },
      { id:'t6',  num:6,  item:'No orphan pages (0 internal links)',               howTo:'Screaming Frog → filter pages with 0 inlinks.',                                                              priority:'High'     },
      { id:'t7',  num:7,  item:'Crawl depth ≤ 3 clicks from homepage',            howTo:'Screaming Frog crawl depth report. Key pages ≤ 3.',                                                         priority:'High'     },
      { id:'t8',  num:8,  item:'Pagination handled correctly',                     howTo:'Check rel="prev/next" or canonical approach for paginated content.',                                         priority:'Medium'   },
      { id:'t9',  num:9,  item:'No redirect chains (max 1 hop)',                  howTo:'Screaming Frog → 3xx. Chains waste crawl budget.',                                                           priority:'High'     },
      { id:'t10', num:10, item:'No broken internal links (404s)',                  howTo:'Screaming Frog → 4xx. Every broken link hurts crawlability.',                                               priority:'Critical' },
      { id:'t11', num:11, item:'International / hreflang tags correct',            howTo:'Check hreflang for correct lang codes and self-referencing.',                                                priority:'Medium'   },
      { id:'t12', num:12, item:'GSC shows no crawl anomalies',                     howTo:'GSC → Coverage → check Errors and Valid with warnings.',                                                     priority:'Critical' },
      { id:'t13', num:13, item:'JavaScript not blocking key content',              howTo:"Google's URL Inspection → 'View Crawled Page' — is content visible?",                                       priority:'High'     },
      { id:'t14', num:14, item:'URL structure is clean and descriptive',           howTo:'No query strings, IDs, or stop words in URLs for key pages.',                                               priority:'Medium'   },
    ]},
    { id: 'cwv', label: 'Core Web Vitals (Items 15–26)', items: [
      { id:'t15', num:15, item:'LCP ≤ 2.5s (Largest Contentful Paint)',           howTo:'PageSpeed Insights or GSC Core Web Vitals report.',                                                          priority:'Critical' },
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
    ]},
    { id: 'https', label: 'HTTPS & Security (Items 27–34)', items: [
      { id:'t27', num:27, item:'SSL certificate valid and not expiring soon',      howTo:'Check SSL Labs or browser padlock. Expiry > 30 days.',                                                      priority:'Critical' },
      { id:'t28', num:28, item:'All pages served over HTTPS',                     howTo:'No HTTP pages. Check for mixed content warnings in console.',                                                priority:'Critical' },
      { id:'t29', num:29, item:'HTTP → HTTPS redirect in place',                  howTo:'Visit http://yourdomain.com — should 301 redirect to HTTPS.',                                              priority:'Critical' },
      { id:'t30', num:30, item:'www / non-www canonicalized',                     howTo:'Both versions resolve to one canonical version.',                                                            priority:'High'     },
      { id:'t31', num:31, item:'HSTS header present',                             howTo:'Check response headers: Strict-Transport-Security.',                                                        priority:'Medium'   },
      { id:'t32', num:32, item:'No mixed content (HTTP resources on HTTPS pages)', howTo:'Browser console → check for mixed content warnings.',                                                      priority:'High'     },
      { id:'t33', num:33, item:'Security headers present (CSP, X-Frame-Options)', howTo:'securityheaders.com — check for missing headers.',                                                         priority:'Medium'   },
      { id:'t34', num:34, item:'No sensitive data exposed in source or URLs',     howTo:'Check page source and URL parameters for API keys, tokens.',                                               priority:'High'     },
    ]},
    { id: 'schema', label: 'Structured Data / Schema (Items 35–43)', items: [
      { id:'t35', num:35, item:'Organization schema implemented',                  howTo:'Google Rich Results Test. schema.org/Organization on homepage.',                                            priority:'High'     },
      { id:'t36', num:36, item:'WebSite schema with SearchAction',                 howTo:'Enables sitelinks searchbox in Google SERPs.',                                                             priority:'Medium'   },
      { id:'t37', num:37, item:'BreadcrumbList schema on inner pages',             howTo:'Rich Results Test on category/product pages.',                                                              priority:'Medium'   },
      { id:'t38', num:38, item:'Product schema on product pages',                  howTo:'Check price, availability, reviews in schema. Rich Results Test.',                                         priority:'Critical' },
      { id:'t39', num:39, item:'Article/BlogPosting schema on blog posts',         howTo:'Check datePublished, author, headline fields.',                                                            priority:'High'     },
      { id:'t40', num:40, item:'FAQ schema on FAQ pages',                          howTo:'Rich Results Test — enables FAQ rich results in SERPs.',                                                   priority:'Medium'   },
      { id:'t41', num:41, item:'Review/Rating schema correct',                     howTo:'Ensure aggregate rating is genuine. No review gating.',                                                    priority:'High'     },
      { id:'t42', num:42, item:'No schema markup errors in GSC',                   howTo:'GSC → Enhancements — check for errors in all schema types.',                                              priority:'High'     },
      { id:'t43', num:43, item:'LocalBusiness schema if applicable',               howTo:'Name, address, phone, opening hours. Google Business profile aligned.',                                   priority:'Medium'   },
    ]},
    { id: 'mobile', label: 'Mobile & Technical UX (Items 44–52)', items: [
      { id:'t44', num:44, item:'Mobile-first indexing compatible',                 howTo:'GSC → Settings → confirm mobile-first indexing active.',                                                   priority:'Critical' },
      { id:'t45', num:45, item:'Viewport meta tag correct',                        howTo:'<meta name="viewport" content="width=device-width, initial-scale=1">',                                    priority:'Critical' },
      { id:'t46', num:46, item:'No horizontal scroll on mobile',                   howTo:'Test on real device or Chrome DevTools mobile view.',                                                      priority:'High'     },
      { id:'t47', num:47, item:'Touch targets ≥ 48px (Google standard)',           howTo:'Lighthouse accessibility — tap target size check.',                                                        priority:'High'     },
      { id:'t48', num:48, item:'No intrusive interstitials on mobile',             howTo:'No full-screen pop-ups on page load on mobile.',                                                           priority:'High'     },
      { id:'t49', num:49, item:'AMP implemented if news/article site',             howTo:'Check for <link rel="amphtml"> on articles if relevant.',                                                  priority:'Low'      },
      { id:'t50', num:50, item:'404 page is helpful and links back to site',       howTo:'Visit /nonexistent-page. Should have nav and search.',                                                     priority:'Medium'   },
      { id:'t51', num:51, item:'Thin content pages handled (noindex or improved)', howTo:'Pages < 300 words with no clear purpose — noindex or improve.',                                           priority:'High'     },
      { id:'t52', num:52, item:'Duplicate content managed via canonicals',         howTo:'No identical or near-identical pages competing for same keywords.',                                        priority:'Critical' },
    ]},
    { id: 'intl', label: 'International & Advanced (Items 53–65)', items: [
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
    ]},
  ]
};

const onPage = {
  id: 'onpage', label: 'On-Page & Content', icon: '📝', color: '#8B5CF6',
  sections: [
    { id: 'title', label: 'Title Tags & Meta Data (Items 1–9)', items: [
      { id:'o1',  num:1,  item:'Title tag exists on every page',                  howTo:'Screaming Frog → Page Titles — filter missing.',                                                           priority:'Critical' },
      { id:'o2',  num:2,  item:'Title tag length is 50–60 characters',            howTo:'Screaming Frog → Page Titles — check Over 60 and Under 30.',                                              priority:'High'     },
      { id:'o3',  num:3,  item:'Primary keyword appears in title tag (near start)',howTo:'Check title starts with or contains primary keyword.',                                                    priority:'Critical' },
      { id:'o4',  num:4,  item:'Each page has a unique title tag (no duplicates)', howTo:'Screaming Frog → Page Titles → sort by duplicate.',                                                      priority:'Critical' },
      { id:'o5',  num:5,  item:'Meta description exists on every key page',       howTo:'Screaming Frog → Meta Description — filter missing.',                                                     priority:'High'     },
      { id:'o6',  num:6,  item:'Meta description includes primary + secondary keyword', howTo:'Check meta descriptions contain target keywords naturally.',                                         priority:'High'     },
      { id:'o7',  num:7,  item:'Meta description has a clear call-to-action',     howTo:'Descriptions should entice click. "Learn more", "Get started", etc.',                                    priority:'Medium'   },
      { id:'o8',  num:8,  item:'No duplicate meta descriptions across pages',     howTo:'Screaming Frog → Meta Description → sort by duplicate.',                                                  priority:'High'     },
      { id:'o9',  num:9,  item:'Open Graph / Twitter Card tags present',          howTo:'Check <meta property="og:title"> etc. Use Facebook Debugger.',                                            priority:'Medium'   },
    ]},
    { id: 'headings', label: 'Headings & Structure (Items 10–17)', items: [
      { id:'o10', num:10, item:'Every page has exactly one H1',                   howTo:'Screaming Frog → H1 → filter missing or multiple.',                                                       priority:'Critical' },
      { id:'o11', num:11, item:'H1 contains primary keyword',                     howTo:'H1 should match search intent and include target keyword.',                                               priority:'Critical' },
      { id:'o12', num:12, item:'H1 differs from title tag (but aligned)',         howTo:'Title = SERP optimized. H1 = UX optimized. Should not be identical.',                                    priority:'Medium'   },
      { id:'o13', num:13, item:'Heading hierarchy correct (H1→H2→H3)',            howTo:'No skipping from H1 to H3. Logical document outline.',                                                   priority:'High'     },
      { id:'o14', num:14, item:'H2s contain secondary keywords',                  howTo:'H2 headings naturally incorporate related terms.',                                                        priority:'High'     },
      { id:'o15', num:15, item:'Headings are descriptive (not "Section 1")',      howTo:'Each heading tells user and Google what the section is about.',                                           priority:'Medium'   },
      { id:'o16', num:16, item:'FAQ sections use H2/H3 for questions',            howTo:'FAQ schema + heading structure for featured snippet opportunity.',                                        priority:'Medium'   },
      { id:'o17', num:17, item:'No keyword stuffing in headings',                 howTo:'Headings read naturally. No forced repetition of keywords.',                                              priority:'High'     },
    ]},
    { id: 'keywords', label: 'Keyword Optimization (Items 18–26)', items: [
      { id:'o18', num:18, item:'Primary keyword in first 100 words',              howTo:'Check body copy — keyword should appear early.',                                                           priority:'High'     },
      { id:'o19', num:19, item:'Keyword density natural (1–2%, no stuffing)',     howTo:'Use SurferSEO or manual check — not forced, reads naturally.',                                           priority:'High'     },
      { id:'o20', num:20, item:'LSI / semantic keywords used throughout',         howTo:'Related terms appear naturally in copy. Use Google NLP API to check.',                                   priority:'High'     },
      { id:'o21', num:21, item:'No keyword cannibalization',                      howTo:'Multiple pages targeting same keyword — consolidate or differentiate.',                                  priority:'Critical' },
      { id:'o22', num:22, item:'Target keyword in image alt text (where relevant)',howTo:'Not every image — only where contextually appropriate.',                                                 priority:'Medium'   },
      { id:'o23', num:23, item:'Target keyword in URL slug',                      howTo:'URL contains keyword: /best-seo-tools not /page?id=123',                                                 priority:'High'     },
      { id:'o24', num:24, item:'Long-tail keyword variations covered',            howTo:'Check if content covers question variants (who, what, how, best).',                                      priority:'Medium'   },
      { id:'o25', num:25, item:'Featured snippet optimization attempted',         howTo:'Direct answers, tables, lists at top of content for snippet targets.',                                  priority:'Medium'   },
      { id:'o26', num:26, item:'Search intent matched correctly',                 howTo:'Informational / commercial / transactional intent matched by page type.',                               priority:'Critical' },
    ]},
    { id: 'content', label: 'Content Quality (Items 27–36)', items: [
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
    ]},
    { id: 'links', label: 'Internal Links (Items 37–44)', items: [
      { id:'o37', num:37, item:'Internal linking strategy in place',              howTo:'Key pages receive internal links from relevant content.',                                                 priority:'High'     },
      { id:'o38', num:38, item:'Anchor text is descriptive (not "click here")',   howTo:'Anchor text describes destination page content.',                                                        priority:'High'     },
      { id:'o39', num:39, item:'No broken internal links',                        howTo:'Screaming Frog → Response Codes → 4xx inlinks.',                                                        priority:'Critical' },
      { id:'o40', num:40, item:'Important pages linked from homepage',            howTo:'Top-priority pages should be 1–2 clicks from homepage.',                                                priority:'High'     },
      { id:'o41', num:41, item:'Content links to relevant internal resources',    howTo:'Blog posts link to product/service pages where relevant.',                                              priority:'Medium'   },
      { id:'o42', num:42, item:'No excessive internal links on single page',      howTo:'< 100 links per page guideline. Too many dilutes PageRank.',                                            priority:'Medium'   },
      { id:'o43', num:43, item:'Navigation links consistent across site',         howTo:'Header/footer nav same across all pages.',                                                               priority:'High'     },
      { id:'o44', num:44, item:'External links open in new tab & are relevant',  howTo:'outbound links use target="_blank" rel="noopener". No spammy outbound.',                                priority:'Medium'   },
    ]},
    { id: 'eeat', label: 'E-E-A-T Signals (Items 45–50)', items: [
      { id:'o45', num:45, item:'Author bios present on all blog/article content', howTo:'Name, credentials, photo, social links on each author.',                                                priority:'High'     },
      { id:'o46', num:46, item:'About page is comprehensive and credible',        howTo:'Company history, team, mission, contact details.',                                                      priority:'High'     },
      { id:'o47', num:47, item:'Contact information visible on every page',       howTo:'Footer: address, phone, email. Contact page linked from nav.',                                          priority:'High'     },
      { id:'o48', num:48, item:'Trust signals present (awards, press, clients)',  howTo:'Logos, badges, testimonials on key landing pages.',                                                     priority:'High'     },
      { id:'o49', num:49, item:'Privacy policy and terms of service present',     howTo:'Linked from footer. Required for GDPR compliance.',                                                     priority:'Critical' },
      { id:'o50', num:50, item:'External links point to authoritative sources',   howTo:'Cite .edu, .gov, established industry sources.',                                                        priority:'Medium'   },
    ]},
  ]
};

const uxHeuristics = {
  id: 'ux', label: 'UX Heuristics', icon: '🎯', color: '#10B981',
  sections: [
    { id: 'nielsen15', label: 'Nielsen Heuristics 1–5 (Items 1–14)', items: [
      { id:'u1',  num:1,  item:'H1: System status always visible (loading, progress)', howTo:'Loading spinners, progress bars, success/error states — users must always know what is happening.', priority:'Critical' },
      { id:'u2',  num:2,  item:'H1: Forms show inline validation feedback',       howTo:'Inline validation reduces form abandonment by 22%. Show errors in real time, not just on submit.',      priority:'High'     },
      { id:'u3',  num:3,  item:'H1: Async operations show clear loading state',   howTo:'Any action taking >1 second needs a loading indicator. >3 seconds needs progress feedback.',           priority:'High'     },
      { id:'u4',  num:4,  item:'H2: UI language matches user language (no jargon)', howTo:"No technical jargon, error codes, or developer-speak in UI text. Use user's own language.",         priority:'Critical' },
      { id:'u5',  num:5,  item:'H2: Icons have visible labels (no icon-only nav)', howTo:'Icon-only navigation fails usability testing consistently. Add labels below or beside icons.',        priority:'High'     },
      { id:'u6',  num:6,  item:'H3: Users can undo / go back from any action',    howTo:'Every action should be reversible or confirmable. Irreversible actions need explicit warnings.',       priority:'Critical' },
      { id:'u7',  num:7,  item:'H3: Browser back button works as expected',       howTo:'SPA frameworks often break back button. Test full navigation flow.',                                    priority:'Critical' },
      { id:'u8',  num:8,  item:'H4: UI visually consistent across all pages',     howTo:'Consistent colours, fonts, spacing across every page. Inconsistency erodes trust.',                   priority:'Critical' },
      { id:'u9',  num:9,  item:'H4: Terminology consistent (same words for same things)', howTo:"Button says 'Submit' page 1, 'Send' page 2, 'Go' page 3 = confusing. Pick one term.",        priority:'High'     },
      { id:'u10', num:10, item:'H4: Button styles consistent (primary/secondary/danger)', howTo:'One primary button style, one secondary. Mixing styles confuses action hierarchy.',            priority:'High'     },
      { id:'u11', num:11, item:'H5: Destructive actions require confirmation',    howTo:'Delete, cancel subscription, clear cart — always require explicit confirmation step.',                  priority:'Critical' },
      { id:'u12', num:12, item:'H5: Forms have clear required field indicators',  howTo:"Asterisk (*) with legend. Don't rely on colour alone — fails accessibility.",                         priority:'High'     },
      { id:'u13', num:13, item:'H5: Password show/hide toggle available',         howTo:'Reduces password entry errors and improves login conversion. Simple to implement.',                    priority:'Medium'   },
      { id:'u14', num:14, item:'H5: Input fields show expected format (date, phone)', howTo:'Show MM/DD/YYYY placeholder in date fields. (000) 000-0000 in phone fields.',                     priority:'High'     },
    ]},
    { id: 'nielsen610', label: 'Nielsen Heuristics 6–10 (Items 15–24)', items: [
      { id:'u15', num:15, item:'H6: Navigation always visible (not hidden)',      howTo:'Primary navigation accessible without scrolling. Never hide behind ambiguous icon.',                   priority:'Critical' },
      { id:'u16', num:16, item:'H6: Search prominently placed and functional',    howTo:'Search in header, easy to find. Auto-suggestions significantly improve search UX.',                   priority:'High'     },
      { id:'u17', num:17, item:'H7: Keyboard shortcuts documented if present',   howTo:'If shortcuts exist, make them discoverable via ? key or help section.',                               priority:'Low'      },
      { id:'u18', num:18, item:'H7: Complex tasks have help/tutorial available',  howTo:'Contextual help, tooltips, or onboarding flow for complex features.',                                 priority:'Medium'   },
      { id:'u19', num:19, item:"H8: Minimal design — no unnecessary elements",   howTo:"Remove anything that doesn't serve user goals. Every element needs a reason.",                        priority:'High'     },
      { id:'u20', num:20, item:'H8: Page has clear visual hierarchy',             howTo:'Most important content visually dominant. F-pattern or Z-pattern layout.',                            priority:'Critical' },
      { id:'u21', num:21, item:'H9: Error messages explain what went wrong',      howTo:"Not 'Error 404' — 'Page not found. Here's what you can do next.'",                                   priority:'Critical' },
      { id:'u22', num:22, item:'H9: Error messages suggest how to fix the issue', howTo:'Every error message should have a clear next step for the user.',                                     priority:'Critical' },
      { id:'u23', num:23, item:'H10: New users can complete core task without help', howTo:'5-second test and first-click test. Can new user achieve goal unaided?',                          priority:'Critical' },
      { id:'u24', num:24, item:'H10: Familiar UI patterns used where appropriate', howTo:"Shopping cart icon for cart. Hamburger for mobile menu. Don't reinvent conventions.",               priority:'High'     },
    ]},
    { id: 'navigation', label: 'Navigation & IA (Items 25–32)', items: [
      { id:'u25', num:25, item:'Navigation labels are clear and unambiguous',     howTo:"Users should predict what they'll find before clicking. No clever/obscure labels.",                   priority:'Critical' },
      { id:'u26', num:26, item:'Active navigation state clearly indicated',       howTo:'Current page/section highlighted in nav. Users know where they are.',                                 priority:'High'     },
      { id:'u27', num:27, item:'Breadcrumbs present on inner pages',              howTo:'Especially important for e-commerce and deep content sites.',                                         priority:'Medium'   },
      { id:'u28', num:28, item:'Footer navigation is comprehensive and useful',   howTo:'Footer: key pages, contact, social, legal. A second chance at navigation.',                          priority:'Medium'   },
      { id:'u29', num:29, item:'Search results are relevant and well-formatted',  howTo:'Test 5 searches. Results relevant? Filters available? No results handled?',                         priority:'High'     },
      { id:'u30', num:30, item:'404 page helps users recover',                    howTo:'404 page: explain what happened, provide search, link to key pages.',                                 priority:'High'     },
      { id:'u31', num:31, item:'Mega menu / dropdown usable on touch devices',    howTo:'Hover-only dropdowns fail on touch. Test on mobile and tablet.',                                      priority:'High'     },
      { id:'u32', num:32, item:'Information architecture tested with users',      howTo:'Card sorting or tree testing done. IA based on user mental models.',                                  priority:'Medium'   },
    ]},
    { id: 'accessibility', label: 'Accessibility (Items 33–37)', items: [
      { id:'u33', num:33, item:'Colour contrast ratio ≥ 4.5:1 (WCAG AA)',        howTo:'Chrome DevTools accessibility panel or Colour Contrast Analyser.',                                    priority:'Critical' },
      { id:'u34', num:34, item:'All images have descriptive alt text',            howTo:'Screen readers rely on alt text. Decorative images: alt="".',                                         priority:'Critical' },
      { id:'u35', num:35, item:'Site fully navigable by keyboard alone',          howTo:'Tab through entire site. Every interactive element must be reachable.',                               priority:'Critical' },
      { id:'u36', num:36, item:'Focus indicators visible on all interactive elements', howTo:':focus styles not removed. Blue outline or custom visible focus ring.',                         priority:'High'     },
      { id:'u37', num:37, item:'ARIA labels on icon buttons and form elements',   howTo:'aria-label on buttons with no text. Screen reader announces purpose.',                               priority:'High'     },
    ]},
    { id: 'mobileux', label: 'Mobile UX (Items 38–40)', items: [
      { id:'u38', num:38, item:'Mobile navigation is simple and thumb-friendly',  howTo:'Bottom nav or hamburger menu. Key actions within thumb reach zone.',                                  priority:'Critical' },
      { id:'u39', num:39, item:'Forms are optimized for mobile input',            howTo:'Correct input type (email, tel, number). No tiny date pickers.',                                     priority:'High'     },
      { id:'u40', num:40, item:'Content priority preserved on mobile',            howTo:'Most important content first on mobile. No key content hidden or collapsed.',                       priority:'High'     },
    ]},
  ]
};

const cro = {
  id: 'cro', label: 'Conversion & CTA', icon: '⚡', color: '#F59E0B',
  sections: [
    { id: 'cta', label: 'CTA Design (Items 1–8)', items: [
      { id:'c1',  num:1,  item:'Primary CTA visible above the fold',              howTo:'Users should not scroll to find the main action. Test on 1280px and 375px.',                          priority:'Critical' },
      { id:'c2',  num:2,  item:'CTA copy is action-oriented and specific',        howTo:'"Get Free Audit" beats "Submit". "Start 14-day Trial" beats "Sign Up".',                             priority:'Critical' },
      { id:'c3',  num:3,  item:'CTA button has strong visual contrast',           howTo:'CTA must stand out from background. Color contrast + size + whitespace.',                             priority:'Critical' },
      { id:'c4',  num:4,  item:'Single primary CTA per page section',             howTo:'Multiple competing CTAs cause decision paralysis. One primary, one secondary max.',                  priority:'High'     },
      { id:'c5',  num:5,  item:'CTA repeated strategically for long pages',       howTo:'Long pages: repeat CTA at 1/3, 2/3, and bottom.',                                                    priority:'High'     },
      { id:'c6',  num:6,  item:'Hover/active states on all CTAs',                 howTo:'Visual feedback on hover and click. Not just cursor change.',                                         priority:'Medium'   },
      { id:'c7',  num:7,  item:'CTA above fold tested across device sizes',       howTo:'Test on iPhone 13 (390px), Samsung Galaxy (360px), iPad (768px).',                                   priority:'High'     },
      { id:'c8',  num:8,  item:'Sticky CTA or sticky header with CTA on mobile',  howTo:'Mobile users scroll — sticky CTA maintains conversion opportunity.',                                priority:'High'     },
    ]},
    { id: 'trust', label: 'Trust Signals (Items 9–16)', items: [
      { id:'c9',  num:9,  item:'Customer testimonials present on key pages',      howTo:'Real testimonials with name, company, photo. Not just star ratings.',                                priority:'Critical' },
      { id:'c10', num:10, item:'Social proof (customer count, logos, reviews)',   howTo:'"Trusted by 5,000+ agencies" or client logo strip significantly increases conversion.',              priority:'High'     },
      { id:'c11', num:11, item:'Trust badges (secure payment, guarantees)',       howTo:'SSL badge, money-back guarantee, industry certifications visible at decision point.',                 priority:'High'     },
      { id:'c12', num:12, item:'Pricing is clear with no hidden fees',            howTo:'All fees shown upfront. Surprise fees on checkout = #1 cart abandonment cause.',                    priority:'Critical' },
      { id:'c13', num:13, item:'Risk reversal offered (free trial, guarantee)',   howTo:'"30-day money-back guarantee" removes purchase barrier significantly.',                              priority:'High'     },
      { id:'c14', num:14, item:'Case studies or results data present',            howTo:'Specific results ("increased organic traffic by 340%") outperform generic claims.',                 priority:'High'     },
      { id:'c15', num:15, item:'Third-party review integration (G2, Trustpilot)', howTo:'Independent reviews more trusted than site testimonials.',                                           priority:'Medium'   },
      { id:'c16', num:16, item:'Contact info visible throughout conversion flow',  howTo:'Phone number and live chat visible reduces checkout abandonment.',                                   priority:'High'     },
    ]},
    { id: 'forms', label: 'Forms & Checkout (Items 17–23)', items: [
      { id:'c17', num:17, item:'Forms have minimal required fields',              howTo:'Every extra field reduces conversion. Ask only what is needed.',                                      priority:'Critical' },
      { id:'c18', num:18, item:'Form progress shown for multi-step forms',        howTo:'Step 2 of 3 reduces abandonment. Show progress bar.',                                               priority:'High'     },
      { id:'c19', num:19, item:'Auto-fill supported on all form fields',          howTo:'Correct autocomplete attributes. name="email", name="tel" etc.',                                    priority:'High'     },
      { id:'c20', num:20, item:'Form errors shown inline, not on submit',         howTo:'Real-time validation before submit. Red border + message on blur.',                                 priority:'High'     },
      { id:'c21', num:21, item:'Thank you / confirmation page provides next step', howTo:'After conversion: what should user do next? Onboarding, download, calendar.',                     priority:'High'     },
      { id:'c22', num:22, item:'Guest checkout available (e-commerce)',           howTo:'Forced account creation is #2 cart abandonment cause.',                                              priority:'Critical' },
      { id:'c23', num:23, item:'Checkout steps minimized (< 3 steps)',            howTo:'1-page checkout always outperforms multi-step for e-commerce.',                                     priority:'High'     },
    ]},
    { id: 'mobile_cro', label: 'Mobile Conversion (Items 24–28)', items: [
      { id:'c24', num:24, item:'Mobile checkout / conversion flow tested',        howTo:'Complete full purchase/signup flow on real mobile device.',                                           priority:'Critical' },
      { id:'c25', num:25, item:'Apple Pay / Google Pay available on mobile',     howTo:'1-tap payment massively improves mobile conversion rate.',                                            priority:'High'     },
      { id:'c26', num:26, item:'Phone number is click-to-call on mobile',        howTo:'<a href="tel:+1234567890"> on all phone numbers.',                                                   priority:'High'     },
      { id:'c27', num:27, item:'Mobile popups do not obstruct conversion flow',  howTo:'No full-screen overlays on mobile product/checkout pages.',                                          priority:'High'     },
      { id:'c28', num:28, item:'Mobile page load < 3s on 4G connection',         howTo:'WebPageTest with 4G throttling. 3s = 53% of mobile users abandon.',                                priority:'Critical' },
    ]},
    { id: 'analytics', label: 'Analytics & Testing (Items 29–32)', items: [
      { id:'c29', num:29, item:'Conversion tracking set up in GA4',               howTo:'Key goals: form submit, purchase, signup, call. All tracked as conversions.',                       priority:'Critical' },
      { id:'c30', num:30, item:'Heatmap / session recording tool in place',       howTo:'Hotjar or MS Clarity. 500+ sessions before drawing conclusions.',                                   priority:'High'     },
      { id:'c31', num:31, item:'A/B testing program active',                      howTo:'At minimum, test CTAs and headlines. Use VWO, Optimizely, or Google Optimize.',                    priority:'Medium'   },
      { id:'c32', num:32, item:'Funnel drop-off points identified and addressed', howTo:'GA4 funnel exploration report. Fix biggest drop-off first.',                                       priority:'High'     },
    ]},
    { id: 'page', label: 'Page-Level (Items 33–35)', items: [
      { id:'c33', num:33, item:'Hero section communicates value prop in < 5 secs', howTo:'5-second test: can new visitor understand what you offer and for whom?',                          priority:'Critical' },
      { id:'c34', num:34, item:'Pricing page has comparison table',               howTo:'Feature comparison between plans reduces sales friction.',                                           priority:'High'     },
      { id:'c35', num:35, item:'Exit intent strategy in place',                   howTo:'Exit popup with offer or content upgrade. Recovers 10–15% of abandoning visitors.',               priority:'Medium'   },
    ]},
  ]
};

const aiSerp = {
  id: 'serp', label: 'AI & SERP Visibility', icon: '🤖', color: '#06B6D4',
  sections: [
    { id: 'serp_visibility', label: 'SERP Performance', items: [
      { id:'serp1',  num:1,  item:'Site appears in Google top 10 for main keyword',      howTo:'Run target keyword in Google. If not in top 10, focus on content depth, backlinks, and on-page SEO.',    priority:'Critical' },
      { id:'serp2',  num:2,  item:'SERP intent matches content type',                    howTo:'Check top 10 results: informational/commercial/transactional? Your content format must match.',             priority:'Critical' },
      { id:'serp3',  num:3,  item:'Content depth ≥ competitor average (top 3)',          howTo:'If top 3 competitors avg 1500 words and your page has 400, add depth.',                                     priority:'High'     },
      { id:'serp8',  num:4,  item:'Title tag has emotional trigger or power word',       howTo:'Add "best", "ultimate", "proven", year, or number to title.',                                               priority:'Medium'   },
    ]},
    { id: 'aeo', label: 'AEO — Answer Engine Optimization', items: [
      { id:'serp4',  num:5,  item:'Featured snippet / answer box opportunity detected',  howTo:'If featured snippet present in SERP, structure content with direct Q&A format, 40–60 word answers.',      priority:'High'     },
      { id:'serp5',  num:6,  item:'People Also Ask (PAA) detected → FAQ schema added',   howTo:'PAA in SERP = FAQ opportunity. Add FAQ schema markup and answer PAA questions in content.',                priority:'High'     },
      { id:'serp6',  num:7,  item:'Content answers a clear, specific question',           howTo:'Every page should answer ONE clear question. Use it as the H1.',                                           priority:'High'     },
      { id:'serp7',  num:8,  item:'Content structured in short, scannable chunks',        howTo:'Use H2/H3 headers every 200–300 words. Short paragraphs (2–3 lines).',                                    priority:'Medium'   },
    ]},
    { id: 'aio', label: 'Google AI Overview (AIO)', items: [
      { id:'serp9',  num:9,  item:'Google AI Overview detected for this keyword',         howTo:'AIO appears for many informational queries. Optimize for direct concise answers and strong E-E-A-T.',    priority:'High'     },
      { id:'serp10', num:10, item:'Site cited as source in Google AI Overview',           howTo:'Add author bios, cite sources, use structured data. AIO sources favor authoritative content.',           priority:'Critical' },
      { id:'serp11', num:11, item:'Content structured for AI answer extraction',          howTo:'Short intro paragraphs that directly answer the query. Lists, tables, and clear H2 questions.',         priority:'High'     },
    ]},
    { id: 'geo', label: 'AI Visibility (GEO)', advanced: true, items: [
      { id:'serp12', num:12, item:'Brand appears in AI-generated answers for core queries', howTo:'Search your brand or niche in ChatGPT, Perplexity, Gemini. If absent, build authoritative backlinks and increase brand co-mentions on trusted sites.', priority:'High' },
      { id:'serp13', num:13, item:'AI crawlers not blocked in robots.txt',                howTo:'Check robots.txt — ensure GPTBot, ClaudeBot, PerplexityBot, anthropic-ai are not disallowed unless intentional.',  priority:'High'     },
      { id:'serp14', num:14, item:'LLMs.txt or AI-readable content structure exists',     howTo:'Add /llms.txt to guide AI crawlers to preferred content. Also ensure clean headings, direct answers, and structured HTML that LLMs can parse easily.', priority:'Medium' },
      { id:'serp15', num:15, item:'Content includes unique data, insights or first-hand information', howTo:'AI tools preferentially cite original research, proprietary data, and first-hand experience. Generic rephrased content is deprioritized.', priority:'High' },
      { id:'serp16', num:16, item:'Brand has entity signals (Knowledge Graph / structured presence)', howTo:'Search brand in Google — Knowledge Panel present? If not, create Google Business Profile, add Wikidata entry, use Organization schema with sameAs links.', priority:'Medium' },
    ]},
    { id: 'eeat', label: 'E-E-A-T & Authorship Signals', advanced: true, items: [
      { id:'serp17', num:17, item:'Author byline and bio on all content pages',           howTo:'Add author name, photo, credentials, and link to author page on every article. AI citation algorithms weight author signals heavily.', priority:'High' },
      { id:'serp18', num:18, item:'Person schema markup on author pages',                 howTo:'Add Person schema with sameAs links to LinkedIn, Google Scholar, published works.',                       priority:'High'     },
      { id:'serp19', num:19, item:'About page demonstrates real expertise & credibility', howTo:'About page should clearly convey credentials, experience, and certifications. AIO and GEO systems use this page for trust scoring.', priority:'Medium' },
      { id:'serp20', num:20, item:'References high-authority sources (.gov, .edu, research)', howTo:'Link out to .gov, .edu, peer-reviewed studies, and established publications. AI tools value well-sourced content for citation eligibility.', priority:'Medium' },
      { id:'serp21', num:21, item:'Content shows human editorial oversight (not raw AI output)', howTo:'Raw AI-generated content without editorial review triggers quality filters. Add human expertise, first-person experience, and original commentary throughout.', priority:'High' },
    ]},
  ]
};

const AUDIT_CATEGORIES = [technicalSEO, onPage, uxHeuristics, cro, aiSerp];
const ITEM_W  = { Critical: 2, High: 1.5, Medium: 1, Low: 0.75 };
const WEIGHTS = { technical: 0.25, ux: 0.25, onpage: 0.20, cro: 0.15, serp: 0.15 };

// ─── SCORING ──────────────────────────────────────────────────────────────────

function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

function getRating(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Improvement';
  return 'Critical';
}

function calculateScore(results) {
  const categories = AUDIT_CATEGORIES.map(cat => {
    const allItems = cat.sections.flatMap(s => s.items);
    let pass = 0, partial = 0, fail = 0, wPass = 0, wPartial = 0, wFail = 0;
    allItems.forEach(item => {
      const s = results[item.id];
      const w = ITEM_W[item.priority] ?? 1;
      if (s === 'Pass')         { pass++;    wPass    += w; }
      else if (s === 'Partial') { partial++; wPartial += w; }
      else if (s === 'Fail')    { fail++;    wFail    += w; }
      // blank and N/A → excluded from denominator
    });
    const evaluated = pass + partial + fail;
    const wTotal = wPass + wPartial + wFail;
    const score = wTotal > 0 ? Math.round((wPass + wPartial * 0.5) / wTotal * 100) : 0;
    return {
      id: cat.id, label: cat.label, icon: cat.icon, color: cat.color,
      score, grade: getGrade(score), weight: WEIGHTS[cat.id] ?? 0.2,
      passed: pass, failed: fail, partial, total: allItems.length, evaluated,
    };
  });

  const totalEvaluated = categories.reduce((s, c) => s + c.evaluated, 0);
  const totalAll       = categories.reduce((s, c) => s + c.total,     0);
  const activeCats     = categories.filter(c => c.evaluated > 0);
  const totalWeight    = activeCats.reduce((s, c) => s + c.weight, 0);
  const weighted       = totalWeight > 0
    ? Math.round(activeCats.reduce((sum, c) => sum + c.score * c.weight, 0) / totalWeight)
    : 0;

  const completionPct = Math.round(totalEvaluated / totalAll * 100);
  const confidence    = completionPct < 20 ? 'Low' : completionPct < 80 ? 'Medium' : 'High';

  return {
    overall: weighted, weighted,
    grade:  totalEvaluated > 0 ? getGrade(weighted)  : '—',
    rating: totalEvaluated > 0 ? getRating(weighted) : '—',
    categories, completionPct, confidence, totalEvaluated, totalAll,
  };
}

function getTopIssues(results, limit = 10) {
  const PSCORE = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  return AUDIT_CATEGORIES
    .flatMap(cat => cat.sections.flatMap(sec =>
      sec.items
        .filter(item => results[item.id] === 'Fail' || results[item.id] === 'Partial')
        .map(item => ({
          id: item.id, item: item.item, category: cat.label,
          catColor: cat.color, priority: item.priority,
          status: results[item.id], score: PSCORE[item.priority] ?? 1,
        }))
    ))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ─── PDF GENERATOR ────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.substring(0,2),16), parseInt(h.substring(2,4),16), parseInt(h.substring(4,6),16)];
}
function lighten(rgb, amount = 0.9) {
  return [
    Math.round(rgb[0] + (255 - rgb[0]) * amount),
    Math.round(rgb[1] + (255 - rgb[1]) * amount),
    Math.round(rgb[2] + (255 - rgb[2]) * amount),
  ];
}
const STATUS_COLORS_PDF = {
  Pass: [16,185,129], Partial: [245,158,11], Fail: [239,68,68], 'N/A': [107,122,153],
};

// Normalise image through canvas — fixes indexed-colour PNG issues while
// preserving transparency. Always outputs PNG so logos on coloured backgrounds
// remain transparent in the PDF.
function normalizeImage(b64, callback) {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0); // no white fill — keep alpha
    callback(c.toDataURL('image/png'));
  };
  img.src = b64;
}

function downloadPDF(config, auditUrl, score, results) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = 210, H = 297, M = 15;
  const brandRgb      = hexToRgb(config.brandColor);
  const brandLight    = lighten(brandRgb, 0.92);
  const clientName    = config.clientName    || '';
  const agencyLogo    = config.agencyLogo    || null;
  const clientLogo    = config.clientLogo    || null;
  const agencyEmail   = config.agencyEmail   || '';
  const agencyWebsite = config.agencyWebsite || '';
  const agencyTitle   = config.agencyTitle   || '';
  let y = 0;

  function addPage() { doc.addPage(); y = M; drawFooter(); }
  function drawFooter() {
    doc.setFontSize(6.5); doc.setTextColor(170,172,180); doc.setFont('helvetica','normal');
    doc.text(auditUrl, W - M, H - 6, { align:'right' });
    doc.text(new Date().toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}), M, H - 6);
    doc.setDrawColor(220,222,228); doc.setLineWidth(0.2);
    doc.line(M, H - 10, W - M, H - 10);
  }
  function checkPageBreak(needed) { if (y + needed > H - 18) addPage(); }
  function addLogoToDoc(b64, x, yPos, maxW, maxH, alignRight) {
    try {
      const props = doc.getImageProperties(b64);
      const ratio = props.width / props.height;
      let w = maxW, h = maxW / ratio;
      if (h > maxH) { h = maxH; w = maxH * ratio; }
      const drawX = alignRight ? x - w : x;
      doc.addImage(b64.split(',')[1], 'PNG', drawX, yPos, w, h);
      return { w, h };
    } catch { return { w:0, h:0 }; }
  }

  // ── Executive Insight Generator ────────────────────────────────────────────
  function generateInsight() {
    const evaluated = score.categories.filter(c => c.evaluated > 0);
    if (evaluated.length === 0) return null;
    const overall  = score.weighted;
    const weakest  = evaluated.reduce((a,b) => b.score < a.score ? b : a);
    const critFails = AUDIT_CATEGORIES.flatMap(cat => cat.sections.flatMap(sec =>
      sec.items.filter(it => results[it.id] === 'Fail' && it.priority === 'Critical')
    )).length;
    const highFails = AUDIT_CATEGORIES.flatMap(cat => cat.sections.flatMap(sec =>
      sec.items.filter(it => results[it.id] === 'Fail' && it.priority === 'High')
    )).length;
    const totalFails = score.categories.reduce((s,c) => s + c.failed, 0);
    const healthLabel = overall >= 80 ? 'strong' : overall >= 60 ? 'moderate' : overall >= 40 ? 'needs significant improvement' : 'in critical condition';
    let urgency = '';
    if (critFails > 0)      urgency = `${critFails} critical issue${critFails>1?'s':''} require immediate attention.`;
    else if (highFails > 0) urgency = `${highFails} high-priority issue${highFails>1?'s':''} were identified.`;
    else if (totalFails > 0) urgency = `${totalFails} item${totalFails>1?'s':''} failed across the reviewed sections.`;
    else urgency = 'No failed items found — focus on completing unevaluated sections.';
    const weakestLabel = weakest.label.replace('AI & SERP Visibility','AI Visibility');
    return `This website has a ${healthLabel} overall score of ${overall}/100 (Grade ${score.grade}). The area requiring most attention is ${weakestLabel} (${weakest.score}/100). ${urgency} Prioritise the Top Priority Issues below, then work through each category section.`;
  }

  // ── PAGE 1: COVER ──────────────────────────────────────────────────────────
  const headerH = 50;
  doc.setFillColor(...brandRgb);
  doc.rect(0, 0, W, 36, 'F');
  const darkRgb = brandRgb.map(v => Math.max(0, Math.round(v * 0.72)));
  doc.setFillColor(...darkRgb);
  doc.rect(0, 36, W, headerH - 36, 'F');
  if (clientLogo) addLogoToDoc(clientLogo, W - M, 4, 36, 13, true);
  doc.setTextColor(255,255,255);
  doc.setFontSize(clientName ? 16 : 18); doc.setFont('helvetica','bold');
  doc.text(clientName || config.agencyName, M, 14);
  doc.setFontSize(8.5); doc.setFont('helvetica','normal');
  doc.text('UX + SEO Audit Report', M, 23);
  doc.setFontSize(7); doc.setTextColor(210,225,240);
  doc.text(auditUrl, M, 31);
  doc.setFontSize(6); doc.setTextColor(180,200,220);
  doc.text('Powered by', M, 43);
  if (agencyLogo) {
    addLogoToDoc(agencyLogo, M + 22, 38, 30, 9, false);
  } else {
    doc.setFontSize(7.5); doc.setFont('helvetica','bold'); doc.setTextColor(230,238,248);
    doc.text(config.agencyName, M + 22, 43);
    doc.setFont('helvetica','normal');
  }

  // ── Prepared by / for ─────────────────────────────────────────────────────
  y = headerH + 6;
  const halfW = (W - 2*M - 4) / 2;
  doc.setFillColor(245,247,251);
  doc.roundedRect(M, y, W - 2*M, 22, 2, 2, 'F');
  doc.setDrawColor(215,220,232); doc.setLineWidth(0.2);
  doc.roundedRect(M, y, W - 2*M, 22, 2, 2, 'S');
  // Left: Prepared by
  doc.setFontSize(6); doc.setFont('helvetica','bold'); doc.setTextColor(155,160,178);
  doc.text('PREPARED BY', M + 5, y + 6);
  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(25,30,48);
  doc.text(config.agencyName, M + 5, y + 12);
  if (agencyTitle) { doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(90,95,115); doc.text(agencyTitle, M + 5, y + 17); }
  const contactLine = [agencyWebsite, agencyEmail].filter(Boolean).join('  ·  ');
  if (contactLine) { doc.setFontSize(7); doc.setTextColor(125,130,150); doc.text(contactLine, M + 5, agencyTitle ? y + 21 : y + 17); }
  // Divider
  doc.setDrawColor(210,215,228); doc.line(M + halfW + 2, y + 4, M + halfW + 2, y + 19);
  // Right: Prepared for
  const rx = M + halfW + 6;
  doc.setFontSize(6); doc.setFont('helvetica','bold'); doc.setTextColor(155,160,178);
  doc.text('PREPARED FOR', rx, y + 6);
  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(25,30,48);
  doc.text(clientName || '—', rx, y + 12);
  doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(90,95,115);
  const urlShort = auditUrl.replace(/https?:\/\/(www\.)?/, '');
  doc.text(urlShort, rx, y + 17);
  doc.setFontSize(6); doc.setTextColor(155,160,178);
  doc.text(new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}), W - M, y + 6, {align:'right'});

  // ── Overall score box ─────────────────────────────────────────────────────
  y += 28;
  doc.setFillColor(...brandLight);
  doc.roundedRect(M, y, W - 2*M, 28, 3, 3, 'F');
  doc.setDrawColor(...brandRgb); doc.setLineWidth(0.35);
  doc.roundedRect(M, y, W - 2*M, 28, 3, 3, 'S');
  doc.setFontSize(28); doc.setFont('helvetica','bold'); doc.setTextColor(...brandRgb);
  doc.text(`${score.weighted}`, M + 14, y + 20);
  doc.setFontSize(10); doc.setTextColor(...brandRgb);
  doc.text('/100', M + 36, y + 20);
  doc.setFontSize(13); doc.setTextColor(50,55,65);
  doc.text(`Grade ${score.grade}`, M + 72, y + 13);
  doc.setFontSize(9); doc.setTextColor(95,100,115); doc.setFont('helvetica','normal');
  doc.text(score.rating, M + 72, y + 21);
  const confColor = score.confidence === 'High' ? [5,150,105] : score.confidence === 'Medium' ? [14,165,233] : [245,158,11];
  doc.setFontSize(6.5); doc.setFont('helvetica','bold'); doc.setTextColor(...confColor);
  doc.text(`${score.confidence} Confidence · ${score.completionPct}% reviewed`, W - M - 4, y + 7, {align:'right'});

  // ── Section Scores ────────────────────────────────────────────────────────
  y += 34;
  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(30,35,45);
  doc.text('Section Scores', M, y);
  y += 5;
  const numCats = score.categories.length;
  const catGap  = 3;
  const catBoxW = (W - 2*M - catGap * (numCats-1)) / numCats;
  score.categories.forEach((cat, i) => {
    const x       = M + i * (catBoxW + catGap);
    const catRgb  = hexToRgb(cat.color);
    const catLite = lighten(catRgb, 0.92);
    const noData  = cat.evaluated === 0;
    doc.setFillColor(...(noData ? [244,245,250] : catLite));
    doc.roundedRect(x, y, catBoxW, 28, 2, 2, 'F');
    doc.setDrawColor(...(noData ? [210,215,225] : catRgb)); doc.setLineWidth(0.25);
    doc.roundedRect(x, y, catBoxW, 28, 2, 2, 'S');
    doc.setFontSize(noData ? 8 : 17); doc.setFont('helvetica','bold');
    doc.setTextColor(...(noData ? [185,190,205] : catRgb));
    doc.text(noData ? '—' : `${cat.score}`, x + catBoxW/2, noData ? y + 13 : y + 13, {align:'center'});
    doc.setFontSize(5.5); doc.setFont('helvetica','normal');
    doc.setTextColor(noData ? 175 : 75, noData ? 180 : 75, noData ? 198 : 75);
    const lbl = cat.label.replace('Technical SEO','Tech SEO').replace('On-Page & Content','On-Page')
      .replace('UX Heuristics','UX').replace('Conversion & CTA','CRO').replace('AI & SERP Visibility','AI/SERP');
    doc.text(lbl, x + catBoxW/2, y + 19, {align:'center'});
    if (!noData) {
      doc.setFontSize(6.5); doc.setFont('helvetica','bold'); doc.setTextColor(...catRgb);
      doc.text(`Grade ${cat.grade}`, x + catBoxW/2, y + 25, {align:'center'});
    } else {
      doc.setFontSize(5.5); doc.setFont('helvetica','italic'); doc.setTextColor(175,180,198);
      doc.text('Not evaluated', x + catBoxW/2, y + 24, {align:'center'});
    }
  });

  // ── Executive Insight ─────────────────────────────────────────────────────
  y += 34;
  const insight = generateInsight();
  if (insight) {
    const insightLines = doc.splitTextToSize(insight, W - 2*M - 10);
    const insightH = Math.max(18, 11 + insightLines.length * 4.2);
    doc.setFillColor(...brandLight);
    doc.roundedRect(M, y, W - 2*M, insightH, 2, 2, 'F');
    doc.setFillColor(...brandRgb);
    doc.roundedRect(M, y, 2.5, insightH, 1, 0, 'F');
    doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(...brandRgb);
    doc.text('Executive Summary', M + 6, y + 6);
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(45,50,65);
    doc.text(insightLines, M + 6, y + 12);
    y += insightH + 5;
  }

  // ── Audit Summary stats ───────────────────────────────────────────────────
  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(30,35,45);
  doc.text('Audit Summary', M, y);
  y += 5;
  const totalPass    = score.categories.reduce((s,c) => s + c.passed,  0);
  const totalFail    = score.categories.reduce((s,c) => s + c.failed,  0);
  const totalPartial = score.categories.reduce((s,c) => s + c.partial, 0);
  const totalItems   = score.categories.reduce((s,c) => s + c.total,   0);
  const statW = (W - 2*M - 9) / 4;
  [{label:'Total Items',value:`${totalItems}`,color:[40,42,55]},
   {label:'Passed',     value:`${totalPass}`, color:STATUS_COLORS_PDF.Pass},
   {label:'Partial',    value:`${totalPartial}`,color:STATUS_COLORS_PDF.Partial},
   {label:'Failed',     value:`${totalFail}`, color:STATUS_COLORS_PDF.Fail}
  ].forEach((stat, i) => {
    const x = M + i * (statW + 3);
    doc.setFillColor(244,246,250);
    doc.roundedRect(x, y, statW, 17, 2, 2, 'F');
    doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(...stat.color);
    doc.text(stat.value, x + statW/2, y + 9.5, {align:'center'});
    doc.setFontSize(6); doc.setFont('helvetica','normal'); doc.setTextColor(120,125,140);
    doc.text(stat.label, x + statW/2, y + 14.5, {align:'center'});
  });
  y += 21;

  // ── Top Priority Issues ───────────────────────────────────────────────────
  const PSCORE_PDF = { Critical:4, High:3, Medium:2, Low:1 };
  const priorityFails = AUDIT_CATEGORIES.flatMap(cat =>
    cat.sections.flatMap(sec => sec.items
      .filter(it => results[it.id] === 'Fail')
      .map(it => ({ ...it, catLabel:cat.label, catRgb:hexToRgb(cat.color) }))
    )
  ).sort((a,b) => (PSCORE_PDF[b.priority]??0) - (PSCORE_PDF[a.priority]??0));

  if (priorityFails.length > 0) {
    doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(30,35,45);
    doc.text('Top Priority Issues', M, y);
    doc.setFontSize(6); doc.setFont('helvetica','normal'); doc.setTextColor(155,160,178);
    doc.text(`${priorityFails.length} issue${priorityFails.length>1?'s':''} · sorted by impact`, W - M, y, {align:'right'});
    y += 4;
    doc.setDrawColor(215,218,228); doc.setLineWidth(0.2);
    doc.line(M, y, W - M, y);
    y += 3;

    priorityFails.slice(0, 8).forEach((item, i) => {
      const rowH = 17;
      checkPageBreak(rowH + 2);
      if (i % 2 === 0) { doc.setFillColor(247,248,252); doc.rect(M, y, W - 2*M, rowH, 'F'); }
      // Category dot
      doc.setFillColor(...item.catRgb);
      doc.circle(M + 3, y + rowH/2, 1.5, 'F');
      // Priority badge
      const bCol = item.priority==='Critical'?[214,45,60]:item.priority==='High'?[210,115,5]:item.priority==='Medium'?[12,155,220]:[14,180,120];
      doc.setFillColor(...bCol);
      doc.roundedRect(M + 7, y + 2, 20, 4.5, 1, 1, 'F');
      doc.setFontSize(5); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
      doc.text(item.priority.toUpperCase(), M + 17, y + 5.2, {align:'center'});
      // Category tag
      const shortCat = item.catLabel.replace('Technical SEO','Tech SEO').replace('On-Page & Content','On-Page')
        .replace('UX Heuristics','UX').replace('Conversion & CTA','CRO').replace('AI & SERP Visibility','AI/SERP');
      doc.setFontSize(5.5); doc.setFont('helvetica','normal'); doc.setTextColor(...item.catRgb);
      doc.text(shortCat, M + 30, y + 5.2);
      // Item title
      doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(25,30,45);
      const titleLine = doc.splitTextToSize(item.item, W - 2*M - 34);
      doc.text(titleLine[0], M + 30, y + 10.5);
      // HowTo hint
      doc.setFontSize(6.5); doc.setFont('helvetica','normal'); doc.setTextColor(100,105,122);
      const howLine = doc.splitTextToSize(item.howTo, W - 2*M - 34);
      doc.text(howLine[0], M + 30, y + 14.8);
      y += rowH;
    });
    if (priorityFails.length > 8) {
      doc.setFontSize(6.5); doc.setFont('helvetica','italic'); doc.setTextColor(160,165,182);
      doc.text(`+ ${priorityFails.length - 8} more issues in the detailed sections below.`, M + 7, y + 4);
      y += 7;
    }
  }
  drawFooter();

  // ── CATEGORY DETAIL PAGES ──────────────────────────────────────────────────
  AUDIT_CATEGORIES.forEach(cat => {
    addPage();
    const catColor = hexToRgb(cat.color);
    const catDark  = catColor.map(v => Math.max(0, Math.round(v * 0.72)));
    doc.setFillColor(...catColor);
    doc.rect(0, 0, W, 18, 'F');
    doc.setFillColor(...catDark);
    doc.rect(0, 18, W, 8, 'F');
    doc.setTextColor(255,255,255); doc.setFontSize(13); doc.setFont('helvetica','bold');
    doc.text(`${cat.icon}  ${cat.label}`, M, 13);
    const catScore = score.categories.find(c => c.id === cat.id);
    // AI Visibility NEW badge
    if (cat.id === 'serp') {
      doc.setFillColor(255,255,255);
      doc.roundedRect(W - M - 16, 5.5, 13, 5, 1, 1, 'F');
      doc.setFontSize(5); doc.setFont('helvetica','bold'); doc.setTextColor(...catColor);
      doc.text('NEW', W - M - 9.5, 9.2, {align:'center'});
    }
    // Score + evaluation state
    if (catScore) {
      const scoreStr = catScore.evaluated > 0
        ? `${catScore.score}/100 — Grade ${catScore.grade}`
        : 'Not evaluated';
      const scoreX = cat.id === 'serp' ? W - M - 20 : W - M;
      doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
      doc.text(scoreStr, scoreX, 13, {align:'right'});
      // Low confidence warning
      if (catScore.evaluated > 0 && catScore.evaluated < catScore.total * 0.3) {
        doc.setFontSize(6); doc.setFont('helvetica','italic'); doc.setTextColor(230,215,165);
        doc.text(`Low confidence — only ${catScore.evaluated}/${catScore.total} items reviewed`, M, 22.5);
      }
    }
    // AI Visibility subtitle
    if (cat.id === 'serp') {
      doc.setFontSize(6.5); doc.setFont('helvetica','italic'); doc.setTextColor(210,230,248);
      doc.text('Optimize your presence in ChatGPT, Perplexity, Gemini & next-gen search engines', M, 22.5);
    }
    doc.setFillColor(...brandRgb); doc.rect(0, 26, W, 0.7, 'F');
    y = 32;

    cat.sections.forEach(sec => {
      checkPageBreak(20);
      doc.setFillColor(...lighten(catColor, 0.88));
      doc.rect(M, y, W - 2*M, 8, 'F');
      doc.setFontSize(8.5); doc.setFont('helvetica','bold'); doc.setTextColor(...catColor);
      doc.text(sec.label, M + 3, y + 5.5);
      if (sec.advanced) {
        doc.setFontSize(5); doc.setFont('helvetica','bold');
        doc.text('ADVANCED', W - M - 3, y + 5.5, {align:'right'});
      }
      y += 9;
      // GEO section subtitle
      if (sec.id === 'geo') {
        doc.setFontSize(6.5); doc.setFont('helvetica','italic'); doc.setTextColor(120,130,152);
        doc.text('AI brand visibility in ChatGPT, Perplexity, Gemini & Knowledge Graph', M + 3, y + 3.5);
        y += 6;
      }

      const visibleItems = sec.items.filter(it => results[it.id] !== 'N/A');
      const naCount = sec.items.length - visibleItems.length;

      visibleItems.forEach((item, idx) => {
        checkPageBreak(10);
        const status = results[item.id] || 'Blank';
        const statusColor = STATUS_COLORS_PDF[status] || [160,165,180];
        if (idx % 2 === 0) { doc.setFillColor(247,248,252); doc.rect(M, y, W - 2*M, 8, 'F'); }
        // Fail row highlight
        if (status === 'Fail') {
          doc.setFillColor(252,245,246); doc.rect(M, y, 2, 8, 'F');
        }
        doc.setFontSize(6.5); doc.setFont('helvetica','bold'); doc.setTextColor(155,160,175);
        doc.text(`${item.num}`, M + 3, y + 5.5);
        doc.setFontSize(7.5); doc.setFont('helvetica', status === 'Fail' ? 'bold' : 'normal');
        doc.setTextColor(35,40,55);
        const itemText = doc.splitTextToSize(item.item, W - 2*M - 40);
        doc.text(itemText[0], M + 12, y + 5.5);
        doc.setFillColor(...statusColor);
        const badgeX = W - M - 22;
        doc.roundedRect(badgeX, y + 1.2, 20, 5.2, 2, 2, 'F');
        doc.setFontSize(6); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
        doc.text(status === 'Blank' ? 'Blank' : status, badgeX + 10, y + 4.9, {align:'center'});
        y += 8;
      });

      if (naCount > 0) {
        doc.setFontSize(6); doc.setFont('helvetica','italic'); doc.setTextColor(175,180,198);
        doc.text(`${naCount} non-applicable item${naCount>1?'s':''} excluded from this report.`, M + 3, y + 3.5);
        y += 6;
      }
      if (visibleItems.length === 0 && naCount > 0) {
        doc.setFontSize(7); doc.setFont('helvetica','italic'); doc.setTextColor(175,180,198);
        doc.text('All items in this section were marked N/A.', M + 3, y + 3.5);
        y += 6;
      }
      y += 3;
    });
  });

  // ── RECOMMENDED NEXT STEPS PAGE ────────────────────────────────────────────
  addPage();
  doc.setFillColor(...brandRgb);
  doc.rect(0, 0, W, 18, 'F');
  doc.setFillColor(...darkRgb);
  doc.rect(0, 18, W, 7, 'F');
  doc.setTextColor(255,255,255); doc.setFontSize(14); doc.setFont('helvetica','bold');
  doc.text('Recommended Next Steps', M, 13);
  doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(210,225,240);
  doc.text('A prioritised action plan based on this audit', M, 22.5);
  y = 34;

  const evaluatedCats = score.categories.filter(c => c.evaluated > 0);
  const weakestCat    = evaluatedCats.length > 0 ? evaluatedCats.reduce((a,b) => b.score < a.score ? b : a) : null;
  const critCount     = AUDIT_CATEGORIES.flatMap(cat => cat.sections.flatMap(sec =>
    sec.items.filter(it => results[it.id] === 'Fail' && it.priority === 'Critical')
  )).length;

  const steps = [
    critCount > 0
      ? { num:'1', title:`Fix ${critCount} Critical Issue${critCount>1?'s':''}`, body:'These failures have the highest impact on performance, user experience, and search visibility. Address them before anything else.', hot:true }
      : { num:'1', title:'Resolve All Failed Items', body:'Work through each failed item in the detailed sections. Sort by priority — Critical and High items first.', hot:false },
    weakestCat
      ? { num:'2', title:`Strengthen ${weakestCat.label.replace('AI & SERP Visibility','AI Visibility')} — Score: ${weakestCat.score}/100`, body:'This is the weakest area in the audit. A focused effort here will have the highest impact on overall site health and score.', hot:false }
      : { num:'2', title:'Complete Unevaluated Sections', body:'Several sections have not been fully reviewed. Complete them to get a reliable overall score and more actionable insights.', hot:false },
    { num:'3', title:'Work Through the Top Priority Issues', body:'Each priority issue in this report includes a specific how-to action. These are your clearest, most actionable next steps.', hot:false },
    { num:'4', title:'Strengthen AI Visibility & E-E-A-T', body:'AI search engines (ChatGPT, Perplexity, Google AI Overviews) increasingly drive organic traffic. Ensure your brand, authors, and content are optimised for this layer.', hot:false },
    { num:'5', title:'Re-run This Audit in 4–8 Weeks', body:'Track your progress by re-running the audit after implementing changes. Use the score difference to demonstrate the value of your work to stakeholders.', hot:false },
  ];

  steps.forEach((step) => {
    checkPageBreak(22);
    const stepH = 19;
    const sColor = step.hot ? [214,45,60] : brandRgb;
    const sBg    = step.hot ? [255,247,247] : brandLight;
    doc.setFillColor(...sBg);
    doc.roundedRect(M, y, W - 2*M, stepH, 2, 2, 'F');
    doc.setDrawColor(...sColor); doc.setLineWidth(0.2);
    doc.roundedRect(M, y, W - 2*M, stepH, 2, 2, 'S');
    doc.setFillColor(...sColor);
    doc.circle(M + 8, y + stepH/2, 4.5, 'F');
    doc.setFontSize(8.5); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
    doc.text(step.num, M + 8, y + stepH/2 + 3, {align:'center'});
    doc.setFontSize(8.5); doc.setFont('helvetica','bold'); doc.setTextColor(25,30,48);
    doc.text(step.title, M + 17, y + 8.5);
    doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(75,80,100);
    const bodyLines = doc.splitTextToSize(step.body, W - 2*M - 20);
    doc.text(bodyLines, M + 17, y + 14);
    y += stepH + 3;
  });

  y += 5;
  checkPageBreak(18);
  doc.setFillColor(...brandLight);
  doc.roundedRect(M, y, W - 2*M, 16, 2, 2, 'F');
  doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(...brandRgb);
  doc.text(`Questions? ${config.agencyName} is here to help.`, M + 5, y + 7);
  if (agencyEmail || agencyWebsite) {
    doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(80,90,112);
    doc.text([agencyEmail, agencyWebsite].filter(Boolean).join('  ·  '), M + 5, y + 13);
  }
  drawFooter();

  // ── ABOUT THIS REPORT PAGE ─────────────────────────────────────────────────
  addPage();
  doc.setFillColor(...brandRgb);
  doc.rect(0, 0, W, 18, 'F');
  doc.setFillColor(...darkRgb);
  doc.rect(0, 18, W, 7, 'F');
  doc.setTextColor(255,255,255); doc.setFontSize(14); doc.setFont('helvetica','bold');
  doc.text('About This Report', M, 13);
  y = 30;

  // Prepared by / for cards
  const cardW = (W - 2*M - 5) / 2;
  // Left card
  doc.setFillColor(244,246,252);
  doc.roundedRect(M, y, cardW, 38, 2, 2, 'F');
  doc.setFontSize(6.5); doc.setFont('helvetica','bold'); doc.setTextColor(150,155,175);
  doc.text('PREPARED BY', M + 5, y + 7);
  if (agencyLogo) {
    addLogoToDoc(agencyLogo, M + 5, y + 10, 30, 11, false);
    doc.setFontSize(9.5); doc.setFont('helvetica','bold'); doc.setTextColor(20,25,45);
    doc.text(config.agencyName, M + 5, y + 26);
  } else {
    doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(20,25,45);
    doc.text(config.agencyName, M + 5, y + 16);
  }
  if (agencyTitle)   { doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(85,90,112); doc.text(agencyTitle,   M + 5, agencyLogo ? y+31 : y+22); }
  if (agencyWebsite) { doc.setFontSize(7.5); doc.setTextColor(14,155,230);  doc.text(agencyWebsite, M + 5, agencyLogo ? y+35 : (agencyTitle ? y+27 : y+22)); }
  if (agencyEmail)   { doc.setFontSize(7.5); doc.setTextColor(85,90,112);   doc.text(agencyEmail,   M + 5, agencyLogo ? y+35+(agencyWebsite?5:0) : (agencyTitle&&agencyWebsite ? y+32 : agencyTitle ? y+27 : agencyWebsite ? y+27 : y+22)); }

  // Right card
  const rx2 = M + cardW + 5;
  doc.setFillColor(244,246,252);
  doc.roundedRect(rx2, y, cardW, 38, 2, 2, 'F');
  doc.setFontSize(6.5); doc.setFont('helvetica','bold'); doc.setTextColor(150,155,175);
  doc.text('PREPARED FOR', rx2 + 5, y + 7);
  if (clientLogo) {
    addLogoToDoc(clientLogo, rx2 + 5, y + 10, 30, 11, false);
    doc.setFontSize(9.5); doc.setFont('helvetica','bold'); doc.setTextColor(20,25,45);
    doc.text(clientName || '—', rx2 + 5, y + 26);
  } else {
    doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(20,25,45);
    doc.text(clientName || '—', rx2 + 5, y + 16);
  }
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(85,90,112);
  doc.text(auditUrl.replace(/https?:\/\/(www\.)?/,''), rx2 + 5, clientLogo ? y + 31 : y + 22);
  y += 44;

  // Disclaimer
  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(28,32,48);
  doc.text('About This Audit', M, y);
  y += 6;
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(85,90,112);
  const disclaimer = doc.splitTextToSize(
    `This UX + SEO audit was conducted for ${auditUrl} on ${new Date().toLocaleDateString()}. ` +
    `It covers ${score.categories.reduce((s,c)=>s+c.total,0)} checkpoints across Technical SEO, On-Page & Content, UX Heuristics, Conversion & CTA, and AI Visibility. ` +
    `Scores are based on evaluated items only — blank and N/A items are excluded from scoring. ` +
    `Some checks require verification with external tools (Google Search Console, PageSpeed Insights, Screaming Frog, etc.). ` +
    `This report is intended as a professional client deliverable and should be reviewed in the context of the site's specific goals.`,
    W - 2*M
  );
  doc.text(disclaimer, M, y);
  drawFooter();

  const safeClient = (clientName || auditUrl).replace(/https?:\/\//,'').replace(/[^a-zA-Z0-9.-]/g,'_');
  doc.save(`${config.agencyName.replace(/\s+/g,'_')}_Audit_${safeClient}.pdf`);
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const DARK_C = {
  bg: '#0A0E1A', surface: '#111827', surfaceHover: '#1a2235',
  border: '#1e2d45', accent: '#0EA5E9', accentDim: '#0c4a6e',
  green: '#10B981', amber: '#F59E0B', red: '#EF4444', purple: '#8B5CF6',
  text: '#F0F4FF', muted: '#6B7A99',
};
const LIGHT_C = {
  bg: '#F0F4F8', surface: '#FFFFFF', surfaceHover: '#F1F5F9',
  border: '#D1D9E6', accent: '#0284C7', accentDim: '#DBEAFE',
  green: '#059669', amber: '#B45309', red: '#DC2626', purple: '#6D28D9',
  text: '#0F172A', muted: '#64748B',
};
const C = { ...DARK_C };
const SEV = { Critical: '#EF4444', High: '#F59E0B', Medium: '#0EA5E9', Low: '#10B981' };
const STATUS_COLOR = { Pass: '#10B981', Partial: '#F59E0B', Fail: '#EF4444', 'N/A': '#6B7A99' };
const STATUS_BG    = { Pass: '#10B98122', Partial: '#F59E0B22', Fail: '#EF444422', 'N/A': '#6B7A9922' };

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 120, color = C.accent }) {
  const stroke = 10, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const grade = score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D';
  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize: size > 100 ? 28 : 18, fontWeight:800, color:C.text, lineHeight:1 }}>{score}</span>
        <span style={{ fontSize:11, color, fontWeight:700 }}>Grade {grade}</span>
      </div>
    </div>
  );
}

function Sidebar({ page, setPage, isDark, onToggleTheme }) {
  const nav = [
    { id:'dashboard', icon:'▦', label:'Dashboard' },
    { id:'audit',     icon:'◎', label:'New Audit' },
    { id:'whitelabel',icon:'◈', label:'White Label' },
  ];
  return (
    <div style={{ width:220, background:C.surface, borderRight:`1px solid ${C.border}`,
      display:'flex', flexDirection:'column', height:'100vh', flexShrink:0 }}>
      <div style={{ padding:'24px 24px 20px', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontSize:16, fontWeight:800, color:C.text }}>
          <span style={{ color:C.accent }}>Audit</span>Pro
        </div>
        <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>UX + SEO Intelligence</div>
      </div>
      <nav style={{ padding:'16px 12px', flex:1 }}>
        {nav.map(n => (
          <div key={n.id} onClick={() => setPage(n.id)} style={{
            display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
            borderRadius:8, cursor:'pointer', marginBottom:2,
            background: page === n.id ? `${C.accent}18` : 'transparent',
            color: page === n.id ? C.accent : C.muted }}>
            <span style={{ fontSize:14, width:18, textAlign:'center' }}>{n.icon}</span>
            <span style={{ fontSize:13, fontWeight: page === n.id ? 600 : 400 }}>{n.label}</span>
          </div>
        ))}
        <div style={{ borderTop:`1px solid ${C.border}`, margin:'10px 0' }} />
        <div style={{ display:'flex', background:C.bg, border:`1px solid ${C.border}`,
          borderRadius:8, padding:3, gap:2 }}>
          <button onClick={() => !isDark && onToggleTheme()} style={{
            flex:1, padding:'6px 0', borderRadius:6, border:'none', cursor:'pointer',
            background: isDark ? C.surface : 'transparent',
            color: isDark ? C.text : C.muted,
            fontSize:12, fontWeight: isDark ? 600 : 400 }}>🌙 Dark</button>
          <button onClick={() => isDark && onToggleTheme()} style={{
            flex:1, padding:'6px 0', borderRadius:6, border:'none', cursor:'pointer',
            background: !isDark ? C.surface : 'transparent',
            color: !isDark ? C.text : C.muted,
            fontSize:12, fontWeight: !isDark ? 600 : 400 }}>☀️ Light</button>
        </div>
      </nav>
      <div style={{ padding:'12px 16px', borderTop:`1px solid ${C.border}` }}>
        <div style={{ fontSize:10, color:C.muted, textAlign:'center' }}>AuditPro v2.5</div>
      </div>
    </div>
  );
}

// ─── HOLD BUTTON (hold 2s to confirm) ────────────────────────────────────────
function HoldButton({ onConfirm, label, holdLabel, duration = 2000, style: extStyle = {} }) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const startRef    = useRef(null);

  const start = (e) => {
    e.stopPropagation();
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const pct = Math.min((Date.now() - startRef.current) / duration * 100, 100);
      setProgress(pct);
      if (pct >= 100) { clearInterval(intervalRef.current); setProgress(0); onConfirm(); }
    }, 16);
  };
  const cancel = (e) => {
    e && e.stopPropagation();
    clearInterval(intervalRef.current);
    setProgress(0);
  };

  return (
    <button
      onMouseDown={start} onMouseUp={cancel} onMouseLeave={cancel}
      onTouchStart={start} onTouchEnd={cancel}
      style={{ position:'relative', overflow:'hidden', userSelect:'none', ...extStyle }}>
      {progress > 0 && (
        <div style={{ position:'absolute', left:0, top:0, height:'100%',
          width:`${progress}%`, background:'rgba(255,255,255,0.25)', transition:'none', pointerEvents:'none' }} />
      )}
      <span style={{ position:'relative', pointerEvents:'none' }}>
        {progress > 0 ? (holdLabel || '…') : label}
      </span>
    </button>
  );
}

// ─── CLEAR ALL MODAL (type DELETE to confirm) ─────────────────────────────────
function ClearAllModal({ count, onConfirm, onCancel }) {
  const [input, setInput] = useState('');
  const valid = input.trim() === 'DELETE';
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background:C.surface, border:`1px solid ${C.border}`, borderRadius:14,
        padding:32, width:400, boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize:20, marginBottom:8 }}>🗑️</div>
        <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:8 }}>Delete all audit data?</div>
        <div style={{ fontSize:13, color:C.muted, lineHeight:1.6, marginBottom:20 }}>
          This will permanently remove <strong style={{ color:C.text }}>{count} project{count !== 1 ? 's' : ''}</strong> and
          all audit results. <span style={{ color:C.red }}>This action cannot be undone.</span>
        </div>
        <div style={{ fontSize:11, color:C.muted, marginBottom:6, fontWeight:600 }}>
          Type <strong style={{ color:C.red, letterSpacing:2 }}>DELETE</strong> to confirm
        </div>
        <input
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="DELETE"
          style={{ width:'100%', boxSizing:'border-box', background:C.bg,
            border:`1px solid ${valid ? C.red : C.border}`, borderRadius:8,
            padding:'10px 14px', color:C.text, fontSize:14, outline:'none',
            letterSpacing:2, fontWeight:700, marginBottom:16 }} />
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, background:'transparent',
            border:`1px solid ${C.border}`, borderRadius:8, padding:'10px',
            color:C.muted, fontSize:13, cursor:'pointer' }}>Cancel</button>
          <button onClick={() => valid && onConfirm()} disabled={!valid} style={{
            flex:1, background: valid ? C.red : C.border, border:'none', borderRadius:8,
            padding:'10px', color:'#fff', fontSize:13, fontWeight:700,
            cursor: valid ? 'pointer' : 'not-allowed', opacity: valid ? 1 : 0.5 }}>
            Delete Everything
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryDetail({ catId, results, onClose }) {
  const cat = AUDIT_CATEGORIES.find(c => c.id === catId);
  const [filter, setFilter] = useState('all');
  const allItems = cat.sections.flatMap(s => s.items);
  const filtered = filter === 'all' ? allItems : allItems.filter(i => (results[i.id] ?? 'none') === filter);
  const counts = {
    Pass:    allItems.filter(i => results[i.id] === 'Pass').length,
    Partial: allItems.filter(i => results[i.id] === 'Partial').length,
    Fail:    allItems.filter(i => results[i.id] === 'Fail').length,
    'N/A':   allItems.filter(i => results[i.id] === 'N/A').length,
  };
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000,
      display:'flex', alignItems:'flex-start', justifyContent:'flex-end' }} onClick={onClose}>
      <div style={{ width:700, height:'100vh', background:C.surface, overflowY:'auto',
        borderLeft:`1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:'24px 28px', borderBottom:`1px solid ${C.border}`,
          display:'flex', justifyContent:'space-between', alignItems:'center',
          position:'sticky', top:0, background:C.surface, zIndex:10 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:C.text }}>{cat.icon} {cat.label}</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>
              {allItems.length} items · {counts.Pass} pass · {counts.Fail} fail · {counts.Partial} partial
            </div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:`1px solid ${C.border}`,
            borderRadius:8, padding:'6px 14px', color:C.muted, fontSize:13, cursor:'pointer' }}>✕ Close</button>
        </div>
        <div style={{ padding:'16px 28px', borderBottom:`1px solid ${C.border}`, display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            {key:'all',     label:`All (${allItems.length})`,   color:C.accent},
            {key:'Fail',    label:`Fail (${counts.Fail})`,       color:C.red},
            {key:'Partial', label:`Partial (${counts.Partial})`, color:C.amber},
            {key:'Pass',    label:`Pass (${counts.Pass})`,       color:C.green},
            {key:'N/A',     label:`N/A (${counts['N/A']})`,      color:C.muted},
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer',
              border:`1px solid ${filter === f.key ? f.color : C.border}`,
              background: filter === f.key ? `${f.color}22` : 'transparent',
              color: filter === f.key ? f.color : C.muted }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ padding:'16px 28px' }}>
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 0', color:C.muted }}>No items match this filter</div>
          )}
          {filtered.map(item => {
            const status = results[item.id];
            return (
              <div key={item.id} style={{ marginBottom:10, borderRadius:10,
                border:`1px solid ${status ? `${STATUS_COLOR[status]}44` : C.border}`,
                background: status ? STATUS_BG[status] : `${C.bg}88` }}>
                <div style={{ padding:'14px 18px', display:'flex', alignItems:'flex-start', gap:14 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0,
                    background:`${SEV[item.priority]}22`, border:`1px solid ${SEV[item.priority]}44`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:10, fontWeight:700, color:SEV[item.priority] }}>{item.num}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                      <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{item.item}</span>
                      <span style={{ fontSize:10, color:SEV[item.priority], fontWeight:700,
                        textTransform:'uppercase', background:`${SEV[item.priority]}22`,
                        padding:'2px 8px', borderRadius:10 }}>{item.priority}</span>
                    </div>
                    <div style={{ fontSize:11, color:C.muted, lineHeight:1.6, fontStyle:'italic' }}>
                      💡 {item.howTo}
                    </div>
                  </div>
                  {status && (
                    <div style={{ flexShrink:0, padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700,
                      background:STATUS_BG[status], color:STATUS_COLOR[status],
                      border:`1px solid ${STATUS_COLOR[status]}44` }}>
                      {status === 'Pass' ? '✓ Pass' : status === 'Fail' ? '✗ Fail' : status === 'Partial' ? '~ Partial' : '○ N/A'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DashboardView({ score, auditUrl, results, setPage, onEdit, audits, onSelectAudit }) {
  const [detailCat, setDetailCat] = useState(null);
  const [issueFilter, setIssueFilter] = useState(null);
  const issuesRef = useRef(null);

  const totalAll      = AUDIT_CATEGORIES.flatMap(c => c.sections.flatMap(s => s.items)).length;
  const totalEval     = score?.totalEvaluated ?? 0;
  const completionPct = score?.completionPct  ?? 0;
  const confidence    = score?.confidence     ?? 'Low';
  const naCount       = Object.values(results).filter(v => v === 'N/A').length;
  const onlyNA        = totalEval === 0 && naCount > 0;
  const nothingDone   = totalEval === 0 && naCount === 0;
  const justStarted   = totalEval > 0 && totalEval <= 2;
  const firstIsFail   = totalEval === 1 && Object.values(results).find(v => v !== 'N/A') === 'Fail';
  const activeId      = audits?.find(a => a.url === auditUrl)?.id;
  const confidenceColor = confidence === 'High' ? C.green : confidence === 'Medium' ? C.accent : C.amber;

  // Smart message
  const smartMsg = nothingDone  ? { text: "Start your audit to unlock your site's performance score.", icon: '🚀' }
    : onlyNA     ? { text: 'No applicable checkpoints reviewed yet. Try marking some items.', icon: '💡' }
    : firstIsFail? { text: "Good start — you've found your first issue. Keep going!", icon: '💪' }
    : justStarted? { text: 'Keep going to get a clearer picture of your site.', icon: '📈' }
    : null;

  // All items with status for filter
  const PSCORE = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  const allItems = AUDIT_CATEGORIES.flatMap(cat => cat.sections.flatMap(sec =>
    sec.items.map(it => ({ ...it, category: cat.label, catColor: cat.color, status: results[it.id] || null }))
  ));
  const failItems    = allItems.filter(it => it.status === 'Fail').sort((a,b) => (PSCORE[b.priority]??0)-(PSCORE[a.priority]??0));
  const partialItems = allItems.filter(it => it.status === 'Partial').sort((a,b) => (PSCORE[b.priority]??0)-(PSCORE[a.priority]??0));
  const blankItems   = allItems.filter(it => !it.status);
  const filteredIssues = issueFilter === 'Fail' ? failItems : issueFilter === 'Partial' ? partialItems : issueFilter === 'Blank' ? blankItems : [];

  const scrollToIssues = (filter) => { setIssueFilter(filter); setTimeout(() => issuesRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 50); };

  const FILTER_TABS = [
    { key:'Fail',    label:`Fail`,    count: failItems.length,    color: C.red    },
    { key:'Partial', label:`Partial`, count: partialItems.length, color: C.amber  },
    { key:'Blank',   label:`Blank`,   count: blankItems.length,   color: C.muted  },
  ];

  if (!score && Object.keys(results).length === 0) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:48 }}>📊</div>
      <div style={{ fontSize:16, fontWeight:600, color:C.text }}>No audit yet</div>
      <div style={{ fontSize:13, color:C.muted, marginBottom:8 }}>Run your first audit to see results</div>
      <button onClick={() => setPage('audit')} style={{ background:C.accent, border:'none',
        borderRadius:8, padding:'10px 24px', color:'#fff', fontWeight:600, fontSize:14, cursor:'pointer' }}>
        Start First Audit →
      </button>
    </div>
  );

  return (
    <div style={{ padding:'28px 36px', flex:1, overflowY:'auto' }}>
      {detailCat && <CategoryDetail catId={detailCat} results={results} onClose={() => setDetailCat(null)} />}

      {/* Header row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:6 }}>Audit Dashboard</h1>
          {audits && audits.length > 1 ? (
            <select value={activeId || ''} onChange={e => { const a = audits.find(x => x.id === e.target.value); if (a) onSelectAudit(a); }}
              style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                padding:'7px 12px', color:C.text, fontSize:13, cursor:'pointer', maxWidth:340, outline:'none' }}>
              {audits.map(a => (
                <option key={a.id} value={a.id}>{a.clientName ? `${a.clientName} — ` : ''}{a.url} (Grade {a.score.grade})</option>
              ))}
            </select>
          ) : (
            <div style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>{auditUrl}</div>
          )}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onEdit} style={{ background:'transparent', border:`1px solid ${C.border}`,
            borderRadius:8, padding:'8px 16px', color:C.muted, fontSize:13, fontWeight:600, cursor:'pointer' }}>✎ Edit</button>
          <button onClick={() => setPage('audit')} style={{ background:C.accent, border:'none',
            borderRadius:8, padding:'8px 16px', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>+ New Audit</button>
        </div>
      </div>

      {/* Smart message banner */}
      {smartMsg && (
        <div style={{ background:`${C.accent}15`, border:`1px solid ${C.accent}44`, borderRadius:10,
          padding:'12px 18px', marginBottom:18, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>{smartMsg.icon}</span>
          <span style={{ fontSize:13, color:C.text }}>{smartMsg.text}</span>
          {nothingDone && <button onClick={onEdit} style={{ marginLeft:'auto', background:C.accent,
            border:'none', borderRadius:7, padding:'6px 14px', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            Start Audit →
          </button>}
        </div>
      )}

      {/* Top metrics row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:20 }}>
        {/* Score */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px 20px' }}>
          <div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Audit Score</div>
          <div style={{ fontSize:36, fontWeight:800, color: totalEval > 0 ? C.accent : C.muted, lineHeight:1 }}>
            {totalEval > 0 ? `${score.weighted}%` : '—'}
          </div>
          <div style={{ fontSize:12, color:C.muted, marginTop:6 }}>
            {totalEval > 0 ? `Grade ${score.grade} · ${score.rating}` : 'No items reviewed yet'}
          </div>
        </div>
        {/* Completion — click to see blank items */}
        <div onClick={() => scrollToIssues('Blank')}
          style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px 20px', cursor:'pointer' }}>
          <div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Completion</div>
          <div style={{ fontSize:36, fontWeight:800, color:C.text, lineHeight:1 }}>{completionPct}<span style={{ fontSize:18 }}>%</span></div>
          <div style={{ marginTop:10, background:C.border, borderRadius:4, height:5 }}>
            <div style={{ height:5, borderRadius:4, background:C.accent, width:`${completionPct}%`, transition:'width 0.4s ease' }} />
          </div>
          <div style={{ fontSize:11, color:C.muted, marginTop:5 }}>
            {totalEval} / {totalAll} items
            {blankItems.length > 0 && <span style={{ color:C.accent }}> · {blankItems.length} remaining ↓</span>}
          </div>
        </div>
        {/* Issues Found — clickable + smooth scroll */}
        <div onClick={() => scrollToIssues('Fail')}
          style={{ background:C.surface, border:`1px solid ${failItems.length > 0 ? C.red+'44' : C.border}`,
            borderRadius:12, padding:'18px 20px', cursor:'pointer', transition:'border-color 0.15s' }}>
          <div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Issues Found</div>
          <div style={{ fontSize:36, fontWeight:800, color: failItems.length > 0 ? C.red : C.muted, lineHeight:1 }}>{failItems.length}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>
            {partialItems.length > 0 && <span style={{ color:C.amber }}>{partialItems.length} partial · </span>}
            <span style={{ color:C.accent }}>view details ↓</span>
          </div>
        </div>
        {/* Confidence */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px 20px' }}>
          <div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Confidence</div>
          <div style={{ fontSize:36, fontWeight:800, color:confidenceColor, lineHeight:1 }}>{confidence}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>
            {confidence === 'Low' && 'Review more items for reliable results'}
            {confidence === 'Medium' && 'Good coverage — keep going'}
            {confidence === 'High' && 'Strong coverage — results are reliable'}
          </div>
        </div>
      </div>

      {/* Category cards */}
      {score && (() => {
        const evaluated = score.categories.filter(c => c.evaluated > 0);
        const weakestId = evaluated.length > 0
          ? evaluated.reduce((a, b) => b.score < a.score ? b : a).id
          : null;
        return (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12, marginBottom:20 }}>
            {score.categories.map(cat => {
              const isWeakest = cat.id === weakestId;
              return (
                <div key={cat.id} onClick={() => setDetailCat(cat.id)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = cat.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = isWeakest ? C.red : C.border}
                  style={{ background:C.surface,
                    border:`1px solid ${isWeakest ? C.red : C.border}`,
                    borderRadius:12, padding:'14px 16px', cursor:'pointer',
                    transition:'border-color 0.15s',
                    boxShadow: isWeakest ? `0 0 0 2px ${C.red}33` : 'none' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:'uppercase', flex:1, lineHeight:1.3 }}>
                      {cat.icon} {cat.label.replace('Technical SEO','Tech SEO').replace('On-Page & Content','On-Page').replace('UX Heuristics','UX').replace('Conversion & CTA','CRO').replace('AI & SERP Visibility','AI/SERP')}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, flexShrink:0 }}>
                      {isWeakest && (
                        <span style={{ fontSize:8, fontWeight:800, padding:'1px 5px', borderRadius:3,
                          background:`${C.red}22`, color:C.red, letterSpacing:'0.5px' }}>WEAKEST</span>
                      )}
                      <div style={{ background:`${cat.color}22`, borderRadius:6, padding:'2px 8px',
                        fontSize:14, fontWeight:800, color:cat.color }}>{cat.grade}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:24, fontWeight:800, color:C.text, lineHeight:1, marginBottom:4 }}>
                    {cat.evaluated > 0 ? cat.score : '—'}<span style={{ fontSize:11, color:C.muted }}>{cat.evaluated > 0 ? '/100' : ''}</span>
                  </div>
                  <div style={{ background:C.border, borderRadius:3, height:3, marginBottom:6 }}>
                    <div style={{ height:3, borderRadius:3, background:cat.color, width:`${cat.score}%` }} />
                  </div>
                  <div style={{ fontSize:10, color:C.muted }}>
                    {cat.evaluated > 0 ? `${cat.passed}✓ ${cat.failed}✗ ${cat.evaluated} reviewed` : 'Not started'}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Top 5 Fixes */}
      {failItems.length > 0 && (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12,
          overflow:'hidden', marginBottom:16 }}>
          <div style={{ padding:'12px 20px', borderBottom:`1px solid ${C.border}`,
            display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:14 }}>🔧</span>
            <span style={{ fontSize:13, fontWeight:700, color:C.text }}>Top 5 Fixes</span>
            <span style={{ fontSize:11, color:C.muted, marginLeft:4 }}>highest-impact issues to address first</span>
          </div>
          {failItems.slice(0, 5).map((item, i) => (
            <div key={item.id} style={{ display:'flex', alignItems:'flex-start', gap:12,
              padding:'10px 20px', borderBottom: i < Math.min(failItems.length, 5) - 1 ? `1px solid ${C.border}` : 'none',
              background: i % 2 === 0 ? C.surface : C.surfaceHover }}>
              <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0,
                background:`${SEV[item.priority]}22`, border:`1px solid ${SEV[item.priority]}55`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:10, fontWeight:800, color:SEV[item.priority] }}>{i + 1}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2, flexWrap:'wrap' }}>
                  <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{item.item}</span>
                  <span style={{ fontSize:9, padding:'1px 5px', borderRadius:3, flexShrink:0,
                    background:`${SEV[item.priority]}22`, color:SEV[item.priority], fontWeight:700 }}>
                    {item.priority}
                  </span>
                  <span style={{ fontSize:9, padding:'1px 5px', borderRadius:3, flexShrink:0,
                    background: item.catColor + '22', color: item.catColor, fontWeight:600 }}>
                    {item.category.replace('Technical SEO','Tech SEO').replace('On-Page & Content','On-Page')
                      .replace('UX Heuristics','UX').replace('Conversion & CTA','CRO').replace('AI & SERP Visibility','AI/SERP')}
                  </span>
                </div>
                <div style={{ fontSize:10, color:C.muted, fontStyle:'italic', lineHeight:1.4 }}>{item.howTo}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issues section */}
      <div ref={issuesRef} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.text }}>🎯 Issues &amp; Gaps</div>
          <div style={{ display:'flex', gap:6, marginLeft:'auto' }}>
            {FILTER_TABS.map(tab => (
              <button key={tab.key} onClick={() => setIssueFilter(tab.key)}
                style={{ background: issueFilter === tab.key ? tab.color : 'transparent',
                  border:`1px solid ${issueFilter === tab.key ? tab.color : C.border}`,
                  borderRadius:20, padding:'4px 12px', fontSize:11, fontWeight:600,
                  color: issueFilter === tab.key ? '#fff' : C.muted, cursor:'pointer' }}>
                {tab.label} <span style={{ opacity:0.75 }}>({tab.count})</span>
              </button>
            ))}
          </div>
          <div style={{ fontSize:11, color:C.muted }}>
            based on {totalEval}/{totalAll} reviewed
          </div>
        </div>
        {issueFilter === null ? (
          <div style={{ padding:'32px 24px', textAlign:'center', color:C.muted, fontSize:13 }}>
            Click a card above or select a filter to explore issues.
          </div>
        ) : filteredIssues.length === 0 ? (
          <div style={{ padding:'32px 24px', textAlign:'center', color:C.muted, fontSize:13 }}>
            {issueFilter === 'Fail'    && (totalEval === 0 ? 'Complete some audit items to see issues.' : '🎉 No failures found in reviewed items.')}
            {issueFilter === 'Partial' && '✅ No partial items found.'}
            {issueFilter === 'Blank'   && '✅ All items have been reviewed.'}
          </div>
        ) : (() => {
          // Group by category
          const groups = [];
          filteredIssues.forEach(issue => {
            const last = groups[groups.length - 1];
            if (last && last.category === issue.category) last.items.push(issue);
            else groups.push({ category: issue.category, catColor: issue.catColor, items: [issue] });
          });
          return groups.map(group => (
            <div key={group.category}>
              <div style={{ padding:'7px 20px', background:`${group.catColor}18`,
                borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${group.catColor}33`,
                display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:group.catColor, flexShrink:0 }} />
                <span style={{ fontSize:11, fontWeight:700, color:group.catColor, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  {group.category}
                </span>
                <span style={{ fontSize:11, color:C.muted }}>— {group.items.length} item{group.items.length > 1 ? 's' : ''}</span>
              </div>
              {group.items.map((issue, i) => {
                const statusColor = issue.status === 'Fail' ? C.red : issue.status === 'Partial' ? C.amber : C.muted;
                return (
                  <div key={issue.id} style={{ padding:'11px 20px 11px 36px',
                    borderBottom: i < group.items.length - 1 ? `1px solid ${C.border}` : 'none',
                    display:'flex', alignItems:'flex-start', gap:12,
                    background: i % 2 === 0 ? 'transparent' : `${C.bg}55` }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', marginTop:5, flexShrink:0,
                      background: issue.status ? statusColor : C.border }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, color:C.text, marginBottom:2 }}>{issue.item}</div>
                      {issue.howTo && <div style={{ fontSize:11, color:C.muted, fontStyle:'italic', lineHeight:1.5 }}>💡 {issue.howTo}</div>}
                    </div>
                    <div style={{ fontSize:10, fontWeight:700, color:SEV[issue.priority] ?? C.muted,
                      textTransform:'uppercase', background:`${SEV[issue.priority]}22`,
                      borderRadius:6, padding:'3px 8px', flexShrink:0 }}>{issue.priority}</div>
                  </div>
                );
              })}
            </div>
          ));
        })()}
      </div>
    </div>
  );
}

function AuditView({ onComplete, initialUrl = '', initialClientName = '', initialResults = {}, isEditing = false }) {
  const [url, setUrl]               = useState(initialUrl);
  const [clientName, setClientName] = useState(initialClientName);
  const [results, setResults]       = useState(initialResults);
  const [activeCat, setActiveCat]   = useState(AUDIT_CATEGORIES[0].id);
  const [collapsedSections, setCollapsedSections] = useState({});
  const scrollRef = useRef(null);
  const catIdxRef = useRef(0);
  const lastSwitchRef = useRef(0);

  const switchCat = (id, scrollToBottom) => {
    setActiveCat(id);
    setTimeout(() => {
      if (!scrollRef.current) return;
      scrollRef.current.scrollTop = scrollToBottom ? scrollRef.current.scrollHeight : 0;
    }, 0);
  };

  const totalItems = AUDIT_CATEGORIES.flatMap(c => c.sections.flatMap(s => s.items)).length;
  const filledItems = Object.keys(results).filter(k => results[k] !== null && results[k] !== undefined).length;
  const remaining = totalItems - filledItems;
  const liveScore = useMemo(() => calculateScore(results), [results]);
  const canComplete = filledItems > 0;
  const cat = AUDIT_CATEGORIES.find(c => c.id === activeCat);
  const catIdx = AUDIT_CATEGORIES.findIndex(c => c.id === activeCat);
  catIdxRef.current = catIdx;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      const now = Date.now();
      if (now - lastSwitchRef.current < 800) return;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
      const atTop    = el.scrollTop <= 8;
      const idx = catIdxRef.current;
      if (e.deltaY > 0 && atBottom && idx < AUDIT_CATEGORIES.length - 1) {
        lastSwitchRef.current = now;
        const nextId = AUDIT_CATEGORIES[idx + 1].id;
        setActiveCat(nextId);
        setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, 0);
      } else if (e.deltaY < 0 && atTop && idx > 0) {
        lastSwitchRef.current = now;
        const prevId = AUDIT_CATEGORIES[idx - 1].id;
        setActiveCat(prevId);
        setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 0);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: true });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div ref={scrollRef} style={{ flex:1, overflowY:'auto' }}>
      {/* Sticky header */}
      <div style={{ position:'sticky', top:0, zIndex:20, background:C.bg,
        borderBottom:`1px solid ${C.border}`, padding:'16px 36px 12px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:800, color:C.text }}>
              {isEditing ? '✎ Edit Audit' : 'New Audit'}
            </h1>
            <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>
              {remaining > 0
                ? <span style={{ color:C.amber }}>{remaining} remaining — mark Pass / Partial / Fail / N/A</span>
                : <span style={{ color:C.green }}>All {totalItems} items reviewed ✓</span>
              }
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input value={clientName} onChange={e => setClientName(e.target.value)}
              placeholder="Client name"
              style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                padding:'8px 12px', color:C.text, fontSize:13, width:160 }} />
            <input value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://yoursite.com"
              style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                padding:'8px 12px', color:C.text, fontSize:13, width:200 }} />
            <button
              onClick={() => canComplete && onComplete(url || clientName || 'Manual Audit', clientName, results, calculateScore(results))}
              disabled={!canComplete}
              style={{ background: canComplete ? C.green : C.border, border:'none', borderRadius:8,
                padding:'9px 18px', color:'#fff', fontWeight:600, fontSize:13, whiteSpace:'nowrap',
                cursor: canComplete ? 'pointer' : 'not-allowed', opacity: canComplete ? 1 : 0.45 }}>
              {isEditing ? 'Save Changes →' : 'Complete Audit →'}
            </button>
          </div>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {AUDIT_CATEGORIES.map(c => {
            const catFilled = c.sections.flatMap(s => s.items).filter(it => results[it.id]).length;
            const catTotal  = c.sections.flatMap(s => s.items).length;
            const done = catFilled === catTotal;
            const active = activeCat === c.id;
            return (
              <button key={c.id} onClick={() => switchCat(c.id)} style={{
                background: active ? c.color : C.surface,
                border:`1px solid ${active ? c.color : done ? c.color + '55' : C.border}`,
                borderRadius:8, padding:'6px 14px',
                color: active ? '#fff' : done ? c.color : C.muted,
                fontSize:12, fontWeight: active ? 700 : 400, cursor:'pointer',
                transition:'background 0.15s, color 0.15s', position:'relative' }}>
                {c.icon} {c.label}
                {c.id === 'serp' && (
                  <span style={{ fontSize:8, fontWeight:800, padding:'1px 5px', borderRadius:3,
                    background: active ? 'rgba(255,255,255,0.3)' : '#06B6D4', color:'#fff',
                    marginLeft:4, letterSpacing:'0.5px', verticalAlign:'middle' }}>NEW</span>
                )}
                {done && !active && (
                  <span style={{ position:'absolute', top:-4, right:-4, width:10, height:10,
                    borderRadius:'50%', background:c.color, border:`2px solid ${C.bg}` }} />
                )}
              </button>
            );
          })}
        </div>
        {/* Live Section Score Breakdown */}
        {liveScore.totalEvaluated > 0 && (
          <div style={{ display:'flex', gap:10, marginTop:8, flexWrap:'wrap' }}>
            {liveScore.categories.map(cat => (
              <div key={cat.id} style={{ display:'flex', alignItems:'center', gap:5, flex:'1 1 100px' }}>
                <span style={{ fontSize:9, color:C.muted, whiteSpace:'nowrap', minWidth:48 }}>
                  {cat.label.replace('Technical SEO','Tech SEO').replace('On-Page & Content','On-Page')
                    .replace('UX Heuristics','UX').replace('Conversion & CTA','CRO').replace('AI & SERP Visibility','AI/SERP')}
                </span>
                <div style={{ flex:1, background:C.border, borderRadius:2, height:4 }}>
                  {cat.evaluated > 0 && (
                    <div style={{ height:4, borderRadius:2, background:cat.color,
                      width:`${cat.score}%`, transition:'width 0.3s' }} />
                  )}
                </div>
                <span style={{ fontSize:9, fontWeight:700, minWidth:22, textAlign:'right',
                  color: cat.evaluated > 0 ? cat.color : C.muted }}>
                  {cat.evaluated > 0 ? cat.score : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category content */}
      <div style={{ padding:'20px 36px 32px' }}>
        {cat.sections.map(sec => {
          const isCollapsed = sec.advanced && collapsedSections[sec.id];
          const toggleCollapse = () => setCollapsedSections(prev => ({ ...prev, [sec.id]: !prev[sec.id] }));
          return (
          <div key={sec.id} style={{ marginBottom:14 }}>
            <div onClick={sec.advanced ? toggleCollapse : undefined}
              style={{ padding:'8px 14px', background:cat.color + '22',
                borderLeft:`3px solid ${cat.color}`, borderRadius:'0 6px 6px 0',
                fontSize:11, fontWeight:700, color:cat.color,
                display:'flex', alignItems:'center', justifyContent:'space-between',
                cursor: sec.advanced ? 'pointer' : 'default' }}>
              <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                {sec.label}
                {sec.advanced && (
                  <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:4,
                    background: cat.color + '33', color: cat.color, letterSpacing:'0.5px' }}>
                    ADVANCED
                  </span>
                )}
              </span>
              {sec.advanced && (
                <span style={{ fontSize:11, opacity:0.7 }}>{isCollapsed ? '▶' : '▼'}</span>
              )}
            </div>
            {sec.advanced && (
              <div style={{ padding:'5px 14px', background: cat.color + '0D',
                borderLeft:`3px solid ${cat.color}55`, fontSize:10, color:C.muted, fontStyle:'italic' }}>
                Advanced signals for AI-era SEO & authority
                {isCollapsed && <span style={{ marginLeft:6, color:cat.color }}>— click to expand</span>}
              </div>
            )}
            {sec.advanced && !isCollapsed && (
              <div style={{ padding:'9px 14px', background: cat.color + '0A',
                borderLeft:`3px solid ${cat.color}`, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13 }}>💡</span>
                <span style={{ fontSize:11, color:C.muted }}>
                  These checks are optional but powerful for long-term growth.
                </span>
              </div>
            )}
            {!isCollapsed && sec.items.map((item, i) => {
              const s = results[item.id];
              const isFail = s === 'Fail';
              const impactColor = SEV[item.priority];
              return (
                <div key={item.id} style={{ display:'flex', alignItems:'flex-start', gap:14,
                  padding:'11px 14px',
                  background: isFail ? `${impactColor}0A` : i % 2 === 0 ? C.surface : C.surfaceHover,
                  borderBottom:`1px solid ${C.border}`,
                  borderLeft: isFail ? `3px solid ${impactColor}` : '3px solid transparent' }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0,
                    background:`${SEV[item.priority]}22`, border:`1px solid ${SEV[item.priority]}44`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:9, fontWeight:700, color:SEV[item.priority] }}>{item.num}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{item.item}</span>
                      {isFail && (
                        <span style={{ fontSize:9, fontWeight:800, padding:'2px 6px', borderRadius:4,
                          background: `${impactColor}22`, color: impactColor,
                          textTransform:'uppercase', letterSpacing:'0.5px', flexShrink:0 }}>
                          {item.priority === 'Critical' ? '🔥 Critical Impact'
                            : item.priority === 'High'   ? '⚠️ High Impact'
                            : item.priority === 'Medium' ? '· Medium Impact'
                            :                              '· Low Impact'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:11, color:C.muted, fontStyle:'italic', lineHeight:1.5 }}>{item.howTo}</div>
                  </div>
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    {['Pass','Partial','Fail','N/A'].map(v => (
                      <button key={v} onClick={() => setResults(r => ({ ...r, [item.id]: v }))} style={{
                        padding:'4px 8px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer',
                        border:`1px solid ${s === v ? STATUS_COLOR[v] : C.border}`,
                        background: s === v ? STATUS_BG[v] : 'transparent',
                        color: s === v ? STATUS_COLOR[v] : C.muted }}>{v}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          );
        })}

        {/* Prev / Next navigation */}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:16 }}>
          <button
            onClick={() => catIdx > 0 && switchCat(AUDIT_CATEGORIES[catIdx - 1].id)}
            disabled={catIdx === 0}
            style={{ background: catIdx > 0 ? C.surface : 'transparent',
              border:`1px solid ${catIdx > 0 ? C.border : 'transparent'}`,
              borderRadius:8, padding:'9px 18px', color: catIdx > 0 ? C.muted : 'transparent',
              fontSize:13, cursor: catIdx > 0 ? 'pointer' : 'default' }}>
            ← {catIdx > 0 ? AUDIT_CATEGORIES[catIdx - 1].label : ''}
          </button>
          <button
            onClick={() => catIdx < AUDIT_CATEGORIES.length - 1 && switchCat(AUDIT_CATEGORIES[catIdx + 1].id)}
            disabled={catIdx === AUDIT_CATEGORIES.length - 1}
            style={{ background: catIdx < AUDIT_CATEGORIES.length - 1 ? cat.color : 'transparent',
              border:'none', borderRadius:8, padding:'9px 18px',
              color: catIdx < AUDIT_CATEGORIES.length - 1 ? '#fff' : 'transparent',
              fontSize:13, fontWeight:600, cursor: catIdx < AUDIT_CATEGORIES.length - 1 ? 'pointer' : 'default' }}>
            {catIdx < AUDIT_CATEGORIES.length - 1 ? AUDIT_CATEGORIES[catIdx + 1].label : ''} →
          </button>
        </div>
      </div>
    </div>
  );
}

function WhiteLabelView({ audits, currentUrl, currentClientName, score, results, onSelect, onDelete, onUpdateAudit, onEditAudit, onResetAudit, onDuplicateAudit, onClearAll, isDark, onToggleTheme }) {
  const [showClearModal, setShowClearModal] = useState(false);
  const [name, setName]               = useState('My Agency');
  const [color, setColor]             = useState('#0EA5E9');
  const [agencyEmail, setAgencyEmail] = useState('');
  const [agencyWebsite, setAgencyWebsite] = useState('');
  const [agencyTitle, setAgencyTitle] = useState('');
  const [agencyLogo, setAgencyLogo]   = useState(null);
  const [saved, setSaved]             = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);

  // Client logo lives on the audit object, not in agency settings
  const clientLogo = selectedAudit?.clientLogo || null;

  // Derive active audit data from local selection or current props
  const activeScore   = selectedAudit ? selectedAudit.score   : score;
  const activeResults = selectedAudit ? selectedAudit.results : results;
  const activeUrl     = selectedAudit ? selectedAudit.url     : currentUrl;
  const activeClient  = selectedAudit ? (selectedAudit.clientName || '') : (currentClientName || '');
  const activeId      = selectedAudit ? selectedAudit.id      : null;
  const hasAudit      = !!activeScore;

  // Seed selection from current props on first load
  useEffect(() => {
    if (score && !selectedAudit) {
      setSelectedAudit({ url: currentUrl, clientName: currentClientName, score, results,
        id: audits.find(a => a.url === currentUrl)?.id ?? null });
    }
  }, [score]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('auditpro_whitelabel');
      if (raw) {
        const cfg = JSON.parse(raw);
        setName(cfg.agencyName);
        setColor(cfg.brandColor);
        if (cfg.agencyEmail)   setAgencyEmail(cfg.agencyEmail);
        if (cfg.agencyWebsite) setAgencyWebsite(cfg.agencyWebsite);
        if (cfg.agencyTitle)   setAgencyTitle(cfg.agencyTitle);
        if (cfg.agencyLogo)    setAgencyLogo(cfg.agencyLogo);
      }
    } catch {}
  }, []);

  const makeLogoUploader = (setter) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => normalizeImage(ev.target.result, setter);
    reader.readAsDataURL(file);
  };

  const handleClientLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedAudit) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      normalizeImage(ev.target.result, (jpeg) => {
        const updated = { ...selectedAudit, clientLogo: jpeg };
        setSelectedAudit(updated);
        onUpdateAudit(selectedAudit.id, { clientLogo: jpeg });
      });
    };
    reader.readAsDataURL(file);
  };

  const handleClientLogoClear = () => {
    const updated = { ...selectedAudit, clientLogo: null };
    setSelectedAudit(updated);
    onUpdateAudit(selectedAudit.id, { clientLogo: null });
  };

  const handleSave = () => {
    localStorage.setItem('auditpro_whitelabel', JSON.stringify({
      agencyName: name, brandColor: color,
      agencyEmail, agencyWebsite, agencyTitle,
      agencyLogo: agencyLogo || null,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const triggerPDF = (auditScore, auditResults, auditUrl, auditClient) => {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('jsPDF library not loaded. Please reload the page and try again.');
      return;
    }
    try {
      downloadPDF(
        { agencyName: name, brandColor: color, clientName: auditClient,
          agencyLogo, clientLogo, agencyEmail, agencyWebsite, agencyTitle },
        auditUrl, auditScore, auditResults
      );
    } catch (e) {
      alert('PDF error: ' + (e && e.message ? e.message : String(e)));
      console.error('PDF generation failed:', e);
    }
  };

  const handleDownload = () => {
    if (!activeScore) return;
    setDownloading(true);
    triggerPDF(activeScore, activeResults, activeUrl, activeClient);
    setDownloading(false);
  };

  const catScores = activeScore?.categories ?? [];

  return (
    <div style={{ padding:'32px 36px', flex:1, overflowY:'auto' }}>
      <h1 style={{ fontSize:26, fontWeight:800, color:C.text, marginBottom:8 }}>White Label</h1>
      <p style={{ color:C.muted, fontSize:13, marginBottom:28 }}>Customize branding on client-facing PDF reports.</p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, maxWidth:720 }}>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:'uppercase',
              letterSpacing:'0.08em', display:'block', marginBottom:8 }}>Agency Name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={{ width:'100%',
              background:C.bg, border:`1px solid ${C.border}`, borderRadius:8,
              padding:'10px 14px', color:C.text, fontSize:13, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:'uppercase',
              letterSpacing:'0.08em', display:'block', marginBottom:8 }}>Role / Title</label>
            <input value={agencyTitle} onChange={e => setAgencyTitle(e.target.value)}
              placeholder="e.g. UX & SEO Consultant"
              style={{ width:'100%', background:C.bg, border:`1px solid ${C.border}`, borderRadius:8,
                padding:'10px 14px', color:C.text, fontSize:13, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:'uppercase',
              letterSpacing:'0.08em', display:'block', marginBottom:8 }}>Website</label>
            <input value={agencyWebsite} onChange={e => setAgencyWebsite(e.target.value)}
              placeholder="e.g. yoursite.com"
              style={{ width:'100%', background:C.bg, border:`1px solid ${C.border}`, borderRadius:8,
                padding:'10px 14px', color:C.text, fontSize:13, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:'uppercase',
              letterSpacing:'0.08em', display:'block', marginBottom:8 }}>Email</label>
            <input value={agencyEmail} onChange={e => setAgencyEmail(e.target.value)}
              placeholder="e.g. hello@yoursite.com"
              style={{ width:'100%', background:C.bg, border:`1px solid ${C.border}`, borderRadius:8,
                padding:'10px 14px', color:C.text, fontSize:13, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:'uppercase',
              letterSpacing:'0.08em', display:'block', marginBottom:8 }}>Brand Color</label>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                style={{ width:44, height:44, border:'none', borderRadius:8, cursor:'pointer' }} />
              <span style={{ fontSize:13, color:C.muted }}>{color}</span>
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:'uppercase',
              letterSpacing:'0.08em', display:'block', marginBottom:8 }}>Agency Logo</label>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <label style={{ background:C.bg, border:`1px dashed ${C.border}`, borderRadius:8,
                padding:'7px 14px', color:C.muted, fontSize:12, cursor:'pointer',
                display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                📎 Upload PNG / JPG
                <input type="file" accept="image/png,image/jpeg,image/jpg"
                  onChange={makeLogoUploader(setAgencyLogo)} style={{ display:'none' }} />
              </label>
              {agencyLogo ? (
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <img src={agencyLogo} alt="agency" style={{ height:30, maxWidth:72, objectFit:'contain',
                    borderRadius:4, background:'#fff', padding:2 }} />
                  <button onClick={() => setAgencyLogo(null)} style={{ background:'transparent',
                    border:`1px solid ${C.border}`, borderRadius:6, padding:'3px 8px',
                    color:C.muted, fontSize:11, cursor:'pointer' }}>✕</button>
                </div>
              ) : <span style={{ fontSize:11, color:C.muted }}>No logo uploaded</span>}
            </div>
          </div>
          <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16, marginBottom:16 }}>
            <label style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:'uppercase',
              letterSpacing:'0.08em', display:'block', marginBottom:10 }}>Client Logo</label>
            {selectedAudit ? (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                {clientLogo ? (
                  <img src={clientLogo} alt="client" style={{ height:34, maxWidth:80, objectFit:'contain',
                    borderRadius:6, background:'#fff', padding:3, flexShrink:0 }} />
                ) : (
                  <div style={{ width:56, height:34, borderRadius:6, background:C.bg,
                    border:`1px dashed ${C.border}`, flexShrink:0 }} />
                )}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:C.text, overflow:'hidden',
                    textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:6 }}>
                    {selectedAudit.clientName || selectedAudit.url}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <label style={{ background:C.bg, border:`1px dashed ${C.border}`, borderRadius:6,
                      padding:'4px 10px', color:C.muted, fontSize:11, cursor:'pointer',
                      display:'flex', alignItems:'center', gap:5 }}>
                      📎 Upload
                      <input type="file" accept="image/png,image/jpeg,image/jpg"
                        onChange={handleClientLogoUpload} style={{ display:'none' }} />
                    </label>
                    {clientLogo && (
                      <button onClick={handleClientLogoClear} style={{ background:'transparent',
                        border:`1px solid ${C.border}`, borderRadius:6, padding:'4px 10px',
                        color:C.muted, fontSize:11, cursor:'pointer' }}>✕ Remove</button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize:11, color:C.muted, fontStyle:'italic' }}>
                Select an audit below to upload its client logo
              </div>
            )}
          </div>
          <button onClick={handleSave} style={{ background:color, border:'none', borderRadius:8,
            padding:'11px 20px', color:'#fff', fontWeight:600, fontSize:13, width:'100%',
            cursor:'pointer' }}>
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>

        </div>

        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:20 }}>PDF Preview</div>
          <div style={{ background:C.bg, borderRadius:10, padding:20, border:`1px solid ${C.border}` }}>
            <div style={{ background:color, borderRadius:8, padding:'14px 18px 10px', marginBottom:10, position:'relative' }}>
              <div style={{ fontSize:14, fontWeight:800, color:'#fff' }}>
                {activeClient || (hasAudit ? activeUrl : 'Client Name')}
              </div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', marginTop:2 }}>UX + SEO Audit Report</div>
              {hasAudit && <div style={{ fontSize:9, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{activeUrl}</div>}
              {clientLogo && (
                <img src={clientLogo} alt="client" style={{ position:'absolute', top:8, right:12,
                  height:22, maxWidth:55, objectFit:'contain', background:'rgba(255,255,255,0.15)',
                  borderRadius:4, padding:2 }} />
              )}
              <div style={{ marginTop:8, paddingTop:6, borderTop:'1px solid rgba(255,255,255,0.2)',
                display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:8, color:'rgba(255,255,255,0.5)' }}>Powered by</span>
                {agencyLogo
                  ? <img src={agencyLogo} alt="agency" style={{ height:12, maxWidth:36, objectFit:'contain',
                      opacity:0.75 }} />
                  : <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.65)' }}>{name || 'Agency Name'}</span>
                }
              </div>
            </div>
            {hasAudit && activeScore ? (
              <>
                <div style={{ textAlign:'center', marginBottom:12 }}>
                  <div style={{ fontSize:28, fontWeight:800, color, lineHeight:1 }}>{activeScore.weighted}</div>
                  <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>Weighted Score — Grade {activeScore.grade}</div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  {catScores.map(cat => (
                    <div key={cat.id} style={{ flex:1, background:C.surface, borderRadius:6, padding:8, textAlign:'center' }}>
                      <div style={{ fontSize:15, fontWeight:800, color, lineHeight:1 }}>{cat.score}</div>
                      <div style={{ fontSize:8, color:C.muted, marginTop:2 }}>
                        {cat.label.replace('Technical SEO','Tech SEO').replace('On-Page & Content','On-Page')
                          .replace('UX Heuristics','UX').replace('Conversion & CTA','CRO')}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {AUDIT_CATEGORIES.map(cat => (
                  <div key={cat.id} style={{ flex:'1 1 60px', background:C.surface, borderRadius:6, padding:8, textAlign:'center' }}>
                    <div style={{ fontSize:15, fontWeight:800, color, lineHeight:1 }}>--</div>
                    <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>
                      {cat.label.replace('Technical SEO','Tech SEO').replace('On-Page & Content','On-Page')
                        .replace('UX Heuristics','UX').replace('Conversion & CTA','CRO').replace('AI & SERP Visibility','AI/SERP')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {!hasAudit && (
            <div style={{ marginTop:8, fontSize:11, color:C.amber, textAlign:'center' }}>
              Complete an audit to see real scores in the preview
            </div>
          )}
        </div>
      </div>

      {showClearModal && (
        <ClearAllModal count={audits.length} onConfirm={() => { setShowClearModal(false); onClearAll(); }} onCancel={() => setShowClearModal(false)} />
      )}

      {audits.length > 0 && (
        <div style={{ marginTop:28, maxWidth:720 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:16, fontWeight:700, color:C.text }}>Saved Audits ({audits.length})</div>
            <div style={{ fontSize:11, color:C.muted }}>
              <span style={{ opacity:0.6 }}>↺ Clear = hold 2s · keeps name &amp; URL, clears answers</span>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {audits.map(a => {
              const isSelected = selectedAudit ? a.id === activeId : a.url === currentUrl;
              const d = new Date(a.date);
              const dateStr = d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
              const timeStr = d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
              return (
                <div key={a.id} onClick={() => setSelectedAudit(a)} style={{
                  display:'flex', alignItems:'center', gap:14, padding:'12px 18px',
                  background: isSelected ? `${C.accent}15` : C.surface,
                  border:`1px solid ${isSelected ? C.accent : C.border}`, borderRadius:10, cursor:'pointer' }}>
                  <div style={{ width:44, height:44, borderRadius:10, display:'flex', alignItems:'center',
                    justifyContent:'center', fontWeight:800, fontSize:16,
                    background:`${a.score.weighted >= 70 ? C.green : a.score.weighted >= 50 ? C.amber : C.red}22`,
                    color: a.score.weighted >= 70 ? C.green : a.score.weighted >= 50 ? C.amber : C.red,
                  }}>{a.score.weighted}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text, overflow:'hidden',
                      textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {a.clientName || a.url}
                    </div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                      {a.clientName && <span style={{ color:C.muted }}>{a.url} · </span>}
                      {dateStr} at {timeStr} — Grade {a.score.grade}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
                    {isSelected && <span style={{ fontSize:10, color:C.accent, fontWeight:700,
                      background:`${C.accent}22`, padding:'3px 10px', borderRadius:12 }}>SELECTED</span>}
                    <button onClick={e => { e.stopPropagation(); triggerPDF(a.score, a.results, a.url, a.clientName || ''); }}
                      style={{ background:color, border:'none', borderRadius:6,
                        padding:'4px 12px', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer',
                        whiteSpace:'nowrap' }}>↓ PDF</button>
                    <button onClick={e => { e.stopPropagation(); onEditAudit(a); }}
                      style={{ background:'transparent', border:`1px solid ${C.accent}`, borderRadius:6,
                        padding:'4px 10px', color:C.accent, fontSize:12, cursor:'pointer' }}>✎ Edit</button>
                    <button onClick={e => { e.stopPropagation(); onDuplicateAudit(a); }}
                      title="Duplicate with blank results"
                      style={{ background:'transparent', border:`1px solid ${C.border}`, borderRadius:6,
                        padding:'4px 10px', color:C.muted, fontSize:11, cursor:'pointer' }}>⧉ Copy</button>
                    <HoldButton
                      onConfirm={() => onResetAudit(a.id)}
                      label="↺ Clear"
                      holdLabel="↺ …"
                      duration={2000}
                      style={{ background:'transparent', border:`1px solid ${C.amber}66`, borderRadius:6,
                        padding:'4px 10px', color:C.amber, fontSize:11, cursor:'pointer' }} />
                    <button onClick={e => { e.stopPropagation(); onDelete(a.id); }}
                      title="Delete project"
                      style={{ background:'transparent', border:`1px solid ${C.border}`, borderRadius:6,
                        padding:'4px 10px', color:C.muted, fontSize:11, cursor:'pointer' }}>✕ Delete</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Danger Zone */}
          <div style={{ marginTop:28, border:`1px solid ${C.red}44`, borderRadius:10, padding:'16px 20px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.red, textTransform:'uppercase',
              letterSpacing:'0.08em', marginBottom:10 }}>⚠ Danger Zone</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>Clear All Data</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                  Permanently deletes all {audits.length} project{audits.length !== 1 ? 's' : ''} and audit results.
                </div>
              </div>
              <button onClick={() => setShowClearModal(true)} style={{
                background:'transparent', border:`1px solid ${C.red}`, borderRadius:8,
                padding:'8px 16px', color:C.red, fontSize:12, fontWeight:600, cursor:'pointer',
                flexShrink:0, marginLeft:20 }}>
                🗑️ Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LOCAL STORAGE ────────────────────────────────────────────────────────────

function loadAudits() {
  try { const raw = localStorage.getItem('auditpro_audits'); if (raw) return JSON.parse(raw); } catch {}
  return [];
}
function saveAudits(audits) {
  try { localStorage.setItem('auditpro_audits', JSON.stringify(audits.slice(0, 20))); } catch {}
}

// ─── APP ──────────────────────────────────────────────────────────────────────

function App() {
  const [page, setPage]               = useState('dashboard');
  const [score, setScore]             = useState(null);
  const [issues, setIssues]           = useState([]);
  const [auditUrl, setUrl]            = useState('');
  const [clientName, setClientName]   = useState('');
  const [results, setResults]         = useState({});
  const [audits, setAudits]           = useState([]);
  const [editMode, setEditMode]       = useState(false);
  const [isDark, setIsDark]           = useState(() => {
    try { return localStorage.getItem('auditpro_theme') !== 'light'; } catch { return true; }
  });

  // Keep C in sync — runs before children render
  Object.assign(C, isDark ? DARK_C : LIGHT_C);

  const handleToggleTheme = () => {
    setIsDark(d => {
      const next = !d;
      try { localStorage.setItem('auditpro_theme', next ? 'dark' : 'light'); } catch {}
      return next;
    });
  };

  useEffect(() => {
    const saved = loadAudits();
    setAudits(saved);
    if (saved.length > 0) {
      const latest = saved[0];
      setUrl(latest.url);
      setClientName(latest.clientName || '');
      setResults(latest.results);
      setScore(latest.score);
      setIssues(getTopIssues(latest.results));
    }
  }, []);

  const handleComplete = (url, cn, res, sc) => {
    setUrl(url); setClientName(cn || ''); setScore(sc); setResults(res);
    setIssues(getTopIssues(res)); setPage('dashboard'); setEditMode(false);
    const newAudit = {
      id: `${Date.now()}`, url, clientName: cn || '',
      results: res, score: sc, date: new Date().toISOString(),
    };
    const updated = [newAudit, ...audits.filter(a => a.url !== url)];
    setAudits(updated); saveAudits(updated);
  };

  const handleEdit = () => {
    setEditMode(true);
    setPage('audit');
  };

  const handleNewAudit = () => {
    setEditMode(false);
    setPage('audit');
  };

  const handleSelectAudit = (audit) => {
    setUrl(audit.url);
    setClientName(audit.clientName || '');
    setResults(audit.results);
    setScore(audit.score);
    setIssues(getTopIssues(audit.results));
  };

  const handleDeleteAudit = (id) => {
    const updated = audits.filter(a => a.id !== id);
    setAudits(updated); saveAudits(updated);
    if (updated.length > 0) handleSelectAudit(updated[0]);
    else { setUrl(''); setResults({}); setScore(null); setIssues([]); }
  };

  const handleUpdateAudit = (id, patch) => {
    const updated = audits.map(a => a.id === id ? { ...a, ...patch } : a);
    setAudits(updated); saveAudits(updated);
  };

  const handleEditAudit = (audit) => {
    handleSelectAudit(audit);
    setEditMode(true);
    setPage('audit');
  };

  const handleResetAudit = (id) => {
    const blank = calculateScore({});
    const updated = audits.map(a => a.id === id ? { ...a, results: {}, score: blank } : a);
    setAudits(updated); saveAudits(updated);
    if (auditUrl === audits.find(a => a.id === id)?.url) {
      setResults({}); setScore(blank);
    }
  };

  const handleDuplicateAudit = (audit) => {
    const copy = { ...audit, id: `${Date.now()}`, results: {}, score: calculateScore({}),
      date: new Date().toISOString(), clientName: `${audit.clientName || audit.url} (copy)` };
    const updated = [copy, ...audits];
    setAudits(updated); saveAudits(updated);
  };

  const handleClearAll = () => {
    try { localStorage.removeItem('auditpro_audits'); } catch {}
    setAudits([]); setUrl(''); setClientName(''); setResults({}); setScore(null); setIssues([]);
  };

  return (
    <div style={{ display:'flex', height:'100vh', background:C.bg, color:C.text,
      fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar page={page} setPage={p => { if (p === 'audit') { setEditMode(false); } setPage(p); }} isDark={isDark} onToggleTheme={handleToggleTheme} />
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {page === 'dashboard'  && <DashboardView score={score} auditUrl={auditUrl} results={results}
          setPage={handleNewAudit} onEdit={handleEdit} audits={audits} onSelectAudit={handleSelectAudit} />}
        {page === 'audit'      && <AuditView onComplete={handleComplete}
            initialUrl={editMode ? auditUrl : ''}
            initialClientName={editMode ? clientName : ''}
            initialResults={editMode ? results : {}}
            isEditing={editMode} />}
        {page === 'whitelabel' && <WhiteLabelView audits={audits} currentUrl={auditUrl}
          currentClientName={clientName} score={score} results={results}
          onSelect={handleSelectAudit} onDelete={handleDeleteAudit} onUpdateAudit={handleUpdateAudit}
          onEditAudit={handleEditAudit} onResetAudit={handleResetAudit}
          onDuplicateAudit={handleDuplicateAudit} onClearAll={handleClearAll}
          isDark={isDark} onToggleTheme={handleToggleTheme} />}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
