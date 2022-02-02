import * as dgram from "dgram";
import * as net from "net";
import { LynxResults, LynxDirective } from "./lynx-data.interface";
import { parseLynxPacket } from "./lynx-data-parser";
import { Socket } from "net";

interface LynxScoreboardOpts {
    ip: string;
    port: number;
}

type Topic =
  | "results"
  | "directive"
  | "error"
  | "listening"
  | "stoppedListening";
type ErrorCallback = (error: string) => void;
type DirectiveCallback = (data: LynxDirective) => void;
type ResultsCallback = (data: LynxResults) => void;
type StringCallback = (data: string) => void;
type EmptyCallback = () => void;
type Subscribers = {
    results: ResultsCallback[];
    directive: DirectiveCallback[];
    error: ErrorCallback[];
    listening: EmptyCallback[];
    stoppedListening: StringCallback[];
};

export class LynxScoreboard {
    static async listen(opts: LynxScoreboardOpts): Promise<LynxScoreboard> {
        return new Promise((resolve) => {
            const scoreboard = new LynxScoreboard(opts);
            scoreboard.subscribe("listening", () => resolve(scoreboard));
        });
    }

    public get ip(): string {
        return this.opts.ip;
    }

    public get port(): number {
        return this.opts.port;
    }

    public get isListening(): boolean {
        return this._isListening;
    }

    private readonly _socketUDP: dgram.Socket;
    private readonly _serverTCP: net.Server;
    private _isListening = false;
    private _subscribers: Subscribers = {
        error: [],
        results: [],
        directive: [],
        listening: [],
        stoppedListening: [],
    };

    private partialMessage = "";
    private fullMessage = "";
    private clients: Socket[] = [];

    private constructor(private opts: LynxScoreboardOpts) {
        this._socketUDP = dgram.createSocket("udp4");
        this._serverTCP = net.createServer((tcpServer) => {
            tcpServer.on("data", buffer => {
                try {
                    const message = parseLynxPacket(buffer.toString("utf8"));
                    const topic = message.isDirective ? "directive" : "results";
                    this._publish(topic, message.data);
                } catch (err) {
                    this._publish("error", String(err));
                }
            });

            tcpServer.on("error", (err) => {
                this._publish("error", err.message);
            });
        });
        this._startListening();
    }

    private _startListening(): void {
    // Start TCP listener
        this._serverTCP.listen(this.port, this.ip);
        // Open UDP socket
        this._socketUDP
            .on("listening", () => {
                this._isListening = true;
                this._publish("listening");
            })
            .on("close", () => {
                this._isListening = false;
                this._publish("stoppedListening", "UDP");
            })
            .on("message", (buffer, rinfo) => {
                // Special case for FinishLynx UDP.  Packets are fragmented at size 536 by default.
                // Do this so timer doesn't have to change hidden settings
                // If they do change it, no problem
                // rare case - complete packet is 536, one message will be off until next message is received with different size

                // check if datagram is full.  If so, more data to come
                if (rinfo.size === 536) {
                    this.partialMessage = this.partialMessage + buffer.toString("utf8");
                } else {
                    // Not full?  This message is complete
                    this.fullMessage = this.partialMessage + buffer.toString("utf8");

                    try {
                        const packet = parseLynxPacket(this.fullMessage);
                        const topic = packet.isDirective ? "directive" : "results";
                        this._publish(topic, packet.data);
                        // reset the partial message for next datagram
                        this.partialMessage = "";
                    } catch (err) {
                        this.partialMessage = "";
                        this._publish("error", String(err));
                    }
                }
            })
            .on("error", (err) => {
                this._publish("error", err.message);
            })
            .bind(this.port, this.ip);

        this._serverTCP.on("connection", (socket) => {
            this.clients.push(socket);

            socket.on("close", () => {
                this.clients.splice(this.clients.indexOf(socket), 1);
            });
        });
        this._serverTCP.on("close", () => {
            this._isListening = false;
            this._publish("stoppedListening", "TCP");
        });
    }

    private _publish(topic: Topic, data?: LynxResults | LynxDirective | string): void {
        this._subscribers[topic].forEach((callback: Function) => callback(data));
    }

    public subscribe(
        topic: Topic,
        callback:
        | ResultsCallback
        | DirectiveCallback
        | ErrorCallback
        | EmptyCallback
    ): LynxScoreboard {
        switch (topic) {
            case "listening":
                this._subscribers.listening.push(callback as EmptyCallback);
                break;
            case "stoppedListening":
                this._subscribers.stoppedListening.push(callback as StringCallback);
                break;
            case "results":
                this._subscribers.results.push(callback as ResultsCallback);
                break;
            case "directive":
                this._subscribers.directive.push(callback as DirectiveCallback);
                break;
            case "error":
                this._subscribers.error.push(callback as ErrorCallback);
                break;
        }
        return this;
    }

    public stopListening(): Promise<void> {
        if (!this._isListening) {
            throw "This socket is not listening.";
        }
        return new Promise((resolve) => {
            this.subscribe("stoppedListening", () => resolve);
            this._socketUDP.close();
            // For tcp, sever connections before closing server
            this.clients.forEach(client => {
                client.destroy();
            });
            this._serverTCP.close();
        });
    }
}
