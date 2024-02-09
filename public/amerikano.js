//const { emit } = require("nodemon");

const socket = io();
var connected = false;
var isTurn = false;
var username;

const waitingPlayerCount = document.getElementById("waitingCount");
const readyPlayerCount = document.getElementById("readyCount");
const deletedDropdown = document.getElementById("removedMenu");
const turnDisplay = document.getElementById("turnDisplay");
const tables = new Array;
tables[0] = document.getElementById("mateTable")
tables[1] = document.getElementById("leftTable")
tables[2] = document.getElementById("rightTable")
tables[3] = document.getElementById("yourTable")
const dumpPile = new Array;
dumpPile[0] = document.getElementById("pile1")
dumpPile[1] = document.getElementById("pile2")
dumpPile[2] = document.getElementById("pile3")
dumpPile[3] = document.getElementById("pile4")
var gotStartingCards = false;
var roomid;
var playerNo;
var roomPlayerCount;
var steal = 4;

let dumpFlag = new Array;
dumpFlag[0] = false
dumpFlag[1] = false
dumpFlag[2] = false
dumpFlag[3] = false

let roomsDisplayed  = new Map;


socket.on('player-total', (data) => {
    console.log("user count = ",data);
    waitingPlayerCount.textContent = "Players on server= " + data;
})

const container1s= document.querySelectorAll('.container1');    
        container1s.forEach(container1 => {
        container1.addEventListener('dragend', e => {
            e.preventDefault();
            if(container1.lastChild.getAttribute("src") == "images/divider.png") container1.lastChild.remove();
            else {
                var whichPile = 0;
                switch (container1.getAttribute("id")) {
                    case "pile1":
                        whichPile = 0;
                        break;
                    case "pile2":
                        whichPile = 1;
                        break;
                    case "pile3":
                        whichPile = 2;
                        break;
                    case "pile4":
                        whichPile = 3;
                        break;
                }
                container1.lastChild.draggable = false;
                socket.emit("change-dumpPile", {src: container1.lastChild.getAttribute('src'), pile: whichPile,roomid:roomid});
                turnDisplay.textContent = "Right opponent's turn"
                dumpFlag[whichPile] = false;
                isTurn = false;
                if(container1.childElementCount > 1)  {
                    container1.firstChild.draggable = false;
                    container1.firstChild.classList.remove("draggable")
                    socket.emit("change-deletedDropdown", ({ src:container1.firstChild.getAttribute('src'),roomid:roomid}));
                    document.getElementById("removedMenu").appendChild(container1.firstChild)
                }
            }
        
        }),
        container1.addEventListener('dragstart', e=> {
            var whichPile = 0;
                switch (container1.getAttribute("id")) {
                    case "pile1":
                        whichPile = 0;
                        break;
                    case "pile2":
                        whichPile = 1;
                        break;
                    case "pile3":
                        whichPile = 2;
                        break;
                    case "pile4":
                        whichPile = 3;
                        break;
                }

            var isNormalPile = false
            var canBeStolen = true
            switch (playerNo) {
                case 1:
                    if(whichPile == 3) isNormalPile =true;
                    break;
                case 2:
                    if(whichPile == 0) isNormalPile =true;
                    break;
                case 3:
                    if(whichPile == 1) isNormalPile =true;
                    break;
                case 4:
                    if(whichPile == 2) isNormalPile =true;
                    break;
            }

            if(!document.getElementById("getCard").disabled || numberOfCardsInHand()%2 == 1) canBeStolen = false


            if((isNormalPile && isTurn && !document.getElementById("getCard").disabled )|| (steal > 0 && canBeStolen) ) {
                if(!isNormalPile) {
                    socket.emit("want-card",({roomid,username}));
                    steal--;
                } 
                
                if (isNormalPile) {
                    document.getElementById("getCard").disabled = true;  
                } 
                
                document.getElementById("handTop").append(container1.firstChild)            
                socket.emit("delete-dumpPile", ({pile:whichPile,roomid:roomid}));
                
            }
            
        }),
        container1.addEventListener('dragover', e => {
            e.preventDefault();
            var whichPile = 0;
            switch (container1.getAttribute("id")) {
                case "pile1":
                    whichPile = 0;
                    break;
                case "pile2":
                    whichPile = 1;
                    break;
                case "pile3":
                    whichPile = 2;
                    break;
                case "pile4":
                    whichPile = 3;
                    break;
            }
                
            if(dumpFlag[whichPile] && roomPlayerCount == 4) {

                const draggable = document.querySelector('.dragging');
                container1.appendChild(draggable);
                if(!document.getElementById("getCard").disabled) {
                    socket.emit("want-card",{roomid,username});
                    document.getElementById("getCard").disabled = true
                }
                
            }
            
        });    
       }); 
       
       
