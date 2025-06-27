import { Listener } from "./types";

export class EventEmitter<T extends string> {
    private events: Partial<Record<T, Listener[]>> = {};

    on(event: T, listener: Listener): void {
        if(!this.events[event]) this.events[event] = [];
        this.events[event]?.push(listener);
    }

    emit(event: T, data?: any): void {
        if(!!this.events[event]) this.events[event].forEach(listener => listener(data))!;
    }
}