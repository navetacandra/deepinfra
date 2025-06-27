import { EventEmitter } from "./event";
import { Message, Model, RequestMethod, CompletionConfig } from "./types";

const randomIPv4 = (): string =>
    Array.from({ length: 4 })
        .map((_) => Math.floor(Math.random() * 255))
        .join(".");
const randomIPv6Segment = (): string =>
    Math.random().toString(16).slice(2, 6).padStart(4, "0");
const randomIPv6 = (): string =>
    Array.from({ length: 8 })
        .map((_) => randomIPv6Segment())
        .join(":");

const userAgents: string[] = [
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 11.0; Surface Duo) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
];

const textDecoder = new TextDecoder();
const headers = {
    accept: "application/json",
    "accept-language": "en-US,en;q=0.9,id;q=0.8",
    "content-type": "application/json",
    pragma: "no-cache",
    "x-deepinfra-source": "web-embed",
}

const isJson = (json: string) => {
    try {
        return !!json && JSON.parse(json) !== null;
    } catch (err) {
        return false;
    }
}

export const getModels = async (request?: RequestMethod): Promise<Model[]> => {
    if (!request) request = fetch;
    const response = await request(`https://api.deepinfra.com/models/featured`, {
        headers: {
            ...headers,
            "user-agent": userAgents[Math.floor(Math.random() * userAgents.length)],
            "x-forwarded-for": `${randomIPv4()}, ${randomIPv6()}`,
        },
        referrer: "https://deepinfra.com/",
        referrerPolicy: "strict-origin-when-cross-origin",
        method: "GET",
        mode: "cors",
        credentials: "omit",
    });
    const json = (await response.json()) as any[];
    const models: Model[] = json
        .filter(item => item.type === 'text-generation')
        .map(item => ({
            full_name: item.model_name,
            name: item.model_name.slice(item.model_name.indexOf('/') + 1),
            description: item.description,
            image: item.cover_img_url,
            maxTokens: item.max_tokens,
            quantization: item.quantization,
        }));

    return models;
}

export const generateCompletion = async (messages: Message[], config: CompletionConfig, streamControl?: EventEmitter<'completion' | 'error' | 'done'>): Promise<Message | Error> => {
    const body = { 
	    messages, 
	    model: config.model, 
	    max_tokens: config.maxTokens || 512, 
	    temperature: config.temperature || 0.7, 
	    topP: config.topP || 0.9, 
	    minP: config.minP || 0, 
	    topK: config.topK || 0, 
	    stream: !!streamControl
    };
    const payload: RequestInit = {
        headers: {
            ...headers,
            "user-agent": userAgents[Math.floor(Math.random() * userAgents.length)],
            "x-forwarded-for": `${randomIPv4()}, ${randomIPv6()}`,
        },
        referrer: "https://deepinfra.com/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: JSON.stringify(body),
        method: "POST",
        mode: "cors",
        credentials: "omit",
    };
    

    if (!config.request) config.request = fetch;

    try {
        const response = await config.request('https://api.deepinfra.com/v1/openai/chat/completions', payload);
        if (!streamControl) {
            const json = await response.json();
            if (!response.ok) return new Error(json?.detail?.error || json?.error?.message || 'Failed to fetch');

            const choices = json.choices;
            if (!choices || choices.length < 1) throw new Error('Failed get completion.');

            const message = choices[0].message;
            return { role: message.role, content: message.content } as Message;
        }

        if (!response.ok) {
            const { detail, error } = await response.json();
            const errorMessage = new Error(detail?.error || error?.message || 'Failed to fetch');
            streamControl.emit("error", errorMessage);
            return errorMessage;
        }

        const assistantMessage: Message = { role: 'assistant', content: '' };
        const reader = response.body?.getReader();
        while (true) {
            const { value, done } = await reader?.read() as { value: Uint8Array, done: boolean };
            if (done) {
                streamControl.emit('done', assistantMessage);
                break;
            }

            const dataStreamArr: string[] = textDecoder.decode(value).split('\n').filter(f => f.length && f.startsWith('data:'));
            dataStreamArr.forEach(dataStream => {
                dataStream = dataStream.replace(/^data: /, '');

                if (!isJson(dataStream)) return;

                const json = JSON.parse(dataStream);
                const choices = json.choices;
                if (!choices || choices.length < 1) return;

                const content = choices[0].delta?.content || '';
                assistantMessage.content += content;
                streamControl.emit('completion', content);
            })
        }

        return assistantMessage;
    } catch (error) {
        if (!!streamControl) streamControl.emit('error', error);
        return error as Error;
    }
}
