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
   * @param {object} opt
   * @param {{role:'system'|'assistant'|'user', content: string}[]} opt.history
   * @param {string} opt.rewritedTo
   * @param {string} opt.model
   * @param {boolean} opt.stream - default value `false`
   *
   * @returns {Conversation}
   */
  constructor({ history=[], rewritedTo='', stream=false } = {}) {
    super();
    /**
     * @type {boolean}
     */
    this.stream = !!stream;
    /**
     * @type {{model_name: string, type: string, description: string, cover_img_url: string, max_tokens: number|null, deprecated: boolean|null}[]}
     */
    this.models = [];
    /**
     * @type {string}
     */
    this.model;
    /**
     * @type {{role:'system'|'assistant'|'user', content: string}[]}
     */
    this.history = history;
    /**
     * @type {string}
     */
    this.api = !!rewritedTo ? rewritedTo : 'https://api.deepinfra.com';
    /**
     * @type {boolean}
     */
    this.initialized = false;
  }

  /**
   * Initialize conversation
   */
  async init() {
    try {
      this.models = await this.getModels();
      this.initialized = true;
      this.emit('initialized');
    } catch(err) {
      this.emit('error', err);
    }
  }

  /**
   * Fetch all available models
   * @returns {Promise<{model_name: string, type: string, description: string, cover_img_url: string, max_tokens: number|null, deprecated: boolean|null}[]>}
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
    return JSON.parse(res).filter(f => f.type == 'text-generation').map(({model_name, type, description, cover_img_url, max_tokens, deprecated}) => ({ model_name, type, description, cover_img_url, max_tokens, deprecated}));
  }

  setModel(model='') {
    // Checking is model available and valid
    if(!this.models.find(f => f.model_name == model)) {
      const errorMessage = new Error('Model not found');
      this.emit('error', errorMessage);
      throw errorMessage;
    }
    this.model = model;
  }

  /**
    * Generate completion for conversation
    * @param {string} content
    * @returns {Promise<{role:'assistant', content: string}>}
    */
  async completion(content='') {
    // Checking is model available and valid
    if(!this.models.find(f => f.model_name == this.model)) {
      const errorMessage = new Error('Invalid model name');
      this.emit('error', errorMessage);
      throw errorMessage;
    }

    // Checking if content is empty
    if(!content || typeof content !== 'string') {
      // Checking if content is empty and last chat is by user
      if(this.history.slice(-1)[0].role !== 'user') {
        const errorMessage = new Error('Content should be a string and cannot be empty!');
        this.emit('error', errorMessage);
        throw errorMessage;
      }
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
