export async function readTradeStream(body, onDelta) {
  if (!body) {
    throw new Error('The backend did not return a response stream.');
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (!line) continue;

        let event;
        try {
          event = JSON.parse(line);
        } catch {
          throw new Error('The backend returned an invalid response stream.');
        }

        if (!event || typeof event !== 'object') {
          throw new Error('The backend returned an invalid response stream.');
        }

        if (event.type === 'delta' && typeof event.content === 'string') {
          onDelta(event.content);
        } else if (event.type === 'done') {
          return;
        } else if (event.type === 'error') {
          throw new Error(event.message || 'The trade analysis failed.');
        } else {
          throw new Error('The backend returned an invalid response stream.');
        }
      }
    }

    throw new Error('The response ended before the trade analysis completed.');
  } finally {
    reader.releaseLock();
  }
}
