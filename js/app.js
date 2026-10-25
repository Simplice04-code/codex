import { GRAPH, createTraversalSteps } from './traversal.js';

// The UI only renders immutable algorithm snapshots; traversal logic lives separately.
const elements = Object.fromEntries([
  'next-button', 'reset-button', 'step-label', 'algorithm-name', 'progress-fill',
  'step-icon', 'step-title', 'step-message', 'frontier-title', 'frontier-rule',
  'frontier-description', 'frontier-items', 'frontier-left', 'frontier-right',
  'traversal-order', 'visited-count', 'graph-description',
].map((id) => [id, document.getElementById(id)]));

const algorithmButtons = document.querySelectorAll('[data-algorithm]');
const nodeCount = Object.keys(GRAPH).length;
let algorithm = 'bfs';
let steps = createTraversalSteps(algorithm);
let stepIndex = 0;

function render() {
  const state = steps[stepIndex];
  const isBfs = algorithm === 'bfs';
  const collection = isBfs ? 'queue' : 'stack';

  // Node state colors are paired with a legend and a text description for accessibility.
  document.querySelectorAll('[data-node]').forEach((node) => {
    const label = node.dataset.node;
    node.classList.toggle('is-current', label === state.current);
    node.classList.toggle('is-visited', state.visited.includes(label));
    node.classList.toggle('is-frontier', state.frontier.includes(label));
  });
  document.querySelectorAll('[data-edge]').forEach((edge) => {
    const [from, to] = edge.dataset.edge.split('-');
    edge.classList.toggle('is-explored', state.visited.includes(from) && state.visited.includes(to));
    edge.classList.toggle('is-current-edge', to === state.current);
  });
  elements['graph-description'].textContent = `Edges connect A to B, A to C, B to D, and C to E. ${state.visited.length ? `Visited: ${state.visited.join(', ')}. Current node: ${state.current}.` : 'No nodes have been visited.'} ${collection}: ${state.frontier.join(', ') || 'empty'}.`;

  elements['step-label'].textContent = `STEP ${String(stepIndex).padStart(2, '0')} OF ${String(nodeCount).padStart(2, '0')}`;
  elements['algorithm-name'].textContent = isBfs ? 'Breadth-first search' : 'Depth-first search';
  elements['progress-fill'].style.width = `${(state.visited.length / nodeCount) * 100}%`;
  document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', state.visited.length);
  elements['step-icon'].textContent = state.complete ? '✓' : state.current ? state.current : '→';
  elements['step-title'].textContent = state.complete ? 'Every node. Nicely explored.' : state.current ? `Meet node ${state.current}.` : 'Ready when you are.';
  elements['step-message'].textContent = state.message;
  elements['next-button'].disabled = state.complete;
  elements['next-button'].innerHTML = state.complete ? 'Complete <span aria-hidden="true">✓</span>' : 'Next Step <span aria-hidden="true">→</span>';

  elements['frontier-title'].textContent = `The ${collection}`;
  elements['frontier-rule'].textContent = isBfs ? 'FIFO' : 'LIFO';
  elements['frontier-description'].textContent = isBfs
    ? 'First in, first out. A little like a line of people.'
    : 'Last in, first out. Think of a stack of plates.';
  elements['frontier-left'].textContent = isBfs ? '↑ NEXT OUT' : '↑ BOTTOM';
  elements['frontier-right'].textContent = isBfs ? 'NEW ITEMS JOIN HERE ↑' : 'TOP · NEXT OUT ↑';
  elements['frontier-items'].replaceChildren();
  for (const [index, label] of state.frontier.entries()) {
    const chip = document.createElement('span');
    const isNext = isBfs ? index === 0 : index === state.frontier.length - 1;
    chip.className = `frontier-chip${isNext ? ' is-next' : ''}`;
    chip.textContent = label;
    elements['frontier-items'].append(chip);
  }
  if (!state.frontier.length) {
    const empty = document.createElement('span');
    empty.className = 'empty-frontier';
    empty.textContent = 'Empty — all done!';
    elements['frontier-items'].append(empty);
  }
  const next = isBfs ? state.frontier[0] : state.frontier.at(-1);
  elements['frontier-items'].setAttribute('aria-label', `${collection}: ${state.frontier.join(', ') || 'empty'}${next ? `. ${next} is next.` : '.'}`);

  elements['visited-count'].textContent = `${state.visited.length} of ${nodeCount} visited`;
  elements['traversal-order'].replaceChildren();
  for (let index = 0; index < nodeCount; index++) {
    const item = document.createElement('li');
    item.className = state.visited[index] ? `order-node${index === state.visited.length - 1 ? ' latest' : ''}` : 'empty-slot';
    item.textContent = state.visited[index] || '—';
    if (!state.visited[index]) item.setAttribute('aria-hidden', 'true');
    elements['traversal-order'].append(item);
  }
  elements['traversal-order'].setAttribute('aria-label', state.visited.length ? `Traversal order: ${state.visited.join(', ')}` : 'No nodes visited yet');
  algorithmButtons.forEach((button) => {
    const selected = button.dataset.algorithm === algorithm;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', selected);
  });
}

function reset(selectedAlgorithm = algorithm) {
  algorithm = selectedAlgorithm;
  steps = createTraversalSteps(algorithm);
  stepIndex = 0;
  render();
}

function nextStep() {
  if (stepIndex < steps.length - 1) {
    stepIndex++;
    render();
  }
}

algorithmButtons.forEach((button) => button.addEventListener('click', () => reset(button.dataset.algorithm)));
elements['next-button'].addEventListener('click', nextStep);
elements['reset-button'].addEventListener('click', () => reset());

// A keyboard shortcut supplements the native, keyboard-accessible buttons.
document.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowRight' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  event.preventDefault();
  nextStep();
});

render();
