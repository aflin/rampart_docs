The rampart-net module
======================

Preface
-------

Acknowledgment
~~~~~~~~~~~~~~

The rampart-net module makes extensive use of the 
`libevent2 <https://libevent.org/>`_ library embedded in 
the main rampart executable as well as the 
`OpenSSL <https://www.openssl.org/>`_ library, imported from
:ref:`the rampart-crypto module <rampart-crypto:The rampart-crypto module>`.
 
License
~~~~~~~

The rampart-net module is released under the MIT license.

What does it do?
~~~~~~~~~~~~~~~~

The rampart-net module allows the creation of network connections and
servers in a manner similar to (but with significant differences from)
`the node.js net module <https://nodejs.org/api/net.html>`_\ .

All of the callback functions in rampart-net are asynchronously executed in
rampart's event loop unless stated otherwise.

All functions return their parent object, for chainability, unless otherwise
stated.

Loading and Using the Module
----------------------------

Loading
~~~~~~~

Loading the module is a simple matter of using the ``require()`` function:

.. code-block:: javascript

    var net = require("rampart-net");


Socket Functions
----------------

new net.Socket()
~~~~~~~~~~~~~~~~  

    In order to make a tcp connection to a server, a new Socket object must
    be created.  The ``new net.Socket()`` statement returns functions to
    connect and communicate over tcp, with or without ssl/tls.
 
    Usage:

    .. code-block:: javascript
    
        var net = require("rampart-net");
        
        var socket = new net.Socket();

    Return Value:
        An object with the below listed function.

socket.connect()
~~~~~~~~~~~~~~~~

    Make a new tcp connection.

    Usage:

    .. code-block:: javascript
    
        var net = require("rampart-net");
        
        var socket = new net.Socket();

        socket.connect(options[, connect_callback]);

        /* or */

        socket.connect(port[, host][, connect_callback]); 

    Where:
    
    * ``port`` - Required. The port of the server to which a connection
      will be attempted.

    * ``host`` - The hostname or ip address of the server.  Default is
      ``127.0.0.1``.

    * ``connect_callback`` is a callback :green:`Function`` which is run
      after a connection is established and the "connect" event is emitted.

    * ``options`` is an :green:`Object` with the following optional
      properties:

        * ``port`` - Required.  A :green:`Number`.  The port of the server
          to which a connection will be attempted.

        * ``timeout`` - How long in milliseconds before a connection is
          terminated for inactivity (both read and write).  Default is
          forever.

        * ``family`` - A :green:`Number`. Must be ``0`` (the default), ``4``
          or ``6`` to specify any ip family, ipv4 only or ipv6 only
          respectively.  May be used if ``host`` above resolves to both
          ipv4 and ipv6 addresses to force the use of a particular one.

    	* ``keepalive`` - A :green:`Boolean`. If ``true`` set tcp keepalive
          on the connection.  Packets will be transparently sent to the
          server to aid in keeping the connection alive (should it be
          necessary).  See 
          `this document <https://tldp.org/HOWTO/TCP-Keepalive-HOWTO/overview.html>`_
          for more information.  Default is ``false``.

        * ``keepAliveInitialDelay`` - A :green:`Number`. How many seconds to
          wait before sending the first keepalive packet.  Has no effect
          unless ``keepalive`` above is ``true``. Default is ``1``.

        * ``keepAliveInterval`` - A :green:`Number`. How many seconds
          between sending keepalive packets. Has no effect
          unless ``keepalive`` above is ``true``.  Default is ``1``.

        * ``keepAliveCount`` - A :green:`Number`. How many keepalive packets
          should be sent with no reply before disconnecting.  Has no effect
          unless ``keepalive`` above is ``true``. Default is ``10``.

        * ``tls`` - A :green:`Boolean`.  Whether to use SSL/TLS for the
          connection.  Default is ``false``.

        * ``ssl`` - Same as ``tls``.  If both set, ``ssl`` is ignored.

        * ``insecure`` - A :green:`Boolean`.  Whether to skip verification
          of the server's credentials when making a connection over
          SSL/TLS.  The default is ``false`` (i.e. check credentials and
          fail the connection if the server's credentials are not
          verified).

        * ``cacert`` - A :green:`String`. The path to the CA certificate
          store file, required to verify the server when using SSL/TLS.  The 
          default is system dependent (usually ``/etc/ssl/cert.pem`` on
          MacOS or ``/etc/ssl/certs/ca-certificates.crt`` on Linux).

        * ``capath`` - A :green:`String`.  The path to the CA directory.  CA
          certificates need to be stored as individual PEM files in this
          directory.  No Default.

        * ``hostname`` - A :green:`String`. Name to use to verify the server
          if different than provided in ``host`` above or if ``host`` is a 
          numeric ip address.  No Default.

