export function compareSchemaText(blocks: string[], visibleText: string) {
  const normalize = (s: string) => s.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
  const visible = normalize(visibleText);
  const fields: string[] = [];
  let invalid = 0;
  for (const block of blocks) {
    try {
      const queue: unknown[] = [JSON.parse(block)];
      let visited = 0;
      while (queue.length && visited++ < 10000) {
        const node = queue.pop();
        if (!node || typeof node !== 'object') continue;
        if (Array.isArray(node)) { queue.push(...node); continue; }
        const item = node as Record<string, unknown>;
        const types = [item['@type']].flat().filter((x): x is string => typeof x === 'string').map(x => x.replace(/^https?:\/\/schema\.org\//, ''));
        const keys = types.some(t => ['Organization', 'LocalBusiness'].includes(t)) ? ['name', 'telephone'] : types.includes('Question') ? ['name'] : types.includes('Answer') ? ['text'] : [];
        for (const key of keys) if (typeof item[key] === 'string' && (item[key] as string).trim()) fields.push(item[key] as string);
        queue.push(...Object.values(item));
      }
    } catch { invalid++; }
  }
  const unique = [...new Set(fields)].slice(0, 100);
  const matched = unique.filter(s => !/<[^>]+>/.test(s) && visible.includes(normalize(s))).length;
  return { tested: unique.length, matched, invalid, note: `${matched}/${unique.length} sampled JSON-LD name/telephone/question/answer strings matched rendered visible text; ${invalid} invalid JSON blocks. Missing matches need manual review (formatting, collapsed content, localization or dynamic rendering may differ). This is not semantic equivalence or rich-result validation.` };
}