const container2s = document.querySelectorAll('.container2');
        container2s.forEach(container2=> {
            container2.addEventListener('dragend', e=> {
                e.preventDefault()
                var whichPile = 0;
                switch (container2.getAttribute("id")) {
                    case "mateTable":
                        whichPile = 0;
                        break;
                    case "leftTable":
                        whichPile = 1;
                        break;
                    case "rightTable":
                        whichPile = 2;
                        break;
                    case "yourTable":
                        whichPile = 3;
                        break;
                }   
                var srcArr = new Array;
                for(var i = 0; i < tables[whichPile].childElementCount; i++) {
                    srcArr[i] = tables[whichPile].children[i].getAttribute('src');
                }

                socket.emit("show-tableContent", ({srcArr:srcArr ,table:whichPile, roomid:roomid }))
                
            }),
            container2.addEventListener('dragstart', e=> {
                
                switch (container2.getAttribute("id")) {
                    case "mateTable":
                        whichPile = 0;
                        break;
                    case "leftTable":
                        whichPile = 1;
                        break;
                    case "rightTable":
                        whichPile = 2;
                        break;
                    case "yourTable":
                        whichPile = 3;
                        break;
                }
                var srcArr = new Array;
                for(var i = 0; i < tables[whichPile].childElementCount; i++) {

                    if(document.querySelector('.dragging').getAttribute('src') != tables[whichPile].children[i].getAttribute('src')) srcArr[i] = tables[whichPile].children[i].getAttribute('src');
                }

                
                socket.emit("show-tableContent", ({srcArr:srcArr ,table:whichPile,roomid:roomid }))
            })
        })

document.getElementById("openTopHand").addEventListener("click", e=>{
        var openTable = 0;
        
        if(document.getElementById("yourTable").childElementCount == 0)  {
            openTable = 3
        } else if(document.getElementById("rightTable").childElementCount == 0){
            openTable = 2
        } else if(document.getElementById("leftTable").childElementCount == 0) {
            openTable = 1
        } else if(document.getElementById("mateTable").childElementCount == 0) {
            openTable = 0
        }


        const firstChildren  = document.getElementById("handTop").children;
        const x = firstChildren.length
        
        for(var i = 0; i < x; i++) {
            trial(openTable,firstChildren[i].getAttribute('src'))
        }

        var srcArr = new Array;
        for(var i = 0; i < x ;i++) {
            document.getElementById("handTop").children[0].remove();
            srcArr[i] = tables[openTable].children[i].getAttribute('src');
        }

        socket.emit("show-tableContent", ({srcArr:srcArr ,table:openTable,roomid:roomid}))
})

document.getElementById("getCard").addEventListener("click", e=> {
    socket.emit("want-card",{roomid,username});
    document.getElementById("getCard").disabled = true;
    console.log(dumpFlag);
    switch (playerNo) {
        case 1:
            dumpFlag[3] = false
            dumpPile[3].firstChild.draggable = false
            break;
        case 2:
            dumpFlag[0] = false
            dumpPile[0].firstChild.draggable = false
            break;
        case 3:
            dumpFlag[1] = false
            dumpPile[1].firstChild.draggable = false
            break;
        case 4:
            dumpFlag[2] = false
            dumpPile[2].firstChild.draggable = false
            break;
    }
})

document.getElementById("getStartingCards").addEventListener("click",e=> {
    document.getElementById("getStartingCards").disabled = true;
    if(!gotStartingCards) {
    for(var i = 0; i < 14; i++) {
        socket.emit("want-card",{roomid,username})
    }
    gotStartingCards = true;
        if(playerNo == 1) {
            socket.emit("want-card",{roomid,username})
        }
    }
})

