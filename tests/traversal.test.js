import test from 'node:test';
import assert from 'node:assert/strict';
import { GRAPH, createTraversalSteps } from '../js/traversal.js';

test('BFS visits the tutor graph level by level in alphabetical order', () => {
  const steps = createTraversalSteps('bfs');
  assert.equal(steps.length, 6);
  assert.deepEqual(steps.map((step) => step.current), [null, 'A', 'B', 'C', 'D', 'E']);
  assert.deepEqual(steps.at(-1).visited, ['A', 'B', 'C', 'D', 'E']);
  assert.deepEqual(steps.map((step) => step.frontier), [
    ['A'], ['B', 'C'], ['C', 'D'], ['D', 'E'], ['E'], [],
  ]);
});

test('DFS goes down a branch first, using the last stack item as its top', () => {
  const steps = createTraversalSteps('dfs');
  assert.equal(steps.length, 6);
  assert.deepEqual(steps.map((step) => step.current), [null, 'A', 'B', 'D', 'C', 'E']);
  assert.deepEqual(steps.at(-1).visited, ['A', 'B', 'D', 'C', 'E']);
  assert.deepEqual(steps.map((step) => step.frontier), [
    ['A'], ['C', 'B'], ['C', 'D'], ['C'], ['E'], [],
  ]);
});

for (const algorithm of ['bfs', 'dfs']) {
  test(`${algorithm}: each step preserves its history and records the discovery edges`, () => {
    const steps = createTraversalSteps(algorithm);
    assert.deepEqual(steps[0].visited, []);
    assert.deepEqual(steps[0].discovered, ['A']);
    assert.deepEqual(steps[0].edges, []);
    assert.equal(steps[0].current, null);
    assert.deepEqual(steps[1].visited, ['A']);
    assert.deepEqual(steps[1].edges, [['A', 'B'], ['A', 'C']]);
    assert.deepEqual(steps[2].edges, [['A', 'B'], ['A', 'C'], ['B', 'D']]);
    assert.deepEqual(steps.at(-1).edges, [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'E']]);
    for (let index = 0; index < steps.length; index++) {
      assert.equal(steps[index].visited.length, index);
      assert.equal(steps[index].complete, index === steps.length - 1);
      assert.equal(new Set(steps[index].visited).size, index);
    }
    assert.match(steps[0].message, algorithm === 'bfs' ? /queue.*FIFO/ : /stack.*LIFO/);
    assert.match(steps.at(-1).message, /empty.*complete/i);
  });

  test(`${algorithm}: new runs reset state and snapshots cannot be mutated`, () => {
    const first = createTraversalSteps(algorithm);
    const second = createTraversalSteps(algorithm);
    assert.notEqual(first, second);
    assert.notEqual(first[1].visited, second[1].visited);
    assert.throws(() => first[0].frontier.push('Z'), TypeError);
    assert.throws(() => first[1].edges[0].push('Z'), TypeError);
    assert.throws(() => { first[1].current = 'Z'; }, TypeError);
    assert.deepEqual(second[0].visited, []);
    assert.deepEqual(second[0].frontier, ['A']);
    assert.deepEqual(GRAPH.A, ['B', 'C']);
  });

  test(`${algorithm}: input neighbor order does not change alphabetical traversal`, () => {
    const shuffled = { A: ['C', 'B'], B: ['D', 'A'], C: ['E', 'A'], D: ['B'], E: ['C'] };
    const before = JSON.stringify(shuffled);
    assert.deepEqual(createTraversalSteps(algorithm, shuffled).at(-1).visited,
      algorithm === 'bfs' ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'D', 'C', 'E']);
    assert.equal(JSON.stringify(shuffled), before);
  });

  test(`${algorithm}: cycles and self edges do not cause repeated visits`, () => {
    const cyclic = { A: ['A', 'B', 'C'], B: ['A', 'C'], C: ['A', 'B'] };
    const steps = createTraversalSteps(algorithm, cyclic);
    assert.equal(steps.length, 4);
    assert.deepEqual(steps.at(-1).visited, ['A', 'B', 'C']);
    assert.equal(steps.at(-1).complete, true);
    assert.deepEqual(steps.at(-1).frontier, []);
    assert.equal(steps.at(-1).edges.length, 2);
  });

  test(`${algorithm}: visits only the reachable component, including isolated starts`, () => {
    const graph = { A: ['B'], B: ['A'], C: [] };
    assert.deepEqual(createTraversalSteps(algorithm, graph).at(-1).visited, ['A', 'B']);
    const isolated = createTraversalSteps(algorithm, graph, 'C');
    assert.equal(isolated.length, 2);
    assert.deepEqual(isolated.at(-1).visited, ['C']);
    assert.equal(isolated.at(-1).complete, true);
  });
}

test('invalid algorithms, missing starts, and malformed graph edges fail clearly', () => {
  assert.throws(() => createTraversalSteps('dijkstra'), /Choose "bfs" or "dfs"/);
  assert.throws(() => createTraversalSteps('bfs', GRAPH, 'Z'), /start node Z/);
  assert.throws(() => createTraversalSteps('bfs', null), /map node names/);
  assert.throws(() => createTraversalSteps('bfs', { A: ['Z'] }), /Every neighbor/);
  assert.throws(() => createTraversalSteps('dfs', { A: 'B', B: [] }), /Every neighbor/);
});
