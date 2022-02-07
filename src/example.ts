import { LynxScoreboard } from ".";
import { LynxDirective, LynxResults } from "./lynx-data.interface";
import { Protocol } from "./lynx-scoreboard";

(async (): Promise<void> => {
    const scoreboardTCP = await LynxScoreboard.listen({
        port: 8080,
        ip: "127.0.0.1",
        protocol: Protocol.tcp
    });

    const scoreboardUDP = await LynxScoreboard.listen({
        port: 9090
    });

    if (scoreboardTCP.isListening) {
        console.log("I am listening!");
    }

    scoreboardTCP.subscribe("error", (err: string) => {
        console.log(`Uh oh! There was an error: ${err}`);
    });

    scoreboardTCP.subscribe("results", (data: LynxResults) => {
        console.log(`Received ${JSON.stringify(data.results)} from ${data.event.eventName}`);
    });

    scoreboardTCP.subscribe("directive", (data: LynxDirective) => {
        console.log(`Received directive: ${data.title}`);
    });

    scoreboardTCP.subscribe("stoppedListening", (data?: string) => {
        console.log(`${data} stopped listening!`);
    });

    if (scoreboardUDP.isListening) {
        console.log("I am listening!");
    }

    scoreboardUDP.subscribe("error", (err: string) => {
        console.log(`Uh oh! There was an error: ${err}`);
    });

    scoreboardUDP.subscribe("results", (data: LynxResults) => {
        console.log(`Received ${JSON.stringify(data.results)} from ${data.event.eventName}`);
    });

    scoreboardUDP.subscribe("directive", (data: LynxDirective) => {
        console.log(`Received directive: ${data.title}`);
    });

    scoreboardUDP.subscribe("stoppedListening", (data?: string) => {
        console.log(`${data} stopped listening!`);
    });

    // Stop listening after 10 seconds
    setTimeout(() => scoreboardTCP.stopListening(Protocol.tcp), 10000);
    setTimeout(() => scoreboardUDP.stopListening(), 10000);
})();
