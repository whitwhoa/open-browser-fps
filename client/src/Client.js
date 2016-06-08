// =============================================================================
//  The Client.
// =============================================================================
var Client = function(camera){
    
    this.id = null;
    
    this.pointerLockEnabled = false;
    this.pitchObject = new THREE.Object3D();
    this.yawObject = new THREE.Object3D();
    
    
    this.mouseX = 0;
    this.mouseY = 0;
    this.previousMouseX = 0;
    this.previousMouseY = 0;
    
    
    this.current_state = new THREE.Object3D();
    this.previous_state = new THREE.Object3D();

    
    
    this.key_left = false;
    this.key_right = false;
    this.key_up = false;
    this.key_down = false;
    this.jump = false;
    
    this.velocity = new THREE.Vector3();
    
    // Data needed for reconciliation.
    this.input_sequence_number = 0;
    this.pending_inputs = [];
    
    // Instantiate mouse pointer controls
    this.setPointerControls(camera);
    
        
};

Client.prototype.setPointerControls = function(camera){
  
    camera.rotation.set(0,0,0);
    
    this.pitchObject.add(camera);
    
    this.yawObject.position.y = 10;
    this.yawObject.add(this.pitchObject);
    
    // Set current_state to reference yawObject
    this.current_state = this.yawObject;
    
};

Client.prototype.getDirection = function(){
  
    var direction = new THREE.Vector3(0,0,-1);
    var rotation = new THREE.Euler(0,0,0, "XYZ");
    
    var v = new THREE.Vector3();
    rotation.set(this.pitchObject.rotation.x, this.yawObject.rotation.y, 0);
    v.copy(direction).applyEuler(rotation);
    
    return v;
    
};

Client.prototype.processInputs = function(socket, delta){
    
    var input = new Object;
    input.input_sequence_number = this.input_sequence_number++;
    input.id = this.id;
    
    if(this.key_up){
        input.key_up = true;
    } else {
        input.key_up = false;
    }
    
    if(this.key_down){
        input.key_down = true;
    } else {
        input.key_down = false;
    }
    
    if(this.key_left){
        input.key_left = true;
    } else {
        input.key_left = false;
    }
    
    if(this.key_right){
        input.key_right = true;
    } else {
        input.key_right = false;
    }
    
    if(this.jump && this.velocity.y === 0){
        input.jump = true;
    } else {
        input.jump = false;
    }
    
    input.mouseX = this.mouseX;
    input.mouseY = this.mouseY;
    
//    input.quat = {
//        x:this.current_state.quaternion.x,
//        y:this.current_state.quaternion.y,
//        z:this.current_state.quaternion.z,
//        w:this.current_state.quaternion.w
//    };
    
    // Send this input to the server for processing
    socket.emit('client_input', input);
    
    // Do client-side prediction.
    this.applyInput(input, delta);
    
    // Save this input for later reconciliation.
    this.pending_inputs.push(input);

};

Client.prototype.applyInput = function(input, delta){
  
    if(input.jump){
        this.velocity.y += 350;
        this.jump = false;
    }
    
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;
    this.velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    if ( input.key_up ) this.velocity.z -= 600.0 * delta;
    if ( input.key_down ) this.velocity.z += 600.0 * delta;
    if ( input.key_left ) this.velocity.x -= 600.0 * delta;
    if ( input.key_right ) this.velocity.x += 600.0 * delta;
    
    // Rotation
    if(this.mouseX !== this.previousMouseX){
        this.yawObject.rotation.y -= this.mouseX * (Math.abs(this.yawObject.rotation.x) < (Math.PI / 2) ? 0.003 : -0.003);
        this.previousMouseX = this.mouseX;
    }
    if(this.mouseY !== this.previousMouseY){
        this.pitchObject.rotation.x -= this.mouseY * 0.003;
        this.previousMouseY = this.mouseY;
    }
    this.pitchObject.rotation.x = Math.max(-(Math.PI / 2), Math.min(Math.PI / 2, this.pitchObject.rotation.x));
    
    // Position
    this.current_state.translateX( this.velocity.x * delta );
    this.current_state.translateY( this.velocity.y * delta );
    this.current_state.translateZ( this.velocity.z * delta );
    
    // Jump
    if ( this.current_state.position.y < 10 ) {
        this.velocity.y = 0;
        this.current_state.position.y = 10;
    }
        
};

Client.prototype.updateState = function(netObj){
    
    this.current_state.position.copy(netObj.position);
    this.current_state.quaternion.copy(netObj.quat);
    
};