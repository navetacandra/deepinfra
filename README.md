# `@navetacandra/deepinfra`

> **Lightweight DeepInfra API client – no API key required, zero runtime dependencies.**

---

## 📖 Introduction

`@navetacandra/deepinfra` lets you query **[DeepInfra](https://deepinfra.com)** Large‑Language‑Models from Node.js or the browser *without* providing an API key.
It automatically:

* Picks a random **User‑Agent** & **IP** (IPv4 + IPv6) for every request.
* Exposes a **tiny wrapper** around DeepInfra’s public endpoints – <40 kB after tree‑shaking.
* Supports **streamed** and **non‑streamed** chat completions.

No additional packages are pulled in – ideal for quick prototypes, CLIs, and browser bundles.

---

## ⚙️ Installation

```bash
npm i @navetacandra/deepinfra
# or
yarn add @navetacandra/deepinfra
# or
pnpm add @navetacandra/deepinfra
```

> **Requires Node ≥ 18** (for native `fetch`). For earlier versions, pass a polyfilled `fetch` via the `request` option.

---

## 🚀 Usage

Below are minimal examples for **CommonJS**, **ESM**, and **TypeScript**.

### CommonJS

```js
const { getModels, generateCompletion, EventEmitter } = require('@navetacandra/deepinfra');

(async () => {
  const models = await getModels();
  console.table(models.map(m => ({ name: m.name, tokens: m.maxTokens })));

  const system = { role: 'system', content: 'You are a helpful assistant.' };
  const user   = { role: 'user',   content: 'Say hello in French.' };

  const reply = await generateCompletion([system, user], { model: 'meta-llama/Meta-Llama-3-70B-Instruct' });
  console.log(reply.content); // → « Bonjour ! »
})();
```

### ES Module

```js
import { getModels, generateCompletion, EventEmitter } from '@navetacandra/deepinfra';

// identical API – just use `import` syntax
```

### TypeScript

```ts
import { getModels, generateCompletion, EventEmitter } from '@navetacandra/deepinfra';
import type { Message } from '@navetacandra/deepinfra';

const stream = new EventEmitter<'completion' | 'error' | 'done'>();
stream.on('completion', chunk => process.stdout.write(chunk));
stream.on('done', full => console.log('\n\nDone →', full));
stream.on('error', err => console.error(err));

const messages: Message[] = [
  { role: 'system', content: 'You are terse.' },
  { role: 'user',   content: 'Summarise War and Peace in one sentence.' }
];

await generateCompletion(messages, {
  model: 'meta-llama/Meta-Llama-3-8B-Instruct',
  maxTokens: 256
}, stream);
```

---

## 📚 API Reference

### `getModels(request?) → Promise<Model[]>`

Fetches DeepInfra’s *featured* text-generation models.

| Param   | Type                         | Default        | Description                                                                     |
| ------- | ---------------------------- | -------------- | ------------------------------------------------------------------------------- |
| request | `RequestMethod` *(optional)* | `global fetch` | Custom fetch implementation (e.g. [`undici`](https://github.com/nodejs/undici)) |

```ts
import { getModels } from '@navetacandra/deepinfra';

const models = await getModels();
```

**Custom RequestMethod example:**

```ts
import { getModels, type RequestMethod } from '@navetacandra/deepinfra';

const myRequest: RequestMethod = (input, init) => {
  console.log('GET:', input);
  return fetch(input, init);
};

const models = await getModels(myRequest);
```

**Model type:**

```ts
type Model = {
  full_name: string;
  name: string;
  description: string;
  image: string;
  maxTokens: number | null;
  quantization: number | null;
};
```

---

### `generateCompletion(messages, config, stream?) → Promise<Message | Error>`

Creates a chat completion from a sequence of messages.

| Param    | Type                                              | Required | Description                                       |
| -------- | ------------------------------------------------- | -------- | ------------------------------------------------- |
| messages | `Message[]`                                       | ✔︎       | Chat history (system / user / assistant)          |
| config   | `CompletionConfig`                                | ✔︎       | Model configuration & request overrides           |
| stream   | `EventEmitter<'completion' \| 'error' \| 'done'>` | —        | Optional event-based streaming of response tokens |

**CompletionConfig:**

```ts
type CompletionConfig = {
  model: string;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  minP?: number;
  temperature?: number;
  request?: RequestMethod; // optional fetch override
};
```

**Streaming example with custom RequestMethod:**

```ts
import {
  generateCompletion,
  EventEmitter,
  type Message,
  type RequestMethod,
} from '@navetacandra/deepinfra';

const myRequest: RequestMethod = (input, init) => {
  console.log('POST:', input);
  return fetch(input, init);
};

const stream = new EventEmitter<'completion' | 'done' | 'error'>();
stream.on('completion', (chunk) => process.stdout.write(chunk));
stream.on('done', (final) => console.log('\nDone:', final.content));
stream.on('error', (err) => console.error('Error:', err));

const messages: Message[] = [
  { role: 'system', content: 'You are helpful.' },
  { role: 'user', content: 'Translate to French: Good morning.' },
];

await generateCompletion(messages, {
  model: 'meta-llama/Meta-Llama-3-8B-Instruct',
  request: myRequest,
  temperature: 0.3,
}, stream);
```

**Non-streaming example:**

```ts
const reply = await generateCompletion(messages, {
  model: 'meta-llama/Meta-Llama-3-8B-Instruct',
});
console.log(reply.content); // → "Bonjour."
```

**Message type:**

```ts
type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};
```

---

### `class EventEmitter<T extends string>`

Tiny event emitter for streaming use. You can reuse it or use your own.

**Methods:**

| Method              | Description                      |
| ------------------- | -------------------------------- |
| `on(event, fn)`     | Attach a listener to an event    |
| `emit(event, data)` | Emit event data to all listeners |

```ts
const events = new EventEmitter<'tick' | 'done'>();
events.on('tick', (msg) => console.log('→', msg));
events.emit('tick', 'progress...');
```

---

## 📝 Note

* DeepInfra may change its public endpoints at any time; pin a patch‑version and follow releases.
* The library **spoofs** IP/UA headers to bypass the official API‑key gate. Respect DeepInfra’s ToS & rate‑limits.

---

## License

```
MIT License

Copyright (c) 2025 navetacandra

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
