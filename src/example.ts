import { LynxScoreboard } from ".";
import {LynxDirective, LynxResults} from "./lynx-data.interface";

(async (): Promise<void> => {
    const scoreboard = await LynxScoreboard.listen({
        port: 8080,
        ip: "127.0.0.1",
    });

    if (scoreboard.isListening) {
        console.log("I am listening!");
    }

    scoreboard.subscribe("error", (err: string) => {
        console.log(`Uh oh! There was an error: ${err}`);
    });

    scoreboard.subscribe("results", (data: LynxResults) => {
        console.log(`Received ${JSON.stringify(data.results)} from ${data.event.eventName}`);
    });

    scoreboard.subscribe("directive", (data: LynxDirective) => {
        console.log(`Received directive: ${data.title}`);
    });

    scoreboard.subscribe("stoppedListening", (data?: string) => {
        console.log(`${data} stopped listening!`);
    });

    // Stop listening after 10 seconds
    setTimeout(() => scoreboard.stopListening(), 10000);
})();
