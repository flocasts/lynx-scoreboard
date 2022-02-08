import "jest";
import { LynxScoreboard, Protocol } from "./lynx-scoreboard";

let scoreboard: LynxScoreboard;
describe("Expert Mode Listener", () => {
    beforeAll(async () => {
        scoreboard = await LynxScoreboard.listen({
            port: 9999,
            ip: "127.0.0.1",
            protocol: Protocol.TCP
        });
    });
    test("Expert Mode should be listening", () => {
        expect(scoreboard.isListening).toEqual(true);
    });
    test("Expert Mode should stop listening", () => {
        scoreboard.stopListening(Protocol.TCP);
        expect(scoreboard.isListening).toEqual(false);
    });
});

// TCP
describe("TCP Scoreboard Listener", () => {
    beforeAll(async () => {
        scoreboard = await LynxScoreboard.listen({
            port: 9999,
            protocol: Protocol.TCP
        });
    });
    test("TCP Scoreboard should be listening", () => {
        expect(scoreboard.isListening).toEqual(true);
    });
    test("TCP Scoreboard should stop listening", () => {
        scoreboard.stopListening(Protocol.TCP);
        expect(scoreboard.isListening).toEqual(false);
    });
});

// UDP
describe("UDP Scoreboard Listener", () => {
    beforeAll(async () => {
        scoreboard = await LynxScoreboard.listen({
            port: 9990
        });
    });
    test("UDP Scoreboard should be listening", () => {
        expect(scoreboard.isListening).toEqual(true);
    });
    test("UDP Scoreboard should stop listening", () => {
        scoreboard.stopListening();
        expect(scoreboard.isListening).toEqual(false);
    });
});
