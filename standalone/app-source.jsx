const { useState, useEffect, useRef } = React;

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
  id: 'serp', label: 'AI & SERP Visibility', icon: '🤖', color: '#8B5CF6',
  sections: [
    { id: 'serp_visibility', label: 'SERP Performance', items: [
      { id:'serp1', num:1,  item:'Site appears in Google top 10 for main keyword',    howTo:'Run target keyword in Google. If not in top 10, focus on content depth, backlinks, and on-page SEO.',   priority:'Critical' },
      { id:'serp2', num:2,  item:'SERP intent matches content type',                  howTo:'Check top 10 results: informational/commercial/transactional? Your content format must match.',            priority:'Critical' },
      { id:'serp3', num:3,  item:'Content depth ≥ competitor average (top 3)',        howTo:'If top 3 competitors avg 1500 words and your page has 400, add depth.',                                    priority:'High'     },
      { id:'serp8', num:4,  item:'Title tag has emotional trigger or power word',     howTo:'Add "best", "ultimate", "proven", year, or number to title.',                                              priority:'Medium'   },
    ]},
    { id: 'aeo', label: 'AEO — Answer Engine Optimization', items: [
      { id:'serp4', num:5,  item:'Featured snippet / answer box opportunity detected', howTo:'If featured snippet present in SERP, structure content with direct Q&A format, 40–60 word answers.',     priority:'High'     },
      { id:'serp5', num:6,  item:'People Also Ask (PAA) detected → FAQ schema added', howTo:'PAA in SERP = FAQ opportunity. Add FAQ schema markup and answer PAA questions in content.',               priority:'High'     },
      { id:'serp6', num:7,  item:'Content answers a clear, specific question',         howTo:'Every page should answer ONE clear question. Use it as the H1.',                                          priority:'High'     },
      { id:'serp7', num:8,  item:'Content structured in short, scannable chunks',      howTo:'Use H2/H3 headers every 200–300 words. Short paragraphs (2–3 lines).',                                   priority:'Medium'   },
    ]},
    { id: 'aio', label: 'Google AI Overview (AIO)', items: [
      { id:'serp9',  num:9,  item:'Google AI Overview detected for this keyword',       howTo:'AIO appears for many informational queries. Optimize for direct concise answers and strong E-E-A-T.',   priority:'High'     },
      { id:'serp10', num:10, item:'Site cited as source in Google AI Overview',          howTo:'Add author bios, cite sources, use structured data. AIO sources favor authoritative content.',          priority:'Critical' },
      { id:'serp11', num:11, item:'Content structured for AI answer extraction',         howTo:'Short intro paragraphs that directly answer the query. Lists, tables, and clear H2 questions.',        priority:'High'     },
    ]},
  ]
};

