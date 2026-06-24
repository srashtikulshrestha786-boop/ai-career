/** Render simple markdown (bold, lists, paragraphs) to safe HTML. */
export function renderMarkdown(text: string): string {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // headings
  html = html.replace(/^### (.+)$/gm, '<p class="font-semibold text-purple-400 mt-2">$1</p>');
  // list items
  const lines = html.split('\n');
  const out: string[] = [];
  let inList = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[•-]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${trimmed.replace(/^[•-]\s+/, '').replace(/^\d+\.\s+/, '')}</li>`);
    } else {
      if (inList) { out.push('</ul>'); inList = false; }
      if (trimmed) out.push(`<p>${trimmed}</p>`);
    }
  }
  if (inList) out.push('</ul>');
  return out.join('\n');
}
