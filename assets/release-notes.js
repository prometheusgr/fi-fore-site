(function (root) {
  function parseInline(text) {
    const out = [];
    const re = /\*\*(.+?)\*\*|`([^`]+)`/g;
    let last = 0;
    let m;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push({ text: text.slice(last, m.index) });
      out.push(m[1] !== undefined ? { text: m[1], bold: true } : { text: m[2], code: true });
      last = re.lastIndex;
    }
    if (last < text.length) out.push({ text: text.slice(last) });
    return out;
  }

  function parseNotes(md) {
    const blocks = [];
    let para = [];
    const flush = () => {
      if (para.length) blocks.push({ type: 'p', inline: parseInline(para.join(' ')) });
      para = [];
    };
    for (const raw of String(md || '').split(/\r?\n/)) {
      const line = raw.trim();
      const h = line.match(/^#{2,4}\s+(.*)$/);
      const li = line.match(/^[-*]\s+(.*)$/);
      if (!line) flush();
      else if (h) { flush(); blocks.push({ type: 'h', text: h[1] }); }
      else if (li) {
        flush();
        const last = blocks[blocks.length - 1];
        const item = parseInline(li[1]);
        if (last && last.type === 'ul') last.items.push(item);
        else blocks.push({ type: 'ul', items: [item] });
      } else para.push(line);
    }
    flush();
    return blocks;
  }

  function isBreaking(block) {
    return block.type === 'h' && /breaking/i.test(block.text);
  }

  function appendInline(doc, parent, parts) {
    for (const part of parts) {
      const el = doc.createElement(part.bold ? 'strong' : part.code ? 'code' : 'span');
      el.textContent = part.text;
      parent.appendChild(el);
    }
  }

  function renderNotes(doc, md) {
    const wrap = doc.createElement('div');
    wrap.className = 'notes';
    let section = null;
    const target = () => section || wrap;
    for (const block of parseNotes(md)) {
      if (block.type === 'h') {
        section = doc.createElement('div');
        section.className = 'notes-section' + (isBreaking(block) ? ' breaking' : '');
        const h = doc.createElement('h4');
        h.textContent = block.text;
        section.appendChild(h);
        wrap.appendChild(section);
      } else if (block.type === 'p') {
        const p = doc.createElement('p');
        appendInline(doc, p, block.inline);
        target().appendChild(p);
      } else {
        const ul = doc.createElement('ul');
        for (const item of block.items) {
          const li = doc.createElement('li');
          appendInline(doc, li, item);
          ul.appendChild(li);
        }
        target().appendChild(ul);
      }
    }
    return wrap;
  }

  const api = { parseNotes, renderNotes, isBreaking };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ReleaseNotes = api;
})(typeof window !== 'undefined' ? window : globalThis);
