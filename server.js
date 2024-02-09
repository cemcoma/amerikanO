
const { log } = require("console");
const express = require("express");
const { createServer } = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });

app.use(express.static(path.join(__dirname,"public")))


httpServer.listen(3002,()=> {
    console.log("WOO! Server live at 3002")
});

let connected = new Array;  // holds socket.ids
let users = new Array;      // hold user object which has {username: any, id: socket.id ,roomid: any, playerno: number}
let rooms = new Map;        // holds <roomid:any, roomplayercount:number>

let bunchOfHands = new Map; // holds <username:any, hand: card[]>
let bunchOfDecks = new Map; // holds <roomid:any , deck: card[] >

 
function initRoomDeck(roomid) {
    let deck = {
        cards:initCards(),
        size: 106
    }
    bunchOfDecks.set(roomid,deck)
}

function initCards() {
    var tmp = new Array;
    for(var i = 1; i <= 13; i++) {
        tmp[(i-1)*8 + 0] = i+"K";
        tmp[(i-1)*8 + 1] = i+"M";
        tmp[(i-1)*8 + 2] = i+"Si";
        tmp[(i-1)*8 + 3] = i+"Sa";
        tmp[(i-1)*8 + 4] = i+"K";
        tmp[(i-1)*8 + 5] = i+"M";
        tmp[(i-1)*8 + 6] = i+"Si";
        tmp[(i-1)*8 + 7] = i+"Sa";
    }
    tmp[104] = "25J";
    tmp[105] = "25J";
    return tmp;
}


function getRandomFromAvailable(roomid) {
    let arrsize = bunchOfDecks.get(roomid).size
    let cards = bunchOfDecks.get(roomid).cards

    if(arrsize <= 0) {
        return;
    } 
   
    var index = getRandomInt(arrsize)
    
    var card = cards[index]
    for(var i = 1; i < arrsize; i++) {
        if(i > index ) {
            var temp = cards[i-1] 
            cards[i-1] = cards[i]
            cards[i] = temp
        }
    }
    let changedDeck = {
        cards: cards,
        size : arrsize-1
    }
    bunchOfDecks.set(roomid,changedDeck)

    return card
}

function getRandomInt(max) {
    return Math.floor(Math.random() * (max));
}   

















