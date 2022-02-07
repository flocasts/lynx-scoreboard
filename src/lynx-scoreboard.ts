import * as dgram from "dgram";
import * as net from "net";
import { LynxResults, LynxDirective } from "./lynx-data.interface";
import { parseLynxPacket } from "./lynx-data-parser";
import { Socket } from "net";

export enum Protocol {
    tcp = "tcp",
    udp = "udp"
}

interface LynxScoreboardOpts {
    ip?: string;
    port: number;
    protocol?: Protocol;
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

    private message = "";
    private clients: Socket[] = [];

    public get ip(): string {
        return this.opts?.ip || "0.0.0.0";
    }

    public get port(): number {
        return this.opts.port;
    }

    public get isListening(): boolean {
        return this._isListening;
    }

    static async listen(opts: LynxScoreboardOpts): Promise<LynxScoreboard> {
        return new Promise((resolve) => {
            const scoreboard = new LynxScoreboard(opts);
            scoreboard.subscribe("listening", () => resolve(scoreboard));
        });
    }

    private constructor(private opts: LynxScoreboardOpts) {
        if (this.opts?.protocol === Protocol.tcp) {
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
            this.startListeningTCP();
        } else {
            this._socketUDP = dgram.createSocket({
                type: "udp4",
                reuseAddr: true
            });
            this.startListeningUDP();
        }
    }

    private startListeningUDP(): void {
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
                // check if datagram is missing trailer and default packet size is full.  If not, more data to come
                // This is a specific case from FinishLynx.  Older scripts don't have trailer, so we qualify with full packet size
                if (!buffer.toString("utf8").endsWith("*COMPLETE") && rinfo.size === 536) {
                    this.message = this.message + buffer.toString("utf8");
                } else {
                    // Ends with trailer or another size?  This message is complete
                    this.message = this.message + buffer.toString("utf8");

                    try {
                        const packet = parseLynxPacket(this.message);
                        const topic = packet.isDirective ? "directive" : "results";
                        this._publish(topic, packet.data);
                        // reset the partial message for next datagram
                        this.message = "";
                    } catch (err) {
                        this.message = "";
                        this._publish("error", String(err));
                    }
                }
            })
            .on("error", (err) => {
                this._publish("error", err.message);
            })
            .bind(this.port, this.ip);
    }

    private startListeningTCP(): void {
        // Start TCP listener
        this._serverTCP.listen(this.port, this.ip);
        this._serverTCP.on("listening", () => {
            this._isListening = true;
            this._publish("listening");
        });

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

    public stopListening(protocol?: Protocol): Promise<void> {
        if (!this._isListening) {
            throw "This socket is not listening.";
        }
        return new Promise((resolve) => {
            this.subscribe("stoppedListening", () => resolve);
            if (this._socketUDP && !protocol) {
                this._socketUDP.close();
            }
            if (this.clients && protocol === Protocol.tcp) {
                this.clients.forEach(client => {
                    client.destroy();
                });
            }
            // For tcp, sever connections before closing server
            if (this._serverTCP && protocol === Protocol.tcp) {
                this._serverTCP.close();
            }
        });
    }
}
