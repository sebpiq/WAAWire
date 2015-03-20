var assert = require('assert')
  , utils = require('waatest').utils
  , WAAOffset = require('waaoffset')
  , WAAWire = require('../index')

var generateBuffer = function(context) {
  var buffer = context.createBuffer(2, 10, context.sampleRate)
  for (var ch = 0; ch < buffer.numberOfChannels; ch++)
    for (var i = 0; i < buffer.length; i++)
      buffer.getChannelData(ch)[i] = (ch + 1) * 0.11
  return buffer
}

describe('WAAWire', function() {
  
  describe('connect', function() {

    it('should just connect the node straight away', function(done) {
      var offsetNode, connector
      utils.expectSamples(
        function(context) {
          offsetNode = new WAAOffset(context)
          connector = new WAAWire(context)
          offsetNode.offset.setValueAtTime(0.88, 0)
          connector.connect(offsetNode, context.destination)
        },
        [
          [0.88, 0.88, 0.88, 0.88, 0.88, 0.88, 0.88, 0.88, 0.88, 0.88],
          [0.88, 0.88, 0.88, 0.88, 0.88, 0.88, 0.88, 0.88, 0.88, 0.88]
        ],
        done
      )
    })

    it('should connect the node at the given time', function(done) {
      var offsetNode, connector
      utils.expectSamples(
        function(context) {
          offsetNode = new WAAOffset(context)
          connector = new WAAWire(context)
          offsetNode.offset.setValueAtTime(0.88, 0)
          connector.atTime(5 * 1 / 44100).connect(offsetNode, context.destination)
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
          connector = new WAAWire(context)

          carrier = new WAAOffset(context)
          carrier.connect(gainNode)
          carrier.offset.setValueAtTime(2, 0)

          connector.atTime(5 * 1 / 44100).connect(modulator, gainNode.gain)
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

  describe('swapSource', function() {

    it('should swap the node at the given time', function(done) {
      var offsetNode1, offsetNode2, connector
      utils.expectSamples(
        function(context) {
          offsetNode1 = new WAAOffset(context)
          offsetNode2 = new WAAOffset(context)
          connector = new WAAWire(context)
          offsetNode1.offset.setValueAtTime(0.88, 0)
          offsetNode2.offset.setValueAtTime(0.33, 0)
          connector.atTime(5 * 1 / 44100).connect(offsetNode1, context.destination)
          connector.atTime(7 * 1 / 44100).swapSource(offsetNode2)
        },
        [
          [0, 0, 0, 0, 0, 0.88, 0.88, 0.33, 0.33, 0.33],
          [0, 0, 0, 0, 0, 0.88, 0.88, 0.33, 0.33, 0.33]
        ],
        done
      )
    })

  })

  describe('swapDestination', function() {

    it('should swap the node at the given time', function(done) {
      var offsetNode, gainNode1, gainNode2, connector
      utils.expectSamples(
        function(context) {
          offsetNode = new WAAOffset(context)
          offsetNode.offset.setValueAtTime(0.11, 0)

          gainNode1 = context.createGain()
          gainNode1.gain.value = 2
          gainNode1.connect(context.destination)
          gainNode2 = context.createGain()
          gainNode2.gain.value = 3
          gainNode2.connect(context.destination)
          
          connector = new WAAWire(context)
          connector.connect(offsetNode, gainNode1)
          connector.atTime(7 * 1 / 44100).swapDestination(gainNode2)
        },
        [
          [0.22, 0.22, 0.22, 0.22, 0.22, 0.22, 0.22, 0.33, 0.33, 0.33],
          [0.22, 0.22, 0.22, 0.22, 0.22, 0.22, 0.22, 0.33, 0.33, 0.33]
        ],
        done
      )
    })

  })

  describe('close', function() {

    it('should close the connection at the given time', function(done) {
      var bufferNode, channelSplitter, channelMerger, connector1, connector2 
      utils.expectSamples(
        function(context) {
          channelSplitter = context.createChannelSplitter(2)
          channelMerger = context.createChannelMerger(2)
          channelMerger.connect(context.destination)

          bufferNode = context.createBufferSource()
          bufferNode.buffer = generateBuffer(context)
          bufferNode.connect(channelSplitter)
          bufferNode.start(0)

          connector1 = new WAAWire(context)
          connector2 = new WAAWire(context)

          connector1.atTime(2 * 1 / 44100).connect(channelSplitter, channelMerger, 0, 0)
          connector2.atTime(4 * 1 / 44100).connect(channelSplitter, channelMerger, 1, 1)

          connector1.atTime(8 * 1 / 44100).close()
        },
        [
          [0, 0, 0.11, 0.11, 0.11, 0.11, 0.11, 0.11, 0, 0],
          [0, 0, 0, 0, 0.22, 0.22, 0.22, 0.22, 0.22, 0.22]
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
          connector = new WAAWire(context)

          carrier = new WAAOffset(context)
          carrier.connect(gainNode)
          carrier.offset.setValueAtTime(2, 0)

          connector.atTime(5 * 1 / 44100).connect(modulator, gainNode.gain, 0, 0)
          gainNode.gain.setValueAtTime(0, 5 * 1 / 44100)

          connector.atTime(8 * 1 / 44100).close()
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

})