document.getElementById("joinroomButton").addEventListener("click", e => {
    username = document.getElementById("username").value 
    var room = document.getElementById("room").value 
    console.log(username);

    var isUsernameEmpty = true;
    var isRoomIDEmpty = true;
    if(username != "") isUsernameEmpty = false;
    if(room != "") isRoomIDEmpty = false;


    if (!isUsernameEmpty && !isRoomIDEmpty) {
        socket.emit("join-room", ({username:username,id: socket.id, roomid:room, playerNo: -1 }))
        roomid = room;
    }
    else if (isUsernameEmpty) alert("Username is empty");
    else alert("Room id is empty");
})


socket.on("display-current-rooms",({roomid,roomCount}) => {
    if(!connected) {
        if(roomsDisplayed.has(roomid)) {
            for(const roomDisplay of document.getElementById("roomsDisplay").children) {
                console.log("Im here with the room ", roomid," and it has player count of " ,roomCount);
                console.log(roomDisplay.firstChild.textContent.substring(9),roomid);
                if(roomDisplay.firstChild.textContent.substring(9) == roomid)  {
                    if(roomCount == 0) {
                        roomDisplay.parentNode.removeChild(roomDisplay)
                        roomsDisplayed.delete(roomid)
                    } else {
                        roomDisplay.children[1].textContent = "Player count: " + roomCount;
                    }
                }
               
            }
         }
         else {
             roomsDisplayed.set(roomid,roomCount);
             var node = document.createElement("div")
             node.classList.add("roomsDisplay") 
     
             var insidetext1 = document.createElement("p")
             insidetext1.textContent = "Room id: " + roomid ;
             
             var insidetext2 = document.createElement("p")
             insidetext2.textContent = "Player count: " + roomCount;
             
             node.append(insidetext1);
             node.append(insidetext2);
     
             document.getElementById("roomsDisplay").append(node)    
         }
    }
    
    
})

socket.on("room-is-full", (id) =>{
    alert(("Room " + id +" is full!"))
})


socket.on("init-room-for-user", ({playerNo,roomUserCount}) => {
    connected = true;
    document.getElementById("dropdownDiv").style.visibility = "visible"
    document.getElementById("buttonsNpilesDiv").style.visibility = "visible"
    document.getElementById("turnDisplay").style.visibility="visible"
    document.querySelectorAll(".divider").forEach(divider => {
        divider.style.visibility = "visible"
    })
    document.querySelectorAll('.container').forEach(container =>{
        container.style.visibility = "visible"
    }) 
    document.getElementById("nameNpnoDisplay").textContent = "You are player " + playerNo;
    this.playerNo = playerNo;
    roomPlayerCount = roomUserCount;
    document.getElementById("getCard").disabled = true;


    if(playerNo == 1) dumpFlag[0] = true;
    
    
    document.getElementById("roomPlayerCount").textContent = "Players in this room = "+ roomUserCount;
    document.getElementById("roomPlayerCount").style.visibility ="visible"
    document.getElementById("roomIDDisplay").style.visibility="visible"
    document.getElementById("roomIDDisplay").textContent ="You are playing on room= " +roomid;
    const startingElementCount = document.getElementById("roomjoinDiv").childElementCount;
    for (let index = 0; index < startingElementCount; index++) {
        document.getElementById("roomjoinDiv").children[0].remove();
    }

    const elementCountStarting = document.getElementById("roomsDisplay").childElementCount;
    for (let index = 0; index < elementCountStarting; index++) {
        document.getElementById("roomsDisplay").children[0].remove();
    }
})