socket.write()
~~~~~~~~~~~~~~

    Write data to the server. The parameter can be a :green:`String` or a
    :green:`Buffer`.

    .. code-block:: javascript
    
        var net = require("rampart-net");
        
        var socket = new net.Socket();

        function mycallback(){
            // now connected, so we can write to server
            socket.write("hello world");
        }

        socket.on("connect", mycallback);

        socket.connect(port, host);

socket.on()
~~~~~~~~~~~

    Register a callback :green:`Function` to be run when an event on
    ``socket`` is emitted.

    Usage:

    .. code-block:: javascript
    
        var net = require("rampart-net");
        
        var socket = new net.Socket();

        socket.on(event, callback);

    Where:

    * ``event`` is one of the following possible events for a socket:

        * ``connect`` - emitted after a connection has been established.

        * ``data`` - emitted after data has been received on the socket.
          The provided function takes one argument, the data received
          in a :green:`Buffer`.

        * ``ready`` - For compatibility. Emitted immediately after
          "connect".

        * ``drain`` - emitted when data has been written.

        * ``end`` - emitted when disconnected by the server. Note: "close" 
          below will also be emitted.

        * ``timeout`` - emitted if the connection exceeds the provided
          timeout interval.  Note: "close" below will also be emitted.

        * ``close`` - emitted whenever a connection is terminated.

        * ``error``  - emitted upon error. Note: if no error callback is registered for a socket,
          rampart will throw an error instead.

    * ``callback`` is a function.  If ``error``, function will have its
      first parameter be the error object/message.  If ``data``, function
      will have its first parameter be the received data in a :green:`Buffer`.

socket.off()
~~~~~~~~~~~~

    Unregister a callback :green:`Function` previously registered with
    ``socket.on``.  Function must be a named function.

    Usage example:

    .. code-block:: javascript
    
        var net = require("rampart-net");
        
        var socket = new net.Socket();

        function mycallback(){
            ...
        }

        function finishcb(){
            this.off("connect", mycallback);
            this.off("close",   finishcb);
        }

        socket.on("connect", mycallback);

        ...

        socket.on("close", finishcb);

socket.once()
~~~~~~~~~~~~~

    Same as ``socket.on``, except the event will be removed after being
    called once.  This is equivalent to calling off at the beginning of a
    callback, except with once, the function may be anonymous (unnamed).

    Example:

    .. code-block:: javascript
    
        var net = require("rampart-net");
        
        var socket = new net.Socket();

        /*
            with on()

        function mycallback(){
            // 'socket' and 'this' are the same
            socket.off("connect", mycallback);
            ...
        }

        socket.on("connect", mycallback);

        */
        
        /* with once */
        
        socket.once("connect", function(){
            ...
        });
 
socket.destroy()
~~~~~~~~~~~~~~~~  

    Close the connection to server.  The "close" event is emitted upon
    the actual disconnect.

socket.setTimeout()
~~~~~~~~~~~~~~~~~~~ 

    Set a timeout and optional timeout event callback.  This is a shortcut
    for setting timeout value (in milliseconds) in ``socket.connect`` and a
    callback using ``socket.on("timeout", mytimeoutfunc)``.

    Usage example:

    .. code-block:: javascript
    
        var net = require("rampart-net");
        
        var socket = new net.Socket();
 
        function timedout(){
            console.log("connection timed out");
        }

        socket.setTimeout(5000, timedout); // five seconds

