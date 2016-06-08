// =============================================================================
//  Peer object
// =============================================================================
var Peer = function(scene, netObj) {

    this.textures = {
        s:new THREE.ImageUtils.loadTexture('./assets/textures/player_0/s.png'),
        se:new THREE.ImageUtils.loadTexture('./assets/textures/player_0/se.png'),
        e:new THREE.ImageUtils.loadTexture('./assets/textures/player_0/e.png'),
        ne:new THREE.ImageUtils.loadTexture('./assets/textures/player_0/ne.png'),
        n:new THREE.ImageUtils.loadTexture('./assets/textures/player_0/n.png'),
        nw:new THREE.ImageUtils.loadTexture('./assets/textures/player_0/nw.png'),
        w:new THREE.ImageUtils.loadTexture('./assets/textures/player_0/w.png'),
        sw:new THREE.ImageUtils.loadTexture('./assets/textures/player_0/sw.png')
    };

    this.animations = {
        s:new TextureAnimator(this.textures.s, 4, 1, 4, 160),
        se:new TextureAnimator(this.textures.se, 4, 1, 4, 160),
        e:new TextureAnimator(this.textures.e, 4, 1, 4, 160),
        ne:new TextureAnimator(this.textures.ne, 4, 1, 4, 160),
        n:new TextureAnimator(this.textures.n, 4, 1, 4, 160),
        nw:new TextureAnimator(this.textures.nw, 4, 1, 4, 160),
        w:new TextureAnimator(this.textures.w, 4, 1, 4, 160),
        sw:new TextureAnimator(this.textures.sw, 4, 1, 4, 160)
    };

    this.billboard_mat = new THREE.MeshBasicMaterial({map: this.textures.n,  transparent:true});
    this.billboard_geom = new THREE.PlaneGeometry(14, 14, 1, 1);
    this.billboard = new THREE.Mesh(this.billboard_geom, this.billboard_mat);
    this.billboard.name = netObj.id + '_billboard';
    this.billboard.rotation.set(0,0,0);
    this.billboard.position.copy(netObj.position);
    scene.add(this.billboard);
    
    
    this.material = new THREE.MeshBasicMaterial({transparent:true, opacity:0.0});
    //this.material = new THREE.MeshBasicMaterial({transparent:false});
    this.geometry = new THREE.PlaneGeometry(14, 14, 1, 1);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.name = netObj.id + '_mesh';
    this.mesh.rotation.set(0,0,0);
    this.mesh.position.copy(netObj.position);
    scene.add(this.mesh);
    
    this.render_state = new THREE.Object3D();
    this.render_state.rotation.set(0,0,0);
    this.render_state.position.copy(netObj.position);
    
    //this.physics_state = new THREE.Object3D();
    
    this.direction = '';
    
    this.update_cache = [];
    
    this.previous_lerp_update = null;
    this.next_lerp_update = null;


};

Peer.prototype.updateState = function(netObj){
    
    this.billboard.position.x = netObj.position.x;
    this.billboard.position.y = netObj.position.y;
    this.billboard.position.z = netObj.position.z;
    
    this.mesh.position.x = netObj.position.x;
    this.mesh.position.y = netObj.position.y;
    this.mesh.position.z = netObj.position.z;
    
    this.mesh.quaternion.set(netObj.quat.x, netObj.quat.y, netObj.quat.z, netObj.quat.w);
    this.mesh.quaternion.normalize();
    
};

