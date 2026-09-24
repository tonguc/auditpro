import { parse } from 'parse5';

type Node = { tagName?: string; value?: string; attrs?: Array<{name: string; value: string}>; childNodes?: Node[] };
const attribute = (node: Node, name: string) => node.attrs?.find(item => item.name === name)?.value ?? '';
const normalize = (value: string) => value.replace(/\s+/gu, ' ').trim();

// Measure the parsed document head. Template contents, SVG titles, comments and
// strings in scripts/styles are not document metadata. parse5 decodes entities.
export function documentMetadata(html: string) {
  const document = parse(html) as unknown as Node;
  const head = document.childNodes?.find(node => node.tagName === 'html')?.childNodes?.find(node => node.tagName === 'head');
  const children = head?.childNodes ?? [];
  const titles = children.filter(node => node.tagName === 'title').map(node => normalize((node.childNodes ?? []).map(child => child.value ?? '').join('')));
  const title = titles[0] ?? '';
  const descriptions = children.filter(node => node.tagName === 'meta' && attribute(node, 'name').trim().toLowerCase() === 'description').map(node => normalize(attribute(node, 'content')));
  const meta = (key: string, attr = 'name') => {
    const node = children.find(node => node.tagName === 'meta' && attribute(node, attr).trim().toLowerCase() === key.toLowerCase());
    return node ? normalize(attribute(node, 'content')) : '';
  };
  return {title, titles, descriptions, description: meta('description'), meta};
}