socket.setKeepAlive()
~~~~~~~~~~~~~~~~~~~~~ 

    Set keepalive on or off, or adjust settings at any point while the
    socket is connected.


    Usage:

    .. code-block:: javascript

        socket.setKeepAlive(enable[, initialDelay[, interval[, count]]]);

    Where ``enable`` is a :green:`Boolean` and the optional parameters are
    the same as in `socket.connect()`_\ .

socket.trigger()
~~~~~~~~~~~~~~~~~~~~~ 

    Trigger functions registered with `socket.on()`_ for a named event.

    Usage:

    .. code-block:: javascript

        socket.trigger(event[, argument]);

    Where ``event`` is a :green:`String`, the name of an event registered with
    `socket.on()`_\ , and ``argument`` is optionally an argument to pass to the
    registered callbacks for the event.

    Arbitarty events can be registered with `socket.on()`_\ , and then
    called with this function.

socket.bytesWritten
~~~~~~~~~~~~~~~~~~~

    A :green:`Number` - the number of bytes written to the server for the
    current connection.

socket.bytesRead
~~~~~~~~~~~~~~~~

    A :green:`Number` - the number of bytes read from the server for the
    current connection.

Other socket properties
~~~~~~~~~~~~~~~~~~~~~~~

    The ``socket`` :green:`Object` may include these possible status properties:

    * ``connecting`` - :green:`Boolean`. Whether the connection has been
      initiated, but not yet established.

    * ``connected`` - :green:`Boolean`. Whether the connection has been
      established.

    * ``tsl`` - :green:`Boolean`. Whether this is a secure connection.

    * ``destroyed`` - :green:`Boolean`. Whether this connection has been
      closed or destroyed.

    * ``pending`` - :green:`Boolean`. Whether a connection has not yet been
      attempted.  ``true`` before ``connect`` is called and after
      ``close`` and/or ``end`` event. ``false`` after connection
      is established.

    * ``readyState`` - :green:`String`.  "open" when connected, "opening"
      after ``socket.connect()`` is called and ``undefined`` after close or 
      before ``socket.connect()`` is called.

    * ``_events`` - :green:`Object`. Registered callbacks for events.

    * ``timeout`` - :green:`Number`. Timeout value, if set.

    * ``remoteAddress`` - :green:`String`.  IP address of the connected remote peer.

    * ``remotePort`` - :green:`Number`.  Port of the connected remote peer.

    * ``remoteFamily`` - :green:`String`.  IP version used for connection
      (``ipv4`` or ``ipv6``).

    * ``_hostPort`` - :green:`Number`. Same as ``remotePort``

    * ``_hostAddrs`` - :green:`Object`. Host address used for this connection
      returned from a call to `new net.Resolve()`_ by `socket.connect()`_ internally.

    * ``sslCipher`` - :green:`String`.  If ``tls`` is true, the name of the
      openssl cipher being used for this connection.

Socket Full Example
~~~~~~~~~~~~~~~~~~~

