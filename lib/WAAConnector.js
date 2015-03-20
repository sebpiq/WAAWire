var WAAConnector = module.exports = function(context) {
  this.context = context
  
  this._source = null
  this._output = null
  this._destination = null
  this._input = null

  this._gainNode = null
  this._discardedGainNode = null

  this._atTime = 0
  this._closed = false
}

var _withTimeArg = function(methName) {
  return function() {
    // Is that the best place to _clean ?
    this._clean()
    this[methName].apply(this, [this._atTime].concat([].slice.call(arguments, 0)))
    this._atTime = 0
    return this
  }
}

WAAConnector.prototype.connect = _withTimeArg('_connect')
WAAConnector.prototype.swapSource = _withTimeArg('_swapSource')
WAAConnector.prototype.swapDestination = _withTimeArg('_swapDestination')
WAAConnector.prototype.close = _withTimeArg('_close')

WAAConnector.prototype.atTime = function(time) {
  this._atTime = time
  return this
} 

WAAConnector.prototype._connect = function(time, source, destination, output, input) {
  if (this._gainNode) throw new Error('Wire already connected')

  this._source = source
  this._destination = destination
  this._output = output || 0
  this._input = input || 0

  this._doConnections(time)
}

WAAConnector.prototype._swapSource = function(time, source, output) {
  this._discardedGainNode = this._gainNode
  this._discardedGainNode.gain.setValueAtTime(0, time)

  this._source = source
  this._output = output || 0

  this._doConnections(time)
}

WAAConnector.prototype._swapDestination = function(time, destination, input) {
  this._discardedGainNode = this._gainNode
  this._discardedGainNode.gain.setValueAtTime(0, time)

  this._destination = destination
  this._input = input || 0

  this._doConnections(time)
}

WAAConnector.prototype._close = function(time) {
  if (this._closed === true) throw new Error('Wire already closed')
  this._discardedGainNode = this._gainNode
  this._gainNode.gain.setValueAtTime(0, time)
  this._gainNode = null
  this._closed = true
}

WAAConnector.prototype._doConnections = function(time) {
  var gainNode = this.context.createGain()
  gainNode.gain.setValueAtTime(0, 0)
  gainNode.gain.setValueAtTime(1, time)
  this._gainNode = gainNode

  this._source.connect(gainNode, this._output)
  if (this._destination instanceof AudioParam)
    gainNode.connect(this._destination, 0)
  else gainNode.connect(this._destination, 0, this._input)
}

// Cleans discardedGain, if there is
WAAConnector.prototype._clean = function() {
  if (this._discardedGainNode && this._discardedGainNode.gain.value === 0) {
    this._discardedGainNode.disconnect()
    this._discardedGainNode = null
  }
}