socket.on("change-dumpPile-contents",({src,pile}) => {

    var node = document.createElement("img")
    node.src = src
    node.classList.add("draggable")
    node.draggable = true;
    node.addEventListener('dragstart', () =>{
        node.classList.add('dragging');
    })
    node.addEventListener('dragend', () =>{
        node.classList.remove('dragging');
    })
    switch (pile) {
        case 0:
            
            if(playerNo == 2) {
                turnDisplay.textContent = "Your turn!"
                isTurn = true;
                dumpFlag[1] = true;
                document.getElementById("getCard").disabled = false;
                if(dumpPile[2].childElementCount > 0)dumpPile[2].firstChild.draggable = false
                if(dumpPile[3].childElementCount > 0)dumpPile[3].firstChild.draggable = false
            } else if (playerNo == 1){
                turnDisplay.textContent = "Right opponent's turn"
            } else if (playerNo == 3) {
                turnDisplay.textContent = "Left opponent's turn"
            } else {
                turnDisplay.textContent = "Your teammate's turn"
            }
            break;
        case 1:
            
            if(playerNo == 3) {
                turnDisplay.textContent = "Your turn!"
                isTurn = true;
                dumpFlag[2] = true;
                document.getElementById("getCard").disabled = false;
                if(dumpPile[3].childElementCount > 0)dumpPile[3].firstChild.draggable = false
                if(dumpPile[0].childElementCount > 0)dumpPile[0].firstChild.draggable = false
            } else if (playerNo == 2){
                turnDisplay.textContent = "Right opponent's turn"
            } else if (playerNo == 4) {
                turnDisplay.textContent = "Left opponent's turn"
            } else {
                turnDisplay.textContent = "Your teammate's turn"
            }
            break;
        case 2:
            turnDisplay.textContent = "Your turn!"
            if(playerNo == 4) {
                dumpFlag[3] = true;
                isTurn = true;
                document.getElementById("getCard").disabled = false;
                if(dumpPile[0].childElementCount > 0)dumpPile[0].firstChild.draggable = false
                if(dumpPile[1].childElementCount > 0)dumpPile[1].firstChild.draggable = false
            } else if (playerNo == 3){
                turnDisplay.textContent = "Right opponent's turn"
            } else if (playerNo == 1) {
                turnDisplay.textContent = "Left opponent's turn"
            } else {
                turnDisplay.textContent = "Your teammate's turn"
            }
            break;    
        case 3:
            if(playerNo == 1) {
            turnDisplay.textContent = "Your turn!"
                dumpFlag[0] = true;
                isTurn = true;
                document.getElementById("getCard").disabled = false;
                if(dumpPile[1].childElementCount > 0)dumpPile[1].firstChild.draggable = false
                if(dumpPile[2].childElementCount > 0)dumpPile[2].firstChild.draggable = false
            } else if (playerNo == 4){
                turnDisplay.textContent = "Right opponent's turn"
            } else if (playerNo == 2) {
                turnDisplay.textContent = "Left opponent's turn"
            } else {
                turnDisplay.textContent = "Your teammate's turn"
            }
            break;
        }

   
        dumpPile[pile].appendChild(node)
        if(dumpPile[pile].childElementCount>1) dumpPile[pile].firstChild.remove();
        
        
})

socket.on("change-deletedDropdown-contents",(src) => {
    
    var node = document.createElement("img")
        node.src = src
    deletedDropdown.append(node)
})

socket.on("delete-dumpPile-contents",(pile) => {
    dumpPile[pile].children[0].remove(); 
})

socket.on("show-tableContent",({srcArr,table}) => {
    const size = tables[table].childElementCount;
    for(var i = 0; i < size; i++) { 
        tables[table].children[0].remove();
    }
    
    for(var i = 0; i < srcArr.length; i++) {
        trial(table,srcArr[i])
    }

          
})
function trial(table,src) {
    var node = document.createElement("img")
    node.src = src
    node.classList.add("draggable")
    node.draggable = true;
    node.addEventListener('dragstart', () =>{
        node.classList.add('dragging');
    })
    node.addEventListener('dragend', () =>{
        node.classList.remove('dragging');
    })

    if(src != null) {
        tables[table].appendChild(node)
    }
    
}


socket.on("want-tableContent", ({roomid,roomUserCount})=>{
    if(tables[0].childElementCount != 0 || tables[1].childElementCount != 0 || tables[2].childElementCount != 0 || tables[3].childElementCount != 0 ){

        for(var j = 0; j < 4; j++) {
            var srcArr = new Array;
            for(var i = 0; i < tables[j].childElementCount; i++) {
                srcArr[i] = tables[j].children[i].getAttribute('src');
            }
            socket.emit("show-tableContent", ({srcArr:srcArr ,table:j,roomid:roomid}))
        }
    }
    /* Experimental rejoining stuff 
    if(dumpPile[0].childElementCount != 0 || dumpPile[1].childElementCount != 0 || dumpPile[2].childElementCount != 0 || dumpPile[3].childElementCount != 0 ) { 
        for(var j = 0; j < 4; j++) {
            var src = dumpPile[0].children[0].getAttribute('src');
            socket.emit("show-dumpPileContent", ({src:src ,whichPile:j}))
        }
    }

    if(deletedDropdown.childElementCount != 0) { // experimental rejoining
        for(const children of deletedDropdown.children) socket.emit("show-deletedDropdown", children.getAttribute("src"))
    }
    */

    roomPlayerCount = roomUserCount;
    document.getElementById("roomPlayerCount").textContent = "Players in this room = "+ roomUserCount;
})
   
