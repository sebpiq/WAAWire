var isNumber = require('lodash.isnumber')

var WAAConnector = module.exports = function(context, source) {
  this.context = context
  this._source = source
  this._connections = []
  this._disconnected = []
  this._atTime = 0
}

WAAConnector.prototype.connect = function(destination, output, input) {
  var connection = this._connect(this._atTime, destination, output, input)
  this._atTime = 0
  return connection
}

WAAConnector.prototype.disconnect = function(destination, output, input) {
  this._disconnect(this._atTime, destination, output, input)
  this._atTime = 0
}

WAAConnector.prototype.atTime = function(time) {
  this._atTime = time
  return this
} 

WAAConnector.prototype._connect = function(time, destination, output, input) {
  this._cleanDisconnected()

  output = output || 0
  input = input || 0

  var connection = this._getConnections(destination, output, input, true)[0]
    , gainNode
  if (!connection._isNew()) return connection

  gainNode = this.context.createGain()
  gainNode.gain.setValueAtTime(0, 0)
  this._source.connect(gainNode, output)
  if (destination instanceof AudioParam)
    gainNode.connect(destination, 0)
  else gainNode.connect(destination, 0, input)
  gainNode.gain.setValueAtTime(1, time)
  connection._init(gainNode)
  return connection
}

WAAConnector.prototype._disconnect = function(time, destination, output, input) {
  var self = this
  this._cleanDisconnected()

  var connections = this._getConnections(destination, output, input)
  connections.forEach(function(connection) { connection.close(time) })
}

// Returns the queried connection or `null` if it doesn't exist. 
// If it doesn't exist and `addNew` is true, a new connection is added and returned. 
WAAConnector.prototype._getConnections = function(destination, output, input, addNew) {
  addNew = addNew || false
  var i, length, destDatas = [], connections = []
  
  // Collect `destDatas` that fit the query
  this._connections.forEach(function(destData) {
    if ((!destination) || destData.destination === destination)
      destDatas.push(destData)
  })

  // Insert connections object for `destination` if missing and `addNew` is `true` 
  if (destDatas.length === 0) {
    if (addNew === true && destination) {
      destDatas = [{ destination: destination, ports: [] }]
      this._connections.push(destDatas[0])
    } else return []
  }

  // Collect connections `input` -> `output` that fit the query
  destDatas.forEach(function(destData) {
    destData.ports.forEach(function(connection) {
      if (((!isNumber(output)) || connection.output === output) 
        && ((!isNumber(input)) || connection.input === input)) connections.push(connection)
    })
  })

  // If the connection if fully caracterized, but it doesn't exist
  // and `addNew` is `true`, we create it
  if (connections.length === 0) {
    if (addNew === true && destination && isNumber(output) && isNumber(output)) {
      connections = [new _Connection(this, this._source, destination, output, input)]
      destDatas[0].ports.push(connections[0])
    }
  }

  return connections

}

// Returns the queried connection or `null` if it doesn't exist. 
// If it doesn't exist and `addNew` is true, a new connection is added and returned. 
WAAConnector.prototype._getConnection2 = function(destination, output, input, addNew) {
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

var _Connection = function(connector, source, destination, output, input) {
  this.connector = connector
  this.source = source
  this.destination = destination
  this.output = output
  this.input = input
  this._gainNode = null
  this._closed = false
}

_Connection.prototype.close = function(time) {
  if (this._closed === true) return
  this.connector._disconnected.push(this)
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