// Product descriptions are pasted in from marketplace listings, so they arrive
// as a plain-text document: sub-headings, bullet lists and paragraphs separated
// by line breaks. Rendered as one <p> it reads as a grey wall, so the text is
// parsed back into real headings, lists and paragraphs.

// ️ is the variation selector trailing emoji bullets like ✔️ — without it
// the selector survives the strip and shows up in front of the text.
const BULLET_RE = /^\s*[*\-•✔✓]️?\s*/;

// A line is a sub-heading when it is short, carries no digits, ends without
// sentence punctuation and states no value — "Care Instructions", "Why You'll
// Love It". Anything with a number ("TOTAL LENGTH - 68.60 MM") or a label/value
// split ("Color - Vibrant tomato red") is content, not a heading.
const isHeading = (line) =>
  line.length <= 45 &&
  !/\d/.test(line) &&
  !/[.:,;!?]$/.test(line) &&
  !line.includes(':') &&
  !line.includes(' - ');

function parse(text) {
  const nodes = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    if (BULLET_RE.test(line)) {
      const item = line.replace(BULLET_RE, '').trim();
      if (!item) continue;
      const last = nodes[nodes.length - 1];
      if (last?.type === 'list') last.items.push(item);
      else nodes.push({ type: 'list', items: [item] });
      continue;
    }

    nodes.push({ type: isHeading(line) ? 'heading' : 'text', value: line });
  }
  return nodes;
}

export default function ProductDescription({ text }) {
  const nodes = parse(text || '');

  return (
    <div className="product-description">
      {nodes.map((node, i) =>
        node.type === 'list' ? (
          <ul key={i}>
            {node.items.map((item, j) => <li key={j}>{item}</li>)}
          </ul>
        ) : node.type === 'heading' ? (
          <h5 key={i}>{node.value}</h5>
        ) : (
          <p key={i}>{node.value}</p>
        )
      )}
    </div>
  );
}