const AUDIT_CATEGORIES = [technicalSEO, onPage, uxHeuristics, cro, aiSerp];
const WEIGHTS = { technical: 0.25, onpage: 0.25, ux: 0.20, cro: 0.17, serp: 0.13 };

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
    let pass = 0, partial = 0, fail = 0;
    allItems.forEach(item => {
      const s = results[item.id];
      if (s === 'Pass') pass++;
      else if (s === 'Partial') partial++;
      else if (s === 'N/A') { /* excluded */ }
      else fail++; // Fail OR blank → counts as Fail
    });
    const total = pass + partial + fail;
    const score = total > 0 ? Math.round((pass * 2 + partial * 1) / (total * 2) * 100) : 0;
    return {
      id: cat.id, label: cat.label, icon: cat.icon, color: cat.color,
      score, grade: getGrade(score), weight: WEIGHTS[cat.id] ?? 0.25,
      passed: pass, failed: fail, partial, total,
    };
  });
  const weighted = Math.round(categories.reduce((sum, c) => sum + c.score * c.weight, 0));
  const overall = Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length);
  return { overall, weighted, grade: getGrade(weighted), rating: getRating(weighted), categories };
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
  const brandRgb = hexToRgb(config.brandColor);
  const brandLight = lighten(brandRgb, 0.92);
  const clientName = config.clientName || '';
  const agencyLogo = config.agencyLogo || null;
  const clientLogo = config.clientLogo || null;
  let y = 0;

  function addPage() { doc.addPage(); y = M; drawFooter(); }
  function drawFooter() {
    doc.setFontSize(7.5); doc.setTextColor(160,160,160);
    doc.text(auditUrl, W - M, H - 8, { align: 'right' });
  }
  function checkPageBreak(needed) { if (y + needed > H - 20) addPage(); }

  // Aspect-ratio-preserving image helper — accepts normalised PNG data URLs
  function addLogoToDoc(b64, x, yPos, maxW, maxH, alignRight) {
    try {
      const props = doc.getImageProperties(b64);
      const ratio = props.width / props.height;
      let w = maxW, h = maxW / ratio;
      if (h > maxH) { h = maxH; w = maxH * ratio; }
      const drawX = alignRight ? x - w : x;
      doc.addImage(b64.split(',')[1], 'PNG', drawX, yPos, w, h);
      return { w, h };
    } catch { return { w: 0, h: 0 }; }
  }

  // ── Cover header bar (two-tone) ───────────────────────────────────────────────
  const headerH = 50;
  // Top zone — main brand colour
  doc.setFillColor(...brandRgb);
  doc.rect(0, 0, W, 36, 'F');
  // Bottom zone — 25% darker for "Powered by" strip
  const darkRgb = brandRgb.map(v => Math.max(0, Math.round(v * 0.72)));
  doc.setFillColor(...darkRgb);
  doc.rect(0, 36, W, headerH - 36, 'F');

  // Client logo — right side of top zone, aspect-ratio-preserved, max 36×13mm
  if (clientLogo) {
    addLogoToDoc(clientLogo, W - M, 4, 36, 13, true);
  }

  // Client name + subtitle + URL (top zone)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(clientName ? 16 : 18); doc.setFont('helvetica', 'bold');
  doc.text(clientName || config.agencyName, M, 14);
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
  doc.text('UX + SEO Audit Report', M, 23);
  doc.setFontSize(7); doc.setTextColor(210, 225, 240);
  doc.text(auditUrl, M, 31);

  // "Powered by" — bottom zone
  doc.setFontSize(6); doc.setTextColor(180, 200, 220);
  doc.text('Powered by', M, 43);
  if (agencyLogo) {
    addLogoToDoc(agencyLogo, M + 22, 38, 30, 9, false);
  } else {
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(230, 238, 248);
    doc.text(config.agencyName, M + 22, 43);
    doc.setFont('helvetica', 'normal');
  }

  // ── Cover body ───────────────────────────────────────────────────────────────
  y = headerH + 9;
  doc.setTextColor(130, 130, 130); doc.setFontSize(8);
  doc.text(`Report Date: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}`, M, y);

  // Overall score box
  y += 8;
  doc.setFillColor(...brandLight);
  doc.roundedRect(M, y, W - 2*M, 36, 3, 3, 'F');
  doc.setDrawColor(...brandRgb); doc.setLineWidth(0.4);
  doc.roundedRect(M, y, W - 2*M, 36, 3, 3, 'S');
  doc.setFontSize(32); doc.setFont('helvetica','bold'); doc.setTextColor(...brandRgb);
  doc.text(`${score.weighted}`, M + 16, y + 24);
  doc.setFontSize(12); doc.setTextColor(...brandRgb);
  doc.text('/100', M + 40, y + 24);
  doc.setFontSize(15); doc.setTextColor(55, 55, 55);
  doc.text(`Grade ${score.grade}`, M + 72, y + 18);
  doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.setFont('helvetica', 'normal');
  doc.text(score.rating, M + 72, y + 28);

  // Category scores
  y += 44;
  doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(30,30,30);
  doc.text('Category Scores', M, y);
  y += 7;
  const numCats = score.categories.length;
  const catGap  = 3;
  const catBoxW = (W - 2*M - catGap * (numCats - 1)) / numCats;
  score.categories.forEach((cat, i) => {
    const x = M + i * (catBoxW + catGap);
    const catRgb   = hexToRgb(cat.color);
    const catLight = lighten(catRgb, 0.92);
    doc.setFillColor(...catLight);
    doc.roundedRect(x, y, catBoxW, 32, 2, 2, 'F');
    doc.setDrawColor(...catRgb); doc.setLineWidth(0.3);
    doc.roundedRect(x, y, catBoxW, 32, 2, 2, 'S');
    doc.setFontSize(19); doc.setFont('helvetica','bold'); doc.setTextColor(...catRgb);
    doc.text(`${cat.score}`, x + catBoxW/2, y + 14, {align:'center'});
    doc.setFontSize(6.5); doc.setFont('helvetica','normal'); doc.setTextColor(80,80,80);
    const lbl = cat.label.replace('Technical SEO','Tech SEO').replace('On-Page & Content','On-Page')
      .replace('UX Heuristics','UX').replace('Conversion & CTA','CRO').replace('AI & SERP Visibility','AI/SERP');
    doc.text(lbl, x + catBoxW/2, y + 22, {align:'center'});
    doc.setFontSize(8); doc.setFont('helvetica','bold');
    doc.text(`Grade ${cat.grade}`, x + catBoxW/2, y + 29, {align:'center'});
  });

  // Summary stats
  y += 40;
  doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(30,30,30);
  doc.text('Summary', M, y);
  y += 7;
  const totalPass    = score.categories.reduce((s,c) => s + c.passed,  0);
  const totalFail    = score.categories.reduce((s,c) => s + c.failed,  0);
  const totalPartial = score.categories.reduce((s,c) => s + c.partial, 0);
  const totalItems   = score.categories.reduce((s,c) => s + c.total,   0);
  const stats = [
    {label:'Total Checked', value:`${totalItems}`,   color:[40,40,40]},
    {label:'Passed',        value:`${totalPass}`,    color:STATUS_COLORS_PDF.Pass},
    {label:'Partial',       value:`${totalPartial}`, color:STATUS_COLORS_PDF.Partial},
    {label:'Failed',        value:`${totalFail}`,    color:STATUS_COLORS_PDF.Fail},
  ];
  const statW = (W - 2*M - 9) / 4;
  stats.forEach((stat, i) => {
    const x = M + i * (statW + 3);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(x, y, statW, 20, 2, 2, 'F');
    doc.setFontSize(15); doc.setFont('helvetica','bold'); doc.setTextColor(...stat.color);
    doc.text(stat.value, x + statW/2, y + 11, {align:'center'});
    doc.setFontSize(6.5); doc.setFont('helvetica','normal'); doc.setTextColor(120,120,120);
    doc.text(stat.label, x + statW/2, y + 17, {align:'center'});
  });
  drawFooter();

  AUDIT_CATEGORIES.forEach(cat => {
    addPage();
    const catColor = hexToRgb(cat.color);
    doc.setFillColor(...catColor);
    doc.rect(0, 0, W, 22, 'F');
    doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont('helvetica','bold');
    doc.text(cat.label, M, 15);
    const catScore = score.categories.find(c => c.id === cat.id);
    if (catScore) {
      doc.setFontSize(14);
      doc.text(`${catScore.score}/100 — Grade ${catScore.grade}`, W - M, 15, {align:'right'});
    }
    y = 30;
    cat.sections.forEach(sec => {
      checkPageBreak(20);
      doc.setFillColor(...lighten(catColor, 0.85));
      doc.rect(M, y, W - 2*M, 8, 'F');
      doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(...catColor);
      doc.text(sec.label, M + 3, y + 5.5);
      y += 10;
      sec.items.forEach((item, idx) => {
        checkPageBreak(10);
        const status = results[item.id] || 'N/A';
        const statusColor = STATUS_COLORS_PDF[status] || STATUS_COLORS_PDF['N/A'];
        if (idx % 2 === 0) { doc.setFillColor(248,249,252); doc.rect(M, y, W - 2*M, 8, 'F'); }
        doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(150,150,150);
        doc.text(`${item.num}`, M + 3, y + 5.5);
        doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(40,40,40);
        const itemText = doc.splitTextToSize(item.item, W - 2*M - 40);
        doc.text(itemText[0], M + 12, y + 5.5);
        doc.setFillColor(...statusColor);
        const badgeX = W - M - 22;
        doc.roundedRect(badgeX, y + 1, 20, 5.5, 2, 2, 'F');
        doc.setFontSize(6.5); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
        doc.text(status, badgeX + 10, y + 5, {align:'center'});
        y += 8;
      });
      y += 3;
    });
  });

  addPage();
  doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.setTextColor(...brandRgb);
  doc.text(config.agencyName, M, y + 10);
  y += 20;
  doc.setFontSize(11); doc.setTextColor(60,60,60);
  doc.text('About This Report', M, y);
  y += 8;
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(100,100,100);
  const disclaimer = doc.splitTextToSize(
    `This UX + SEO audit report was generated for ${auditUrl} on ${new Date().toLocaleDateString()}. ` +
    `The audit covers 190 checkpoints across Technical SEO, On-Page & Content, UX Heuristics, Conversion & CTA, and AI & SERP Visibility. ` +
    `Some items require manual verification or tools like Google Search Console, Screaming Frog, or PageSpeed Insights. ` +
    `Scores reflect the items reviewed; unreviewed items are excluded from scoring.`,
    W - 2*M
  );
  doc.text(disclaimer, M, y);
  y += disclaimer.length * 5 + 15;
  doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(...brandRgb);
  doc.text(`Prepared by ${config.agencyName}`, M, y);
  drawFooter();

  const safeClient = (clientName || auditUrl).replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9.-]/g, '_');
  doc.save(`${config.agencyName.replace(/\s+/g,'_')}_Audit_${safeClient}.pdf`);
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const C = {
  bg: '#0A0E1A', surface: '#111827', surfaceHover: '#1a2235',
  border: '#1e2d45', accent: '#0EA5E9', accentDim: '#0c4a6e',
  green: '#10B981', amber: '#F59E0B', red: '#EF4444', purple: '#8B5CF6',
  text: '#F0F4FF', muted: '#6B7A99',
};
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

