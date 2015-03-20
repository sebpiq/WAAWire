var assert = require('assert')
  , utils = require('waatest').utils
  , WAAOffset = require('waaoffset')
  , WAAConnector = require('../index')

var generateBuffer = function(context) {
  var buffer = context.createBuffer(2, 10, context.sampleRate)
  for (var ch = 0; ch < buffer.numberOfChannels; ch++)
    for (var i = 0; i < buffer.length; i++)
      buffer.getChannelData(ch)[i] = (ch + 1) * 0.11
  return buffer
}

describe('WAAConnector', function() {
  
  describe('connect', function() {

    it('should connect the node at the given time', function(done) {
      var offsetNode, connector
      utils.expectSamples(
        function(context) {
          offsetNode = new WAAOffset(context)
          connector = new WAAConnector(context, offsetNode)
          offsetNode.offset.setValueAtTime(0.88, 0)
          connector.connect(5 * 1 / 44100, context.destination, 0, 0)
        },
        [
          [0, 0, 0, 0, 0, 0.88, 0.88, 0.88, 0.88, 0.88],
          [0, 0, 0, 0, 0, 0.88, 0.88, 0.88, 0.88, 0.88]
        ],
        done
      )
    })

    it('should work with AudioParam', function(done) {
      var modulator, carrier, gainNode, connector
      utils.expectSamples(
        function(context) {
          gainNode = context.createGain()
          gainNode.connect(context.destination)
          
          modulator = new WAAOffset(context)
          modulator.offset.setValueAtTime(0.11, 0)
          connector = new WAAConnector(context, modulator)

          carrier = new WAAOffset(context)
          carrier.connect(gainNode)
          carrier.offset.setValueAtTime(2, 0)

          connector.connect(5 * 1 / 44100, gainNode.gain, 0, 0)
          gainNode.gain.setValueAtTime(0, 5 * 1 / 44100)
        },
        [
          [2, 2, 2, 2, 2, 0.22, 0.22, 0.22, 0.22, 0.22],
          [2, 2, 2, 2, 2, 0.22, 0.22, 0.22, 0.22, 0.22]
        ],
        done
      )
    })

  })

  describe('disconnect', function() {

    it('should close the given connection at the given time', function(done) {
      var bufferNode, channelSplitter, channelMerger, connector
      utils.expectSamples(
        function(context) {
          channelSplitter = context.createChannelSplitter(2)
          channelMerger = context.createChannelMerger(2)
          channelMerger.connect(context.destination)

          bufferNode = context.createBufferSource()
          bufferNode.buffer = generateBuffer(context)
          bufferNode.connect(channelSplitter)
          bufferNode.start(0)

          connector = new WAAConnector(context, channelSplitter)
          connector.connect(2 * 1 / 44100, channelMerger, 0, 0)
          connector.connect(4 * 1 / 44100, channelMerger, 1, 1)

          connector.disconnect(8 * 1 / 44100, channelMerger, 0, 0)
        },
        [
          [0, 0, 0.11, 0.11, 0.11, 0.11, 0.11, 0.11, 0, 0],
          [0, 0, 0, 0, 0.22, 0.22, 0.22, 0.22, 0.22, 0.22]
        ],
        done
      )
    })

    it('should close all connections for the given destination', function(done) {
      var bufferNode, channelSplitter, channelMerger, connector
      utils.expectSamples(
        function(context) {
          channelSplitter = context.createChannelSplitter(2)
          channelMerger = context.createChannelMerger(2)
          channelMerger.connect(context.destination)

          bufferNode = context.createBufferSource()
          bufferNode.buffer = generateBuffer(context)
          bufferNode.connect(channelSplitter)
          bufferNode.start(0)

          connector = new WAAConnector(context, channelSplitter)
          connector.connect(2 * 1 / 44100, channelMerger, 0, 0)
          connector.connect(4 * 1 / 44100, channelMerger, 1, 1)

          connector.disconnect(8 * 1 / 44100, channelMerger)
        },
        [
          [0, 0, 0.11, 0.11, 0.11, 0.11, 0.11, 0.11, 0, 0],
          [0, 0, 0, 0, 0.22, 0.22, 0.22, 0.22, 0, 0]
        ],
        done
      )
    })

    it('should be possible to close the connection directly', function(done) {
      var offsetNode, connector, connection
      utils.expectSamples(
        function(context) {
          offsetNode = new WAAOffset(context)
          connector = new WAAConnector(context, offsetNode)
          offsetNode.offset.setValueAtTime(0.88, 0)
          connector.connect(5 * 1 / 44100, context.destination, 0, 0).close(8 * 1 / 44100)
        },
        [
          [0, 0, 0, 0, 0, 0.88, 0.88, 0.88, 0, 0],
          [0, 0, 0, 0, 0, 0.88, 0.88, 0.88, 0, 0]
        ],
        done
      )
    })

    it('should disconnect also AudioParam', function(done) {
      var modulator, carrier, gainNode, connector
      utils.expectSamples(
        function(context) {
          gainNode = context.createGain()
          gainNode.connect(context.destination)
          
          modulator = new WAAOffset(context)
          modulator.offset.setValueAtTime(0.11, 0)
          connector = new WAAConnector(context, modulator)

          carrier = new WAAOffset(context)
          carrier.connect(gainNode)
          carrier.offset.setValueAtTime(2, 0)

          connector.connect(5 * 1 / 44100, gainNode.gain, 0, 0)
          gainNode.gain.setValueAtTime(0, 5 * 1 / 44100)

          connector.disconnect(8 * 1 / 44100, gainNode.gain, 0, 0)
          gainNode.gain.setValueAtTime(1, 8 * 1 / 44100)
        },
        [
          [2, 2, 2, 2, 2, 0.22, 0.22, 0.22, 2, 2],
          [2, 2, 2, 2, 2, 0.22, 0.22, 0.22, 2, 2]
        ],
        done
      )
    })


  })

  describe('_getConnections', function() {

    it('should add new connection if it doesnt exist', function() {
      var dummySource = {}
        , dummyDestination1 = {}
        , dummyDestination2 = {}
        , connector = new WAAConnector(null, dummySource)
        , connection1, connection2

      assert.equal(connector._connections.length, 0)

      // Create a new connection
      connection1 = connector._getConnections(dummyDestination1, 0, 1, true)[0]
      assert.equal(connector._connections.length, 1)
      assert.equal(connector._connections[0].destination, dummyDestination1)
      assert.deepEqual(connector._connections[0].ports, [connection1])

      // Add the same connection again (same instance is returned)
      assert.equal(connector._getConnections(dummyDestination1, 0, 1, true)[0], connection1)
      assert.equal(connector._connections.length, 1)
      assert.deepEqual(connector._connections[0].ports, [connection1])
      assert.ok(connection1._isNew())

      // Create a new connection with different ports
      connection2 = connector._getConnections(dummyDestination1, 1, 1, true)[0]
      assert.equal(connector._connections.length, 1)
      assert.equal(connector._connections[0].ports.length, 2)
      assert.deepEqual(connector._connections[0].ports, [connection1, connection2])

      // Create a new connection with different destination
      connection1 = connector._getConnections(dummyDestination2, 0, 0, true)[0]
      assert.equal(connector._connections.length, 2)
      assert.equal(connector._connections[1].destination, dummyDestination2)
      assert.deepEqual(connector._connections[1].ports, [connection1])
    })

    it('should return all queried connections', function() {
      var dummySource = {}
        , dummyDestination1 = {}
        , dummyDestination2 = {}
        , connector = new WAAConnector(null, dummySource)
        , connection1, connection2, connection3, connection4, connection5

      assert.equal(connector._connections.length, 0)

      // Create connections
      connection1 = connector._getConnections(dummyDestination1, 0, 0, true)[0]
      connection2 = connector._getConnections(dummyDestination1, 0, 1, true)[0]
      connection3 = connector._getConnections(dummyDestination1, 1, 0, true)[0]

      connection4 = connector._getConnections(dummyDestination2, 0, 0, true)[0]
      connection5 = connector._getConnections(dummyDestination2, 1, 1, true)[0]

      // Query connections by destination
      assert.deepEqual(connector._getConnections(dummyDestination1), 
        [connection1, connection2, connection3])
      assert.deepEqual(connector._getConnections(dummyDestination2),
        [connection4, connection5])

      // Query output
      assert.deepEqual(connector._getConnections(null, 0), 
        [connection1, connection2, connection4])
      assert.deepEqual(connector._getConnections(null, 1),
        [connection3, connection5])

      // Query input
      assert.deepEqual(connector._getConnections(null, null, 0), 
        [connection1, connection3, connection4])
      assert.deepEqual(connector._getConnections(null, null, 1),
        [connection2, connection5])

      // Compound queries
      assert.deepEqual(connector._getConnections(dummyDestination1, null, 0), 
        [connection1, connection3])
      assert.deepEqual(connector._getConnections(dummyDestination1, 0, null),
        [connection1, connection2])
    })


  })

})