.. code-block:: javascript

    /* simulate a https request to google.com */
    rampart.globalize(rampart.utils);

    var net = require('rampart-net');

    var socket = new net.Socket();

    socket.on("connect", function(){
        console.log("CONNECTED");
        this.write("GET / HTTP/1.0\r\nHost: google.com\r\n\r\n");
    });

    socket.on("ready", function(){
        console.log("READY");
    });

    // http 1.0, server should disconnect us.
    socket.on('end', function() {
        console.log("END EVENT");;
    });

    /* just to demonstrate multiple callbacks */

    socket.on('data', function(data) {
        printf("\nlength=%d\n",data.length);
    });

    socket.on('data', function(data) {
        printf("\ncontent:\n%s\n",data);
    });

    socket.on('close', function() {
        printf("Close - written: %s, read: %s\n", this.bytesWritten, this.bytesRead);
    });

    socket.on('error', function(err) {
        console.log("ERROR:", err);
    });

    socket.on('timeout', function(){
        console.log("TIMEOUT")
    });

    socket.setTimeout(1000);

    // now actually connect
    socket.connect({
        host: "google.com",
        port: 443,
        tls: true
    });

    /* end of script, event loop started, connection made, callbacks executed */

    /*
        Expected results:
            CONNECTED
            READY

            length=703

            content:
            HTTP/1.0 301 Moved Permanently
            Location: https://www.google.com/
            Content-Type: text/html; charset=UTF-8
            Date: Thu, 07 Jul 2022 06:19:02 GMT
            Expires: Sat, 06 Aug 2022 06:19:02 GMT
            Cache-Control: public, max-age=2592000
            Server: gws
            Content-Length: 220
            X-XSS-Protection: 0
            X-Frame-Options: SAMEORIGIN
            Alt-Svc: h3=":443"; ma=2592000,h3-29=":443"; ma=2592000,h3-Q050=":443"; ma=2592000,h3-Q046=":443"; ma=2592000,h3-Q043=":443"; ma=2592000,quic=":443"; ma=2592000; v="46,43"

            <HTML><HEAD><meta http-equiv="content-type" content="text/html;charset=utf-8">
            <TITLE>301 Moved</TITLE></HEAD><BODY>
            <H1>301 Moved</H1>
            The document has moved
            <A HREF="https://www.google.com/">here</A>.
            </BODY></HTML>

            END EVENT
            Close - written: 36, read: 703
    */

Server Functions
----------------


new net.Server()
~~~~~~~~~~~~~~~~

    In order to listen for tcp connections from clients, a new Server object
    must be created.  The ``new net.Server()`` statement returns functions
    to listen and create sockets to communicate over tcp, with or without ssl/tls.

    Usage:

    .. code-block:: javascript
    
        var net = require("rampart-net");
        
        var server = new net.Server([options ][,connection_callback]);

    Where:

    * ``options`` is an :green:`Object` of options:

        * ``tls`` - AKA ``secure`` - a :green:`Boolean` - Whether to serve
          using ssl/tls. Default is ``false``.  If ``true``, the
          ``sslKeyFile`` and ``sslCertFile`` parameters must also be set.

        * ``sslKeyFile``: A :green:`String`, the location of the ssl key file for
          serving  over ssl/tls.  An example, if using 
          `letsencrypt <https://letsencrypt.org/>`_ for "example.com" might be
          ``"/etc/letsencrypt/live/example.com/privkey.pem"``.  This setting has
          no effect unless ``tls`` or ``secure`` is ``true``.

        * ``sslCertFile``: A :green:`String`, the location of the ssl cert file for
          serving over ssl/tls.  An example, if using 
          `letsencrypt <https://letsencrypt.org/>`_ for "example.com" might be
          ``"/etc/letsencrypt/live/example.com/fullchain.pem"``.  This setting has
          no effect unless ``tls`` or ``secure`` is ``true``.

        * ``sslMinVersion``:  A :green:`String`, the minimum SSL/TLS version to use. 
          Possible values are ``ssl3``, ``tls1``, ``tls1.1`` or ``tls1.2``.  The
          default is ``tls1.2``. This setting has no effect unless ``tls``
          or ``secure`` is ``true``.

    * ``connection_callback`` - a :green:`Function` - a callback executed when
      the ``connection`` event is emitted (when the server accepts a new
      connection).  The "connection" event calls registered functions with 
      a single parameter (the ``socket`` object, representing the socket
      connection to the client).
 
    Return Value:
        An object with the below listed function.

