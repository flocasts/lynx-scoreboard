import * as dgram from "dgram";
import { LynxResults, LynxDirective } from "./lynx-data.interface";
import { parseLynxPacket } from "./lynx-data-parser";

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
type EmptyCallback = () => void;
type Subscribers = {
  results: ResultsCallback[];
  directive: DirectiveCallback[];
  error: ErrorCallback[];
  listening: EmptyCallback[];
  stoppedListening: EmptyCallback[];
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

  private readonly _socket: dgram.Socket;
  private _isListening: boolean = false;
  private _subscribers: Subscribers = {
    error: [],
    results: [],
    directive: [],
    listening: [],
    stoppedListening: [],
  };

  private constructor(private opts: LynxScoreboardOpts) {
    this._socket = dgram.createSocket("udp4");
    this._startListening();
  }

  private _startListening() {
    this._socket
      .on("listening", () => {
        this._isListening = true;
        this._publish("listening");
      })
      .on("close", () => {
        this._isListening = false;
        this._publish("stoppedListening");
      })
      .on("message", (buffer) => {
        try {
          const packet = parseLynxPacket(buffer.toString("utf8"));
          const topic = packet.isDirective ? "directive" : "results";
          this._publish(topic, packet.data);
        } catch (err) {
          this._publish("error", String(err));
        }
      })
      .on("error", (err) => {
        this._publish("error", err.message);
      })
      .bind(this.port, this.ip);
  }

  private _publish(topic: Topic, data?: any) {
      this._subscribers[topic].forEach((callback: Function) => callback(data));
  }

  public subscribe(
    topic: "directive",
    callback: DirectiveCallback
  ): LynxScoreboard;
  public subscribe(topic: "results", callback: ResultsCallback): LynxScoreboard;
  public subscribe(topic: "error", callback: ErrorCallback): LynxScoreboard;
  public subscribe(topic: "listening", callback: EmptyCallback): LynxScoreboard;
  public subscribe(
    topic: "stoppedListening",
    callback: EmptyCallback
  ): LynxScoreboard;
  public subscribe(
    topic: Topic,
    callback:
      | ResultsCallback
      | DirectiveCallback
      | ErrorCallback
      | EmptyCallback
  ): LynxScoreboard {
    if (topic == "listening") {
      this._subscribers.listening.push(callback as EmptyCallback);
    } else if (topic == "stoppedListening") {
      this._subscribers.stoppedListening.push(callback as EmptyCallback);
    } else if (topic == "results") {
      this._subscribers.results.push(callback as ResultsCallback);
    } else if (topic == "directive") {
      this._subscribers.directive.push(callback as DirectiveCallback);
    } else {
      this._subscribers.error.push(callback as ErrorCallback);
    }
    return this;
  }

  public stopListening() {
    if (!this._isListening) {
      throw "This socket is not listening.";
    }
    this._socket.close();
  }
}
