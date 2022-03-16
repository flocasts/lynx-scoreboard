# lynx-scoreboard

Create a Scoreboard Interface to listen to updates from FinishLynx

## Publish new version
Edit Cloud Build trigger by updating _FLO_NPM_TOKEN with a valid github personal access token.
Update version in package.json
Merge changes to master branch

## Usage Example
Use "npm run build" to create dist version of example.js
Open terminal and cd to "lynx-scoreboard\dist"
Run command "node example.js"

```javascript
const scoreboard = await LynxScoreboard.listen({
  port: 8080,
  ip: "127.0.0.1",
});

if (scoreboard.isListening) {
  console.log("I am listening!");
}

scoreboard.subscribe("error", (err) => {
  console.log(`Uh oh! There was an error: ${err}`);
});

scoreboard.subscribe("results", (data) => {
  console.log(
    `Received ${data.results.length} results from ${data.event.eventName}`
  );
});

scoreboard.subscribe("directive", (data) => {
  console.log(`Received directive: ${data.title}`);
});

scoreboard.subscribe("stoppedListening", () => {
  console.log(`I stopped listening!`);
});

// Stop listening after 10 seconds
setTimeout(() => scoreboard.stopListening(), 10000);
```