server.listen()
~~~~~~~~~~~~~~~

    Set server to listen on the given port, and optionally ip addresses.

    Usage:

    .. code-block:: javascript
    
        var net = require("rampart-net");
        
        var server = new net.Server([ [options ][,connection_callback]]);

         server.listen(port[, host[, backlog]][, listen_callback]);
         
         /* or */
         
         server.listen(options[, listen_callback]);

    Where:

    * ``port`` - A :green:`Number`. The port upon which to listen. Required.

    * ``host`` - A :green:`String` or :green:`Array` of :green:`Strings`. 
      Hosts and/or IP addresses to bind. Default is ``"any"``
      If unset or set to ``"any"``, it will bind all available IPV4 and IPV6 addresses.

    * ``backlog`` - A :green:`Number`. The maximum length of the queue of pending connections.
      Default is ``511``.

    * ``listen_callback`` - A :green:`Function`. A function to be executed
      when the "listening" event is emitted (when server starts listening).

    * ``options`` - An :green:`Object` with the following properties:

        * ``port`` - Same as above.

        * ``host`` - Same as above.

        * ``backlog`` - Same as above.

        * ``maxConnections`` - Same as `server.maxConnections()`_ below.

        * ``family`` - A :green:`Number`. Must be ``0`` (the default), ``4``
          or ``6`` to specify any ip family, ipv4 only or ipv6 only
          respectively.  May be used if ``host`` above resolves to both
          ipv4 and ipv6 addresses to force the use of a particular one.

server.on()
~~~~~~~~~~~

    Register a callback :green:`Function` to be run when an event on
    ``server`` is emitted.

    Usage:

    .. code-block:: javascript
    
        var net = require("rampart-net");
        
        var server = new net.Server();

        server.on(event, callback);

    Where:

    * ``event`` is one of the following possible events for a socket:

        * ``connection`` - emitted after a new connection has been established.
          The callback is provided a ``socket`` object, connected to the
          client.

        * ``listening`` - emitted after server has binds to the given port
          and is ready to accept connection.

        * ``close`` - emitted when the server is terminated.

        * ``error``  - emitted upon error. Note: if no error callback is registered for
          the server, rampart will throw an error instead.

    * ``callback`` is a function.  If ``error``, function will have its
      first parameter be the error object/message.  If ``data``, function
      will have its first parameter be the received data in a :green:`Buffer`.

server.off()
~~~~~~~~~~~~

    Unregister a callback :green:`Function` previously registered with
    ``server.on``.  Function must be a named function.

server.once()
~~~~~~~~~~~~~

    Same as ``server.on``, except the event will be removed after being called once. 
    This is equivalent to calling off at the beginning of the callback,
    except with ``once``, the function may be anonymous (unnamed).  See example for
    `socket.once()`_\ .

server.connectionCount()
~~~~~~~~~~~~~~~~~~~~~~~~

    Get the number of connected clients.
    
    Return Value:
        A :green:`Number`, the number of connected clients.

server.maxConnections()
~~~~~~~~~~~~~~~~~~~~~~~

    Set the maximum number of connections concurrently connected.  The
    server will drop new connections if this number is reached.
    This function can be called at any time to set or adjust the 
    connection limit.
   
    Usage:
    
    .. code-block:: javascript

        var net = require("rampart-net");

        var server = new net.Server();
        
        server.maxConnections([max]);

    Where ``max`` is a :green:`Number`, the maximum allowed connections. 
    Default is ``0`` (meaning no max) if no value is provided.  Setting to a
    number greater than 4,294,967,295 or less than 0 is equivalent to
    setting ``0``.  Actual system maximum number of connections varies by
    platform and settings.
    
Other server properties
~~~~~~~~~~~~~~~~~~~~~~~

    The ``server`` :green:`Object` may include these possible status properties:

    * ``listening`` - :green:`Boolean`. Whether the connection has been
      initiated, but not yet established.

    * ``_events`` - :green:`Object`. Registered callbacks for events.

    * ``tsl`` - :green:`Boolean`. Whether server accepts secure connections.

    * ``sslKeyFile`` - :green:`String`.  The SSL/TLS key file, if provided  

    * ``sslCertFil`` - :green:`String`.  The SSL/TLS cert file, if provided.

    * ``maxConnections`` - :green:`Number`. ``maxConnections`` value, if set.

    * ``_hostAddrs`` - :green:`Array` of :green:`Objects`.  Host addresses
      that the server is listening on as returned from a call to 
      `resolver.resolve()`_  by `server.listen()`_ internally.

    * ``_hostPort`` - :green:`Number`.  The port used by the server.

    * ``backlog`` - :green:`Number`. ``backlog`` value, if set, or the
      default of ``511``.

