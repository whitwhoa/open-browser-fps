var node_server = require('http').Server();
var io = require('socket.io')(node_server);

var THREE = require('three');

var Peer = require('./Peer.js');
var Queue = require('./Queue.js');
var World = require('./World.js');
var world = new World();

// Network logic
io.on('connection', function(socket){
   console.log('New client has connected'); 
   
   // Create peer object for newly connected client
   world.connect(socket.id);
   
   // Create the peer net object that will be sent over the network
   var netPeer = world.buildPeerNetObject(socket.id);
   
   // Connect the peer to the server and return successful_connection event
   // containing the network object for this peer
   socket.emit('successful_connection', netPeer);
   
   // Send newly connected peer object to all previously connected peers
   io.sockets.emit('new_player_connection', netPeer);
   
   // Send previously connected peers to newly connected peer
   socket.emit('connected_players', world.buildPeersNetObject());
   
   // Send peer input to update queue
   socket.on('client_input', function(input){
        world.queue.updates.push(input);
   });
   
   // Remove the peer from the server
   socket.on('disconnect', function(){
        console.log('Client has disconnected');
       
        // Remove any queued inputs that are waiting to be processed
        var i = 0;
        while(i < world.queue.updates.length){
            var update = world.queue.updates[i];
            if(update.id === socket.id){
                world.queue.updates.splice(i, 1);
            } else {
                i++;
            }
        }

        // Remove client from server
        delete(world.peers[socket.id]);
        
        // Send the peer id to all connected peers
        io.sockets.emit('player_disconnect', socket.id);
       
   });
   
});

// Run server loop 10 times per second
setInterval(function(){
    world.update(io);
}, 1000 / 10);

// Listen on given port number
node_server.listen(3000);