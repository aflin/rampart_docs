The rampart-server HTTP module
==============================

Preface
-------

Acknowledgment
~~~~~~~~~~~~~~

The rampart-server module uses the
`libevhtp_ws <https://github.com/aflin/libevhtp_ws>`_ library,
a fast, embedded, event driven http/https server
which itself uses the `libevent2 <https://libevent.org/>`_ library.

The developers of Rampart are extremely grateful for the excellent APIs and ease
of use of these libraries.

License
~~~~~~~

The rampart-server module is released under the MIT license.
The `libevhtp_ws <https://github.com/aflin/libevhtp_ws>`_ library
and the `libevent2 <https://libevent.org/>`_ library
are both provided under a
`BSD-3-Clause License <https://github.com/aflin/libevhtp_ws/blob/main/LICENSE>`_\ .

What does it do?
~~~~~~~~~~~~~~~~

The rampart-server module provides a multithreaded and flexible http/https webserver
which is started from, configured in and maps urls to Rampart JavaScript functions.
It also can be configured to serve files from the filesystem.


How does it work?
~~~~~~~~~~~~~~~~~

Once the module is loaded and configuration parameters are passed to the
`start()`_ function, the server maps paths to the filesystem, JavaScript
functions, :ref:`JavaScript Modules <rampart-main:Using the require Function to Import Modules>`
and/or directories containing
:ref:`JavaScript Modules <rampart-main:Using the require Function to Import Modules>`.
Modules allow scripts and functions to reside in separate files.
If changes are made to a module, the server does not need to be
restarted for the changes to take effect.

The server can operate from a pool of threads, taking advantage of systems
with multiple CPUs.  As JavaScript is inherently single-threaded, when the
server is started in multi-threaded mode, a new JavaScript stack, heap and
context is created for each thread.  Global variables, global functions
and mapped functions passed to `start()`_ are automatically copied to each
context and each runs independently.  Modules are likewise loaded from
within each thread and checked for changes upon each request.

It is worth noting that rampart-sql and rampart-python functions are not
thread safe.  When SQL or Python functions are executed from within a
function or module, rampart may create a fork, one per thread, in order to
handle such functions.

A timeout for script execution may also be set.  Should the script timeout,
the serving thread will cancel the request and re-initialize the JavaScript
context in order to serve new requests.

Loading and Using the Module
----------------------------

Loading
~~~~~~~

Loading the server modules is a simple matter of using the require
statement:

.. code-block:: javascript

   var server = require("rampart-server");

It returns an :green:`Object` with a single function:

::

   {
      start:    {_func:true}
   }


Configuring and Starting the Server
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

start()
"""""""

The server is configured and started using the ``start()`` function.
Options are passed to the function in a single :green:`Object`.

Usage:

.. code-block:: javascript

   var server = require("rampart-server");

   server.start(Options);

