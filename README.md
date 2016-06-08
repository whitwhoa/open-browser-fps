# Socketio Authoritative FPS
This repository is an example of an authoritative game server using socket.io, and three.js.

## Installation
1. Download this repository into your server's webroot
2. Configure a virtual host with the public root set to `/your/servers/webroot/socket-authoritative-fps/client`
3. Open file `./socket-authoritative-fps/server/index.js` and change the port number of the socketio server to whichever port you want it to run on (the default is 3000)
4. Open file `./socket-authoritative-fps/client/index.html` and change the following line to point to the address of your new virtual host:
```javascript
var socket = io('http://local.serverfps:3000');
var socket = io('http://your.host.name:your-socketio-port#');
```
5. Browse to `./socket-authoritative-fps/server/` and run command `nodejs index.js` to spin up the socketio server
6. Open your web browser and navigate to the url you configured for your virtual host
7. When the page loads, the command line will log that a new user has connected. You will be able to move around, but you will not see another character.
8. Open another browser tab and browse to your url. You will now see the character from your other browser tab.

## Screenshots
![alt text](https://stashcube.com/fpstest/github_screenshot_001.jpg)

## Live Example
The following link is a working example of an earlier version of this source, however it functions almost identically to the current project.
[Click HERE for a live example](https://stashcube.com/fpstest/1/)

___

#### Notes
* If I remember correctly, I was in the middle of optimizing peer interpolation when I last left off with this project. If anyone has any suggestions on a better way to handle it please open an issue and let me know.
* If anyone has any feedback on how to improve upon this project I would love to hear what you have to say. Opening an issue would be the best way for now.
* This project is a mash of several other projects and plugins. When I have more time I will track them down and add them to the bottom of this readme. Author's credit remains in comments.
