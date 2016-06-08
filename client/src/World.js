// =============================================================================
//  The World.
// =============================================================================
var World = function(){
    
    this.currentTime = (+new Date()) / 1000.0;
    
    this.totalPhysicsRunTime = 0.0;
    this.physicsDeltaTime = 0.01;
    this.physicsAccumulator = 0.0;
    
    this.totalRenderRunTime = 0.0;
    this.renderDeltaTime = 0.0;
    
    this.queue = new Queue();
    
    this.peers = new Object;
    
    // Create camera object: PerspectiveCamera( fov, aspect, near, far )
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    
    // Create scene object, add fog to scene: Fog( hex, near, far )
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xffffff, 0, 750);
    
    // Create hemisphere light object, set it's position, add it to the scene: HemisphereLight(skyColorHex, groundColorHex, intensity)
    this.light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    this.light.position.set(0.5, 1, 0.75);
    this.scene.add(this.light);
    
    
    // Create renderer and bind to dom
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(0xffffff);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    // Add floor to scene. In the future I'm thinking we will have another object which defines
    // a world map, and that object will be a property of this world "class". That sounds like
    // it would make the loading of different maps simpler.    
    this.floorTexture = new THREE.ImageUtils.loadTexture( './assets/textures/checkerboard.jpg' );
    this.floorTexture.wrapS = this.floorTexture.wrapT = THREE.RepeatWrapping; 
    this.floorTexture.repeat.set( 10, 10 );
    this.floorMaterial = new THREE.MeshBasicMaterial( { map: this.floorTexture, side: THREE.DoubleSide } );
    this.floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    this.floor = new THREE.Mesh(this.floorGeometry, this.floorMaterial);
    this.floor.position.y = -0.5;
    this.floor.rotation.x = Math.PI / 2;
    this.scene.add(this.floor);
    
//    var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
//    var cubeMaterial = new THREE.MeshLambertMaterial({color: 0xff3333});
//    var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
//    cube.castShadow = true;
//    cube.position.x = -4;
//    cube.position.y = 3;
//    cube.position.z = 0;
//    this.scene.add(cube);
    
    
};

World.prototype.addClient = function(client_current_state){
    
    this.scene.add(client_current_state);
    
};

World.prototype.render = function(){
    
    this.renderer.render(this.scene, this.camera);
    
};


World.prototype.processServerUpdates = function(client) {
  
    while(true){
     
        var update = this.queue.receive();
        
        if(!update){
            break;
        }
        
        for(var id in update.payload){
            
            var server_state = update.payload[id];
            
            if(id === client.id){
                
                // Set user's current state equal to the state processed by the server
                client.updateState(server_state);
                
                
                // Server Reconciliation. Re-apply all the inputs not yet processed by the server
                var i = 0;
                while(i < client.pending_inputs.length){
                    
                    var input = client.pending_inputs[i];
                    if(input.input_sequence_number <= server_state.last_processed_input){
                        
                        // Already processed. Remove
                        client.pending_inputs.splice(i, 1);
                        
                    } else {
                        
                        // Not processed by server yet. Re-apply.
                        client.applyInput(input, this.physicsDeltaTime);
                        i++;
                        
                    }
                    
                }
                
            } else { // This is a peer update
                
                //this.peers[id].updateState(server_state);
                this.peers[id].update_cache.push({'received':update.time_received, 'update':server_state});
                
            }
            
        }
            
    }
        
};

World.prototype.disconnectPeer = function(peer_id){
    
    var selectedObject = this.scene.getObjectByName(this.peers[peer_id].billboard.name);
    this.scene.remove(selectedObject);
    
    var selectedObject = this.scene.getObjectByName(this.peers[peer_id].mesh.name);
    this.scene.remove(selectedObject);
    
    delete(this.peers[peer_id]);
        
};

// Find the position each player is facing relative to
// the current player camera position and display the 
// correct texture on the player billboard, animate texture
World.prototype.animatePeers = function(client){

    var animation_speed = 1000 * this.physicsDeltaTime;
    
    for(var peer_id in this.peers){
        
        var peer = this.peers[peer_id];
        
        var view = new THREE.Vector3();
        view.subVectors(client.current_state.position, peer.mesh.position);

        var inverse = peer.mesh.quaternion.clone();
        inverse.inverse();

        view.applyQuaternion(inverse);

        var angle = Math.round(Math.atan2(view.x, view.z) * 4/Math.PI);

        if(angle === 0 || angle === -0){// North
            peer.billboard.material.map = peer.textures.n;
            peer.billboard.needsUpdate = true;
            peer.animations.n.update(animation_speed);
        }
        else if(angle === -1){// Northwest
            peer.billboard.material.map = peer.textures.nw;
            peer.billboard.needsUpdate = true;
            peer.animations.nw.update(animation_speed);
        }
        else if(angle === -2){// West
            peer.billboard.material.map = peer.textures.w;
            peer.billboard.needsUpdate = true;
            peer.animations.w.update(animation_speed);
        }
        else if(angle === -3){// Southwest
            peer.billboard.material.map = peer.textures.sw;
            peer.billboard.needsUpdate = true;
            peer.animations.sw.update(animation_speed);
        }
        else if(angle === 4 || angle === -4){// South
            peer.billboard.material.map = peer.textures.s;
            peer.billboard.needsUpdate = true;
            peer.animations.s.update(animation_speed);
        }
        else if(angle === 3){// Southeast
            peer.billboard.material.map = peer.textures.se;
            peer.billboard.needsUpdate = true;
            peer.animations.se.update(animation_speed);
        }
        else if(angle === 2){// East
            peer.billboard.material.map = peer.textures.e;
            peer.billboard.needsUpdate = true;
            peer.animations.e.update(animation_speed);
        }
        else if(angle === 1){// Northeast
            peer.billboard.material.map = peer.textures.ne;
            peer.billboard.needsUpdate = true;
            peer.animations.ne.update(animation_speed);
        }

        peer.billboard.lookAt(client.current_state.position);

    }
};