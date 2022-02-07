import "jest";
import { LynxScoreboard, Protocol } from "./lynx-scoreboard";

// Expert mode test
const scoreboard = LynxScoreboard.listen({
    port: 9999,
    ip: "127.0.0.1",
    protocol: Protocol.tcp
});

describe("Expert Mode Listener", () => {
    test("Expert Mode should be listening", async () => {
        expect((await scoreboard).isListening).toEqual(true);
    });
});

describe("Expert Mode Stop listening", () => {
    test("Expert Mode should stop listening", async () => {
        (await scoreboard).stopListening().then( async () => {
            expect((await scoreboard).isListening).toEqual(false);
        });
    });
});

// TCP
const tcpScoreboard = LynxScoreboard.listen({
    port: 9999,
    protocol: Protocol.tcp
});

describe("TCP Scoreboard Listener", () => {
    test("TCP Scoreboard should be listening", async () => {
        expect((await tcpScoreboard).isListening).toEqual(true);
    });
});

describe("TCP Stop listening", () => {
    test("TCP Scoreboard should stop listening", async () => {
        (await tcpScoreboard).stopListening().then( async () => {
            expect((await tcpScoreboard).isListening).toEqual(false);
        });
    });
});

// UDP
const udpScoreboard = LynxScoreboard.listen({
    port: 9990
});

describe("UDP Scoreboard Listener", () => {
    test("UDP Scoreboard should be listening", async () => {
        expect((await udpScoreboard).isListening).toEqual(true);
    });
});

describe("UDP Stop listening", () => {
    test("UDP Scoreboard should stop listening", async () => {
        (await udpScoreboard).stopListening().then( async () => {
            expect((await udpScoreboard).isListening).toEqual(false);
        });
    });
});