io.on("connection", (socket) => {
    console.log("+User connected with id:", socket.id);
    connected.push(socket.id)

    for (const key of rooms.keys()) {
        console.log(key);
        const roomid = key
        const roomCount = rooms.get(key);
        socket.emit("display-current-rooms",{roomid,roomCount}) 
    }   

    socket.on("join-room", (user) => {
        var playerNo = 1;
        var usernameNotAvailable = false;
        for(i = 0; i < users.length; i++ ) {
            if(users[i].username == user.username) {
                usernameNotAvailable = true;
            } 
        }
        if (usernameNotAvailable) {
            socket.emit("username-is-taken-error");
        } else if(rooms.has(user.roomid) && rooms.get(user.roomid) >= 4 ) {
            socket.emit("room-is-full",user.roomid)
        } else {
            if(!rooms.has(user.roomid)) {
                rooms.set(user.roomid,1)
                initRoomDeck(user.roomid);
            } else {
                var playerNoOpenFlag = [true,true,true,true]
                for(var i = 0; i < users.length; i++) {
                    if(users[i].roomid == user.roomid) {
                        playerNoOpenFlag[users[i].playerNo-1] = false
                       
                    }
                }
                console.log("For room:",user.roomid,"openflag:", playerNoOpenFlag);
                for(var i = 0; i < playerNoOpenFlag.length; i++) {
                    if(playerNoOpenFlag[i]) {
                        playerNo = i+1;
                        i = 40000;//to exit loop
                    }
                }
                
                var newUserCount = rooms.get(user.roomid) +1
                rooms.set(user.roomid, newUserCount)
            }
            user.playerNo = playerNo;
            users.push(user);

            socket.join(user.roomid)
            socket.emit("init-room-for-user",{playerNo:playerNo, roomUserCount: rooms.get(user.roomid)});
            socket.to(user.roomid).emit("want-tableContent",{roomid: user.roomid, roomUserCount: rooms.get(user.roomid)} );
            console.log("++User ",user.username," joined room:", user.roomid);

            for (const key of rooms.keys()) {
                const roomid = key
                const roomCount = rooms.get(key);
                socket.broadcast.emit("display-current-rooms",{roomid,roomCount}) 
            } 
        }
       
    })

    io.emit('player-total',connected.length);

    /* Experimental rejoining stuff

    socket.on("rejoin", username) {
        var user;
        for(var i = 0; i < users.lenght; i++) {
            if(users[i].username == username) {
                user = users[i];
            }
        }
        if(user.username == username) {
            socket.join(user.roomid)
            socket.emit("init-room-for-user",{playerNo:playerNo, roomUserCount: rooms.get(user.roomid)});
            socket.to(user.roomid).emit("want-tableContent",{roomid: user.roomid, roomUserCount: rooms.get(user.roomid)} );
            console.log("**User ",user.username," REjoined room:", user.roomid);

            var newUserCount = rooms.get(user.roomid) +1
            rooms.set(user.roomid, newUserCount)

        } else {
            socket.emit("username-not-found")
        }
    }

    socket.on("show-deletedDropdown", (src) => {
        socket.emit("change-deletedDropdown-contents",src);
    })

    socket.on("show-dumpPileContent", {src,whichPile} => {
        socket.to(roomid).emit("dumpPile-init", {src,whichPile});
    })
        
    */


    
    socket.on("change-dumpPile", ({src,pile,roomid}) => {
        socket.to(roomid).emit("change-dumpPile-contents",({src: src, pile: pile}));
    })
    socket.on("change-deletedDropdown", ({src:src,roomid:roomid}) => {
        socket.to(roomid).emit("change-deletedDropdown-contents",src);
    })

    socket.on("delete-dumpPile", ({pile,roomid}) => {
        socket.to(roomid).emit("delete-dumpPile-contents",(pile));
    })

    socket.on("show-tableContent", ({srcArr ,table,roomid}) => {
        socket.to(roomid).emit("show-tableContent", ({srcArr:srcArr ,table:table}));
    })

    socket.on("want-card",({roomid,username}) => {
        const card = getRandomFromAvailable(roomid);

        if(!bunchOfHands.has(username)) {
            let initHand = [];
            initCards[0] = card;
            bunchOfHands.set(username,initHand)
        }
        var newHand = bunchOfHands.get(username)
       
        newHand.push(card)
        
        bunchOfHands.set(username,newHand)
        socket.emit("return-card",{hand:newHand, roomUserCount: rooms.get(roomid)} )
    })
    

    socket.on('disconnect', () => {
        
        var userindex = -1;
        
        for(var i = 0; i < users.length && userindex == -1; i++) {
            if( userindex == -1 && socket.id == users[i].id) {
                var newUserCount = rooms.get(users[i].roomid) -1
              
                rooms.set(users[i].roomid,newUserCount)
                
                const temp = users[i];
                users[i] = users[users.length-1];
                users[users.length-1] = temp;
                userindex = i;
            } 
        }
        
        
        if(userindex != -1)  {
            var roomidForPopping = users[users.length-1].roomid;
            socket.to(users[users.length-1].roomid).emit("user-disconnected")
            console.log("--Disconnected (not removed) user " + users[users.length-1].username)
            if(rooms.get(users[users.length-1].roomid) < 1) {
             
                console.log("---These users have been disconnected because their room is empty: ");
                var arrsize = users.length;
                for(var i = 0; i < arrsize; i++) {
                  
                    if(roomidForPopping == users[i].roomid) {
                        const temp = users[i];
                        users[i] = users[users.length-1];
                        users[users.length-1] = temp;
                        bunchOfHands.delete(users[i].username)
                        console.log(users.pop());
                        arrsize--;
                        i = -1;
                    }
                }

                
                rooms.delete(roomidForPopping);
                bunchOfDecks.delete(roomidForPopping);
                socket.broadcast.emit("display-current-rooms",{roomid:roomidForPopping,roomCount:0})
            }
            
        }
        else console.log("-User disconnected with id:", socket.id)
        

        connected.pop();
        io.emit('player-total', connected.length);
        
        for (const key of rooms.keys()) {
            console.log(key);
            const roomid = key
            const roomCount = rooms.get(key);
            socket.broadcast.emit("display-current-rooms",{roomid,roomCount}) 
        } 

    })    
});


 