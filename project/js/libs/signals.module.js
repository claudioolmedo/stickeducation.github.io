class Signal {
    constructor() {
        this.listeners = [];
    }

    add(listener) {
        this.listeners.push(listener);
    }

    dispatch(...args) {
        for (const listener of this.listeners) {
            listener(...args);
        }
    }
}

export { Signal };
