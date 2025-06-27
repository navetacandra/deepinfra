export type Model = {
    full_name: string;
    name: string;
    description: string;
    image: string;
    maxTokens: number | null;
    quantization: number | null;
};

export type Message = {
    role: 'system' | 'user' | 'assistant';
    content: string;
};

export type Listener = (data?: any) => void;
export type RequestMethod = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export type CompletionConfig = {
    model: string;
    request?: RequestMethod;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    minP?: number;
    temperature?: number;
};
