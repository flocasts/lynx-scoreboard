# lynx-scoreboard
Connection interface to FinishLynx Scoreboard

**USAGE**

Accepts three params
 - an object containing the IP and Port the scoreboard is broadcasting on
 - callback for what to do when a data packet is received
 - (optional) callback for error handling. Will console.log the error if there is no error handling passed in.

```javascript
    const connection = {
        ip: 8080,
        port: '127.0.0.1'
    }
    
    const connection = new LynxScoreboard(connection, 
        packet => {
            console.log(packet);
        },
        error => {
            console.log(error);
        }
    );
```

Use `connection.disconnect()` to terminate the connection.