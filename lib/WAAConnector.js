var WAAConnector = module.exports = function(context, source) {
  this.context = context
  this._source = source
  this._connections = []
  this._disconnected = []
}

WAAConnector.prototype.connect = function(time, destination, output, input) {
  this._cleanDisconnected()

  output = output || 0
  input = input || 0

  var connection = this._getConnection(destination, output, input, true)
    , gainNode

  if (!connection._isNew()) return connection

  gainNode = this.context.createGain()
  gainNode.gain.setValueAtTime(0, 0)
  this._source.connect(gainNode, output)
  gainNode.connect(destination, 0, input)
  gainNode.gain.setValueAtTime(1, time)
  connection._init(gainNode)
}

WAAConnector.prototype.disconnect = function(time, destination, output, input) {
  this._cleanDisconnected()
  var connection = this._getConnection(destination, output, input)
  if (connection) {
    connection.close(time)
    this._disconnected.push(connection)
  }
}

// Returns the queried connection or `null` if it doesn't exist. 
// If it doesn't exist and `addNew` is true, a new connection is added and returned. 
WAAConnector.prototype._getConnection = function(destination, output, input, addNew) {
  addNew = addNew || false
  var i, length, destData, connection
  
  // Find if there is already connections for that destination
  for (i = 0, length = this._connections.length; i < length; i++)
    if (this._connections[i].destination === destination) break
  
  // Otherwise add a new object to store these connections
  if (i === this._connections.length)
    this._connections.push({ destination: destination, ports: [] })
  destData = this._connections[i]

  // Now find if the connection output -> input already exists
  for (i = 0, length = destData.ports.length; i < length; i++) {
    connection = destData.ports[i]
    if (connection.output === output && connection.input === input) break
  }

  // Finally, either create the connection or return the existing one
  if (i === destData.ports.length) {
    if (addNew === true) {
      connection = new _Connection(this._source, destination, output, input)
      destData.ports.push(connection)
    } else return null
  }
  return connection

}

// Should be called regularily to clean connections that have been disconnected
WAAConnector.prototype._cleanDisconnected = function() {
  var self = this
  this._disconnected.slice(0).forEach(function(connection) {
    if (connection._closed === true && connection._gainNode.value === 0) {
      connection._clean()
      var id = self._disconnected.indexOf(connection)
      self._disconnected.splice(id, 1)
    }
  })
}

var _Connection = function(source, destination, output, input) {
  this.source = source
  this.destination = destination
  this.output = output
  this.input = input
  this._gainNode = null
  this._closed = false
}

_Connection.prototype.close = function(time) {
  if (this._closed === true) return 
  this._gainNode.gain.setValueAtTime(0, time)
  this._closed = true
}

_Connection.prototype._init = function(gainNode) {
  this._gainNode = gainNode
}

_Connection.prototype._isNew = function() {
  return this._gainNode === null
}

// TODO : should also disconnect source from gainNode to allow garbage collection
// https://github.com/WebAudio/web-audio-api/issues/6
_Connection.prototype._clean = function() {
  this._gainNode.disconnect()
  this._gainNode = null
}