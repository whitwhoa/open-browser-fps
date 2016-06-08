// =============================================================================
//  Message queue.
// =============================================================================
var Queue = function() {
    this.updates = [];
};

Queue.prototype.send = function(update, time) {
    this.updates.push({time_received:time,payload:update});
};

Queue.prototype.receive = function() {
  for (var i = 0; i < this.updates.length; i++) {
      var update = this.updates[i];
      this.updates.splice(i, 1);
      return update;
  }
};