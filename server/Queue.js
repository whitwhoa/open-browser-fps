// =============================================================================
//  Message queue.
// =============================================================================
var Queue = function() {
  this.updates = [];
};

Queue.prototype.receive = function() {
  for (var i = 0; i < this.updates.length; i++) {
      var update = this.updates[i];
      this.updates.splice(i, 1);
      return update;
  }
};

module.exports = Queue;