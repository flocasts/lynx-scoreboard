export interface ScoreboardConnectionData {
    ip: string,
    port: number
}

export class LynxScoreboard {
    public server = null;
    constructor(connectionData: ScoreboardConnectionData, successCallback: Function, errorCallback: Function | null = null) {
        const dgram = require("dgram");
        this.server = dgram.createSocket("udp4");
        this.server
            .bind(connectionData.port, connectionData.ip)
            .on("message", buffer => { 
                successCallback(buffer.toString());
            })
            .on("error", (err) => {
                if (errorCallback && typeof errorCallback === "function") {
                    errorCallback(err)
                } else {
                    console.log("Scoreboard error: ", err);
                }
            });
    }

    disconnect() {
        if (!this.server) return;
        this.server.close();
    }
}