var gotDisconnectAlert = false
socket.on("user-disconnected", () => {
    if(!gotDisconnectAlert) {
        alert("Someone disconnected in your server! Please refresh the page and join another room...");
        gotDisconnectAlert = true;
    }  
})

function appendCard(src) {
    var node = document.createElement("img")
    node.classList.add("draggable")
    node.draggable = true;
    node.addEventListener('dragstart', () =>{
        node.classList.add('dragging');
    })
    node.addEventListener('dragend', () =>{
        node.classList.remove('dragging');
    })

    var realChildCountTop = 0;
    var realChildCountBot = 0;
    var firstChildren  = document.getElementById("handTop").children;
    var secondChildren = document.getElementById("handBot").children;

    for(var i = 0; i < document.getElementById("handTop").childElementCount;i++) {
        if(firstChildren[i].getAttribute('src') != "images/divider.png") {
            realChildCountTop = realChildCountTop + 1;
        } else {
            realChildCountTop = realChildCountTop;
        }
    }

    for(var i = 0; i < document.getElementById("handBot").childElementCount;i++) {
        if(secondChildren[i].getAttribute('src') != "images/divider.png") {
            realChildCountBot = realChildCountBot + 1;
        } else {
            realChildCountBot = realChildCountBot;
        }
    }
    
             
    if(realChildCountBot+realChildCountTop < 23) {
        if(realChildCountBot < 11) {
                node.src = "images/" + src+ ".png" ;
                document.getElementById("handBot").appendChild(node)
        } else {
            node.src = "images/" + src + ".png" ;
            document.getElementById("handTop").appendChild(node)
        }
        
    }else {
        alert("Can't hold more cards!")
    }
}
                
    
socket.on("return-card", ({hand,roomUserCount}) =>{
    const card = hand[hand.length-1];
    appendCard(card)
    document.getElementById("roomPlayerCount").textContent = "Players in this room = "+ roomUserCount;
})

socket.on("username-is-taken-error", () => {
    alert("Username is taken enter another name pls")
});

/* Experimental rejoining stuff 
socket.on("username-not-found", () => {
    alert("Rejoin failed! Maybe you typed the username wrong, or the room you were in was destroyed (happens when there is no users left in room).")
}) 

socket.on("dumpPile-init", {src,whichPile}) => {
    var node = document.createElement("img")
    node.src = src
    node.classList.add("draggable")
    node.draggable = true;
    node.addEventListener('dragstart', () =>{
        node.classList.add('dragging');
    })
    node.addEventListener('dragend', () =>{
        node.classList.remove('dragging');
    })

    dumpPile[pile].appendChild(node)

})
*/

function numberOfCardsInHand() {
    var realChildCountTop = 0;
    var realChildCountBot = 0;
    var firstChildren  = document.getElementById("handTop").children;
    var secondChildren = document.getElementById("handBot").children;

    for(var i = 0; i < document.getElementById("handTop").childElementCount;i++) {
        if(firstChildren[i].getAttribute('src') != "images/divider.png") {
            realChildCountTop = realChildCountTop + 1;
        } else {
            realChildCountTop = realChildCountTop;
        }
    }

    for(var i = 0; i < document.getElementById("handBot").childElementCount;i++) {
        if(secondChildren[i].getAttribute('src') != "images/divider.png") {
            realChildCountBot = realChildCountBot + 1;
        } else {
            realChildCountBot = realChildCountBot;
        }
    }
    return realChildCountBot+realChildCountTop
}

function isUserFinished() {
    if(numberOfCardsInHand() == 0) socket
}