Where:
   ``Options`` is an :green:`Object` with the following properties:

    * ``bind`` - An :green:`Array` of :green:`Strings`, with each :green:`String`
      representing an ip address and port.  If not specified, the server will
      bind to port 8088 on the loopback device (i.e. 127.0.0.1, which is only
      accessible from the same machine), using the following default value:

      ``[ "[::1]:8088", "127.0.0.1:8088" ]``.

      When specifying an Ipv6 address, bracket notation is required (e.g.
      ``[2001:db8::1111:2222]:80``) while a dot-decimal notation is used for
      ipv4 (e.g. ``172.16.254.1:80``).  To bind to all ip addresses using port 80,
      the following may be used:

      ``[ "[::]:80", "0.0.0.0:80" ]``.

    * ``scriptTimeout``: A :green:`Number`, amount of time in seconds (or fraction
      thereof) to wait for a script to run before canceling the request and
      returning a ``500 Internal Server Error`` timeout message to the
      connecting client.  Default is no timeout/unlimited.

    * ``connectTimeout``: A :green:`Number`, amount of time in seconds (or fraction
      thereof) to wait for a connected client to send a request. Default is no
      timeout/unlimited.

    * ``log``: A :green:`Boolean`, whether to log each request.  Access requests
      are logged to ``stdout`` and errors are logged to ``stderr`` unless
      ``accessLog`` and/or ``errorLog`` below are set.

    * ``accessLog``: A :green:`String`, the location of the access log.  The
      default, if not specified is to log to ``stdout``.  If given, the log
      file will be closed and re-opened upon sending the rampart executable
      a ``USR1`` signal, which allows log rotation.

    * ``errorLog``: A :green:`String`, the location of the error log.  The
      default, if not specified is to log to ``stderr``. If given, the log
      file will be closed and re-opened upon sending the rampart executable
      a ``USR1`` signal, which allows log rotation.

    * ``logIpFromHeader``: A :green:`String`, a header name to use for logging
      the ip address of the request.  In cases where the server is behind a proxy
      such as nginx, instead of logging ``127.0.0.1``, setting, e.g. 
      ``proxy_set_header Remote_address $remote_addr;`` in the appropriate section
      of ``/etc/nginx/nginx.conf``, and setting ``logIpFromHeader: "Remote_address"``
      here will log the ip address of the client connecting to nginx, rather the
      ip address of the nginx proxy server.

    * ``daemon``: A :green:`Boolean`, whether to fork and detach from the
      controlling terminal.  If ``true``, the ``start()`` function will return
      the pid of the server. Otherwise the pid of the current process is
      returned. The default is ``false``.

    * ``useThreads``: A :green:`Boolean`, whether the server is multi-threaded.
      If ``true`` and ``threads`` below is not set, the server will create a
      threadpool consisting of one thread per cpu core.  If set ``false``, it is
      equivalent to setting ``useThreads`` to ``true`` and ``threads`` to ``1``.
      The default is ``true``.

    * ``threads``: A :green:`Number`, the number of threads to create for the
      server thread pool.  The default, if ``useThreads`` is ``true`` or is
      unset, is the number of cpu cores on the current system.

    * ``maxRead``: A :green:`Number`, the largest single read from a client
      allowed in the event loop.  If reading data larger than this, it will
      be done in multiple cycles of the event loop in order to allow the
      servicing of other requests.  A high number can make receiving large
      requests unfairly slow down other clients, especially if the server is
      not using multiple threads.  A low number will slow down the reading
      of data over the specified size. Default is ``65536``.

    * ``maxWrite``: A :green:`Number`, the largest single write to a client
      allowed in the event loop.  If writing data larger than this, it will
      be done in multiple cycles of the event loop in order to allow the
      servicing of other requests.  A high number can make sending large
      replies unfairly slow down other clients, especially if the server is
      not using multiple threads.  A low number will slow down the writing
      of data over the specified size. Default is ``65536``.

    * ``secure``: A :green:`Boolean`, whether to use SSL/TLS layer for serving
      via the ``https`` protocol.  Default is ``false``.  If ``true``, the
      ``sslKeyFile`` and ``sslCertFile`` parameters must also be set.

    * ``sslKeyFile``: A :green:`String`, the location of the ssl key file for
      serving via the ``https`` protocol.  An example, if using
      `letsencrypt <https://letsencrypt.org/>`_ for "example.com" might be
      ``"/etc/letsencrypt/live/example.com/privkey.pem"``.  This setting has
      no effect unless ``secure`` is ``true``.

    * ``sslCertFile``: A :green:`String`, the location of the ssl cert file for
      serving via the ``https`` protocol.  An example, if using
      `letsencrypt <https://letsencrypt.org/>`_ for "example.com" might be
      ``"/etc/letsencrypt/live/example.com/fullchain.pem"``.  This setting has
      no effect unless ``secure`` is ``true``.

    * ``sslMinVersion``:  A :green:`String`, the minimum SSL/TLS version to use.
      Possible values are ``ssl3``, ``tls1``, ``tls1.1`` or ``tls1.2``.  The
      default is ``tls1.2``. This setting has no effect unless ``secure`` is ``true``.

    * ``notFoundFunc``: A :green:`Function` to handle ``404 Not Found`` responses.
      See `Mapped Functions`_ below.

    * ``developerMode``: A :green:`Boolean`, whether to run the server in a
      developer mode.  If ``true``, JavaScript and other errors will cause
      the server to return a ``500 Internal Error`` message, with the error
      and error line numbers printed.  If false, JavaScript errors will
      result in the generic ``404 Not Found Page`` or alternatively, if set
      ``notFoundFunc`` will be called and the request object (``req``) will
      contain the key ``errMsg`` (``req.errMsg``), with the error message.

    * ``directoryFunc``: A :green:`Function` to handle directory listings from
      the filesystem, if no ``index.html`` file exists in the requested
      directory.  May also be set to ``true`` to use the built-in function.
      If set ``false`` (the default), a "404 Forbidden" response is sent
      where a directory listing is requested and no index.html file exists.
      See `Built-in Directory Function`_ below for more information.

    * ``user``: A :green:`String`, the user account which the server will switch
      to after binding to the specified ip address and port.  Only valid if
      server is started as ``root``.  This setting is used for binding to
      privileged ports as ``root`` and then dropping privileges.  If the server
      is started as root, ``user`` must be set.

    * ``cacheControl``: A :green:`String` or a :green:`Boolean`.  If a
      :green:`String` - the text to set the "Cache-Control" header when
      serving files off of the filesystem.  The default is "max-age=84600,
      public", if not set or set ``true``.  If set ``false``, no header is
      sent.

    * ``compressFiles``: A :green:`Boolean` or :green:`Array`.  Whether to
      use gzip compression for files served from the filesystem.  Default is
      ``false``.  If an :green:`Array`. is given, it is a list of file
      extension which will be compressed.  If ``true`` - the following default
      :green:`Array` of extensions will be used:
      ``["html", "css", "js", "json, "xml", "txt", "text", "htm"]``.

      Note that compressed files will be cached in a directory named
      ".gzipcache/" in the directory in which the files are located.
      Compressed cached files are updated based on the date of the original.
      The webserver's ``user`` must have write permissions in the directory
      in which the files are located in order for compressed files to be
      cached.

    * ``compressScripts``:  A :green:`Boolean`. Whether to compress the
      output from scripts by default.  If not set, the default is ``false``.
      This can be overridden in the return value from a script using the key
      ``compress`` set to a :green:`Boolean` or a compression level (1-10).
      See the last example in `The Return Object`_ below.

    * ``compressLevel``: A :green:`Number`. The default level of compression
      used for files and scripts.  Must be an integer between 1 and 10. The
      default, if not specified, is ``1``.

    * ``compressMinSize``: A :green:`Number`. The minimum size in bytes any file or
      script output must be in order for the content to be compressed.  The default,
      if not specified, is ``1000``.

    * ``appendProcTitle``: A :green:`Boolean`. Whether to append the process
      title (as seen in utilities like ``ps``) with the ip address and port
      number of the server.  The default if not specified is ``false``.

    * ``mimeMap``: An :green:`Object`, additions or changes to the standard extension
      to mime mappings.  Normally, if, e.g., ``return { "m4v": mymovie };``
      is set as `The Return Object`_ to a mapped function, the header
      ``content-type: video/x-m4v`` is sent.  Though the ``content-type``
      header can be changed using the ``headers`` object in `The Return
      Object`_\ , it does not affect files served from the filesystem.  If
      it is necessary to change the default "content-type" for both `Mapped
      Functions`_ and files served from `Mapped Directories`_\ ,
      extension:mime-types mappings may be set or changed as follows:

      .. code-block:: javascript

          server.start({
              ...,
              mimeMap: {
                  /* make these movies play as mp4s */
                  "m4v": "video/mp4",
                  "mov": "video/mp4"
              },
              map: {
                  "/": "/var/www/html",
                  ...,
              }
          });

      For a complete list of defaults, see `Key to Mime Mappings`_ below.

    * ``map``: An :green:`Object` of url to function or filesystem mapping.
      The keys of the object are exact paths, regular expressions, partial
      paths or globbed paths to be matched against incoming requests.  For
      example, a key ``/myscript.html`` would match an incoming request for
      ``http://example.com/myscript.html``.  The value to which the key is
      set controls which function, module or filesystem path will be used.

      If the value is a :green:`Function`, that function is used as
      the callback function.  If the value is an :green:`Object` with
      ``module`` or ``modulePath`` key set, it is assumed to
      be a script name (the same as is used for
      :ref:`require() <rampart-main:using the require function to import modules>`)
      or a path with scripts.

      If the value is a :green:`String`, or it is an :green:`Object` with
      ``path`` set, it is assumed to be a mapping to the filesystem.  A
      mapping to a filesystem path may also include headers.

      Example:

      .. code-block:: javascript

        var server = require("rampart-server");

        var pid = server.start({
            bind: [ "[::]:8088", "0.0.0.0:8088" ], /* bind to all */
            map :
            {
                "/":            "/usr/local/etc/httpd/htdocs"  /* map all file requests */
                "/search.html": function (req) { ... },         /* search function */
                "/images/":     {
                                    path: "/path/to/my/jpgs/",
                                    headers: {
                                        "Content-Control": "max-age=31556952, public",
                                        "X-Custom-Header": 1
                                    }
                                }
            }
        });

      In the above example, as the longer path, the ``"/search.html"`` key
      will have priority over ``"/"`` key, so that a request
      ``http://localhost:8088/search.html`` will cause the function to be
      executed while anything else will match ``"/"`` (assuming ``mapSort``
      is not set to ``false``).

      Keys/paths used for mapping a :green:`Function` may be given in one of
      three different formats, which are tested for a match in the following order:

      * Exact Paths - Paths starting with a "/" and having no unescaped ``*`` characters
        will be matched exactly with the incoming request.

      * Regular Expression paths - A path/key that starts with ``~`` will match the
        Perl Regular Expression following the ``~``.  Example:
        ``map: {"~/.*/myfile.html": myfunction }`` will match any path ending
        in ``myfile.html`` and run the named function ``myfunction``.

      * Glob Paths - A glob path will have the last priority for matching the
        requested url.  Example: ``map: {"/*/myfile.html": myfunction2 }`` will
        match the same as the example above, but would have lower priority.  If
        both these examples were present, ``myfunction2`` would never match.

      Keys/paths used for mapping to the **filesystem** are always taken as an Exact path.
      Regular expressions and globs are not allowed.

    * ``mapSort``: A :green:`Boolean`, whether to automatically sort the
      mapped paths given as keys to the :green:`Object` passed to ``map`` below.
      Default is ``true``.  If ``false``, paths from the ``map`` :green:`Object`
      will be matched in the order they are given.

      Note that regardless of this setting, paths are match by type of path (see
      below) with Exact paths tested first, then regular expression paths and
      lastly glob paths.  However, it is usually desirable for longer paths to
      have priority over shorter ones.  For example, if ``/`` and
      ``/search.html`` are both specified (both are "Exact" paths),
      ``/search.html`` should be checked first, otherwise ``/`` will match and
      ``/search.html`` will never match.  When ``mapSort`` is ``true``,
      key/paths are automatically sorted by length.

Return Value
  A :green:`Number`, the pid of the current process, or if ``daemon`` is
  set to ``true``, the pid of the forked server.

Server Usage Details
--------------------

Path Mapping
~~~~~~~~~~~~

  Path mapping using the ``map`` property in `start()`_ above may be used to
  map URL paths to both :green:`Functions` and to a directories on the local
  filesystem.

Mapped Functions
""""""""""""""""

  A mapped function may be expressed in one of several ways.

  * Inline function: ``map: {"/search.html": function(res) { ... } }``.

  * A Global function: ``map: {"/search.html": myfunc }`` where ``myfunc`` is a
    function declared **globally** in the current script.

  * A module with ``module.exports`` set to the desired function.   Example:
    ``map: {"/search.html" : {module:"mysearchmod"} }`` where mysearchmod.js is
    in a :ref:`standard module search path <rampart-main:Module Search Path>`.

  * A directory of modules where the directory contains one or more modules
    with ``module.exports`` set to :green:`Functions` or an :green:`Object`
    containing :green:`Functions`.  Example: ``map: {"/scripts/": {modulePath:
    "/path/to/myscriptsdir/"} }``.  In this case, if
    ``/path/to/myscriptsdir/mymod.js`` script exists, it might be available
    from the URL ``http://localhost:8088/scripts/mymod.ext`` where ``.ext``
    can be ``.html``, ``.txt`` or any other extension desired.  Note that
    regardless of the extension used, the mime-type is set in `The Return
    Object`_\ .

  * A mapped function path/key must start with ``ws:`` for websocket
    connections.  See `Websockets`_ below.

NOTE:
  A module may also return its own mapped functions. The url will
  be a concatenation of the ``map`` object key and the return object keys.

  Example:

  .. code-block:: javascript

    var server = require("rampart-server");

    server.start({
      /* requests to http://localhost:8088/multi/ will be handled by *
       * modules/multi_function.js                                   */
      map: {
         "/multi/":            {module: "modules/multi_function.js" }
      }
    }

    /* Here modules/multi_function.js is a module which sets exports *
     * to an Object with keys as paths set to functions. Example:    */

            /* functions indexpage, firstpage, etc not shown */
            module.exports={
                "/"                  : indexpage,   // the indexpage function
                "/index.html"        : indexpage,   // same
                "/page1.html"        : firstpage,   // function handles page 1
                "/page2.html"        : secondpage,  // function handles page 2
                "/virtdir/page3.html": thirdpage    // function handles page 3
            };
    /*
            These would then map to:
                http://localhost:8088/multi/
                http://localhost:8088/multi/index.html
                http://localhost:8088/multi/page1.html
                http://localhost:8088/multi/page2.html
                http://localhost:8088/multi/virtdir/page3.html
    */

  For normal use, it is always preferable to use modules.  The
  advantage of using modules is that they can be changed at any time without
  having to restart the server and that variables declared in the module
  have their scopes appropriately set.

  See :ref:`rampart-main:Using the require Function to Import Modules`
  for details on writing and using modules.

  It is also important to note that only global variables and functions from
  the main script, along with inline functions are copied to each JavaScript
  context for each server thread.  Any other variable or function that might
  otherwise appear to be in scope when ``server.start()`` is executed will
  not be available from within each server thread.  This is true regardless
  of the state of ``useThreads`` setting above.  Any semantic confusion that
  might be caused by this limitation can be mostly avoided by placing
  functions in separate scripts as modules, since variables declared in the
  module will be available and properly scoped (though separately and
  distinctly; variables are never shared between threads -- though note that
  when using :ref:`rampart.event <rampart-main:rampart.event>`, the triggering
  of events and the ``callbackTriggerVar`` do cross threads).

  Example of a scoped variable that would not be available:

  .. code-block:: javascript

    var server = require("rampart-server");

    function startserver() {
       var html = "<pre>HELLO WORLD!</pre>";

       return server.start({
           map: {
               "/myfunc.html": function(){ return {html:html}; }
           }
       });
    }

    var pid=startserver();


    /* result from http://localhost:8088/myfunc.html:
          Internal Server Error
          ReferenceError: identifier 'html' undefined
            at [anon] (duk_js_var.c:1236) internal
            at [anon] (test-server.js:8) preventsyield
    */


  Note that if ``var html`` was declared globally (e.g. directly after
  ``var server`` line), the function would not throw an error.

  Example of local variables that are available in a module:

  .. code-block:: javascript

    /* mymod.js */

    var html = "<pre>HELLO WORLD!</pre>";

    module.exports = function(){ return {html:html}; }

  With the main script containing:

  .. code-block:: javascript

    /* test-server.js */

    var server=require("rampart-server");

    var pid = server.start({
      map: {
        "/myfunc.html": {module:'mymod'}
      }

    });

  In the above example, ``var html`` would be set once when the module is
  loaded.  It is then accessible from the exported function and its scope is
  limited to the ``mymod.js`` file.

Mapped Directories
""""""""""""""""""

  Mapped Directories are specified by setting the value of a path key to a
  :green:`String`, where the :green:`String` is the name of the directory on
  the current filesystem to use:

  .. code-block:: javascript

      var server = require("rampart-server");

      var pid = server.start({
          map: {
            "/"   : "/var/www/html",
            /* trailing '/' in '/css' is implied */
            "/css": "/usr/local/etc/httpd/css"
          }
      });

  Mapped directories may also be mapped using the following syntax, which allows for custom headers
  to be sent with each file served:

  .. code-block:: javascript

      var server = require("rampart-server");

      var pid = server.start({
          map: {
            "/"   : {
                path: "/var/www/html",
                headers: {
                    "X-Custom-Header-1": "myval1",
                    "X-Custom-Header-2": "myval2"
                }
            },
            "/css/": "/usr/local/etc/httpd/css"
          }
      });

  In the above example, all the files in ``/var/www/html/*`` would be mapped
  to ``http://localhost:8088/*`` including any subdirectories.  However,
  ``http://localhost:8088/css/*`` is mapped from
  ``/usr/local/etc/httpd/css/*`` even if a ``/var/www/html/css/``
  directory exists.

  Note that globs and regular expressions are not allowed for mapped
  directories.  Note also that keys for mapped directories are always
  treated as directories and have a trailing ``/`` added if not present.
  If, e.g., ``map:{"/file.html":"/my/dir"}`` was specified,
  ``http://localhost:8088/file.html`` would return "NOT FOUND" but URLs
  beginning with ``http://localhost:8088/file.html/`` would return files
  from ``/my/dir/``.

The Request Object
~~~~~~~~~~~~~~~~~~

  Mapped :green:`Functions` are passed a single :green:`Object` which contains the details
  of the request.  For example, if the url
  ``http://localhost:8088/showreq.html?q=search+terms`` is requested
  (with a cookie set), the
  :green:`Object` passed to the function might look something like this:

  .. code-block::  javascript

        {
           "ip": "::1",
           "port": 33948,
           "method": "GET",
           "path": {
              "file": "showreq.html",
              "path": "/showreq.html",
              "base": "/",
              "scheme": "http://",
              "host": "localhost:8088",
              "url": "http://localhost:8088/showreq.html?q=search+terms"
           },
           "query": {
              "q": "search terms"
           },
           "body": {},
           "query_raw": "q=search+terms",
           "cookies": {
              "mycookie": "cookietext",
           },
           "headers": {
              "Host": "localhost:8088",
              "Connection": "keep-alive",
              "DNT": "1",
              "Upgrade-Insecure-Requests": "1",
              "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
              "Sec-Fetch-Site": "none",
              "Sec-Fetch-Mode": "navigate",
              "Sec-Fetch-User": "?1",
              "Sec-Fetch-Dest": "document",
              "Accept-Encoding": "gzip, deflate, br",
              "Accept-Language": "en-US,en;q=0.9",
              "Cookie": "mycookie=cookietext"
           },
           "params": {
              "q": "search terms",
              "mycookie": "cookietext",
              "Host": "localhost:8088",
              "Connection": "keep-alive",
              "DNT": "1",
              "Upgrade-Insecure-Requests": "1",
              "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
              "Sec-Fetch-Site": "none",
              "Sec-Fetch-Mode": "navigate",
              "Sec-Fetch-User": "?1",
              "Sec-Fetch-Dest": "document",
              "Accept-Encoding": "gzip, deflate, br",
              "Accept-Language": "en-US,en;q=0.9",
              "Cookie": "mycookie=cookietext"
           }
        }

  The above example could be printed out to the web client using the following function:

  .. code-block:: javascript

        server.start(
        {
            ...,
            map : {
                "/showreq.txt" : function(req) {
                return( { txt: rampart.utils.sprintf("%3J",req) } );
              }
            }
        });

  Note that the ``params`` key is an :green:`Object` with properties set to an
  amalgam of all the useful variables sent from the client.  It includes
  variables from headers, cookies, GET query parameters and POST data,
  prioritize in that order.  If, e.g., a query parameter has the same name
  as a cookie, the cookie value will override the the query parameter.


Posting Form Data
"""""""""""""""""

    When posting form data, the request object will include an additional
    property ``postData``, which will contain the parsed content of the
    posted form as well as the ``Content-Type`` which will be set to
    ``"application/x-www-form-urlencoded"``.  The ``postData`` ``content``
    will also be copied to ``params``, so long as there are no name
    collisions between those keys and variables set from cookies, headers or
    query parameters.  The raw posted content will be returned in the
    property ``body`` as a :green:`Buffer`.  Example:

    .. code-block:: javascript

        server.start(
        {
            ...,
            map : {

                "post.html": function(){
                    var html = '<html><body><form action="/showreq.txt" method="POST">'+
                        '<label for="fname">First name:</label><br>' +
                        '<input type="text" id="fname" name="fname"><br>' +
                        '<label for="lname">Last name:</label><br>' +
                        '<input type="text" id="lname" name="lname">'+
                        '<input type="submit" name="go">'+
                    '</form></body></html>';

                     return {html:html};
                },

                "/showreq.txt" : function(req) {

                    /* convert "body" to text so we can print it out */
                    req.body=rampart.utils.bufferToString(req.body);

                    return( { txt: rampart.utils.sprintf("%3J",req) } );
                }
            }
        });

        /* response from posting form at http://localhost:8088/post.html
           might include:

            {
               "ip": "127.0.0.1",
               "port": 38680,
               "method": "POST",
               "path": {
                  "file": "showreq.html",
                  "path": "/showreq.html",
                  "base": "/",
                  "scheme": "http://",
                  "host": "localhost:8088",
                  "url": "http://localhost:8088/showreq.html"
               },
               "query": {},
               "body": "fname=Joe&lname=Public&go=Submit",
               "query_raw": "",

                ...,

               "postData": {
                  "Content-Type": "application/x-www-form-urlencoded",
                  "content": {
                       "fname": "Joe",
                       "lname": "Public",
                       "go": "Submit"
                  }
               },
               "params": {
                  "fname": "Joe",
                  "lname": "Public",
                  "go": "Submit",

                  ...,

               }
            }
        */

Posting Multipart Form Data
"""""""""""""""""""""""""""

    Multipart form data will also be returned in the property ``formData``
    and will have the ``Content-Type`` property set to
    ``"multipart/form-data"``.  The ``content`` property will contain an
    array of objects, one object for each "part" of the form data.  The key
    and values of an object provides details and the content for each part.

    Example:

    .. code-block:: javascript

        server.start(
        {
            ...,
            map : {

                "postfile.html": function(){
                    var html = '<html><body><form action="/showreq.txt" enctype="multipart/form-data" method="POST">'+
                        'File: <input type="FILE" name="file"/>' +
                        '<input type="submit" name="Upload" value="Upload" />' +
                    '</form></body></html>';

                    return {html: html};
                },

                "/showreq.txt" : function(req) {

                    /* convert "body" to text so we can print it out */
                    req.body=rampart.utils.bufferToString(req.body);

                    return( { txt: rampart.utils.sprintf("%3J",req) } );
                }
            }
        });

        /* posting a small file called "helloWorld.txt with the contents "Hello World!"

        {
           "ip": "::1",
           "port": 39004,
           "method": "POST",
           "path": {
              "file": "showreq.html",
              "path": "/showreq.html",
              "base": "/",
              "scheme": "http://",
              "host": "localhost:8088",
              "url": "http://localhost:8088/showreq.html"
           },
           "query": {},
           "body": "------WebKitFormBoundaryB4UZ3AZ5kFBUZpR6\r\nContent-Disposition: form-data; name=\"file\"; filename=\"helloWorld.txt\"\r\nContent-Type: text/plain\r\n\r\nHello World!\r\n------WebKitFormBoundaryB4UZ3AZ5kFBUZpR6\r\nContent-Disposition: form-data; name=\"Upload\"\r\n\r\nUpload\r\n------WebKitFormBoundaryB4UZ3AZ5kFBUZpR6--\r\n",
           "query_raw": "",
           "cookies": {
              "mycookie": "cookietext",
           },
           "headers": {
              "Host": "localhost:8088",
              "Content-Length": "299",
              ...,
           },
           "postData": {
              "Content-Type": "multipart/form-data",
              "content": [
                 {
                    "Content-Disposition": "form-data",
                    "name": "file",
                    "filename": "helloWorld.txt",
                    "Content-Type": "text/plain",
                    "content": {
                       "0": 72,
                       "1": 101,
                       "2": 108,
                       "3": 108,
                       "4": 111,
                       "5": 32,
                       "6": 87,
                       "7": 111,
                       "8": 114,
                       "9": 108,
                       "10": 100,
                       "11": 33
                    }
                 },
                 {
                    "Content-Disposition": "form-data",
                    "name": "Upload",
                    "content": {
                       "0": 85,
                       "1": 112,
                       "2": 108,
                       "3": 111,
                       "4": 97,
                       "5": 100
                    }
                 }
              ]
           },
           "params": {
              "helloWorld.txt": {
                 "0": 72,
                 "1": 101,
                 "2": 108,
                 "3": 108,
                 "4": 111,
                 "5": 32,
                 "6": 87,
                 "7": 111,
                 "8": 114,
                 "9": 108,
                 "10": 100,
                 "11": 33
              },
              "Upload": {
                 "0": 85,
                 "1": 112,
                 "2": 108,
                 "3": 111,
                 "4": 97,
                 "5": 100
              },
              "Host": "localhost:8088",
              "Connection": "keep-alive",
              "Content-Length": "299",
              "Cache-Control": "max-age=0",
              ...,
           }
        }
        */

    Note that like ``body``, the ``contents`` property of each uploaded part is a :green:`Buffer`.

Posting JSON Data
"""""""""""""""""

    JSON data, sent with ``Content-Type`` set to ``"application/json"`` will also be parsed in
    a manner similar to `Posting Form Data`_.

    .. code-block:: javascript

        var server=require("rampart-server");

        server.start(
        {
            user:"nobody",
            map : {
                "post.html": function(){
                    var html = '<html><head><script>\n'+
                           'function senddata(){\n' +
                             'var first= document.querySelector("#fname");\n' +
                             'var last = document.querySelector("#lname");\n' +
                             'var res  = document.querySelector("#res");\n' +
                             'var xhr = new XMLHttpRequest();\n' +
                             'xhr.open("POST", "/showreq.json");\n' +
                             'xhr.setRequestHeader("Content-Type", "application/json");\n' +
                             'xhr.onreadystatechange = function () { \n' +
                               'if (xhr.readyState === 4 && xhr.status === 200) {\n' +
                                  'res.innerHTML = "<pre>"+ this.responseText +"</pre>";\n' +
                               '} \n' +
                             '};\n' +
                             'xhr.send( JSON.stringify({first:first.value, last:last.value}) );\n'+
                             'return false;'+
                           '}\n'+
                        '</script></head><body>'+
                        '<label for="fname">First name:</label><br>' +
                        '<input type="text" id="fname" name="fname"><br>' +
                        '<label for="lname">Last name:</label><br>' +
                        '<input type="text" id="lname" name="lname">'+
                        '<button onclick="return senddata()">Submit</button>'+
                    '<div id="res"></div></body></html>';

                     return {html:html};
                },

                "/showreq.json" : function(req) {
                    /* convert "body" to text so we can send */
                    req.body=rampart.utils.bufferToString(req.body);

                    return( { json: rampart.utils.sprintf("%3J",req) } );
                }
            }
        });

        /* results might be:
        {
           "ip": "::1",
           "port": 46586,
           "method": "POST",
           "path": {
              "file": "showreq.json",
              "path": "/showreq.json",
              "base": "/",
              "scheme": "http://",
              "host": "localhost:8088",
              "url": "http://localhost:8088/showreq.json"
           },
           "query": {},
           "body": "{\"first\":\"Joe\",\"last\":\"Public\"}",
           "query_raw": "",
           "headers": {
              "Host": "localhost:8088",
              "Connection": "keep-alive",
              "Content-Length": "31",
              "Content-Type": "application/json",
              ...,
           },
           "postData": {
              "Content-Type": "application/json",
              "content": {
                 "first": "Joe",
                 "last": "Public"
              }
           },
           "params": {
              "first": "Joe",
              "last": "Public",
              "Content-Length": "31",
              "Content-Type": "application/json",
              "Referer": "http://localhost:8088/post.html",
              ...,
           }
        }
        */

Posting Other Types
"""""""""""""""""""

  Posting with a ``Content-Type`` other than the three above will return
  ``postData`` with the provided ``Content-Type`` set, and ``contents``
  will be the same as the unparsed :green:`Buffer` ``body``.

The Return Object
~~~~~~~~~~~~~~~~~

  The return value from a mapped :green:`Function` contains the contents of
  the text or data (a :green:`String` or :green:`Buffer`) that will be
  returned to the client.  The name of the key (which usually matches the
  well known file extension) determines the mime-type that is returned.  For
  example: to return an HTML (``text/html`` mime type) document to the
  client, ``{ html: myhtmlcontent}`` would be specified where the variable
  ``myhtmlcontent`` contains the HTML text to be sent to the client.  The name
  of the key (``html``) controls which mime-type will be sent to the
  connecting client.  Supported key-names to mime-types are listed
  :ref:`below <rampart-server:Key to Mime Mappings>`.

  The return object can optionally contain header parameters to be sent to
  the client.

  .. code-block:: javascript

     return {
        html: myhtmltext,
        headers: { "X-Custom-Header": "custom value"}
     }

  To set more than one header with the same name, the value must be an :green:`Array`.

  .. code-block:: javascript

     return {
        html: myhtmltext,
        headers: {
            "X-Custom-Header": "custom value",
            "Set-Cookie": [
                rampart.utils.sprintf("id=%U; Expires=Wed, 15 Oct 2025 10:28:00 GMT", id),
                rampart.utils.sprintf("session=%U; Max-Age=86400", session_id)
            ]
        }
     }

  A Status Code may also be specified. For example, to redirect a url to a
  new one:

  .. code-block:: javascript

     var newurl = "https://example.com/myNewLocation.html";
     return {
        html:rampart.utils.sprintf(
             "<html><body><h1>302 Moved Temporarily</h1>"+
             '<p>Document moved <a href="%s">here</a></p></body></html>',
             newurl
        ),
        status:302,
        headers: { "location": newurl}
     }

  The specified mime-type can also be overwritten using the
  ``content-type`` header.  This way, any arbitrary mime-type can be
  set regardless of the name of the key (though the name of the key
  must be a known extension):

  .. code-block:: javascript

    var jpg = rampart.utils.readFile("/path/to/my/jpeg.jpg");
    /* overwrite the bin -> "application/octet-stream" header */
    return {
       bin:jpg,
       headers: {"content-type": "image/jpeg"}
    };

  See also ``mimeMap`` in `start()`_ above.

  The content of a file may be sent by returning the file name prepended
  with an ``@`` character.

  .. code-block:: javascript

    return {
       jpg: "@/path/to/my/jpeg.jpg"
    };

  This will be more efficient than reading the file and returing its
  content as shown in the previous example.

  Note that in order to send a string whose first character is ``@``, it
  must be escaped.

  .. code-block:: javascript

    return {
       txt: "\\@home is a defunct internet service"
    };

  The ``compressScripts`` setting in server.\ `start()`_ above can be
  overridden with the key ``compress``.  It may be set to ``true``/``false``
  or to a compression level (1-10).

  .. code-block:: javascript

     return {
        html: myhtmltext,
        compress: 5 // gzip compress output at medium level
     }

The Return Object with Defer
""""""""""""""""""""""""""""

    When data is not ready to be sent at the end of a mapped
    :green:`Function`, the reply may be defered until later by returning an
    :green:`Object` with ``defer`` set to ``true``.  Another asynchronous
    :green:`Function` then will be able to use the ``req`` object with
    ``req.reply()`` in order to send data to the client and close the
    transaction.

    Example:

    .. code-block:: javascript

        function defer_test(req){

            // send reply after waiting 2 seconds
            setTimeout(function(){
                req.reply({text:"made ya wait!"});
            }, 2000);

            return {defer:true}; //don't send to client yet.
        }

Built-in Directory Function
~~~~~~~~~~~~~~~~~~~~~~~~~~~

    If ``directoryFunc`` in `start()`_ above is set to ``true``, the
    following script will be used to return an HTML formatted a directory
    listing, where an ``index.html`` file is not present in the requested
    directory.  It is shown below so that if modifications to the default
    are desired, it can be used as a starting point for a custom function
    that can be set using the ``directoryFunc`` property.

    Note that the ``req`` variable passed to the function contains an extra
    property ``fsPath``, which is the path on the filesystem being requested.

    .. code-block:: javascript

        function dirlist(req) {
            var html="<!DOCTYPE html>\n"+
                '<html><head><meta charset="UTF-8"><title>Index of ' +
                req.path.path+
                "</title><style>td{padding-right:22px;}</style></head><body><h1>"+
                req.path.path+
                '</h1><hr><table>';

            function hsize(size) {
                var ret=rampart.utils.sprintf("%d",size);
                if(size >= 1073741824)
                    ret=rampart.utils.sprintf("%.1fG", size/1073741824);
                else if (size >= 1048576)
                    ret=rampart.utils.sprintf("%.1fM", size/1048576);
                else if (size >=1024)
                    ret=rampart.utils.sprintf("%.1fk", size/1024);
                return ret;
            }

            if(req.path.path != '/')
                html+= '<tr><td><a href="../">Parent Directory</a></td><td></td><td>-</td></tr>';
            rampart.utils.readdir(req.fsPath).sort().forEach(function(d){
                var st=rampart.utils.stat(req.fsPath+'/'+d);
                if (st.isDirectory())
                    d+='/';
                html=rampart.utils.sprintf('%s<tr><td><a href="%s">%s</a></td><td>%s</td><td>%s</td></tr>',
                    html, d, d, st.mtime.toLocaleString() ,hsize(st.size));
            });

            html+="</table></body></html>";
            return {html:html};
        }

        server.start({
            ...,
            directoryFunc: dirlist
        });

Advanced Functions
~~~~~~~~~~~~~~~~~~

The ``rampart-server`` module creates a buffer to efficiently store data
that will be returned to the client by the webserver.  There is one buffer per thread
and it is used from within each thread.

The request object contains the functions to manipulate and print to the server buffer,
which will be directly sent to the client without extra copying.

req.printf()
""""""""""""

The request object to a callback function includes the ``printf`` function
which will print directly to the server buffer that will be sent to the client.
It uses the same formats as :ref:`rampart.utils.printf <rampart-utils:printf>`.
The advantages of using ``req.printf`` rather than returning a string is that
content is not copied, but instead placed directly in the server buffer to be
returned to the client.

Example from a normal server callback function:

.. code-block:: javascript

    function mycallback(req) {
        var html;
        ... add content to html ...
        return {html: html};
    }

Example using ``req.printf`` from a server callback function:

.. code-block:: javascript

    function mycallback(req) {
        var content="<html><body>";
        var end_cont = "</body></html>";
        // add more html to content variable ...
        req.printf("%s", content);
        return {html: end_cont};
    }

Return Value:
    The number of bytes written to the server buffer.

Note:
    If ``content`` is large, it is more efficiently handled using
    ``req.printf`` and/or ``req.put`` below than concatenating strings in
    JavaScript.

    The one exception to this is if ``content`` is a :green:`Buffer` and is
    the total content to be returned to the client without concatenation or
    manipulation, doing ``return {html:content}`` is the most efficient
    method.

    However, in nearly all cases, if a function needs to print many strings
    that make up the totality of the data sent to the client, using
    ``req.printf`` or ``req.put`` is preferable.

req.put()
"""""""""

Put a :green:`String` or a :green:`Buffer` into the server buffer to be returned
to the client.

Example:

.. code-block:: javascript

    function mycallback(req) {
        var content="<html><body>";
        var end_cont = "</body></html>";
        // add more html to content variable ...
        req.put(content);
        return {html: end_cont};
    }

Return Value:
    The number of bytes written to the server buffer.

req.getpos()
""""""""""""

Get the current end position in the server buffer.

Return Value
    A :green:`Number` - the end position of the server buffer.

req.rewind()
""""""""""""

Rewind the current end position of the server buffer.

Usage:

.. code-block:: javascript

    function mycallback(req) {
        ...
        var pos = req.rewind(pos);
        ...
    }

Where ``pos`` is the offset to position the end pointer in the server buffer.

Note: ``pos`` must be equal or less than the current end position as
reported by `req.getpos()`_\ .

Return Value
    ``undefined``.

req.getBuffer()
"""""""""""""""

Get a copy of the contents of the server buffer and return it in a JavaScript
buffer.

Return Value:
    A :green:`Buffer` - the contents of the server buffer.

Full Server Example
~~~~~~~~~~~~~~~~~~~

Below is a full example:

.. code-block:: javascript

    var pid=server.start(
    {
        /* bind: string|[array,of,strings]
           default: [ "[::1]:8088", "127.0.0.1:8088" ]
            ipv6 format: [2001:db8::1111:2222]:80
            ipv4 format: 127.0.0.1:80
            spaces are ignored (i.e. " [ 2001:db8::1111:2222 ] : 80" is ok)
        */
        /* bind to all */
        bind: [ "[::]:8088", "0.0.0.0:8088" ],

        /* if started as root, set user here.
           If not root, option "user" is ignored. */
        user: "nobody",

        /* max time to spend in scripts */
        scriptTimeout: 10.0,

        /* how long to wait before client sends
           a req or server can send a response */
        connectTimeout:20.0,

        /*** logging ***/
        log: true,           //turn logging on, by default goes to stdout/stderr
        accessLog: "./access.log",    //access log location, instead of stdout. Can be set if daemon==true
        errorLog: "./error.log",     //error log location, instead of stderr. Can be set if daemon==true

        /*  fork and return pid server start (see end of the script) */
        daemon: true,

        /* make server singe-threaded. */
        //useThreads: false,

        /*  By default, number of threads is set to cpu core count.
            "threads" has no effect unless useThreads is set true.
            The number can be changed here:
        */
        //threads: 8, /* for a 4 core, 8 virtual core hyper-threaded processor. */

        /*
            for https support, these three are the minimum number of options needed:
        */
        secure:true,
        sslKeyFile:  "/etc/letsencrypt/live/mydom.com/privkey.pem",
        sslCertFile: "/etc/letsencrypt/live/mydom.com/fullchain.pem",

        /* sslMinVersion (ssl3|tls1|tls1.1|tls1.2). "tls1.2" is default*/
        sslMinVersion: "tls1.2",

        /* a custom 404 page */
        notFoundFunc: function(req){
            return {
                status:404,
                html: '<html><head><title>404 Not Found</title></head>'+
                      '<body style="background: url(/img/page-background.png);">'+
                      '<center><h1>Not Found</h1><p>The requested URL '+
                        req.path.path+
                      ' was not found on this server.</p>'+
                      '</center></body></html>'
            }
        },

        /* if a function is given, directoryFunc will be called each time a url
            which corresponds to a directory is called if there is no index.htm(l)
            present in the directory.  Added to the normal request object
            will be the property (string) "fsPath" (req.fsPath), which can be used
            to create a directory listing.  See function dirlist() above.
            It is substantially equivelant to the built-in server.defaultDirList function.

            If directoryFunc is not set, a url pointing to a directory without an index.htm(l)
            will return a 403 Forbidden error.
        */

        directoryFunc: true, //use default directory list function

        /* remap a few extensions -> mimetypes */
        mimeMap: {
                "m4v": "video/mp4",
                "mov": "video/mp4"
        },

        /* **********************************************************
           map urls to functions or paths on the filesystem
           If it ends in a '/' then matches everything in that path
           except a more specific ('/something.html') path

           priority is given to Exact Paths (Begins with '/' and no '*' in path), then
             regular expressions, then globs.

           If mapSort: false, then in each of these groups
             is left unsorted.
           Otherwise, within these groups, they are then ordered by length,
             with longest having priority.

           If you wish to specify your own priority, set:

        mapSort: false,

           and then put them in your prefered order below.
           ********************************************************** */
        map:
        {
            "/helloWorld.html" : function(){
                return {
                    html:"<pre>Hello World!</pre>"
                }
            },

            /* directory for scripts */
            "/scripts/": { "modulePath" : "/var/www/scripts" }

            /* static content */
            "/" : "/var/www/html"
        }
    });

    console.log("server started with pid: "+pid);

Chunking Replies
~~~~~~~~~~~~~~~~

The Basics
""""""""""
The server can also send back content with ``Transfer-Encoding: Chunked``.
This allows the server to assemble a response in sections and write back to the
client one section at a time.  The client web browser will reassemble the
document as it is being sent.  This is useful, in particular when sending
a large file, or when sending an `mjpeg <https://en.wikipedia.org/wiki/Motion_JPEG>`_\ .

For a large file, sending in chunks allows the current server thread to
service other requests in between each sent chunk.

For mjpegs, it allow a continuous stream of JPEGs to be sent, also allowing
for other requests to be serviced between each frame.

A chunked document is specified by setting ``chunk:true`` in
`The Return Object`_\ .  A delay between chunks can be set in milliseconds
with the following: ``chunkDelay:delay_in_ms``. This delay works in the same
manner as :ref:`rampart-main:setMetronome()`.

In addition, the extension/mime property of `The Return Object`_ may be
a :green:`Function` (`The Chunk Callback`), which will be called for every
chunk to be written.

Example Callback Return Object:

.. code-block:: javascript

    function send_mp4_chunk(req)
    {
        ...
    }

    function mycallback(req) {
        ...
        return {
            chunk:      true
            chunkDelay: 100,
            mp4:        send_mp4
        }
    }

req.chunkSend()
"""""""""""""""

The ``req.chunkSend()`` function is available only from within `The Chunk Callback`
and is used to send a chunk to the client.

Usage:

.. code-block:: javascript

    req.chunkSend(data);

Where ``data`` is a :green:`String`, :green:`Buffer` (or optionally a :green:`Number`,
:green:`Boolean` or :green:`Object`, in which case it is converted to a
:green:`String`) - The data to send back to the client.

A string starting with `@` is used to send the contents of the file
specified (see `The Return Object`_ for details).

In addition ``data`` may be ``null`` or ``undefined``, in which case, any
data in the server buffer (e.g., when using `req.printf()` or `req.put()`
above) will be sent to the client.  Note that the server buffer is reset
between invocations of `The Chunk Callback`.

req.chunkEnd()
"""""""""""""""

The ``req.chunkEnd()`` function is available only from within `The Chunk Callback`
and is used to terminate the file being sent and the repetition of the callback.

Usage:

.. code-block:: javascript

    req.chunkEnd([data]);

Where ``data`` is optionally a final chunk of data to send (same as in
chunkSend).

req.chunkIndex
""""""""""""""

The ``req.chunkIndex`` variable is available only from within `The Chunk Callback`
and is set to the current 0 based chunk index.

Chunking Examples
"""""""""""""""""

Sending a large file in chunks:

.. code-block:: javascript

    var server=require("rampart-server");
    rampart.globalize(rampart.utils);

    function sendchunk(req){
        var chunk = readFile(req.file, req.chunkIndex * req.chunkSize, req.chunkSize);

        if(req.stat.size > (req.chunkIndex+1) * req.chunkSize)
            req.chunkSend(chunk);
        else
            req.chunkEnd(chunk);
    }

    function sendfile(req) {

        req.chunkSize = 4096; //for convenience and available in sendchunk above
        req.file="/path/to/myfile.mp4";
        req.stat= stat(req.file);
        return {
            "mp4": sendchunk,
            chunk:  true,
            headers: {
                'Content-Disposition': 'attachment; filename="myfile.mp4"'
            }
        };
    }

    /****** START SERVER *******/
    printf("Starting https server\nmp4 is at http://localhost:8088/myfile.mp4\n\n");
    var serverpid=server.start(
    {
        map:
        {
            "/":            function(req){
                                return {
                                    status:302,
                                    headers:{location:'/myfile.mp4'}
                                }
                            },
            "/myfile.mp4":  sendfile
        }
    });

Sending mjpeg, simple:

.. code-block:: javascript

    var server=require("rampart-server");
    var curl = require("rampart-curl");
    rampart.globalize(rampart.utils);

    function sendpic(req){

        msg=curl.fetch('https://jpg.nyctmc.org/5',{insecure:true});

        req.chunkSend(
            sprintf("--myboundary\r\nContent-Type: image/jpeg\r\nContent-Length: %d\r\n\r\n%s",
                msg.body.length,msg.body)
        );
    }

    /* we don't need a chunk delay, the fetch takes a bit of time. */
    function mjpeg(req) {
        return {"data":sendpic, chunk:true, headers:
            {"Content-Type": "multipart/x-mixed-replace;boundary=myboundary"}
        };
    }

    /****** START SERVER *******/
    printf("Starting https server\nmjpeg is at http://localhost:8088/mjpeg.jpg\n\n");
    var serverpid=server.start(
    {
        map:
        {
            "/":  function(req){
                        return {
                            status:302,
                            headers: {
                                location:'/mjpeg.jpg'
                            }
                        }
                  },
            "/mjpeg.jpg": mjpeg
        }
    });

Sending mjpeg, using ffmpeg and a webcam on Linux:

.. code-block:: javascript

    var server=require("rampart-server");
    rampart.globalize(rampart.utils);


    function sendpic_wcam(req){
        var file;

        //skip the first callback if first jpeg is not ready.
        try { file = trim(readFile("test.list",0 ,0, true)); } catch(e){}

        if(file)
        {
            req.printf("--myboundary\r\nContent-Type: image/jpeg\r\n\r\n"); //write header
            req.chunkSend('@'+file); //send jpeg directly from file
        }
    }


    function start_ffmpeg(){
        var pid=0;
        try{
            pid=parseInt(readFile("./ffmpeg.pid"));
        } catch(e){}

        if( pid && kill(pid,0))
            return; //it's running

        /* save video from webcam at 10 fps*/
        ret = exec(
            "ffmpeg", {background:true},
            '-hide_banner',
            '-loglevel',           'error',
            '-f',                  'video4linux2',
            '-i',                  '/dev/video0',
            '-vf',                 'fps=10',
            '-q:v',                '8',
            '-f',                  'segment',
            '-segment_time',       '0.0001',
            '-segment_format',     'singlejpeg',
            '-segment_wrap',       '4',
            '-segment_list',       'test.list',
            '-segment_list_size',  '1',
            'test%02d.jpg',
            '-y'
        );
        fprintf("./ffmpeg.pid", "%d", ret.pid);
    }

    function mjpeg(req) {
        start_ffmpeg();

        return {"data":sendpic_wcam, chunk:true, chunkDelay: 100, headers:
            {"Content-Type": "multipart/x-mixed-replace;boundary=myboundary"}
        };
    }

    /****** START SERVER *******/
    printf("Starting https server\nmjpeg is at http://localhost:8088/mjpeg.jpg\n\n");
    var serverpid=server.start(
    {
        user:'nobody',
        map:
        {
            "/":  function(req){
                        return {
                            status:302,
                            headers: {
                                location:'/mjpeg.jpg'
                            }
                        }
                  },
            "/mjpeg.jpg": mjpeg
        }
    });

Websockets
~~~~~~~~~~

The server also serves websocket connections.  The server
callback function for a websocket connection operates much
the same as a normal http callback, with a few exceptions:

* A websocket callback is specified by prepending the path
  in the ``map`` object with ``ws:``. See `Mapped Functions`_ above.

* The mapped callback is run every time the client sends data over
  the websocket.

* Headers and any GET/POST variables are set once in the ``req`` object and
  are provided in the callback when the client first connects.  Subsequent
  callbacks are supplied with the same ``req`` object every time new data
  from the client is received.

* Replies to the connected client may be returned asynchronously using
  :ref:`rampart.event <rampart-main:rampart.event>` functions or
  :ref:`setTimeout <rampart-main:setTimeout()>`.

* The ``req.wsSend()`` function is used to send replies at any time, and as
  many times as desired.  In addition, returning a value from the callback
  performs the same function as ``req.wsSend()``.

* Since the ``req`` object is recycled, variables may be attached to it
  that will be available on subsequent callbacks.  Example: setting
  ``req.userName=getUserName()`` would allow the return value from the
  hypothetical ``getUserName`` function to be accessed
  on subsequent calls.

* ``req.body`` is empty upon first connecting.  In subsequent calls of the
  callback function, ``req.body`` contains the text or binary data sent by
  the client.

* When returning from the callback function,  the value ``undefined`` or
  ``null`` can be specified, if the callback has no data to send, or if the
  data has been stored in the server buffer using ``req.printf`` or
  ``req.put`` above.  Data is sent by returning the values in the same
  format that is used in ``req.wsSend`` below.

In addition to the above, several variables and functions are available only
when using websockets:

req.wsSend(data)
""""""""""""""""

Send data to the client.  How it is sent depends on the type of ``data``
being sent (the type of the variable given to wsSend as a parameter):

   * :green:`String` - The string is sent as text.
   * :green:`Object` - The object is converted to JSON and send as a string.
   * :green:`Buffer` - The object is send as binary data.

In addition to sending the data given as a parameter to ``req.wsSend()``,
any data which was added via ``req.printf`` or ``req.put`` is prepended to
the outgoing data.

If all the necessary data has been stored in the server buffer using
``req.printf`` or ``req.put``, that data can be sent to the client by
calling  ``req.wsSend(null)``.

req.wsEnd([immediate])
""""""""""""""""""""""

Close the websocket connection.  By default ``wsEnd()`` closes the
connection after pending messages have been written.  The optional
``immediate`` is a :green:`Boolean`.  If ``true`` the connection will be
closed immediately regardless of whether any pending data (such as messages
sent with ``req.wsSend()``) have been flushed to the client.

req.wsOnDisconnect(func)
""""""""""""""""""""""""

Takes a :green:`Function` as its sole parameter, which is a function to run
when either the client disconnects or req.wsEnd() is called.

req.wsIsBin
"""""""""""

This variable is set ``true`` when the incoming data in ``req.body`` is sent from
the client as binary data.  Otherwise this is ``false``.

req.count
"""""""""

This variable is set to the number of times the client has sent data.  On
first run of the callback, it is set to ``0`` and is incremented on each
subsequent callback.

req.websocketId
"""""""""""""""

This variable is set to a unique number which may be used to identify the
connection to the client.

Example echo/chat server
""""""""""""""""""""""""

Below is a simplified version of an echo/chat server using websockets
and :ref:`rampart.event <rampart-main:rampart.event>` functions.

.. code-block:: javascript

    /* load the http server module */
    var server=require("rampart-server");

    /* this function just returns html */
    function frontpage(req)
    {
        return {html:
        `<html><body>
            <div id="chatbox"></div>
            <input id="chatin" type=text style="width:50%">
            <button id="send">send</button>
            <script>
                var chatbox = document.getElementById('chatbox');
                var chatin = document.getElementById('chatin');
                var send = document.getElementById('send');
                var socket = new WebSocket("ws://localhost:8088/ws");

                function showmsg(msg){
                    var node = document.createElement('p');
                    var textnode = document.createTextNode(msg.data);
                    node.appendChild(textnode);
                    chatbox.appendChild(node);
                }

                socket.addEventListener('open', function(e){
                    socket.onmessage = showmsg;
                });

                send.onclick = function(){
                    if(socket.readyState === socket.OPEN) {
                        socket.send(chatin.value);
                        chatin.value="";
                    }
                };

            </script>
        </body></html>`};
    }

    function ws_handler(req)
    {
        /* the setup upon first connecting */
        if (req.count==0)
        {
            /* make a name for our event callback function
               which is unique for this connection and that we can
               use to insert and remove the event callback         */
            var func_name = "myfunc_" + req.websocketId;

            /* what to do if client disconnects */
            req.wsOnDisconnect(function(){
                //remove our event callback function */
                rampart.event.off("myev", func_name);
                rampart.utils.printf("disconnected...\n");
            });

            /* insert the callback */
            rampart.event.on("myev", func_name, function(req, data)
            {
                // only send if from someone else
                if (data.id != req.websocketId)
                    req.wsSend(data.msg);
            }, req);

            /* first connect message */
            return "Greetings, I'm an example echo/chat server";
        }

        /* second and subsequent runs of this callback start here: */

        //convert body from a buffer to a string
        req.body = rampart.utils.bufferToString(req.body);

        if(req.body.length)
        {
            /* send message to any other client that is connected */
            rampart.event.trigger(
                "myev",
                {
                    id: req.websocketId,
                    msg: "a message from "+req.websocketId + ": " + req.body
                }
            );

            /* echo message to this client */
            return req.body;
        }
        //do nothing if we get to here.
    }

    var pid=server.start(
    {
        map:
        {
            "/" : frontpage,
            "ws:/ws": ws_handler
        }
    });

    rampart.utils.printf("\nWebchat is available here:\nhttp://127.0.0.1:8088/\n");

.. THIS WAS REMOVED AND WILL BE IN A REPO OF ITS OWN EVENTUALLY

    For a more complete example of using events and websockets,
    see the ``rampart/examples/web_server/modules/wschat.js``
    script.

Standard Server Layout
----------------------

Included in the rampart distribution is a sample server with a standard
layout for the server tree:

* ``web_server/``                    - the main web server directory

* ``web_server/web_server_conf.js``  - the web server start script, with
  options at the top of the file.

* ``web_server/start_server.sh``     - a bash script to start the web server.

* ``web_server/stop_server.sh``      - a bash script to stop the web server.

* ``web_server/apps``                - the standard location for server modules.

* ``web_server/wsapps``              - the standard location for modules
  that serve websocket connections.

* ``web_server/data``                - a location for databases.

* ``web_server/html``                - the standard location for static files.

* ``web_server/logs``                - the standard location for access and
  error log files.

See the ``serverConf`` variable near the top of ``web_server/web_server_conf.js``
for possible settings. The global ``serverConf`` will be available to
all server module scripts.

This layout translates as:

* Access to, e.g. ``http://example.com/index.html`` will return the
  ``web_server/html/index.html``.
* Access to, e.g. ``http://example.com/apps/myapp.html`` will display
  the return value from ``module.exports`` function in the file
  ``web_server/apps/myapp.js``.  For `Mapped Functions`_ the
  ``module.exports`` is an :green:`Object` with keys equating to files in
  the ``apps/myapp`` directory.  With the values in the key/value pairs of
  the :green:`Object` as :green:`Functions`, the url would be
  ``http://example.com/apps/myapp/key`` where the output is the return value
  of the paired :green:`Function`. See `Mapped Functions`_ for examples.

* Access to ``web_server/wsapps`` is similar to ``web_server/apps``
  except that a :green:`Function` or mapped :green:`Functions` are expected
  to handle `Websockets`_ connections.

Although any layout is possible, it is highly recommended that this layout
is adapted and used for ease of use and organization.

C-API
-----

Using the rp-server c-api, server modules can be written in c without
the need for a deep dive into the duktape api.

Basic Layout
~~~~~~~~~~~~

Below is a sample module in c.

.. code-block:: c

    #include "rp_server.h"

    static char *httop =    "<!DOCTYPE html><html><head><title>Sample C-Mod</title></head><body><div>",
                *htbottom = "</div></body></html>";

    static duk_ret_t hello(duk_context *ctx)
    {
        /* declare and init 'rpserv *serv' */
        INIT_RPSERV(serv, ctx);

        //check query string for "?name=..."
        const char *name = rp_server_get_query(serv, "name");

        rp_server_put_string(serv, httop);

        if(name)
            rp_server_printf(serv, "%s%s%s", "<h2>Hello there ", name, "!</h2>");
        else
            rp_server_put_string(serv,
                          "<form>"
                            "Your name: <input name=\"name\" type=text><input type=submit>"
                          "</form>");

        // function must end by calling rp_server_put_reply*
        // and must return 1;
        return rp_server_put_reply_string(serv, 200, "html", htbottom);
    }

    RP_EXPORT_FUNCTION(hello)

To compile:

.. code-block:: shell

    #Linux:
    cc -I/usr/local/rampart/include -fPIC -shared -Wl,-soname,mymod.so -o mymod.so mymod.c
    #Macos:
    cc -I/usr/local/rampart/include -dynamiclib -undefined dynamic_lookup -install_name mymod.so -o mymod.so mymod.c

And then copy ``mymod.so`` to the ``web_server/apps`` directory (or wherever
server modules are stored in a custom setup).

A map of functions may also be exported (see `Mapped Functions`_\ ).

.. code-block:: c

    // a map of urls relative to http(s)://example.com/apps/mymod/
    rp_server_map exports[] =
    {
        {"/",                my_indexfunc },
        {"/index.html",      my_indexfunc },
        {"/myurl_1.html",    my_func1     },
        {"/myurl_2.json",    my_func2     }
    };

    RP_EXPORT_MAP(exports);

Typedefs
~~~~~~~~

rpserv
""""""

Handle for all functions and macros below.

.. code-block:: c

    typedef struct {
        duk_context *ctx;
        void *dhs;
    } rpserv;

rp_server_map
"""""""""""""

A map of functions to url paths.

.. code-block:: c

    typedef struct {
        char *relpath;
        duk_c_function func;
    } rp_server_map;

multipart_postvar
"""""""""""""""""

A struct containing data and metadata from a single entry in a multipart/form-data
post parsed from the body of the request.

.. code-block:: c

    typedef struct {
        void         *value;                 // the extracted data
        size_t        length;                // length of the data
        const char   *file_name;             // if a file upload, otherwise NULL
        const char   *name;                  // name from <input name=...>
        const char   *content_type;          // content-type of part, or NULL
        const char   *content_disposition;   // content-disposition of part, or NULL
    } multipart_postvar;


Macros
~~~~~~

INIT_RPSERV
"""""""""""

Declare and initialize the ``rpserv`` handle.

.. code-block:: c

    static duk_ret_t my_cfunc(duk_context *ctx)
    {
        INIT_RPSERV(serv_var_name, duk_context *ctx);
        //...
    }

RP_EXPORT_FUNCTION
""""""""""""""""""

Export the function that will serve requests. This (or `RP_EXPORT_MAP`_
must be placed somewhere in the file outside other functions.

.. code-block:: c

    static duk_ret_t my_cfunc(duk_context *ctx)
    {
        INIT_RPSERV(serv_var_name, duk_context *ctx);
        //...
    }

    RP_EXPORT_FUNCTION(my_cfunc)

RP_EXPORT_MAP
"""""""""""""

Export the functions that will serve requests. This (or `RP_EXPORT_FUNCTION`_
must be placed somewhere in the file outside other functions.

.. code-block:: c

    static duk_ret_t my_cfunc(duk_context *ctx)
    {
        INIT_RPSERV(serv_var_name, duk_context *ctx);
        //...
    }

    rp_server_map my_exports[] =
    {
        {"/",                my_indexfunc },
        {"/index.html",      my_indexfunc },
        {"/myurl_1.html",    my_func1     },
    };

    RP_EXPORT_MAP(my_exports)

See `rp_server_map`_ above.

Get Functions
~~~~~~~~~~~~~

For an explanation of the logical layout of request variables, see
`The Request Object`_\ .

NOTE:
Except for multipart form data, all values returned will be strings.
If value is repeated in posted form data or in the query, then it will be
returned as a JSON string.  E.g:

::

      http://localhost:8088/apps/my_mod/?x=val1&x=val2
          x = "[\"val1\", \"val2\"]"

      http://localhost:8088/apps/my_mod/?x[key1]=val1&x[key2]=val2
          x = "{\"key1\":\"val1\", \"key2\":\"val2\"}"

      http://localhost:8088/apps/my_mod/?x[key1]=val1&x=val2
          x = "{\"0\":\"val2\", \"key1\":\"val1\"}

rp_server_get_param
"""""""""""""""""""

Get a parameter by name (parameters includes query, post, headers and cookies)

.. code-block:: c

    const char * rp_server_get_param(rpserv *serv, const char *name);

rp_server_get_header
""""""""""""""""""""

Get a header by name.

.. code-block:: c

    const char * rp_server_get_header(rpserv *serv, const char *name);

rp_server_get_query
"""""""""""""""""""

Get a query string variable by name.

.. code-block:: c

    const char * rp_server_get_query(rpserv *serv, const char *name);

rp_server_get_post
""""""""""""""""""

Get a posted form variable or posted JSON parameter by name.

See also: `Get Multipart Form Data`_ for multipart file uploads.

.. code-block:: c

    const char * rp_server_get_post(rpserv *serv, const char *name);

rp_server_get_path
""""""""""""""""""

Get a path component where ``name`` is
``["file"|"path"|"base"|"scheme"|"host"|"url"]``.

.. code-block:: c

    const char * rp_server_get_path(rpserv *serv, const char *name);

rp_server_get_cookie
""""""""""""""""""""

Get a parsed cookie value by name.

.. code-block:: c

    const char * rp_server_get_cookie(rpserv *serv, const char *name);

rp_server_get_body
""""""""""""""""""

Get unparsed, posted body content as a void buffer.

.. code-block:: c

    void * rp_server_get_body(rpserv *serv, size_t *sz);

rp_server_get_req_json
""""""""""""""""""""""

Get a string of the current request object (just like in `The Request
Object` above).  If indent is >0, pretty print the JSON with specified level
of indentation.

.. code-block:: c

    const char * rp_server_get_req_json(rpserv *serv, int indent);

Get Multiple Values Functions
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The following functions returns a null terminated array of null terminated
strings that are the keys in the corresponding section of `The Request Object`_\ .
If ``values`` is not null, values will be set as well.

Example usage:

.. code-block:: c

    int i=0;
    const char **vals, *val, *key;
    const char **keys = rp_server_get_queries(serv, &vals);

    while(keys) //keys and vals will be null if there are no query string params
    {
        key=keys[i];
        if(!key)  //keys and vals are null terminated lists
            break;
        val=vals[i];

        //do something here with key & val

        i++;
    }
    if(keys)
        free(keys);
    if(vals)
        free(vals);

rp_server_get_queries
"""""""""""""""""""""

.. code-block:: c

    const char ** rp_server_get_queries(rpserv *serv, const char ***values);

rp_server_get_posts
"""""""""""""""""""

.. code-block:: c

    const char ** rp_server_get_posts(rpserv *serv, const char ***values);

rp_server_get_params
""""""""""""""""""""

.. code-block:: c

    const char ** rp_server_get_params(rpserv *serv, const char ***values);

rp_server_get_headers
"""""""""""""""""""""

.. code-block:: c

    const char ** rp_server_get_headers(rpserv *serv, const char ***values);

rp_server_get_paths
"""""""""""""""""""

.. code-block:: c

    const char ** rp_server_get_paths(rpserv *serv, const char ***values);

rp_server_get_cookies
"""""""""""""""""""""

.. code-block:: c

    const char ** rp_server_get_cookies(rpserv *serv, const char ***values);

Get Multipart Form Data
~~~~~~~~~~~~~~~~~~~~~~~

rp_server_get_multipart_length
""""""""""""""""""""""""""""""

Get the number of parts in a multipart form post.  If there is no
such post, return will be ``0``.

.. code-block:: c

    int rp_server_get_multipart_length(rpserv *serv);

rp_server_get_multipart_postitem
""""""""""""""""""""""""""""""""
Retrieve the multipart variable and metadata at position "index".
See `multipart_postvar`_ struct above for members.
If index is invalid, returns a zeroed struct (``length`` == ``0``,
others == ``NULL``);

.. code-block:: c

    multipart_postvar rp_server_get_multipart_postitem(rpserv *serv, int index);

Example for uploading files to server:

.. code-block:: c

    #include <errno.h>
    #include "rp_server.h"

    static char *httop    = "<!DOCTYPE html><html><head><title>Sample C-Mod</title></head><body><div>",
                *htbottom = "</div></body></html>";

    static duk_ret_t index_html(duk_context *ctx)
    {
        /* declare and init 'rpserv *serv' */
        INIT_RPSERV(serv, ctx)

        //check query string for "?name=..."
        const char *name = rp_server_get_post(serv, "name");

        rp_server_put_string(serv, httop);

        rp_server_put_string(serv,
            "<form enctype=\"multipart/form-data\" method=\"POST\" action=\"savepost.html\">"
                "File: <input type=\"FILE\" name=\"myfile\"/>"
                "<input type=\"submit\" name=\"Upload\" value=\"Upload\" />"
            "</form>");

        return rp_server_put_reply_string(serv, 200, "html", htbottom);
    }

    static duk_ret_t savepost(duk_context *ctx)
    {
        INIT_RPSERV(serv, ctx);
        multipart_postvar pvar={0};
        FILE *pfile;
        size_t fileout_sz;
        int i=0, nvars = rp_server_get_multipart_length(serv);
        char filename[PATH_MAX];

        rp_server_put_string(serv, httop);

        for(i=0;i<nvars;i++)
        {
            pvar = rp_server_get_multipart_postitem(serv, 0);
            if (strcmp(pvar.name,"myfile")==0)
                break;
        }

        if(i==nvars || !pvar.file_name) //either no vars(0==0) or not found or no filename
        {
            //redirect to index
            rp_server_add_header(serv, "location", "./");
            rp_server_put_string(serv, "<a href=\"./\">Moved</a>");
            return rp_server_put_reply_string(serv, 302, "html", htbottom);
        }

        snprintf(filename, PATH_MAX, "/tmp/%s", pvar.file_name);

        pfile=fopen(filename,"w");
        if(!pfile)
            goto err;

        fileout_sz=fwrite(pvar.value, 1, pvar.length, pfile);

        if(fileout_sz != pvar.length)
            goto err;

        rp_server_printf(serv, "Your file is at %s on the server", filename);

        return rp_server_put_reply_string(serv, 200, "html", htbottom);

        err:
        rp_server_put_string(serv, "Error writing file: ");
        if(errno)
            rp_server_put_string(serv, strerror(errno));
        return rp_server_put_reply_string(serv, 200, "html", htbottom);
    }

    rp_server_map exports[] = {
        {"/",              index_html},
        {"/index.html",    index_html},
        {"/savepost.html", savepost}
    };

    RP_EXPORT_MAP(exports)


Put Functions
~~~~~~~~~~~~~

The following functions add to the buffer that hold the content to be
returned to the connecting client.  See, e.g. `req.put()`_ above.

rp_server_put
"""""""""""""

Add the contents of ``*buf`` to buffer to be returned to client

.. code-block:: c

    void rp_server_put(rpserv *serv, void *buf, size_t bufsz);

rp_server_put_string
""""""""""""""""""""

Add the contents of the null terminated ``*s`` to buffer to be returned to client

.. code-block:: c

    void rp_server_put_string(rpserv *serv, const char *s);

rp_server_put_and_free
""""""""""""""""""""""

Same as `rp_server_put`_\ , but takes a malloced string and frees it
after it is sent to the client.
Using this function with malloced data saves a copy and a free.

.. code-block:: c

    void rp_server_put_and_free(rpserv *serv, void *buf, size_t bufsz);

rp_server_put_string_and_free
"""""""""""""""""""""""""""""

same as `rp_server_put_and_free`_\ , but takes a null terminated string.

.. code-block:: c

    void rp_server_put_string_and_free(rpserv *serv, char *s);

rp_server_printf
""""""""""""""""

Same as `rp_server_put`_\ , but takes format string and 0+ arguments
Returns number of bytes added, or -1 on failure.
See: `here <https://libevent.org/doc/buffer_8h.html#abb5d7931c7be6b2bde597cbb9b6dc72d>`_
for details.

.. code-block:: c

    int rp_server_printf(rpserv *serv, const char *format, ...);

Header Function
~~~~~~~~~~~~~~~

rp_server_add_header
""""""""""""""""""""

Add a header to the reply.  key and val are copied.  Note that
``content-type`` (which is set in  `End Functions`_ below)
and ``date`` are automatically set (or overwritten)
after the exported function returns.

.. code-block:: c

    void rp_server_add_header(rpserv *serv, char *key, char *val);

End Functions
~~~~~~~~~~~~~

The end of a function which serves a webpage must call one of the following
functions.

Note:
   1) One and only one of these should be called at or near the end of the exported function.
   2) Each function returns ``(duk_ret_t)1``.



rp_server_put_reply
"""""""""""""""""""

Set HTTP Code "code" and ``content-type`` that matches "ext" (e.g. "html", "txt", "json", etc. --
for ext->mime_type map, see `Key to Mime Mappings`_\ ).

If all the content to be sent to client has already been added via the rp_server_put_*  functions
above, set buf to NULL and bufsz to 0.

Otherwise to append more content, set buf and bufsz as appropriate.

.. code-block:: c

    duk_ret_t rp_server_put_reply(rpserv *serv, int code, char *ext, void *buf, size_t bufsz);

rp_server_put_reply_string
""""""""""""""""""""""""""

Same as above, but ``*s`` is either a null terminated string or NULL.

.. code-block:: c

    duk_ret_t rp_server_put_reply_string(rpserv *serv, int code, char *ext, const char *s);

rp_server_put_reply_and_free
""""""""""""""""""""""""""""

Same as rp_server_put_reply, but takes a malloced ``void *`` buffer and frees it.
Using this function with malloced data saves a copy and a free.

.. code-block:: c

    duk_ret_t rp_server_put_reply_and_free(rpserv *serv, int code, char *ext, void *buf, size_t bufsz);

rp_server_put_reply_string_and_free
"""""""""""""""""""""""""""""""""""

Same as `rp_server_put_reply_and_free`_\ , but takes a null terminated string.

.. code-block:: c

    duk_ret_t rp_server_put_reply_string_and_free(rpserv *serv, int code, char *ext, char *s);




Technical Notes
---------------

A rampart server script is broken into 3 stages:

.. code-block:: javascript

    begin code

    server.start()

    end of script


At "begin code", code is run in the main thread.  Global functions and
variables declared here will be copied to server threads when the server starts.

At "server.start" new threads are created, each beginning its own event loop.

At "end of script" the main thread's event loop starts and "server.start" is
initialized from within the main thread's event loop.  The main thread
accepts requests and forwards them to the least busy server thread.


Server.start creates the configured number of threads (as specified or equal
to the number of cpu cores on the system).  Upon creation several things
happen:

    * Two JavaScript contexts are created for each thread.  One for HTTP
      requests and one for websockets conversations.

    * Each JavaScript context is a separate JavaScript interpreter.  In
      general, no data is shared between them.

    * An event loop is created for each thread.

    * Global variables and functions from "begin code" are copied from the
      main thread's Duktape context to all the Duktape thread contexts.
      Local variables are lost.

    * The main thread listens for HTTP connections in its event loop and
      assigns them to the least busy server thread's event loops.

    * The thread event loops accept the http connections and pass the http
      request data to the appropriate Duktape context for that thread.  That
      context runs the matching callback and returns data which is passed on
      to the client.

    * Each thread may be handling http requests and multiple websocket
      connections at the same time from within its event loop.

    * The Duktape context for http requests may be destroyed and recreated
      upon timeout. In contrast, the websocket Duktape context will always persist.

    * Any events or setTimeouts set from within server callbacks are run
      within that thread's event loop.  Events and setTimeouts run outside
      the server (in "begin code" or before "end of script") are run in the
      main event loop.  Certain event data is stored in the main thread so
      events can be triggered regardless on which thread they reside.

    * HTTP requests which have a timeout are run from a new thread which can
      be interrupted.  If the timeout is reached before the callback
      function finishes, the thread is canceled and the threads Duktape
      context is destroyed and recreated in order to serve the next request.

    * Since websockets do not timeout, destroying their contexts would
      interrupt its conversation with the client.  So a second, separate
      context per thread which will never be destroyed is used for
      websockets.


Modules vs Global callback functions:

    * a server callback function may be called from a function defined in
      the main script or by loading a module.

    * Global functions and variables are set once when the server script is
      first loaded and cannot be changed without restarting the server.

    * Modules are loaded in each thread and are checked upon each execution.
      If the source script of a module is changed while the server is
      running, it is reloaded.

Return values from server callback function.

    * Strings are copied from Duktape to the buffer that will be returned to
      the client.

    * Wherever possible, buffers are passed by reference without copy to be
      returned to the client.

    * req.put and req.printf data is copied to a buffer which will be
      passed by reference to the client.


Key to Mime Mappings
--------------------

Key/extension to mime-type mappings are shown below. They apply to both the
return value of `Mapped Functions`_ as well as the extension of files served
from `Mapped Directories`_\ . This list of defaults can be appended or modified
using the ``mimeMap`` property in the :green:`Object` passed to `start()`_ \.

An example: If the variable ``jpg`` is set
(e.g. ``var jpg = rampart.utils.readFile("/path/to/my/jpeg.jpg");``),
then ``return {jpeg:jpg};`` at the end of a mapped function would send
the contents of the file ``/path/to/my/jpeg.jpg`` with the
mime-type ``image/jpeg`` to the client.  The same applies to files served
from the filesystem which end in ``.jpeg`` or ``.jpg``.

::

    "3dm"       ->    "x-world/x-3dmf"
    "3dmf"      ->    "x-world/x-3dmf"
    "3gp"       ->    "video/3gpp"
    "3gpp"      ->    "video/3gpp"
    "7z"        ->    "application/x-7z-compressed"
    "a"         ->    "application/octet-stream"
    "aab"       ->    "application/x-authorware-bin"
    "aam"       ->    "application/x-authorware-map"
    "aas"       ->    "application/x-authorware-seg"
    "abc"       ->    "text/vnd.abc"
    "acgi"      ->    "text/html"
    "afl"       ->    "video/animaflex"
    "ai"        ->    "application/postscript"
    "aif"       ->    "audio/aiff"
    "aifc"      ->    "audio/aiff"
    "aiff"      ->    "audio/aiff"
    "aim"       ->    "application/x-aim"
    "aip"       ->    "text/x-audiosoft-intra"
    "ani"       ->    "application/x-navi-animation"
    "aos"       ->    "application/x-nokia-9000-communicator-add-on-software"
    "aps"       ->    "application/mime"
    "arc"       ->    "application/octet-stream"
    "arj"       ->    "application/arj"
    "art"       ->    "image/x-jg"
    "asf"       ->    "video/x-ms-asf"
    "asm"       ->    "text/x-asm"
    "asp"       ->    "text/asp"
    "asx"       ->    "video/x-ms-asf"
    "atom"      ->    "application/atom+xml"
    "au"        ->    "audio/x-au"
    "avi"       ->    "video/x-msvideo"
    "avs"       ->    "video/avs-video"
    "bcpio"     ->    "application/x-bcpio"
    "bin"       ->    "application/octet-stream"
    "bm"        ->    "image/bmp"
    "bmp"       ->    "image/x-ms-bmp"
    "boo"       ->    "application/book"
    "book"      ->    "application/book"
    "boz"       ->    "application/x-bzip2"
    "bsh"       ->    "application/x-bsh"
    "bz"        ->    "application/x-bzip"
    "bz2"       ->    "application/x-bzip2"
    "c"         ->    "text/plain"
    "c++"       ->    "text/plain"
    "cat"       ->    "application/vnd.ms-pki.seccat"
    "cc"        ->    "text/plain"
    "ccad"      ->    "application/clariscad"
    "cco"       ->    "application/x-cocoa"
    "cdf"       ->    "application/x-cdf"
    "cer"       ->    "application/x-x509-ca-cert"
    "cha"       ->    "application/x-chat"
    "chat"      ->    "application/x-chat"
    "class"     ->    "application/x-java-class"
    "com"       ->    "application/octet-stream"
    "conf"      ->    "text/plain"
    "cpio"      ->    "application/x-cpio"
    "cpp"       ->    "text/x-c"
    "cpt"       ->    "application/x-cpt"
    "crl"       ->    "application/pkix-crl"
    "crt"       ->    "application/x-x509-ca-cert"
    "csh"       ->    "text/x-script.csh"
    "css"       ->    "text/css"
    "cxx"       ->    "text/plain"
    "data"      ->    "application/octet-stream"
    "dcr"       ->    "application/x-director"
    "deb"       ->    "application/octet-stream"
    "deepv"     ->    "application/x-deepv"
    "def"       ->    "text/plain"
    "der"       ->    "application/x-x509-ca-cert"
    "dif"       ->    "video/x-dv"
    "dir"       ->    "application/x-director"
    "dl"        ->    "video/x-dl"
    "dll"       ->    "application/octet-stream"
    "dmg"       ->    "application/octet-stream"
    "doc"       ->    "application/msword"
    "docx"      ->    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    "dot"       ->    "application/msword"
    "dp"        ->    "application/commonground"
    "drw"       ->    "application/drafting"
    "dump"      ->    "application/octet-stream"
    "dv"        ->    "video/x-dv"
    "dvi"       ->    "application/x-dvi"
    "dwf"       ->    "model/vnd.dwf"
    "dwg"       ->    "image/x-dwg"
    "dxf"       ->    "image/x-dwg"
    "dxr"       ->    "application/x-director"
    "ear"       ->    "application/java-archive"
    "el"        ->    "text/x-script.elisp"
    "elc"       ->    "application/x-elc"
    "env"       ->    "application/x-envoy"
    "eot"       ->    "application/vnd.ms-fontobject"
    "eps"       ->    "application/postscript"
    "es"        ->    "application/x-esrehber"
    "etx"       ->    "text/x-setext"
    "evy"       ->    "application/x-envoy"
    "exe"       ->    "application/octet-stream"
    "f"         ->    "text/plain"
    "f77"       ->    "text/plain"
    "f90"       ->    "text/plain"
    "fdf"       ->    "application/vnd.fdf"
    "fif"       ->    "image/fif"
    "fli"       ->    "video/x-fli"
    "flo"       ->    "image/florian"
    "flv"       ->    "video/x-flv"
    "flx"       ->    "text/vnd.fmi.flexstor"
    "fmf"       ->    "video/x-atomic3d-feature"
    "for"       ->    "text/plain"
    "fpx"       ->    "image/vnd.fpx"
    "frl"       ->    "application/freeloader"
    "funk"      ->    "audio/make"
    "g"         ->    "text/plain"
    "g3"        ->    "image/g3fax"
    "gif"       ->    "image/gif"
    "gl"        ->    "video/x-gl"
    "gsd"       ->    "audio/x-gsm"
    "gsm"       ->    "audio/x-gsm"
    "gsp"       ->    "application/x-gsp"
    "gss"       ->    "application/x-gss"
    "gtar"      ->    "application/x-gtar"
    "gz"        ->    "application/x-gzip"
    "gzip"      ->    "application/x-gzip"
    "h"         ->    "text/plain"
    "hdf"       ->    "application/x-hdf"
    "help"      ->    "application/x-helpfile"
    "hgl"       ->    "application/vnd.hp-hpgl"
    "hh"        ->    "text/plain"
    "hlb"       ->    "text/x-script"
    "hlp"       ->    "application/x-helpfile"
    "hpg"       ->    "application/vnd.hp-hpgl"
    "hpgl"      ->    "application/vnd.hp-hpgl"
    "hqx"       ->    "application/mac-binhex40"
    "hta"       ->    "application/hta"
    "htc"       ->    "text/x-component"
    "htm"       ->    "text/html"
    "html"      ->    "text/html"
    "htmls"     ->    "text/html"
    "htt"       ->    "text/webviewhtml"
    "htx"       ->    "text/html"
    "ice"       ->    "x-conference/x-cooltalk"
    "ico"       ->    "image/x-icon"
    "idc"       ->    "text/plain"
    "ief"       ->    "image/ief"
    "iefs"      ->    "image/ief"
    "iges"      ->    "application/iges"
    "igs"       ->    "application/iges"
    "ima"       ->    "application/x-ima"
    "imap"      ->    "application/x-httpd-imap"
    "img"       ->    "application/octet-stream"
    "inf"       ->    "application/inf"
    "ins"       ->    "application/x-internett-signup"
    "ip"        ->    "application/x-ip2"
    "iso"       ->    "application/octet-stream"
    "isu"       ->    "video/x-isvideo"
    "it"        ->    "audio/it"
    "iv"        ->    "application/x-inventor"
    "ivr"       ->    "i-world/i-vrml"
    "ivy"       ->    "application/x-livescreen"
    "jad"       ->    "text/vnd.sun.j2me.app-descriptor"
    "jam"       ->    "audio/x-jam"
    "jar"       ->    "application/java-archive"
    "jardiff"   ->    "application/x-java-archive-diff"
    "jav"       ->    "text/plain"
    "java"      ->    "text/plain"
    "jcm"       ->    "application/x-java-commerce"
    "jfif"      ->    "image/jpeg"
    "jfif-tbnl" ->    "image/jpeg"
    "jng"       ->    "image/x-jng"
    "jnlp"      ->    "application/x-java-jnlp-file"
    "jpe"       ->    "image/jpeg"
    "jpeg"      ->    "image/jpeg"
    "jpg"       ->    "image/jpeg"
    "jps"       ->    "image/x-jps"
    "js"        ->    "application/javascript"
    "json"      ->    "application/json"
    "jut"       ->    "image/jutvision"
    "kar"       ->    "music/x-karaoke"
    "kml"       ->    "application/vnd.google-earth.kml+xml"
    "kmz"       ->    "application/vnd.google-earth.kmz"
    "ksh"       ->    "application/x-ksh"
    "la"        ->    "audio/x-nspaudio"
    "lam"       ->    "audio/x-liveaudio"
    "latex"     ->    "application/x-latex"
    "lha"       ->    "application/x-lha"
    "lhx"       ->    "application/octet-stream"
    "list"      ->    "text/plain"
    "lma"       ->    "audio/nspaudio"
    "log"       ->    "text/plain"
    "lst"       ->    "text/plain"
    "lsx"       ->    "text/x-la-asf"
    "ltx"       ->    "application/x-latex"
    "lzh"       ->    "application/x-lzh"
    "lzx"       ->    "application/x-lzx"
    "m"         ->    "text/plain"
    "m1v"       ->    "video/mpeg"
    "m2a"       ->    "audio/mpeg"
    "m2v"       ->    "video/mpeg"
    "m3u"       ->    "audio/x-mpequrl"
    "m3u8"      ->    "application/vnd.apple.mpegurl"
    "m4a"       ->    "audio/x-m4a"
    "m4v"       ->    "video/x-m4v"
    "man"       ->    "application/x-troff-man"
    "map"       ->    "application/x-navimap"
    "mar"       ->    "text/plain"
    "mbd"       ->    "application/mbedlet"
    "mc$"       ->    "application/x-magic-cap-package-1.0"
    "mcd"       ->    "application/x-mathcad"
    "mcf"       ->    "text/mcf"
    "mcp"       ->    "application/netmc"
    "me"        ->    "application/x-troff-me"
    "mht"       ->    "message/rfc822"
    "mhtml"     ->    "message/rfc822"
    "mid"       ->    "audio/midi"
    "midi"      ->    "audio/midi"
    "mif"       ->    "application/x-frame"
    "mime"      ->    "message/rfc822"
    "mjf"       ->    "audio/x-vnd.audioexplosion.mjuicemediafile"
    "mjpg"      ->    "video/x-motion-jpeg"
    "mm"        ->    "application/x-meme"
    "mme"       ->    "application/base64"
    "mml"       ->    "text/mathml"
    "mng"       ->    "video/x-mng"
    "mod"       ->    "audio/x-mod"
    "moov"      ->    "video/quicktime"
    "mov"       ->    "video/quicktime"
    "movie"     ->    "video/x-sgi-movie"
    "mp2"       ->    "audio/mpeg"
    "mp3"       ->    "audio/mpeg"
    "mp4"       ->    "video/mp4"
    "mpa"       ->    "audio/mpeg"
    "mpc"       ->    "application/x-project"
    "mpe"       ->    "video/mpeg"
    "mpeg"      ->    "video/mpeg"
    "mpg"       ->    "video/mpeg"
    "mpga"      ->    "audio/mpeg"
    "mpp"       ->    "application/vnd.ms-project"
    "mpt"       ->    "application/x-project"
    "mpv"       ->    "application/x-project"
    "mpx"       ->    "application/x-project"
    "mrc"       ->    "application/marc"
    "ms"        ->    "application/x-troff-ms"
    "msi"       ->    "application/octet-stream"
    "msm"       ->    "application/octet-stream"
    "msp"       ->    "application/octet-stream"
    "mv"        ->    "video/x-sgi-movie"
    "my"        ->    "audio/make"
    "mzz"       ->    "application/x-vnd.audioexplosion.mzz"
    "nap"       ->    "image/naplps"
    "naplps"    ->    "image/naplps"
    "nc"        ->    "application/x-netcdf"
    "ncm"       ->    "application/vnd.nokia.configuration-message"
    "nif"       ->    "image/x-niff"
    "niff"      ->    "image/x-niff"
    "nix"       ->    "application/x-mix-transfer"
    "nsc"       ->    "application/x-conference"
    "nvd"       ->    "application/x-navidoc"
    "o"         ->    "application/octet-stream"
    "oda"       ->    "application/oda"
    "odg"       ->    "application/vnd.oasis.opendocument.graphics"
    "odp"       ->    "application/vnd.oasis.opendocument.presentation"
    "ods"       ->    "application/vnd.oasis.opendocument.spreadsheet"
    "odt"       ->    "application/vnd.oasis.opendocument.text"
    "ogg"       ->    "audio/ogg"
    "omc"       ->    "application/x-omc"
    "omcd"      ->    "application/x-omcdatamaker"
    "omcr"      ->    "application/x-omcregerator"
    "p"         ->    "text/x-pascal"
    "p10"       ->    "application/x-pkcs10"
    "p12"       ->    "application/x-pkcs12"
    "p7c"       ->    "application/x-pkcs7-mime"
    "p7m"       ->    "application/x-pkcs7-mime"
    "p7r"       ->    "application/x-pkcs7-certreqresp"
    "p7s"       ->    "application/pkcs7-signature"
    "part"      ->    "application/pro_eng"
    "pas"       ->    "text/pascal"
    "pbm"       ->    "image/x-portable-bitmap"
    "pcl"       ->    "application/x-pcl"
    "pct"       ->    "image/x-pict"
    "pcx"       ->    "image/x-pcx"
    "pdb"       ->    "application/x-pilot"
    "pdf"       ->    "application/pdf"
    "pem"       ->    "application/x-x509-ca-cert"
    "pfunk"     ->    "audio/make"
    "pgm"       ->    "image/x-portable-graymap"
    "pic"       ->    "image/pict"
    "pict"      ->    "image/pict"
    "pkg"       ->    "application/x-newton-compatible-pkg"
    "pko"       ->    "application/vnd.ms-pki.pko"
    "pl"        ->    "application/x-perl"
    "plx"       ->    "application/x-pixclscript"
    "pm"        ->    "application/x-perl"
    "pm4"       ->    "application/x-pagemaker"
    "pm5"       ->    "application/x-pagemaker"
    "png"       ->    "image/png"
    "pnm"       ->    "image/x-portable-anymap"
    "pot"       ->    "application/mspowerpoint"
    "pov"       ->    "model/x-pov"
    "ppa"       ->    "application/vnd.ms-powerpoint"
    "ppm"       ->    "image/x-portable-pixmap"
    "pps"       ->    "application/mspowerpoint"
    "ppt"       ->    "application/vnd.ms-powerpoint"
    "pptx"      ->    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    "ppz"       ->    "application/mspowerpoint"
    "prc"       ->    "application/x-pilot"
    "pre"       ->    "application/x-freelance"
    "prt"       ->    "application/pro_eng"
    "ps"        ->    "application/postscript"
    "psd"       ->    "application/octet-stream"
    "pvu"       ->    "paleovu/x-pv"
    "pwz"       ->    "application/vnd.ms-powerpoint"
    "py"        ->    "text/x-script.phyton"
    "pyc"       ->    "application/x-bytecode.python"
    "qcp"       ->    "audio/vnd.qcelp"
    "qd3"       ->    "x-world/x-3dmf"
    "qd3d"      ->    "x-world/x-3dmf"
    "qif"       ->    "image/x-quicktime"
    "qt"        ->    "video/quicktime"
    "qtc"       ->    "video/x-qtc"
    "qti"       ->    "image/x-quicktime"
    "qtif"      ->    "image/x-quicktime"
    "ra"        ->    "audio/x-realaudio"
    "ram"       ->    "audio/x-pn-realaudio"
    "rar"       ->    "application/x-rar-compressed"
    "ras"       ->    "image/x-cmu-raster"
    "rast"      ->    "image/cmu-raster"
    "rexx"      ->    "text/x-script.rexx"
    "rf"        ->    "image/vnd.rn-realflash"
    "rgb"       ->    "image/x-rgb"
    "rm"        ->    "audio/x-pn-realaudio"
    "rmi"       ->    "audio/mid"
    "rmm"       ->    "audio/x-pn-realaudio"
    "rmp"       ->    "audio/x-pn-realaudio"
    "rng"       ->    "application/ringing-tones"
    "rnx"       ->    "application/vnd.rn-realplayer"
    "roff"      ->    "application/x-troff"
    "rp"        ->    "image/vnd.rn-realpix"
    "rpm"       ->    "application/x-redhat-package-manager"
    "rss"       ->    "application/rss+xml"
    "rt"        ->    "text/richtext"
    "rtf"       ->    "application/rtf"
    "rtx"       ->    "text/richtext"
    "run"       ->    "application/x-makeself"
    "rv"        ->    "video/vnd.rn-realvideo"
    "s"         ->    "text/x-asm"
    "s3m"       ->    "audio/s3m"
    "saveme"    ->    "application/octet-stream"
    "sbk"       ->    "application/x-tbook"
    "scm"       ->    "text/x-script.scheme"
    "sdml"      ->    "text/plain"
    "sdp"       ->    "application/x-sdp"
    "sdr"       ->    "application/sounder"
    "sea"       ->    "application/x-sea"
    "set"       ->    "application/set"
    "sgm"       ->    "text/sgml"
    "sgml"      ->    "text/sgml"
    "sh"        ->    "text/x-script.sh"
    "shar"      ->    "application/x-shar"
    "shtml"     ->    "text/html"
    "sid"       ->    "audio/x-psid"
    "sit"       ->    "application/x-stuffit"
    "skd"       ->    "application/x-koan"
    "skm"       ->    "application/x-koan"
    "skp"       ->    "application/x-koan"
    "skt"       ->    "application/x-koan"
    "sl"        ->    "application/x-seelogo"
    "smi"       ->    "application/smil"
    "smil"      ->    "application/smil"
    "snd"       ->    "audio/basic"
    "sol"       ->    "application/solids"
    "spc"       ->    "text/x-speech"
    "spl"       ->    "application/futuresplash"
    "spr"       ->    "application/x-sprite"
    "sprite"    ->    "application/x-sprite"
    "src"       ->    "application/x-wais-source"
    "ssi"       ->    "text/x-server-parsed-html"
    "ssm"       ->    "application/streamingmedia"
    "sst"       ->    "application/vnd.ms-pki.certstore"
    "step"      ->    "application/step"
    "stl"       ->    "application/sla"
    "stp"       ->    "application/step"
    "sv4cpio"   ->    "application/x-sv4cpio"
    "sv4crc"    ->    "application/x-sv4crc"
    "svf"       ->    "image/x-dwg"
    "svg"       ->    "image/svg+xml"
    "svgz"      ->    "image/svg+xml"
    "svr"       ->    "application/x-world"
    "swf"       ->    "application/x-shockwave-flash"
    "t"         ->    "application/x-troff"
    "talk"      ->    "text/x-speech"
    "tar"       ->    "application/x-tar"
    "tbk"       ->    "application/x-tbook"
    "tcl"       ->    "application/x-tcl"
    "tcsh"      ->    "text/x-script.tcsh"
    "tex"       ->    "application/x-tex"
    "texi"      ->    "application/x-texinfo"
    "texinfo"   ->    "application/x-texinfo"
    "text"      ->    "text/plain"
    "tgz"       ->    "application/gnutar"
    "tif"       ->    "image/tiff"
    "tiff"      ->    "image/tiff"
    "tk"        ->    "application/x-tcl"
    "tr"        ->    "application/x-troff"
    "ts"        ->    "video/mp2t"
    "tsi"       ->    "audio/tsp-audio"
    "tsp"       ->    "audio/tsplayer"
    "tsv"       ->    "text/tab-separated-values"
    "turbot"    ->    "image/florian"
    "txt"       ->    "text/plain"
    "uni"       ->    "text/uri-list"
    "unis"      ->    "text/uri-list"
    "unv"       ->    "application/i-deas"
    "uri"       ->    "text/uri-list"
    "uris"      ->    "text/uri-list"
    "ustar"     ->    "application/x-ustar"
    "uu"        ->    "text/x-uuencode"
    "uue"       ->    "text/x-uuencode"
    "vcd"       ->    "application/x-cdlink"
    "vcs"       ->    "text/x-vcalendar"
    "vda"       ->    "application/vda"
    "vdo"       ->    "video/vdo"
    "vew"       ->    "application/groupwise"
    "viv"       ->    "video/vivo"
    "vivo"      ->    "video/vivo"
    "vmd"       ->    "application/vocaltec-media-desc"
    "vmf"       ->    "application/vocaltec-media-file"
    "voc"       ->    "audio/voc"
    "vos"       ->    "video/vosaic"
    "vox"       ->    "audio/voxware"
    "vqe"       ->    "audio/x-twinvq-plugin"
    "vqf"       ->    "audio/x-twinvq"
    "vql"       ->    "audio/x-twinvq-plugin"
    "vrml"      ->    "application/x-vrml"
    "vrt"       ->    "x-world/x-vrt"
    "vsd"       ->    "application/x-visio"
    "vst"       ->    "application/x-visio"
    "vsw"       ->    "application/x-visio"
    "w60"       ->    "application/wordperfect6.0"
    "w61"       ->    "application/wordperfect6.1"
    "w6w"       ->    "application/msword"
    "war"       ->    "application/java-archive"
    "wav"       ->    "audio/wav"
    "wb1"       ->    "application/x-qpro"
    "wbmp"      ->    "image/vnd.wap.wbmp"
    "web"       ->    "application/vnd.xara"
    "webm"      ->    "video/webm"
    "webp"      ->    "image/webp"
    "wiz"       ->    "application/msword"
    "wk1"       ->    "application/x-123"
    "wmf"       ->    "windows/metafile"
    "wml"       ->    "text/vnd.wap.wml"
    "wmlc"      ->    "application/vnd.wap.wmlc"
    "wmls"      ->    "text/vnd.wap.wmlscript"
    "wmlsc"     ->    "application/vnd.wap.wmlscriptc"
    "wmv"       ->    "video/x-ms-wmv"
    "woff"      ->    "font/woff"
    "woff2"     ->    "font/woff2"
    "word"      ->    "application/msword"
    "wp"        ->    "application/wordperfect"
    "wp5"       ->    "application/wordperfect"
    "wp6"       ->    "application/wordperfect"
    "wpd"       ->    "application/wordperfect"
    "wq1"       ->    "application/x-lotus"
    "wri"       ->    "application/x-wri"
    "wrl"       ->    "application/x-world"
    "wrz"       ->    "model/vrml"
    "wsc"       ->    "text/scriplet"
    "wsrc"      ->    "application/x-wais-source"
    "wtk"       ->    "application/x-wintalk"
    "x-png"     ->    "image/png"
    "xbm"       ->    "image/x-xbitmap"
    "xdr"       ->    "video/x-amt-demorun"
    "xgz"       ->    "xgl/drawing"
    "xhtml"     ->    "application/xhtml+xml"
    "xif"       ->    "image/vnd.xiff"
    "xl"        ->    "application/excel"
    "xla"       ->    "application/excel"
    "xlb"       ->    "application/excel"
    "xlc"       ->    "application/excel"
    "xld"       ->    "application/excel"
    "xlk"       ->    "application/excel"
    "xll"       ->    "application/excel"
    "xlm"       ->    "application/excel"
    "xls"       ->    "application/vnd.ms-excel"
    "xlsx"      ->    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    "xlt"       ->    "application/excel"
    "xlv"       ->    "application/excel"
    "xlw"       ->    "application/excel"
    "xm"        ->    "audio/xm"
    "xml"       ->    "text/xml"
    "xmz"       ->    "xgl/movie"
    "xpi"       ->    "application/x-xpinstall"
    "xpix"      ->    "application/x-vnd.ls-xpix"
    "xpm"       ->    "image/xpm"
    "xspf"      ->    "application/xspf+xml"
    "xsr"       ->    "video/x-amt-showrun"
    "xwd"       ->    "image/x-xwd"
    "xyz"       ->    "chemical/x-pdb"
    "z"         ->    "application/x-compressed"
    "zip"       ->    "application/zip"
    "zoo"       ->    "application/octet-stream"
    "zsh"       ->    "text/x-script.zsh"

