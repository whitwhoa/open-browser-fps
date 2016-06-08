// =============================================================================
//  Peer object
// =============================================================================

var THREE = require('three');


var Peer = function() {
    
    this.id = null;
    this.last_processed_input = null;
  
    this.pitchObject = new THREE.Object3D();
    this.yawObject = new THREE.Object3D();
    
    this.yawObject.position.y = 10;
    this.yawObject.add(this.pitchObject);
    
    this.mouseX = 0;
    this.mouseY = 0;
    this.previousMouseX = 0;
    this.previousMouseY = 0;
  
    this.velocity = new THREE.Vector3();
    this.obj = new THREE.Object3D();
    this.obj = this.yawObject;
  
    this.jump = false;
    
};

Peer.prototype.applyInput = function(input){
    
    var dt = .01; // set to client physics refresh rate
    
//    // Apply quaternion and rotation
//    this.obj.quaternion.set(input.quat.x, input.quat.y, input.quat.z, input.quat.w);
    
    if(input.jump){
        this.velocity.y += 350;
        this.jump = false;
    }
    
    this.velocity.x -= this.velocity.x * 10.0 * dt;
    this.velocity.z -= this.velocity.z * 10.0 * dt;
    this.velocity.y -= 9.8 * 100.0 * dt; // 100.0 = mass

    if ( input.key_up ) this.velocity.z -= 600.0 * dt;
    if ( input.key_down ) this.velocity.z += 600.0 * dt;
    if ( input.key_left ) this.velocity.x -= 600.0 * dt;
    if ( input.key_right ) this.velocity.x += 600.0 * dt;
    
    // Rotation
    if(input.mouseX !== this.previousMouseX){
        this.yawObject.rotation.y -= input.mouseX * (Math.abs(this.yawObject.rotation.x) < (Math.PI / 2) ? 0.003 : -0.003);
        this.previousMouseX = input.mouseX;
    }
    if(input.mouseY !== this.previousMouseY){
        this.pitchObject.rotation.x -= input.mouseY * 0.003;
        this.previousMouseY = input.mouseY;
    }
    this.pitchObject.rotation.x = Math.max(-(Math.PI / 2), Math.min(Math.PI / 2, this.pitchObject.rotation.x));
    
    // Position
    this.obj.translateX( this.velocity.x * dt );
    this.obj.translateY( this.velocity.y * dt );
    this.obj.translateZ( this.velocity.z * dt );
    
    // Jump
    if ( this.obj.position.y < 10 ) {
        this.velocity.y = 0;
        this.obj.position.y = 10;
    }
    
};

module.exports = Peer;