Server Full Example
~~~~~~~~~~~~~~~~~~~

    .. code-block:: javascript

        /* Simulate an https server, return request headers as text */
        rampart.globalize(rampart.utils);

        var net = require('rampart-net');

        var cert = "/etc/letsencrypt/live/example.com/fullchain.pem";
        var key =  "/etc/letsencrypt/live/example.com/privkey.pem";

        var nc=0;
        
        var server = new net.Server(
            {
                "secure":true,
                sslKeyFile:key,
                sslCertFile:cert
            },
            function(socket) {
                console.log("CONNECTED");

                /* assuming all request data will be provided in a single callback */
                socket.on('data', function(data){
                    var ind = bufferToString(data);
                    printf("connection %s, open connections %s\n", ++nc, server.connectionCount());
                    socket.write(
                        "HTTP/1.0 200 OK\r\n" +
                        "Content-type: text/plain\r\n" +
                        "Content-Length: " + ind.length + "\r\n\r\n"
                    );
                    socket.write(ind);
                    socket.destroy();
                })
                
                .on('end', function(){
                    console.log("peer ended connection ", this.remoteAddress);
                })
          
                .on('error', 
                    console.log
                )
                
                .on('close', function(){
                    console.log("closed connection to ", this.remoteAddress);
                });
            }
        );

        server.maxConnections(1200);

        server.on("error", function (err) {
            console.log("server err:",err);
        })

        .on("close", function () {
            console.log("server closed");
        })

        .on("listening", function(){
            printf("LISTENING. server properties:\n%3J\n", this);
        })

        .listen({
            port: 8888,
            maxConnections: 1200
        });
        
        /*
        Output upon Start:
            LISTENING. server properties:
            {
               "listening": true,
               "_events": {
                  "connection": {},
                  "error": {},
                  "close": {},
                  "listening": {}
               },
               "sslKeyFile": "/etc/letsencrypt/live/example.com/fullchain.pem",
               "sslCertFile": "/etc/letsencrypt/live/example.com/privkey.pem",
               "tls": true,
               "maxConnections": 1200,
               "_hostAddrs": [
                  {
                     "host": "0.0.0.0",
                     "ip4addrs": [
                        "0.0.0.0"
                     ],
                     "ip6addrs": [],
                     "ipaddrs": [
                        "0.0.0.0"
                     ],
                     "canonName": "0.0.0.0",
                     "ip": "0.0.0.0",
                     "ipv4": "0.0.0.0"
                  },
                  {
                     "host": "::",
                     "ip4addrs": [],
                     "ip6addrs": [
                        "::"
                     ],
                     "ipaddrs": [
                        "::"
                     ],
                     "canonName": "::",
                     "ip": "::",
                     "ipv6": "::"
                  }
               ],
               "_hostPort": 8888,
               "backlog": 511
            }

        Request:
            curl https://example.com:8888/

            GET / HTTP/1.1
            Host: example.com:8888
            User-Agent: curl/7.58.0
            Accept: * /*

        Output after request:
            CONNECTED
            connection 1, open connections 1
            closed connection to  2001:db8::1

        */


Resolve functions
-----------------

    The following functions are used to resolve a host name to one or more
    ip addresses.

new net.Resolve()
~~~~~~~~~~~~~~~~~

    Create a new resolve object.

    Usage:

    .. code-block:: javascript

        var net = require("rampart-net");

        var resolver = new net.Resolve();

