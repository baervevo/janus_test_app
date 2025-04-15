class JanusStream {
    static #REQUEST_WATCH_MESSAGE(id) { return { message: { request: "watch", id: id } } }
    static #REQUEST_STOP_MESSAGE(id) { return { message: { request: "stop", id: id } } }
    
    #videoElement;
    #streamId;
    #pluginHandle;
    #running = false;

    constructor(videoElement, streamId, pluginHandle) {
        this.#videoElement = videoElement;
        this.#streamId = streamId;
        this.#pluginHandle = pluginHandle;
    }

    subscribe() {
        if (this.#running) return;
        this.#pluginHandle.send(JanusStream.#REQUEST_WATCH_MESSAGE(this.#streamId));
        this.#running = true;
    }

    unsubscribe() {
        if (!this.#running) return;
        this.#pluginHandle.send(JanusStream.#REQUEST_STOP_MESSAGE(this.#streamId));
        this.#running = false;
    }

    getPluginHandle() {
        return this.#pluginHandle;
    }

    attachStream(stream) {
        if(!this.#running) return;
        if (stream) {
            this.#videoElement.srcObject = stream;
        } else {
            console.error("No stream available");
        }
    }
}