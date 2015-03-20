var assert = require('assert')
  , utils = require('waatest').utils
  , WAAOffset = require('waaoffset')
  , WAAConnector = require('../index')

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

  })

  describe('disconnect', function() {

    it('should close the connection at the given time', function(done) {
      var offsetNode, connector
      utils.expectSamples(
        function(context) {
          offsetNode = new WAAOffset(context)
          connector = new WAAConnector(context, offsetNode)
          offsetNode.offset.setValueAtTime(0.88, 0)
          connector.connect(5 * 1 / 44100, context.destination, 0, 0)
          connector.disconnect(8 * 1 / 44100, context.destination, 0, 0)
        },
        [
          [0, 0, 0, 0, 0, 0.88, 0.88, 0.88, 0, 0],
          [0, 0, 0, 0, 0, 0.88, 0.88, 0.88, 0, 0]
        ],
        done
      )
    })

  })

  describe('_getConnection', function() {

    it('should add new connection if it doesnt exist', function() {
      var dummySource = {}
        , dummyDestination1 = {}
        , dummyDestination2 = {}
        , connector = new WAAConnector(null, dummySource)
        , connection1, connection2

      assert.equal(connector._connections.length, 0)

      // Create a new connection
      connection1 = connector._getConnection(dummyDestination1, 0, 1, true)
      assert.equal(connector._connections.length, 1)
      assert.equal(connector._connections[0].destination, dummyDestination1)
      assert.deepEqual(connector._connections[0].ports, [connection1])

      // Add the same connection again (same instance is returned)
      assert.equal(connector._getConnection(dummyDestination1, 0, 1, true), connection1)
      assert.equal(connector._connections.length, 1)
      assert.deepEqual(connector._connections[0].ports, [connection1])
      assert.ok(connection1._isNew())

      // Create a new connection with different ports
      connection2 = connector._getConnection(dummyDestination1, 1, 1, true)
      assert.equal(connector._connections.length, 1)
      assert.equal(connector._connections[0].ports.length, 2)
      assert.deepEqual(connector._connections[0].ports, [connection1, connection2])

      // Create a new connection with different destination
      connection1 = connector._getConnection(dummyDestination2, 0, 0, true)
      assert.equal(connector._connections.length, 2)
      assert.equal(connector._connections[1].destination, dummyDestination2)
      assert.deepEqual(connector._connections[1].ports, [connection1])
    })

  })

})