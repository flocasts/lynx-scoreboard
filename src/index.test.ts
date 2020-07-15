import "jest";
import { LynxScoreboard } from "./lynx-scoreboard";

const scoreboard = LynxScoreboard.listen({
  port: 9999,
  ip: "127.0.0.1",
});

describe("Test Scoreboard Listener", () => {
  test("Scoreboard should be listening", async () => {
    expect((await scoreboard).isListening).toEqual(true);
  });
});
