export type RobotsDecision = { allowed: boolean | null; reason: string; reasonCode?: 'unavailable'|'unsupported'|'complex'|'different-origin'; group?: string; rule?: string };
export type RobotsPageEvidence = RobotsDecision & {url:string; bot:string; policyUrl:string; policyStatus:number; policyContentType:string};
export function robotsPageEvidence(text:string,status:number,policyUrl:string,origin:string,urls:URL[],contentType='text/plain'):RobotsPageEvidence[] {
  return ['googlebot','oai-searchbot','perplexitybot','claudebot'].flatMap(bot=>[...new Map(urls.map(url=>[url.href,url])).values()].map(url=>({
    url:url.href,bot,policyUrl,policyStatus:status,policyContentType:contentType,
    ...(url.origin===origin ? robotsDecision(text,status,url,bot,contentType) : {allowed:null,reason:'different-origin-policy-not-retrieved',reasonCode:'different-origin' as const}),
  })));
}
// Deliberately bounded: encoded/non-ASCII matching is not guessed.
export function robotsDecision(text: string, status: number, url: URL, bot: string, contentType='text/plain'): RobotsDecision {
  if (status >= 400 && status < 500 && status !== 429) return { allowed: null, reasonCode: 'unavailable', reason: `HTTP ${status}: no retrieved policy; crawler-specific missing-file handling requires review` };
  if (status < 200 || status >= 300) return { allowed: null, reasonCode: 'unavailable', reason: `robots retrieval unavailable (HTTP ${status})` };
  if (!/^text\/plain(?:\s*;|$)/i.test(contentType) || text.length > 250000 || /<html\b/i.test(text)) return { allowed: null, reasonCode: 'unsupported', reason: 'robots response is not supported text/plain policy content or exceeds the inspection limit' };
  type Rule = { allow: boolean; path: string };
  const groups: { agents: string[]; rules: Rule[] }[] = [];
  let current = { agents: [] as string[], rules: [] as Rule[] };
  for (const line of text.replace(/^\uFEFF/, '').split(/\r\n|\r|\n/)) {
    const m = line.split('#')[0].trim().match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase(), value = m[2].trim();
    if (key === 'user-agent') {
      if (current.rules.length) { groups.push(current); current = { agents: [], rules: [] }; }
      if (value) current.agents.push(value.toLowerCase());
    } else if (['allow', 'disallow'].includes(key) && current.agents.length) current.rules.push({ allow: key === 'allow', path: value });
  }
  groups.push(current);
  // RFC 9309 §2.2.1: case-insensitive group matching; groups with the same match
  // are combined. Group tokens match as a prefix of the bot product token (the
  // behaviour of the reference parsers) and the longest token is the most
  // specific group; the "*" group applies only when no token matches at all.
  const botToken = bot.toLowerCase();
  const tokenMatch = (agent: string) => Boolean(agent) && agent !== '*' && botToken.startsWith(agent);
  const specificity = (g: { agents: string[] }) => g.agents.reduce((best, agent) => (tokenMatch(agent) ? Math.max(best, agent.length) : best), 0);
  const scored = groups.map(g => ({ g, score: specificity(g) }));
  const bestScore = Math.max(0, ...scored.map(entry => entry.score));
  const selected = scored.filter(entry => entry.score === bestScore && (bestScore > 0 || entry.g.agents.includes('*'))).map(entry => entry.g);
  const rules = selected.flatMap(g => g.rules).filter(r => r.path);
  const group = bestScore > 0
    ? selected[0]?.agents.find(tokenMatch) ?? undefined
    : (selected.length ? '*' : undefined);
  const path = url.pathname + url.search;
  // Encoded or non-ASCII matching is deliberately not guessed ('unsupported');
  // size and wildcard limits are a separate bounded-matcher refusal ('complex').
  if (/[%\u0080-\uffff]/.test(path) || rules.some(r => /[%\u0080-\uffff]/.test(r.path)))
    return { allowed: null, reasonCode: 'unsupported', reason: 'encoded or non-ASCII path matching is not guessed and requires review' };
  if (path.length > 8192 || rules.some(r => r.path.length > 1000 || (r.path.match(/\*/g)?.length ?? 0) > 10))
    return { allowed: null, reasonCode: 'complex', reason: 'path or rule complexity exceeds the bounded matcher and requires review' };
  const matching = rules.filter(r => {
    // RFC 9309 §5.1 rules may start with "*" (e.g. Disallow: *.gif$); other
    // non-"/" patterns are invalid and ignored per §2.2.2.
    if (!r.path.startsWith('/') && !r.path.startsWith('*')) return false;
    const end = r.path.endsWith('$');
    const pattern = end ? r.path.slice(0, -1) : r.path + '*';
    // Greedy wildcard matcher avoids regex backtracking on untrusted policies.
    let i = 0, j = 0, star = -1, retry = 0;
    while (i < path.length) {
      if (pattern[j] === path[i]) { i++; j++; }
      else if (pattern[j] === '*') { star = j++; retry = i; }
      else if (star >= 0) { j = star + 1; i = ++retry; }
      else return false;
    }
    while (pattern[j] === '*') j++;
    return j === pattern.length;
  }).sort((a, b) => b.path.replace(/[*$]/g, '').length - a.path.replace(/[*$]/g, '').length || Number(b.allow) - Number(a.allow));
  const winner = matching[0];
  return { allowed: winner ? winner.allow : true, group, rule: winner ? `${winner.allow ? 'Allow' : 'Disallow'}: ${winner.path}` : undefined, reason: winner ? `${winner.allow ? 'Allow' : 'Disallow'}: ${winner.path}` : 'no matching disallow rule in the selected group' };
}
