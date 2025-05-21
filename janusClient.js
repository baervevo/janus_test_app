class JanusClient {
    static #START_MESSAGE(jsep) { return { message: { request: "start" }, jsep: jsep } }

    #serverUrl;
    #janus;
    #streams = new Map();
    
    constructor(serverUrl) {
        this.#serverUrl = serverUrl;
        this.#janus = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            Janus.init({
                debug: "all",
                callback: () => {
                    if (!Janus.isWebrtcSupported()) {
                        alert("No WebRTC support...");
                        reject("No WebRTC support...");
                        return;
                    }
                    this.#janus = new Janus({
                        server: this.#serverUrl,    
                        success: async () => resolve(),
                        error: function(error) {
                            console.error("Janus connection error:", error);
                            reject(error);
                        }
                    });
                }
            });
        });
    }

    attachStream(streamId, videoElement) {
        return new Promise((resolve, reject) => {
            this.#janus.attach({
                plugin: "janus.plugin.streaming",
                success: (pluginHandle) => {
                    const stream = new JanusStream(videoElement, streamId, pluginHandle);
                    this.#streams.set(streamId, stream);
                    resolve();
                },
                error: (error) => {
                    console.error("Error attaching plugin...", error);
                    reject(error);
                },
                // TODO(@mariusz): test 
                onmessage: (msg, jsep) => {
                    if (jsep) {
                        let handle = this.#streams.get(streamId).getPluginHandle();
                        handle.createAnswer({
                            jsep: jsep,
                            tracks: [{ type: "data" }],
                            success: (jsep) => {
                                handle.send(JanusClient.#START_MESSAGE(jsep));
                            },
                            error: (error) => {
                                console.error("WebRTC error:", error);
                                alert("WebRTC error... " + error.message);
                            }
                        });
                    }
                },
                onremotetrack: (track, mid, on) => {
                    if (!on) return;
                    const stream = this.#streams.get(streamId);
                    stream.attachStream(new MediaStream([track]));
                }
            });
        });
    }

    detachStream(streamId) {
        this.unsubscribeFrom(streamId);
        this.#streams.delete(streamId);
    }

    subscribeTo(streamId) {
        const stream = this.#streams.get(streamId);
        if (stream) {
            stream.subscribe();
        } else {
            console.warn(`Stream ${streamId} does not exist.`);
        }
    }

    unsubscribeFrom(streamId) {
        const stream = this.#streams.get(streamId);
        if (stream) {
            stream.unsubscribe();
        } else {
            console.warn(`Stream ${streamId} does not exist.`);
        }
    }

    subscribeToAll() {
        this.#streams.forEach((_, streamId) => {
            this.subscribeTo(streamId);
        });
    }

    unsubscribeFromAll() {
        this.#streams.forEach((_, streamId) => {
            this.unsubscribeFrom(streamId);
        });
    }
}