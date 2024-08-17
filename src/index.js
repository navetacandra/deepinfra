const { EventEmitter } = require('./event');
const { request, requestStream } = require('./utils');

const headers = {
  accept: "application/json",
  "accept-language": "en-US,en;q=0.9,id;q=0.8",
  "content-type": "application/json",
  "cache-control": "no-cache",
  pragma: "no-cache",
  "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  "x-deepinfra-source": "web-embed",
}

class Conversation extends EventEmitter {
  /**
   *
   * @param {object} opt
   * @param {{role:'system'|'assistant'|'user', content: string}[]} opt.history
   * @param {string} opt.rewritedTo
   * @param {string} opt.model
   * @param {boolean} opt.stream - default value `false`
   */
  constructor({ history=[], model='', rewritedTo='', stream=false }) {
    super();
    this.stream = stream;
    this.models = [];
    this.model = model;
    this.history = history;
    this.api = !!rewritedTo ? rewritedTo : 'https://api.deepinfra.com';
    this.initialized = false;
  }

  /**
   * Initialize conversation
   */
  async init() {
    try {
      this.models = await this.getModels();
      if(!this.models.find(f => f.model_name == this.model)) {
        this.emit('error', new Error('Invalid model name'));
        return;
      }
      this.initialized = true;
      this.emit('initialized');
    } catch(err) {
      this.emit('error', err);
    }
  }

  /**
   * Fetch all available models
   */
  async getModels() {
    if(this.initialized) return this.models;
    const res = await request(`${this.api}/models/featured`, {
      headers,
      referrer: "https://deepinfra.com/",
      referrerPolicy: "strict-origin-when-cross-origin",
      method: "GET",
      mode: "cors",
      credentials: "omit",
    });
    return JSON.parse(res).filter(f => f.type == 'text-generation')
  }

  /**
    * Generate completion for conversation
    * @param {string} content
    * @returns {Promise<{role:'assistant', content: string}>}
    */
  async completion(content='') {
    if(!content || typeof content !== 'string') {
      if(this.history.slice(-1)[0].role !== 'user') throw new Error('Content should be a string and cannot be empty!');
      return await this.#generate();
    }
    this.history.push({ role: 'user', content });
    return await this.#generate();
  }

  /**
   * Generate completion for conversation
   * @returns {Promise<{role:'assistant', content: string}>}
   */
  async #generate() {
    try {
      const assistantChat = {role: 'assistant', content: ''};
      const requestInit = {
        headers,
        referrer: "https://deepinfra.com/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: JSON.stringify({ messages: this.history, model: this.model, stream: this.stream }),
        method: "POST",
        mode: "cors",
        credentials: "omit",
      };

      if(!this.stream) {
        const res = await request(`${this.api}/v1/openai/chat/completions`, requestInit);
        assistantChat.content = JSON.parse(res).choices[0].message.content;
      } else {
        await new Promise((resolve, reject) => {
          const streamControler = new EventEmitter();
          streamControler.on('stream', data => {
            const choices = JSON.parse(data).choices;
            if(!choices) return;
            const content = choices[0].delta.content;
            if(!content) return;
            this.emit('completion', content);
            assistantChat.content += content;
          })
          streamControler.on('error', err => reject(err));
          streamControler.on('end', resolve);
          requestStream(streamControler, `${this.api}/v1/openai/chat/completions`, requestInit);
        });
      }

      this.emit('chat', assistantChat);
      this.history.push(assistantChat);
      return assistantChat;
    } catch(err) {
      this.emit('error', err);
    }
  }
}

exports.Conversation = Conversation;
