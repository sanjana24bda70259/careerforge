// Parse only explicit structures in our authored examples. Unknown notation stays text.
export function exampleDiagram(input, topic) {
  if (['trees', 'bst'].includes(topic)) {
    const notation = input.match(/(?:tree|BST|A)=(-?\d+(?:\([^\s;]*\))?)/)?.[1];
    if (!notation) return null;
    let cursor = 0;
    const nodes = [], edges = [];
    const read = (depth = 0) => {
      if (notation[cursor] === '-' && !/\d/.test(notation[cursor + 1] || '')) { cursor++; return null; }
      const value = notation.slice(cursor).match(/^-?\d+/)?.[0];
      if (!value || depth > 10) throw new Error('Unsupported example tree');
      cursor += value.length;
      const node = { id: nodes.length, label: value, depth, order: 0 };
      nodes.push(node);
      let left = null, right = null;
      if (notation[cursor] === '(') {
        cursor++; left = read(depth + 1);
        if (notation[cursor++] !== ',') throw new Error('Missing child separator');
        right = read(depth + 1);
        if (notation[cursor++] !== ')') throw new Error('Missing child boundary');
      }
      node.left = left; node.right = right;
      for (const child of [left, right]) if (child) edges.push({ from: node.id, to: child.id });
      return node;
    };
    try {
      const root = read();
      if (cursor !== notation.length) return null;
      let order = 0;
      const position = node => { if (!node) return; position(node.left); node.order = order++; position(node.right); };
      position(root);
      const depth = Math.max(...nodes.map(node => node.depth), 1);
      return { label: 'Example tree', nodes: nodes.map(node => ({ id: node.id, label: node.label, x: (node.order + 1) * 600 / (nodes.length + 1), y: 35 + node.depth * 160 / depth })), edges };
    } catch { return null; }
  }
  if (topic === 'linked-list') {
    // Multiple lists and back edges are kept in their original text to avoid conflating identities.
    if (/back edge|[AB]:|child|random|;/.test(input)) return null;
    const chain = input.match(/-?\d+(?:→(?:-?\d+|null))+/)?.[0];
    if (!chain) return null;
    const values = chain.split('→');
    return { label: 'Example linked list', directed: true,
      nodes: values.map((label, id) => ({ id, label, x: (id + 1) * 600 / (values.length + 1), y: 110 })),
      edges: values.slice(1).map((_, i) => ({ from: i, to: i + 1 })) };
  }
  return null;
}
