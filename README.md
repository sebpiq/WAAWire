WAAConnector
==============

More flexible audio node connections and disconnections.

"polyfill" for the newly specified `disconnect([destination, [output, [input]]])` which allows to disconnect a single connection for an AudioNode. This is not stricly a polyfill, as you still have to use the API through a `WAAConnector` instance.

Connect / disconnect a node at a precise time in the future