resolver.resolve()
~~~~~~~~~~~~~~~~~~

    Resolve a host name to ip address.        

    Usage:

    .. code-block:: javascript

        var net = require("rampart-net");

        var resolver = new net.Resolve();

        resolver.resolve(host[, lookup_callback]);

    Where: 

    * ``host`` is a :green:`String` - the host name to be resolved.

    * ``lookup_callback`` is a :green:`Function` - an optional "lookup"
      event callback.

    NOTE:
        ``resolver.resolve()`` may be called multiple times at any time, however
        each time an **anonymous** function is provided as the
        ``lookup_callback``, that additional callback will be run for each
        "lookup" event. Note that duplicate **named** functions are only run
        once per event.

        .. code-block:: javascript

            var net = require("rampart-net");

            var resolver = new net.Resolve();

            /* console.log is run once per lookup */
            
            resolver.resolve("google.com", console.log);

            resolver.resolve("rampart.dev", console.log);

        In contrast:

        .. code-block:: javascript

            var net = require("rampart-net");

            var resolver = new net.Resolve();

            /* console.log is run TWICE per lookup since two different
             * functions call it.                                       */
            
            resolver.resolve("google.com", function(hobj){console.log(hobj);});

            resolver.resolve("rampart.dev", function(hobj){console.log(hobj);});

resolver.reverse()
~~~~~~~~~~~~~~~~~~

    Resolve an ip address to host name.        

    Usage:

    .. code-block:: javascript

        var net = require("rampart-net");

        var resolver = new net.Resolve();

        resolver.reverse(ip_addr[, lookup_callback]);

    Where: 

    * ``ip_addr`` is a :green:`String` - the ip address to look up.

    * ``lookup_callback`` is a :green:`Function` - an optional "lookup"
      event callback.

    NOTE:
        See above.  Note applies to ``resolver.reverse()`` as well.


resolver.on()
~~~~~~~~~~~~~

    Register a callback function for a resolver event.  Currently, the only
    event is ``lookup``.

    Usage example:

    .. code-block:: javascript

        var net = require("rampart-net");

        var resolver = new net.Resolve();

        resolver.on("lookup", function(hobj){
            printf("%3J\n", hobj);
        });

        resolver.resolve("rampart.dev");

        resolver.resolve("google.com");

        /* probable output:

            {
               "host": "google.com",
               "ip4addrs": [
                  "142.251.214.142"
               ],
               "ip6addrs": [
                  "2607:f8b0:4005:80f::200e"
               ],
               "ipaddrs": [
                  "142.251.214.142",
                  "2607:f8b0:4005:80f::200e"
               ],
               "ip": "142.251.214.142",
               "ipv4": "142.251.214.142",
               "ipv6": "2607:f8b0:4005:80f::200e"
            }
            {
               "host": "rampart.dev",
               "ip4addrs": [
                  "184.105.177.37"
               ],
               "ip6addrs": [
                  "2001:470:1:393::37"
               ],
               "ipaddrs": [
                  "184.105.177.37",
                  "2001:470:1:393::37"
               ],
               "ip": "184.105.177.37",
               "ipv4": "184.105.177.37",
               "ipv6": "2001:470:1:393::37"
            }
        */

net.resolve()
~~~~~~~~~~~~~

    Resolve a host name.  **This function is not asynchronous**.  The lookup
    will occur immediately, potentially before the event loop starts,
    and block further execution while waiting for an answer.

    Usage example:

    .. code-block:: javascript

        var net = require("rampart-net");

        var hostobj = net.resolve("yahoo.com");
        
        /* hostobj = 
            {
               "host": "yahoo.com",
               "ip4addrs": [
                  "74.6.231.21",
                  "98.137.11.164",
                  "98.137.11.163",
                  "74.6.143.26",
                  "74.6.231.20",
                  "74.6.143.25"
               ],
               "ip6addrs": [
                  "2001:4998:24:120d::1:0",
                  "2001:4998:44:3507::8000",
                  "2001:4998:44:3507::8001",
                  "2001:4998:124:1507::f000",
                  "2001:4998:24:120d::1:1",
                  "2001:4998:124:1507::f001"
               ],
               "ipaddrs": [
                  "2001:4998:24:120d::1:0",
                  "2001:4998:44:3507::8000",
                  "2001:4998:44:3507::8001",
                  "2001:4998:124:1507::f000",
                  "2001:4998:24:120d::1:1",
                  "2001:4998:124:1507::f001",
                  "74.6.231.21",
                  "98.137.11.164",
                  "98.137.11.163",
                  "74.6.143.26",
                  "74.6.231.20",
                  "74.6.143.25"
               ],
               "ip": "2001:4998:24:120d::1:0",
               "ipv6": "2001:4998:24:120d::1:0",
               "ipv4": "74.6.231.21"
            }

        */

