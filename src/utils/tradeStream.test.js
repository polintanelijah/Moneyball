import assert from 'node:assert/strict';
import test from 'node:test';
import { readTradeStream } from './tradeStream.js';

function streamFromParts(parts) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const part of parts) controller.enqueue(encoder.encode(part));
      controller.close();
    },
  });
}

test('renders deltas even when network chunks split an event', async () => {
  const chunks = [];
  await readTradeStream(streamFromParts([
    '{"type":"delta","content":"Hello"}\n{"type":"del',
    'ta","content":" world"}\n{"type":"done"}\n',
  ]), (chunk) => chunks.push(chunk));
  assert.deepEqual(chunks, ['Hello', ' world']);
});

test('reports an error after preserving earlier deltas', async () => {
  const chunks = [];
  await assert.rejects(
    readTradeStream(streamFromParts([
      '{"type":"delta","content":"Partial"}\n',
      '{"type":"error","message":"Ollama disconnected"}\n',
    ]), (chunk) => chunks.push(chunk)),
    /Ollama disconnected/,
  );
  assert.deepEqual(chunks, ['Partial']);
});

test('rejects a stream that ends without a completion event', async () => {
  await assert.rejects(
    readTradeStream(streamFromParts(['{"type":"delta","content":"Partial"}\n']), () => {}),
    /ended before the trade analysis completed/,
  );
});