function Sidebar({ page, setPage }) {
  const nav = [
    { id:'dashboard', icon:'▦', label:'Dashboard' },
    { id:'audit',     icon:'◎', label:'New Audit' },
    { id:'whitelabel',icon:'◈', label:'White Label' },
  ];
  return (
    <div style={{ width:220, background:C.surface, borderRight:`1px solid ${C.border}`,
      display:'flex', flexDirection:'column', minHeight:'100vh', flexShrink:0 }}>
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
            background: page === n.id ? `${C.accentDim}55` : 'transparent',
            color: page === n.id ? C.accent : C.muted }}>
            <span style={{ fontSize:14, width:18, textAlign:'center' }}>{n.icon}</span>
            <span style={{ fontSize:13, fontWeight: page === n.id ? 600 : 400 }}>{n.label}</span>
          </div>
        ))}
      </nav>
      <div style={{ padding:'16px 24px', borderTop:`1px solid ${C.border}`, fontSize:11, color:C.muted }}>
        AuditPro v1.0
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

function DashboardView({ score, issues, auditUrl, results, setPage, onEdit, audits, onSelectAudit }) {
  const [detailCat, setDetailCat] = useState(null);

  const totalItems = AUDIT_CATEGORIES.flatMap(c => c.sections.flatMap(s => s.items)).length;
  const filledItems = Object.keys(results).filter(k => results[k] !== null && results[k] !== undefined).length;
  const missingCount = totalItems - filledItems;
  const activeId = audits?.find(a => a.url === auditUrl)?.id;

  if (!score) return (
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
    <div style={{ padding:'32px 36px', flex:1, overflowY:'auto' }}>
      {detailCat && <CategoryDetail catId={detailCat} results={results} onClose={() => setDetailCat(null)} />}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, color:C.text, marginBottom:10 }}>Audit Dashboard</h1>
          {audits && audits.length > 1 && (
            <select
              value={activeId || ''}
              onChange={e => { const a = audits.find(x => x.id === e.target.value); if (a) onSelectAudit(a); }}
              style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                padding:'8px 12px', color:C.text, fontSize:13, cursor:'pointer', marginBottom:8,
                maxWidth:340, outline:'none' }}>
              {audits.map(a => (
                <option key={a.id} value={a.id}>
                  {a.clientName ? `${a.clientName} — ` : ''}{a.url}  (Grade {a.score.grade})
                </option>
              ))}
            </select>
          )}
          {audits && audits.length <= 1 && (
            <div style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:'uppercase',
              letterSpacing:'0.08em', marginBottom:6 }}>{auditUrl}</div>
          )}
          {missingCount > 0 && (
            <div style={{ fontSize:12, color:C.amber }}>
              ⚠ {missingCount} of {totalItems} items not yet reviewed —{' '}
              <span onClick={onEdit} style={{ cursor:'pointer', textDecoration:'underline' }}>
                continue audit
              </span>
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onEdit} style={{ background:'transparent', border:`1px solid ${C.border}`,
            borderRadius:8, padding:'9px 18px', color:C.muted, fontSize:13, fontWeight:600, cursor:'pointer' }}>
            ✎ Edit Audit
          </button>
          <button onClick={() => setPage('audit')} style={{ background:C.accent, border:'none',
            borderRadius:8, padding:'9px 18px', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            + New Audit
          </button>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:20, marginBottom:20 }}>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12,
          padding:24, display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          <ScoreRing score={score.weighted} size={130} />
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:'uppercase' }}>Weighted Score</div>
            <div style={{ fontSize:12, color:C.amber, marginTop:4 }}>{score.rating}</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {score.categories.map(cat => (
            <div key={cat.id} onClick={() => setDetailCat(cat.id)}
              onMouseEnter={e => e.currentTarget.style.borderColor = cat.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12,
                padding:'16px 20px', cursor:'pointer', transition:'border-color 0.15s' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:11, color:C.muted, fontWeight:600,
                    textTransform:'uppercase', marginBottom:4 }}>{cat.icon} {cat.label}</div>
                  <div style={{ fontSize:26, fontWeight:800, color:C.text, lineHeight:1 }}>
                    {cat.score}<span style={{ fontSize:12, color:C.muted }}>/100</span>
                  </div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>
                    {cat.passed} pass · {cat.failed} fail · <span style={{ color:C.accent }}>details →</span>
                  </div>
                </div>
                <div style={{ background:`${cat.color}22`, border:`1px solid ${cat.color}44`,
                  borderRadius:8, padding:'4px 12px', fontSize:20, fontWeight:800, color:cat.color }}>
                  {cat.grade}
                </div>
              </div>
              <div style={{ marginTop:12, background:C.border, borderRadius:4, height:4 }}>
                <div style={{ height:4, borderRadius:4, background:cat.color, width:`${cat.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'16px 24px', borderBottom:`1px solid ${C.border}`,
          display:'flex', justifyContent:'space-between' }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.text }}>🎯 Top Priority Issues</div>
          <div style={{ fontSize:11, color:C.muted, textAlign:'right' }}>
            {issues.length} found
            {filledItems < totalItems && (
              <span style={{ color:C.amber }}> · based on {filledItems}/{totalItems} reviewed</span>
            )}
          </div>
        </div>
        {issues.slice(0, 10).map((issue, i) => {
          const howTo = AUDIT_CATEGORIES.flatMap(c => c.sections.flatMap(s => s.items)).find(it => it.id === issue.id)?.howTo;
          return (
            <div key={issue.id} style={{ padding:'13px 24px',
              borderBottom: i < 9 ? `1px solid ${C.border}` : 'none',
              display:'flex', alignItems:'flex-start', gap:14,
              background: i % 2 === 0 ? 'transparent' : `${C.bg}66` }}>
              <div style={{ width:8, height:8, borderRadius:'50%', marginTop:5,
                background: SEV[issue.priority] ?? C.muted, flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color:C.text, marginBottom:3 }}>{issue.item}</div>
                {howTo && <div style={{ fontSize:11, color:C.muted, fontStyle:'italic', lineHeight:1.5 }}>💡 {howTo}</div>}
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                <div style={{ fontSize:11, color:C.muted, background:C.border,
                  borderRadius:6, padding:'3px 10px', whiteSpace:'nowrap' }}>{issue.category}</div>
                <div style={{ fontSize:11, fontWeight:600, color:SEV[issue.priority] ?? C.muted,
                  textTransform:'uppercase', width:60, textAlign:'right' }}>{issue.priority}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AuditView({ onComplete, initialUrl = '', initialClientName = '', initialResults = {}, isEditing = false }) {
  const [url, setUrl]               = useState(initialUrl);
  const [clientName, setClientName] = useState(initialClientName);
  const [results, setResults]       = useState(initialResults);
  const [activeCat, setActiveCat]   = useState(AUDIT_CATEGORIES[0].id);
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
                {done && !active && (
                  <span style={{ position:'absolute', top:-4, right:-4, width:10, height:10,
                    borderRadius:'50%', background:c.color, border:`2px solid ${C.bg}` }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category content */}
      <div style={{ padding:'20px 36px 32px' }}>
        {cat.sections.map(sec => (
          <div key={sec.id} style={{ marginBottom:14 }}>
            <div style={{ padding:'8px 14px', background:cat.color + '22',
              borderLeft:`3px solid ${cat.color}`, borderRadius:'0 6px 6px 0',
              fontSize:11, fontWeight:700, color:cat.color }}>{sec.label}</div>
            {sec.items.map((item, i) => {
              const s = results[item.id];
              return (
                <div key={item.id} style={{ display:'flex', alignItems:'flex-start', gap:14,
                  padding:'11px 14px', background: i % 2 === 0 ? C.surface : C.surfaceHover,
                  borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0,
                    background:`${SEV[item.priority]}22`, border:`1px solid ${SEV[item.priority]}44`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:9, fontWeight:700, color:SEV[item.priority] }}>{item.num}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:2 }}>{item.item}</div>
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
        ))}

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

function WhiteLabelView({ audits, currentUrl, currentClientName, score, results, onSelect, onDelete, onUpdateAudit, onEditAudit }) {
  const [name, setName]               = useState('My Agency');
  const [color, setColor]             = useState('#0EA5E9');
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
        if (cfg.agencyLogo) setAgencyLogo(cfg.agencyLogo);
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
          agencyLogo, clientLogo },
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

      {audits.length > 0 && (
        <div style={{ marginTop:28, maxWidth:720 }}>
          <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:14 }}>
            Saved Audits ({audits.length})
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
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                    {isSelected && <span style={{ fontSize:10, color:C.accent, fontWeight:700,
                      background:`${C.accent}22`, padding:'3px 10px', borderRadius:12 }}>SELECTED</span>}
                    <button onClick={e => { e.stopPropagation(); triggerPDF(a.score, a.results, a.url, a.clientName || ''); }}
                      style={{ background:color, border:'none', borderRadius:6,
                        padding:'4px 12px', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer',
                        whiteSpace:'nowrap' }}>↓ PDF</button>
                    <button onClick={e => { e.stopPropagation(); onEditAudit(a); }}
                      style={{ background:'transparent', border:`1px solid ${C.accent}`, borderRadius:6,
                        padding:'4px 10px', color:C.accent, fontSize:12, cursor:'pointer' }}>✎ Edit</button>
                    <button onClick={e => { e.stopPropagation(); onDelete(a.id); }}
                      style={{ background:'transparent', border:`1px solid ${C.border}`, borderRadius:6,
                        padding:'4px 10px', color:C.muted, fontSize:12, cursor:'pointer' }}>✕</button>
                  </div>
                </div>
              );
            })}
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

  return (
    <div style={{ display:'flex', height:'100vh', background:C.bg, color:C.text,
      fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar page={page} setPage={p => { if (p === 'audit') { setEditMode(false); } setPage(p); }} />
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {page === 'dashboard'  && <DashboardView score={score} issues={issues} auditUrl={auditUrl} results={results}
          setPage={handleNewAudit} onEdit={handleEdit} audits={audits} onSelectAudit={handleSelectAudit} />}
        {page === 'audit'      && <AuditView onComplete={handleComplete}
            initialUrl={editMode ? auditUrl : ''}
            initialClientName={editMode ? clientName : ''}
            initialResults={editMode ? results : {}}
            isEditing={editMode} />}
        {page === 'whitelabel' && <WhiteLabelView audits={audits} currentUrl={auditUrl}
          currentClientName={clientName} score={score} results={results}
          onSelect={handleSelectAudit} onDelete={handleDeleteAudit} onUpdateAudit={handleUpdateAudit} onEditAudit={handleEditAudit} />}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