Peer.prototype.interpolate = function(current_render_time, render_delta, current_client_position){
    //console.log(this.mesh.position);
    
    // Find the render time by subtracting our interpolation delay of .1sec (100ms) from
    // the current world time
    var delay = 0.1; // 100ms
    var peer_render_time = current_render_time - delay;
    
    
    // Loop through update_cache to find the two updates we will be using for interpolation
    for(var i = 0; i < this.update_cache.length; i++){ 
        
        
        // If time_received is older than 500ms remove update from array and continue to next update
        if(current_render_time - this.update_cache[i].received > .5){ //console.log('got here2');
            this.update_cache.splice(i, 1);
            i--;
            continue;
        }
        
        
        
        // If peer_render_time is between the two updates in question assign to update1 & update2
        // otherwise continue to the next update
        if((typeof this.update_cache[i + 1] !== 'undefined') && peer_render_time >= this.update_cache[i].received && 
                peer_render_time <= this.update_cache[i + 1].received){
            
            this.previous_lerp_update = this.update_cache[i].update;
            this.next_lerp_update = this.update_cache[i + 1].update;
            break;
            
        } else {
            
            continue;
            
        }
        
    }
    
//    console.log(JSON.stringify(update1));
//    console.log(JSON.stringify(update2));
    
    
    // If we have made it this far then we either have update values or update values do not yet exist.
    // If we make it into this if statement then we can now interpolate the peer's position
    if(this.previous_lerp_update !== null && this.next_lerp_update !== null){
        
//        this.physics_state.position.copy(this.mesh.position);
//        this.physics_state.quaternion.copy(this.mesh.quaternion);
        
        var update1_position = new THREE.Vector3();
        update1_position.set(this.previous_lerp_update.position.x, this.previous_lerp_update.position.y, this.previous_lerp_update.position.z);
        var update2_position = new THREE.Vector3();
        update2_position.set(this.next_lerp_update.position.x, this.next_lerp_update.position.y, this.next_lerp_update.position.z);
        this.render_state.position.lerpVectors(update1_position, update2_position, render_delta / .01);
        
        this.mesh.position.copy(this.render_state.position);
        this.billboard.position.copy(this.render_state.position);
        
        var update1_quat = new THREE.Quaternion(this.previous_lerp_update.quat.x, this.previous_lerp_update.quat.y,
        this.previous_lerp_update.quat.z, this.previous_lerp_update.quat.w);
        
        var update2_quat = new THREE.Quaternion(this.next_lerp_update.quat.x, this.next_lerp_update.quat.y,
        this.next_lerp_update.quat.z, this.next_lerp_update.quat.w);
        
        var renderQuat = new THREE.Quaternion();
        THREE.Quaternion.slerp(update1_quat, update2_quat, renderQuat, render_delta / .01);
        this.mesh.quaternion.copy(renderQuat);
        
        // Call animate here
        this.animate(current_client_position, render_delta);
        
    }
    
    console.log(this.mesh.position);
    
};

Peer.prototype.animate = function(client_position, delta){

    var animation_speed = 1000 * delta;
    
    var view = new THREE.Vector3();
    view.subVectors(client_position, this.mesh.position);

    var inverse = this.mesh.quaternion.clone();
    inverse.inverse();

    view.applyQuaternion(inverse);

    var angle = Math.round(Math.atan2(view.x, view.z) * 4/Math.PI);

    if(angle === 0 || angle === -0){// North
        this.billboard.material.map = this.textures.n;
        this.billboard.needsUpdate = true;
        this.animations.n.update(animation_speed);
    }
    else if(angle === -1){// Northwest
        this.billboard.material.map = this.textures.nw;
        this.billboard.needsUpdate = true;
        this.animations.nw.update(animation_speed);
    }
    else if(angle === -2){// West
        this.billboard.material.map = this.textures.w;
        this.billboard.needsUpdate = true;
        this.animations.w.update(animation_speed);
    }
    else if(angle === -3){// Southwest
        this.billboard.material.map = this.textures.sw;
        this.billboard.needsUpdate = true;
        this.animations.sw.update(animation_speed);
    }
    else if(angle === 4 || angle === -4){// South
        this.billboard.material.map = this.textures.s;
        this.billboard.needsUpdate = true;
        this.animations.s.update(animation_speed);
    }
    else if(angle === 3){// Southeast
        this.billboard.material.map = this.textures.se;
        this.billboard.needsUpdate = true;
        this.animations.se.update(animation_speed);
    }
    else if(angle === 2){// East
        this.billboard.material.map = this.textures.e;
        this.billboard.needsUpdate = true;
        this.animations.e.update(animation_speed);
    }
    else if(angle === 1){// Northeast
        this.billboard.material.map = this.textures.ne;
        this.billboard.needsUpdate = true;
        this.animations.ne.update(animation_speed);
    }

    this.billboard.lookAt(client_position);


};