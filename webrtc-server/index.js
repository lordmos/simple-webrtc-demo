let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);

let userList = [];
let socketMap = {};

const ONLINE = "ONLINE";
const OFFLINE = "OFFLINE";
const OFFERING = "OFFERING";
const CALLING = "CALLING";
const USERLIST = "USERLIST";

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on(ONLINE, (userInfo) => {
        console.log(`${ONLINE} : ${JSON.stringify(userInfo)}`);
        userInfo.status = ONLINE;
        userList.push(userInfo);
        socket.emit(USERLIST, userList);
        for (let token in socketMap) {
            socketMap[token].emit(ONLINE, userInfo);
        }
        socketMap[userInfo.token] = socket;
    });
    socket.on(OFFLINE, (msg) => {
        console.log(`${OFFLINE} : ${JSON.stringify(msg)}`);
    });
    socket.on(OFFERING, (msg) => {
        console.log(`${OFFERING} : ${JSON.stringify(msg)}`);
        if (msg.sourceToken) {
            for (let source of userList) {
                if (source.token == sourceToken) {
                    source.status = OFFERING;
                }
            }
        }

        if (msg.targetToken) {
            socketMap[userInfo.token].emit(OFFERING, msg);
        }
    });
    socket.on(CALLING, (msg) => {
        console.log(`${CALLING} : ${JSON.stringify(msg)}`);
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
        let deleteToken = "";
        for (let token in socketMap) {
            if (socketMap[token] == socket) {
                deleteToken = token;
                delete socketMap[token]
            }
        }
        if (deleteToken) {
            let deleteUser = undefined;
            for (let i = 0; i < userList.length; i++) {
                if (userList[i].token == deleteToken) {
                    deleteUser = userList.splice(i, 1)[0];
                    break;
                }
            }
            if (deleteUser) {
                for (let token in socketMap) {
                    socketMap[token].emit(OFFLINE, deleteUser);
                    socketMap[token].emit(USERLIST, userList);
                }
            }
        }
    });
});


http.listen(3000, () => {
    console.log('listening on *:3000');
});