net.reverse()
~~~~~~~~~~~~~

    Resolve an ip address to a hostname.  **This function is not asynchronous**.  The lookup
    will occur immediately, potentially before the event loop starts,
    and wait for an answer.

    Usage example:

    .. code-block:: javascript

        var net = require("rampart-net");

        var hostname = net.reverse("1.1.1.1");

        // hostname == "one.one.one.one"

Shortcut Functions
------------------

net.createConnection()
~~~~~~~~~~~~~~~~~~~~~~

    Short cut for ``new net.Socket()`` and ``socket.connect()``.  AKA -
    ``net.connect()``.

    Usage:

    .. code-block:: javascript

        var net = require("rampart-net");

        var socket = net.createConnection(options[, connect_callback]);

        /* or */
        
        var socket = net.connect(options[, connect_callback]);

    Where:

    * ``options`` is an :green:`Object` of options, the same as found in
      `new net.Socket()`_ and `socket.connect()`_ above.

    * ``connect_callback`` is a :green:`Function`, the connect callback
      function.

    This is equivalent to the following:

    .. code-block:: javascript

        var net = require("rampart-net");

        function netconnect(opt, cb) {
            var socket = new net.Socket(opt);
            socket.connect(opt, cb);
            return socket;
        }

        var socket = netconnect(options, connect_callback);

    Alternate usage with ``port``:

    .. code-block:: javascript

        var net = require("rampart-net");

        var socket = net.createConnection(port[, host][, connect_callback]);

        /* or */
        
        var socket = net.connect(port[, host][, connect_callback]);

  
net.createServer()
~~~~~~~~~~~~~~~~~~

    Short cut for ``new net.Server()`` and ``server.listen()``.

    Usage:

    .. code-block:: javascript

        var net = require("rampart-net");

        var server = net.createServer(options, connection_callback);

        /* or */

        var server = net.createServer(port[, host[, backlog]][, connection_callback]);


    Where

    * ``options`` is an :green:`Object` of options, the same as found in
      `new net.Server()`_ and `server.listen()`_ above.

    * ``connection_callback`` is a :green:`Function`, the connection callback
      function.

    This is roughly equivalent to the following (when using ``options``
    above):

    .. code-block:: javascript

        var net = require("rampart-net");

        function makeserver(opt, cb) {
            var server = new net.Server(opt, cb);
            server.listen(opt);
            return server;
        }

        var server = makeserver(options, connect_callback);

net.resolve_async()
~~~~~~~~~~~~~~~~~~~

    Short cut for ``new net.Resolve()`` and ``resolver.resolve()``.

    Usage:

    .. code-block:: javascript

        var net = require("rampart-net");

        var resolver = net.resolve_async(host, lookup_callback);

    Where:

    * ``host`` is a :green:`String` - the host name to be resolved.

    * ``lookup_calback`` is a :green:`Function` - the "lookup" event
      function.


    This is equivalent to the following:

    .. code-block:: javascript

        var net = require("rampart-net");

        function resolve_async(hn, cb) {
            var resolver = new net.Resolver();
            resolver.resolve(hn, cb);
            return resolver;
        }

        var resolver = resolve_async(host, callback);

net.reverse_async()
~~~~~~~~~~~~~~~~~~~

    Short cut for ``new net.Resolve()`` and ``resolver.reverse()``.

    Usage:

    .. code-block:: javascript

        var net = require("rampart-net");

        var resolver = net.reverse_async(ip_addr, lookup_callback);

    Where:

    * ``ip_addr`` is a :green:`String` - the ip address to look up.

    * ``lookup_calback`` is a :green:`Function` - the "lookup" event
      function.


    This is equivalent to the following:

    .. code-block:: javascript

        var net = require("rampart-net");

        function reverse_async(ip, cb) {
            var resolver = new net.Resolver();
            resolver.reverse(ip, cb);
            return resolver;
        }

        var resolver = reverse_async(ip, callback);


