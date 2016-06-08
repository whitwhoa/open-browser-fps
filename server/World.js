// =============================================================================
//  Server world
// =============================================================================

var Peer = require('./Peer.js');
var Queue = require('./Queue.js');

var World = function() {

  this.peers = new Object;
  this.queue = new Queue();
  
};

World.prototype.connect = function(peer_id) {

    // Create a new peer for this connection.
    this.peers[peer_id] = new Peer();
    this.peers[peer_id].id = peer_id;
    // Set peer's initial position
    this.peers[peer_id].obj.position.x = -100;
    this.peers[peer_id].obj.position.y = 10;
    this.peers[peer_id].obj.position.z = 0;
  
};

World.prototype.update = function(io) {
    
    this.processInputs();
    io.sockets.emit('server_state', this.buildPeersNetObject());
    
};

// Check whether this input seems to be valid (e.g. "make sense" according
// to the physical rules of the World) simply return true for now
World.prototype.validateInput = function(input) { 
    
    if(!this.peers[input.id]){
        return false;
    } else {
        return true;
    }
    
};

// Process all pending messages from peers.
World.prototype.processInputs = function() {
  
    while (true) {
        
        var update = this.queue.receive();
    
        if (!update) { 
          break;
        }
    
        // Update the state of the peer, based on its input.
        if (this.validateInput(update)) {

            this.peers[update.id].applyInput(update);
            this.peers[update.id].last_processed_input = update.input_sequence_number;
      
        }    
    
    }
    
};

// Build the object for the given peer id that is to be sent across the network
World.prototype.buildPeerNetObject = function(peer_id){
    
    return {
        id:peer_id,
        position:{
            x:this.peers[peer_id].obj.position.x,
            y:this.peers[peer_id].obj.position.y,
            z:this.peers[peer_id].obj.position.z
        },
        quat:{
            x:this.peers[peer_id].obj.quaternion.x,
            y:this.peers[peer_id].obj.quaternion.y,
            z:this.peers[peer_id].obj.quaternion.z,
            w:this.peers[peer_id].obj.quaternion.w
        },
        last_processed_input:this.peers[peer_id].last_processed_input
    };
    
};

// Build the object for the given peer id that is to be sent across the network
World.prototype.buildPeersNetObject = function(){
    
    var netObj = new Object;
    
    for(var id in this.peers){
        netObj[id] = {
            id:id,
            position:{
                x:this.peers[id].obj.position.x,
                y:this.peers[id].obj.position.y,
                z:this.peers[id].obj.position.z
            },
            quat:{
                x:this.peers[id].obj.quaternion.x,
                y:this.peers[id].obj.quaternion.y,
                z:this.peers[id].obj.quaternion.z,
                w:this.peers[id].obj.quaternion.w
            },
            last_processed_input:this.peers[id].last_processed_input
        };
    }
    
    return netObj;
    
};

module.exports = World;