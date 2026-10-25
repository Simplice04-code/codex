/** The tutor's undirected graph. Neighbor order is normalized by the algorithms. */
export const GRAPH = Object.freeze({
  A: Object.freeze(['B', 'C']),
  B: Object.freeze(['A', 'D']),
  C: Object.freeze(['A', 'E']),
  D: Object.freeze(['B']),
  E: Object.freeze(['C']),
});

/** Copy and freeze each state so moving between steps cannot change earlier steps. */
function snapshot(current, visited, frontier, discovered, edges, message, complete) {
  return Object.freeze({
    current,
    visited: Object.freeze([...visited]),
    frontier: Object.freeze([...frontier]),
    discovered: Object.freeze([...discovered]),
    edges: Object.freeze(edges.map((edge) => Object.freeze([...edge]))),
    message,
    complete,
  });
}

function validateGraph(graph, start) {
  if (!graph || typeof graph !== 'object' || Array.isArray(graph)) {
    throw new TypeError('The graph must map node names to neighbor arrays.');
  }
  if (!Object.hasOwn(graph, start)) {
    throw new RangeError(`The start node ${start} is not in the graph.`);
  }
  for (const neighbors of Object.values(graph)) {
    if (!Array.isArray(neighbors) || neighbors.some((node) => typeof node !== 'string' || !Object.hasOwn(graph, node))) {
      throw new TypeError('Every neighbor must name a node in the graph.');
    }
  }
}

/**
 * Build an initial state followed by one state per visited node.
 *
 * A BFS queue removes from the front (index 0). A DFS stack removes from the
 * top (the last index). DFS pushes neighbors in reverse alphabetical order,
 * putting the alphabetically first neighbor on top. Nodes are marked as
 * discovered when added, which prevents repeated visits on undirected edges.
 */
export function createTraversalSteps(algorithm, graph = GRAPH, start = 'A') {
  if (algorithm !== 'bfs' && algorithm !== 'dfs') {
    throw new RangeError('Choose "bfs" or "dfs".');
  }
  validateGraph(graph, start);

  const isBfs = algorithm === 'bfs';
  const frontier = [start];
  const visited = [];
  const discovered = new Set([start]);
  const edges = [];
  const collection = isBfs ? 'queue' : 'stack';
  const rule = isBfs ? 'first in, first out (FIFO)' : 'last in, first out (LIFO)';
  const steps = [snapshot(null, visited, frontier, discovered, edges,
    `Start at ${start}. Put ${start} in the ${collection}. ${isBfs ? 'BFS' : 'DFS'} uses ${rule}. Click Next Step to visit it.`, false)];

  while (frontier.length > 0) {
    const current = isBfs ? frontier.shift() : frontier.pop();
    visited.push(current);

    // Work on a sorted copy: never mutate a supplied graph or its neighbor lists.
    const neighbors = [...new Set(graph[current])]
      .sort((a, b) => a.localeCompare(b))
      .filter((node) => !discovered.has(node));
    for (const node of neighbors) {
      discovered.add(node);
      edges.push([current, node]);
    }
    const added = isBfs ? neighbors : [...neighbors].reverse();
    frontier.push(...added);

    let message = isBfs
      ? `Dequeue ${current} from the front and visit it. `
      : `Pop ${current} from the top and visit it. `;
    if (neighbors.length > 0) {
      message += isBfs
        ? `Enqueue ${neighbors.join(', ')} at the back in alphabetical order. The queue is FIFO: first in, first out.`
        : `Push ${added.join(', ')} onto the stack${added.length > 1 ? ` so ${neighbors[0]} is on top and visited first` : ''}. The stack is LIFO: last in, first out.`;
    } else {
      message += 'All its neighbors are already discovered, so add nothing. ';
      message += isBfs
        ? 'The queue is FIFO: first in, first out.'
        : 'The stack is LIFO: last in, first out.';
    }
    const complete = frontier.length === 0;
    if (complete) message += ` The ${collection} is empty. Traversal complete!`;
    steps.push(snapshot(current, visited, frontier, discovered, edges, message, complete));
  }

  return Object.freeze(steps);
}
