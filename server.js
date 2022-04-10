//importing express module
const express = require('express');
//creating the express application 
const app = express();

//attaching socketio server to http server to handle both kinds of traffic :- HTTP and websocket traffic.
//Also, a socket.io server will attach to an HTTP server so it can serve its own client code through /socket.io/socket.io.js.
const server = require('http').Server(app);
const io = require('socket.io')(server);

//importing the peer server
const { ExpressPeerServer } = require('peer');
//creating instance of peer server.The peer server will handle the signalling required for WebRTC for us, so we don't have to worry about STUN/TURN servers or other protocols.
const peerServer = ExpressPeerServer(server, {
    debug: true
});

//telling express app to use peerserver.
app.use('/peerjs', peerServer);
const { v4: uuidV4 } = require('uuid')

//the functions defined in routes/users.js are imported.
const {
    enterUser,
    getAllRoomUsers,
    getCurrentUser,
    userLeave
} = require("./routes/users");


// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');

app.use("/", express.static(__dirname + '/public'));

// request to create a call
app.get('/create_call', (req, res) => {
    res.redirect(`/${uuidV4()}`);
})

//request to join a room  
app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
})

// socket connection
io.on('connection', (socket) => {
    //when client wants to join a room 
    socket.on('join-room', (roomId, userId, userName) => {
        socket.join(roomId);
        //new user is then added to the user list by calling func defined in routes/user.js named enterUser and roomId is added to the room list.
        let user = enterUser(userId, userName, roomId, socket.id);
        console.log(user);

        // to all clients in roomId except the newly connected user, user-connected event emitted.
        socket.to(roomId).emit('user-connected', userId);
        console.log("A user is connected:", userName, "User ID:", userId, "Room ID:", roomId);

        //when a user draws the rest of the users in that room are broadcasted these drawings.
        socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));

        //when a user clears the whitebaord rest of the users in that room are broadcasted these changes.
        socket.on('clearBoard', () => {
            socket.to(roomId).emit('clearBoard');
        });

        //when a user makes changes in the editor, rest of the users in that room are broadcasted these changes.
        socket.on('editor-change', (saamaan) => {
            socket.to(roomId).emit('editor-update-kar-rey', saamaan);
        })

        // messages functionality for users
        socket.on('message', (message, username) => {
            //send message to the same room
            io.to(roomId).emit('createMessage', message, username);
        });

        socket.on('disconnect', () => {
            //When user disconnects userLeave function is called in routes/users.js and removed from the userlist.
            let user = userLeave(socket.id);
            //rest of the users are broadacasted about the user getting disconnected.
            socket.broadcast.emit('user-disconnected', userId);
            console.log("Nikal gaya");
        })
    })
})

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log("Server started at: http://localhost:" + port);
});
