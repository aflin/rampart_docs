Frequently Asked Questions
==========================

.. include:: special.rst

General
-------

How do I install Rampart?
~~~~~~~~~~~~~~~~~~~~~~~~~

Download the latest binary for your platform from
`rampart.dev/downloads/latest/ <https://rampart.dev/downloads/latest/>`_
as a ``.tar.gz`` file.  Extract it and change to the ``rampart/``
directory:

.. code-block:: bash

    tar xzf rampart-<version>-<platform>.tar.gz
    cd rampart

From there you have two options:

* **Run the installer** — execute ``./install.sh``, which will guide you
  through the installation process.

* **Run in place** — Rampart is designed to run from any directory, so
  long as the directory structure of the extracted distribution is
  maintained.  No installation step is required; you can run
  ``./bin/rampart`` directly or add the ``bin/`` directory to your
  ``PATH``.


What is Rampart and how does it differ from Node.js?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Rampart is a low-memory-footprint JavaScript runtime that uses the
`Duktape JavaScript Engine <https://duktape.org>`_ to bring together
high-performance C libraries for web and information management
applications.

While both Rampart and Node.js let you write server-side JavaScript,
they have fundamental differences:

+---------------------+-------------------------------------------+--------------------------------------------+
| Feature             | Rampart                                   | Node.js                                    |
+=====================+===========================================+============================================+
| JS Engine           | Duktape (compact, low memory)             | V8 (fast JIT compilation, higher memory)   |
+---------------------+-------------------------------------------+--------------------------------------------+
| Threading           | Native POSIX threads, each with its own   | Single-threaded event loop; worker_threads |
|                     | JS interpreter; threads are integral to   | available but not used by the core HTTP    |
|                     | the built-in HTTP server                  | server or standard libraries               |
+---------------------+-------------------------------------------+--------------------------------------------+
| Event Loop          | libevent2                                 | libuv                                      |
+---------------------+-------------------------------------------+--------------------------------------------+
| Included Modules    | SQL database, full-text search, HTTP      | HTTP, filesystem, streams, child processes |
|                     | server, crypto, HTML parser, Redis,       |                                            |
|                     | LMDB, Python interop, and more            |                                            |
+---------------------+-------------------------------------------+--------------------------------------------+
| Package Ecosystem   | Built-in modules; no npm                  | npm with hundreds of thousands of packages |
+---------------------+-------------------------------------------+--------------------------------------------+
| Performance Profile | Slower JS interpretation, but C-backed    | Fast JS execution, I/O performance depends |
|                     | functions provide speed where it counts   | on ecosystem packages                      |
+---------------------+-------------------------------------------+--------------------------------------------+
| Module Format       | CommonJS-style ``require()``              | CommonJS and ES Modules                    |
+---------------------+-------------------------------------------+--------------------------------------------+

Rampart's philosophy is that JavaScript orchestrates high-performance C
code.  The result is a single product that replaces an entire
`LAMP <https://en.wikipedia.org/wiki/LAMP_(software_bundle)>`_ or
`MEAN <https://en.wikipedia.org/wiki/MEAN_(solution_stack)>`_ stack while
consuming considerably fewer resources.


Can I use npm packages with Rampart?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

No.  Rampart does not use V8 or the Node.js runtime, so npm packages
that depend on Node.js built-in modules (``fs``, ``http``, ``stream``,
etc.) will not work.

In practice, most of the functionality you would reach for npm to provide
is already included in the Rampart distribution.

Some functionality is **built into the rampart executable** and is always
available without ``require()``:

* **Utility functions** — ``rampart.utils`` (file I/O, printf, exec, etc.)
* **Threading** — ``rampart.thread`` (POSIX threads, locks, clipboard)
* **Vector operations** — ``rampart.vector`` (typed vectors, distance metrics)
* **Events** — ``rampart.event`` (cross-thread event system)
* **CSV import** — ``rampart.import`` (CSV parsing)

The remaining functionality ships as **C modules** that come with the
distribution and are loaded with ``require()``:

* **HTTP server** — ``rampart-server`` (multi-threaded, WebSocket support)
* **HTTP client** — ``rampart-curl`` (HTTP, FTP, SMTP, POP3, IMAP)
* **SQL database** — ``rampart-sql`` (Texis with full-text search)
* **Key-value store** — ``rampart-lmdb``
* **Redis** — ``rampart-redis``
* **Crypto** — ``rampart-crypto`` (OpenSSL)
* **HTML parsing** — ``rampart-html`` (Tidy-HTML5)
* **Markdown** — ``rampart-cmark``
* **Image processing** — ``rampart-gm`` (GraphicsMagick)
* **Text extraction** — ``rampart-totext`` (PDF, DOCX, XLSX, etc.)
* **Python interop** — ``rampart-python``
* **Networking** — ``rampart-net`` (TCP sockets, SSL/TLS)
* **URL parsing** — ``rampart-url``
* **robots.txt** — ``rampart-robots``

Pure-JavaScript libraries with no Node.js dependencies may work, but you
should test carefully.  You can also write your own C modules using the
Duktape C API (see `How do I write a C module for Rampart?`_).


What version of ECMAScript does Rampart support?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

By default, Rampart supports partial ECMAScript 2015 (ES6) and
ECMAScript 2016 (ES7) through Duktape.  This includes ``TypedArray``,
``Buffer``, ``Proxy``, ``Symbol``, template literals, and more.

For full ES2015+ support — including ``async``/``await``, destructuring,
arrow functions, ``for...of``, ``class`` syntax, and Promises — place one
of the following directives at the top of your script:

.. code-block:: javascript

    "use transpiler"; // ES2015+ via a fast, built-in C transpiler
                      //    OR
    "use babel";      // Full ES2015+ via the Babel transpiler (much slower)

The built-in transpiler (``"use transpiler"``) is written in C and is
significantly faster than Babel, which runs as JavaScript.  In both
cases, the transpiled output is cached to disk (e.g.,
``myscript.transpiled.js`` or ``myscript.babel.js``).  On subsequent
runs, the cached version is reused if the source file has not changed,
so the startup cost is only paid once.

Note that Rampart's non-standard extensions (template literal ``sprintf``
shortcuts and triple-backtick unescaped strings) work with
``"use transpiler"`` but do **not** work with ``"use babel"``.


What are Rampart's non-standard JavaScript extensions?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Rampart adds two extensions to template literal syntax.  These work
with ``"use transpiler"`` or without any transpiler, but are **not**
available with ``"use babel"``:

**Template literal sprintf shortcut** — embed format specifiers directly
in template literals:

.. code-block:: javascript

    var name = "<b>world</b>";
    console.log(`Hello ${%H:name}`);
    // equivalent to: console.log("Hello " + sprintf("%H", name));
    // output: Hello &lt;b&gt;world&lt;/b&gt;

**Triple-backtick unescaped strings** — backslashes are treated as
literal characters:

.. code-block:: javascript

    var path = ```C:\Users\myfile.txt```;
    // path === "C:\\Users\\myfile.txt"

These are Rampart-specific extensions and are not part of the ECMAScript
standard.  They work with ``"use transpiler"`` but not with
``"use babel"``.


Are operations synchronous or asynchronous by default?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Synchronous by default.** Unlike Node.js, where I/O functions
typically return Promises or accept callbacks, most Rampart functions
block until they complete:

.. code-block:: javascript

    // These all block:
    var data = rampart.utils.readFile("/path/to/file");
    var res  = curl.fetch("http://example.com/");
    var rows = sql.exec("SELECT * FROM bigtable", {maxRows: -1});
    var val  = redis.get("mykey");

This makes Rampart scripts straightforward to write — no callback
pyramids or ``await`` chains for simple operations.

When you need non-blocking behavior, opt in explicitly:

* ``curl.fetchAsync()`` / ``curl.submitAsync()`` — async HTTP requests
* Redis commands with ``{async: true}`` — async Redis operations
* ``rampart.thread`` — offload work to a background thread
* ``setTimeout()`` / ``setInterval()`` — deferred execution

This is a significant difference from Node.js, where the default is
asynchronous and you opt in to synchronous variants (e.g.,
``fs.readFileSync()``).


What is rampart.globalize and why do I see it in so many scripts?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Many Rampart scripts begin with:

.. code-block:: javascript

    rampart.globalize(rampart.utils);

This copies all properties of ``rampart.utils`` into the global scope,
so you can call utility functions directly by name.  The difference is
significant — compare:

.. code-block:: javascript

    // Without globalize:
    rampart.utils.fprintf(rampart.utils.stderr, "Error: %s\n", msg);
    var data = rampart.utils.readFile("/path/to/file");
    var info = rampart.utils.stat("/path/to/file");
    rampart.utils.printf("count: %d\n", n);

    // With globalize:
    rampart.globalize(rampart.utils);

    fprintf(stderr, "Error: %s\n", msg);
    var data = readFile("/path/to/file");
    var info = stat("/path/to/file");
    printf("count: %d\n", n);

For C programmers, the globalized form is immediately familiar —
``fprintf(stderr, ...)``, ``printf()``, ``stat()``, ``fopen()``,
``fclose()``, ``sleep()`` all work just as you would expect.

You can also globalize selectively if you only want a few functions:

.. code-block:: javascript

    rampart.globalize(rampart.utils, ["printf", "sprintf", "fprintf", "stderr"]);

If you prefer not to pollute the global namespace, use
``rampart.localize()`` inside a function to make the same names available
as local variables:

.. code-block:: javascript

    function handleRequest(req) {
        rampart.localize(rampart.utils);
        // printf, sprintf, etc. available here but not globally
        printf("handling request\n");
    }


Modules
-------

How does require() work compared to Node.js?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Rampart uses a CommonJS-style ``require()`` function, but the module
search path is different from Node.js.  There is no ``node_modules``
directory.

The ``.js`` extension is optional.  ``require()`` searches in this order:

1. The absolute path (if one is given).
2. The calling module's own directory (if called from within a module).
3. ``process.scriptPath`` — the directory of the currently running script.
4. ``process.scriptPath + "/modules/"``
5. ``~/.rampart/modules/``
6. The ``$RAMPART_PATH`` environment variable (if set).
7. ``process.modulesPath`` — the system modules directory from the install path.

C modules (``.so`` shared libraries) are searched the same way.

.. code-block:: javascript

    var Sql  = require("rampart-sql");       // included C module
    var util = require("./myutil.js");       // relative path
    var util2 = require("myutil");           // .js extension is optional

Modules are loaded once and cached — subsequent ``require()`` calls for the
same module return the cached instance.


What is the difference between require() and rampart.include()?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``require()`` loads a module with its own scope.  The module exports
values via ``module.exports``, and its internal variables are private.

``rampart.include()`` executes a JavaScript file in the **global** scope —
all variables and functions defined in the included file become global.
It also automatically processes Babel if ``"use babel"`` is specified in
the included file.

.. code-block:: javascript

    // module pattern (private scope)
    var mymod = require("mymodule");
    mymod.doSomething();

    // include pattern (global scope)
    rampart.include("helpers.js");
    helperFunction();  // now available as a global

Use ``require()`` for encapsulated, reusable code.  Use
``rampart.include()`` when you intentionally want to merge code into the
global namespace.


How do I write a C module for Rampart?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If you are a C developer, you can extend Rampart with native modules
using the Duktape C API.

Include the ``rampart.h`` header and export a ``duk_open_module``
function:

.. code-block:: c

    #include "rampart.h"

    static duk_ret_t timesthree(duk_context *ctx) {
        double val = duk_get_number(ctx, 0);
        duk_push_number(ctx, val * 3);
        return 1;
    }

    duk_ret_t duk_open_module(duk_context *ctx) {
        duk_push_c_function(ctx, timesthree, 1);
        return 1;
    }

Compile as a shared library:

.. code-block:: bash

    # Linux
    cc -I/usr/local/rampart/include -fPIC -shared \
       -Wl,-soname,times3.so -o times3.so times3.c

    # macOS
    cc -I/usr/local/rampart/include -dynamiclib \
       -undefined dynamic_lookup \
       -install_name times3.so -o times3.so times3.c

Then load it like any other module:

.. code-block:: javascript

    var x3 = require("times3");
    console.log(x3(7));  // 21

The full Duktape C API documentation is available at
`duktape.org/api.html <https://duktape.org/api.html>`_.


Concurrency and Asynchronous Programming
-----------------------------------------

How does Rampart's threading model work?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Rampart provides **real POSIX threads**, each with its own independent
Duktape JavaScript interpreter and event loop.  Threading in Rampart has
two distinct but related uses:

**General-purpose threads** — created with ``new rampart.thread()`` in
any script, with or without the HTTP server.  These are useful for
CPU-bound work, background tasks, parallel processing, or any situation
where you want concurrent execution:

.. code-block:: javascript

    var thr = new rampart.thread();

    thr.exec({
        threadFunc: function(arg) {
            // runs in a separate OS thread with its own JS interpreter
            return arg * 2;
        },
        threadArg: 21,
        callbackFunc: function(result, error) {
            // runs back in the main thread's event loop
            console.log(result);  // 42
        }
    });

A persistent thread stays alive between calls, which avoids the overhead
of copying global state on each invocation:

.. code-block:: javascript

    var thr = new rampart.thread(true);  // persistent

    thr.exec(doWork, firstJob, onDone);
    // later...
    thr.exec(doWork, secondJob, onDone);

    // must explicitly close when finished
    thr.close();

**Server threads** — ``rampart-server`` internally creates a pool of
these same threads (default: one per CPU core) and automatically
dispatches incoming HTTP and WebSocket requests across them.  You do not
create these yourself; they are managed by ``server.start()``.

Both types share the same underlying mechanism and the same rules apply
to each.

Node.js offers ``worker_threads`` with separate V8 isolates, which is a
similar concept.  The difference is one of integration: Rampart's
``rampart.thread`` is a first-class primitive used throughout the
platform — including by the built-in HTTP server — whereas Node's
``worker_threads`` are an opt-in addition that the standard HTTP server
and most libraries do not use.

**Key points:**

* Each thread has a completely separate JavaScript context — there is
  no shared memory between threads.
* Global variables defined **before** ``new rampart.thread()`` are copied
  into the new thread's context.  Variables defined **after** the thread
  is created are **not** available.
* Use ``rampart.thread.put()`` / ``rampart.thread.get()`` (the thread
  clipboard) or ``rampart.event`` for inter-thread communication.
* Use ``new rampart.lock()`` for mutual exclusion when coordinating
  access to external resources.
* Threads can be created inside other threads, but a child thread can
  only be used from the thread that created it.


Why can't my thread see variables I defined after creating it?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Only global variables that exist at the moment ``new rampart.thread()``
is called are copied into the thread's JavaScript context.  Variables
created afterward are invisible to the thread.

.. code-block:: javascript

    var available = "I exist before the thread";
    var thr = new rampart.thread();
    var notAvailable = "I was defined too late";

    thr.exec(function() {
        console.log(available);     // works
        console.log(notAvailable);  // undefined!
    });

This is because each thread receives a **snapshot** of the global scope
at creation time.  If you need to pass data to a running thread later,
use the thread clipboard:

.. code-block:: javascript

    rampart.thread.put("myKey", someValue);

    // inside the thread:
    var val = rampart.thread.get("myKey");


How do threads communicate with each other?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

There are three mechanisms affecting communication between threads:

**Thread Clipboard** — a key-value store shared across all threads:

.. code-block:: javascript

    // Thread A
    rampart.thread.put("result", {count: 42});

    // Thread B
    var data = rampart.thread.get("result");  // deep copy

``rampart.thread.get()`` returns a deep copy.  You can also use
``rampart.thread.waitfor("key", timeout)`` to block until a key is
available, and ``rampart.thread.onGet("key*", callback)`` to be
notified when matching keys are set.

**Events** — broadcast notifications across threads:

.. code-block:: javascript

    // Listening thread
    rampart.event.on("myevent", "handler1", function(uservar, triggerval) {
        console.log("got:", triggerval);
    });

    // Triggering thread
    rampart.event.trigger("myevent", "hello");

**Locks** — POSIX mutexes for critical sections:

.. code-block:: javascript

    var lock = new rampart.lock("mylock");
    lock.lock();
    // critical section
    lock.unlock();


Does Rampart support Promises and async/await?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Yes, but you must enable a transpiler by placing one of the following at
the top of your script:

.. code-block:: javascript

    "use transpiler"; // ES2015+ via a fast, built-in C transpiler (recommended)
                      //     OR
    "use babel";      // Full ES2015+ via the Babel transpiler (much slower)

Example:

.. code-block:: javascript

    "use transpiler";

    function fetchData() {
        return new Promise(resolve => {
            setTimeout(() => resolve("done"), 100);
        });
    }

    async function main() {
        var result = await fetchData();
        console.log(result);  // "done"
    }

    main();

The ``rampart-curl`` and ``rampart-redis`` modules are designed to take
advantage of this.  Their async variants — ``curl.fetchAsync()``,
``curl.submitAsync()``, and Redis async commands — return Promises and
work with ``async``/``await`` when a transpiler is enabled:

.. code-block:: javascript

    "use transpiler";

    var curl = require("rampart-curl");

    async function main() {
        var res = await curl.fetchAsync("http://example.com/");
        console.log(res.status);  // 200
    }

    main();

Without a transpiler, you can still use ``setTimeout``,
``setInterval``, and callback-based patterns for asynchronous work.


What are the transpiler gotchas I should know about?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

When using ``"use babel"`` or ``"use transpiler"``, be aware of these
limitations:

**const is not enforced at runtime.** The transpiler converts ``const``
to ``var``, so reassignment will silently succeed instead of throwing a
``TypeError``:

.. code-block:: javascript

    "use transpiler";

    const x = 10;
    x = 20;  // No error!  x is now 20.

**await inside loops does not work per-iteration** with
``"use transpiler"``.  The loop body runs without waiting:

.. code-block:: javascript

    "use transpiler";

    // BROKEN — all iterations run without awaiting
    for (var i = 0; i < urls.length; i++) {
        var res = await curl.fetchAsync(urls[i]);  // does not pause
    }

    // WORKAROUND — collect promises, then await
    var promises = urls.map(function(url) {
        return curl.fetchAsync(url);
    });
    var results = await Promise.all(promises);

**Destructuring combined with await does not work** with
``"use transpiler"``:

.. code-block:: javascript

    "use transpiler";

    // BROKEN
    var {status, body} = await curl.fetchAsync(url);

    // WORKAROUND — await first, then destructure
    var res = await curl.fetchAsync(url);
    var status = res.status;
    var body = res.body;

These limitations stem from the lighter-weight transpilation approach.
``"use babel"`` handles more of these cases correctly but has slower
startup.  Test your specific patterns if in doubt.


Why did my setTimeout callback fire late?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Rampart's event loop is based on libevent2.  Synchronous, blocking calls
prevent the event loop from running, which delays all pending callbacks:

.. code-block:: javascript

    setTimeout(function() {
        console.log("hello");  // you might expect this after 100ms
    }, 100);

    rampart.utils.sleep(3);  // blocks the event loop for 3 seconds!
    // "hello" prints AFTER the 3-second sleep, not after 100ms

The rule: avoid long-running synchronous operations if you depend on
timely callback execution.  Use threads for CPU-bound work, and use the
async variants of ``rampart-curl`` and ``rampart-redis`` for I/O-bound
work.


HTTP Server
-----------

How does rampart-server compare to Express.js?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``rampart-server`` is a multi-threaded HTTP/HTTPS server module based on
libevhtp_ws and libevent2.  It ships with the Rampart distribution and is
loaded with ``require("rampart-server")``.  Unlike Express, it is not a
framework you install separately.

Key differences:

* **Threading** — ``rampart-server`` automatically dispatches requests
  across a thread pool (default: one thread per CPU core), each with its
  own JavaScript context and event loop.  Express runs on Node's
  single-threaded event loop by default.
* **Routing** — Routes are defined in a ``map`` object.  Priority is
  determined by path specificity (exact > regex > glob), not declaration
  order.  Express uses middleware chain order.
* **No middleware chain** — Instead of ``app.use()``, Rampart provides
  ``beginFunc`` (runs before each request), ``endFunc`` (after), and
  ``notFoundFunc`` hooks.
* **Module hot-reload** — Mapped modules are re-checked on each request
  and reloaded if changed on disk.  No server restart required.
* **WebSockets included** — No external package needed; part of
  ``rampart-server``.

.. code-block:: javascript

    var server = require("rampart-server");

    server.start({
        bind: "0.0.0.0:8080",
        map: {
            "/":            "/var/www/html",        // static files
            "/api/search":  function(req) {         // dynamic route
                                return {json: {results: []}};
                            },
            "ws:/chat":     function(req) {         // websocket
                                req.wsSend("hello");
                            }
        }
    });


What is web_server_conf.js and when should I use it?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

While the ``rampart-server`` module gives you full flexibility to build a
server from scratch, the Rampart distribution includes a ready-to-use
web server layout in the ``web_server/`` directory of the installation or
distribution directory, with a standard structure:

.. code-block:: none

    web_server/
        web_server_conf.js   — main configuration script
        html/                — static files (document root)
        apps/                — server-side JavaScript app modules
        wsapps/              — WebSocket app modules
        data/                — application data
        logs/                — access and error logs

The ``web_server_conf.js`` script is a self-contained configuration file
that you edit to set up your server.  It wraps the
``rampart-webserver`` module (a JavaScript module included with the
distribution) and provides everything most applications need out of the
box:

* **Start/stop/restart/status** commands — run it as
  ``rampart web_server_conf.js start|stop|restart|status``
* **HTTP to HTTPS redirection** — set ``redir: true`` or
  ``redirPort: 80``
* **Let's Encrypt integration** — set ``letsencrypt: "yourdomain.com"``
  for automatic HTTPS setup
* **Self-signed certificates** — set ``selfSign: true`` for development
* **Process monitoring** — set ``monitor: true`` to auto-restart on crash
* **Log rotation** — set ``rotateLogs: true`` with configurable interval
  and retention
* **Daemon mode** — set ``daemon: true`` to detach from the terminal
* **Privilege dropping** — set, e.g. ``user: "www-data"`` when binding to
  ports < 1024 as root

To get started, copy the ``web_server`` directory to your project and
edit ``web_server_conf.js``.  The configuration is a single
:green:`Object` with commented-out defaults — uncomment and change what
you need:

.. code-block:: javascript

    var serverConf = {
        bindAll:       true,
        port:          443,
        secure:        true,
        letsencrypt:   "example.com",
        redir:         true,          // redirect HTTP port 80 -> HTTPS
        user:          "www-data",
        daemon:        true,
        monitor:       true,
        rotateLogs:    true,
        rotateInterval: "daily",
        serverRoot:    working_directory
    };

    require("rampart-webserver").web_server_conf(serverConf);

Place static files in ``html/``, app modules in ``apps/``, and WebSocket
modules in ``wsapps/``.  The URL mapping is automatic — for example, a
module at ``apps/search.js`` is served at ``/apps/search/`` or
``/apps/search.html``.  You can also
add custom mappings via the ``appendMap`` option without replacing the
default layout.

For most use cases, editing ``web_server_conf.js`` is all you need.  The
lower-level ``rampart-server`` module is there when you need full control
over routing, custom request handling, or non-standard server
architectures.


How do I serve static files?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The easiest way is to use the standard server layout (see
`What is web_server_conf.js and when should I use it?`_).  Place your
files in the ``html/`` directory and they are served automatically at the
root URL.

If you need custom headers for a specific path — for example,
cache-control headers for an images directory — use the ``appendMap``
option in ``web_server_conf.js``:

.. code-block:: javascript

    var serverConf = {
        // ... other settings ...
        appendMap: {
            "/images": {
                path: working_directory + "/html/images",
                headers: {"Cache-Control": "max-age=31536000, public"}
            }
        },
        serverRoot: working_directory
    };

If you are using the ``rampart-server`` module directly, map a URL path
to a filesystem directory in the ``map`` object:

.. code-block:: javascript

    server.start({
        map: {
            "/":       "/path/to/html",
            "/images": {
                path: "/path/to/images",
                headers: {"Cache-Control": "max-age=31536000, public"}
            }
        }
    });

In both cases, the server automatically serves ``index.html`` for
directory requests, maps file extensions to MIME types, supports gzip
compression, and handles HTTP Range requests for partial content.


How do I handle POST data and file uploads?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

POST data is available on the ``req`` object passed to your route
function:

* ``req.body`` — the raw request body as a :green:`Buffer`.
* ``req.postData`` — parsed form data (``application/x-www-form-urlencoded``)
  or JSON (``application/json``) as an :green:`Object`.
* ``req.formData`` — multipart file uploads
  (``multipart/form-data``) as an :green:`Array` of objects containing
  file name, content type, and data.
* ``req.params`` — all parsed variables from postData, formData and/or the query string.  

.. code-block:: javascript

    function handlePost(req) {
        // URL-encoded or JSON POST
        var username = req.postData.content.username;

        // File upload
        if (req.formData && req.formData.content.length) {
            var file = req.formData.content[0];
            // file.filename, file["content-type"], file.content (Buffer)
        }

        return {json: {status: "ok"}};
    }

The maximum body size defaults to 50 MB and can be changed with the
``maxBodySize`` option in ``server.start()``.


How do WebSockets work?
~~~~~~~~~~~~~~~~~~~~~~~

Prefix a route path with ``"ws:"`` in the map:

.. code-block:: javascript

    server.start({
        map: {
            "ws:/chat": function(req) {
                if (req.count == 0) {
                    // First call: client just connected, no websocket
                    // upgrade yet
                    do_setup();

                    // set a disconnect callback
                    req.wsOnDisconnect(function() {
                        // cleanup on disconnect
                    });
                } else {
                    // Subsequent calls: client sent data
                    var message = rampart.utils.bufferToString(req.body);
                    req.wsSend("Echo: " + message);
                }
            }
        }
    });

Key details:

* The callback is invoked once on connection (``req.count == 0``), then
  again each time the client sends data.
* The ``req`` object persists across calls for the same connection — you
  can attach custom properties to it.
* ``req.wsSend(data)`` sends data to the client (:green:`String` for
  text, :green:`Buffer` for binary, :green:`Object` for JSON).
* ``req.wsEnd()`` closes the connection.
* Use ``rampart.event`` to broadcast messages to all connected clients
  across threads.


How do I return different content types?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Route functions return an :green:`Object` with a key that indicates the
MIME type:

.. code-block:: javascript

    // HTML
    return {html: "<h1>Hello</h1>"};

    // JSON
    return {json: {status: "ok", count: 42}};

    // Plain text
    return {txt: "Hello, world"};

    // Binary data
    return {bin: myBuffer, headers: {"Content-Type": "application/octet-stream"}};

    // Serve a file directly (efficient — no readFile needed)
    return {html: "@/var/www/page.html"};

    // Custom status code and headers
    return {
        status: 302,
        headers: {"Location": "/new-page"}
    };

Available shorthand keys include ``html``, ``json``, ``txt``, ``xml``,
``css``, ``js``, ``bin``, ``pdf``, ``png``, ``jpg``, ``gif``, and
others.  You can also set arbitrary ``Content-Type`` values via the
``headers`` property.


Why don't my variables persist between requests?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Each server thread has its own isolated JavaScript context.  Module-level
variables are **not shared** across threads, and each thread loads its
own copy of your modules.

.. code-block:: javascript

    // This will NOT work as a shared counter:
    var count = 0;
    function handler(req) {
        count++;  // each thread has its own copy of count
        return {json: {count: count}};
    }

For shared state, use an external store:

* ``rampart-sql`` or ``rampart-lmdb`` for persistent shared data.
* ``rampart-redis`` for in-memory shared state.
* ``rampart-lmdb`` for on-disk shared state.
* The thread clipboard (``rampart.thread.put()`` /
  ``rampart.thread.get()``) for simple cross-thread values.


Database and Search
-------------------

What is Texis and how does it compare to SQLite?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``rampart-sql`` embeds **Texis**, a full SQL relational database engine
developed by Thunderstone, LLC.  It includes **Metamorph**, an
integrated full-text search engine with linguistic capabilities far
beyond SQLite's FTS.

+---------------------+--------------------------------------------+-----------------------------------+
| Feature             | Texis (rampart-sql)                        | SQLite                            |
+=====================+============================================+===================================+
| Full-Text Search    | Metamorph: suffix/prefix processing,       | FTS5: basic tokenized search,     |
|                     | thesaurus, phrase proximity, wildcards,    | limited ranking                   |
|                     | relevance ranking, linguistic derivations  |                                   |
+---------------------+--------------------------------------------+-----------------------------------+
| Vector Search       | Built-in ``vecdist()`` for cosine,         | Requires extensions               |
|                     | Euclidean, and dot-product distance        |                                   |
+---------------------+--------------------------------------------+-----------------------------------+
| Geocoding           | Built-in ``latlon2geocode()`` for          | Requires extensions               |
|                     | geographic bounded-area searches           |                                   |
+---------------------+--------------------------------------------+-----------------------------------+
| Data Types          | VARCHAR, INT, DOUBLE, DATE, COUNTER,       | TEXT, INTEGER, REAL, BLOB, NULL   |
|                     | STRLST, VARBYTE, INDIRECT, GEOCODE         |                                   |
+---------------------+--------------------------------------------+-----------------------------------+
| Storage             | Directory-based (one dir per database)     | Single file                       |
+---------------------+--------------------------------------------+-----------------------------------+

.. code-block:: javascript

    var Sql = require("rampart-sql");
    var sql = new Sql.connection("/path/to/mydb", true);  // true = create

    sql.exec("CREATE TABLE docs (title VARCHAR(128), body VARCHAR(8000))");
    sql.exec("INSERT INTO docs VALUES(?, ?)", ["My Title", "The full text..."]);
    sql.exec("CREATE FULLTEXT INDEX docs_body_ftx ON docs(body)");

    var results = sql.exec(
        "SELECT title FROM docs WHERE body LIKEP 'full text search'",
        {maxRows: 100}
    );


How does full-text index maintenance work?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Full-text search with ``LIKEP`` always works, even on newly inserted
rows.  Texis will do a linear scan of any rows not yet covered by the
index, so queries always return correct results.

However, full-text indexes are **not automatically updated** on a
schedule unless you explicitly configure one.  As the number of
unindexed rows grows, the linear scan portion becomes slower.  For large
or frequently updated tables, you should set up index maintenance.

**Manual update** — rebuild or optimize the index when convenient:

.. code-block:: javascript

    // Rebuild the index
    sql.exec("CREATE FULLTEXT INDEX docs_body_ftx ON docs(body)");

    // Or optimize only if enough rows have changed
    sql.exec("ALTER INDEX docs_body_ftx OPTIMIZE HAVING COUNT(NewRows) > 1000");

**Scheduled update** — use ``scheduleUpdate()`` to have Rampart
automatically check and update the index at a regular interval:

.. code-block:: javascript

    // Check every 2 hours starting now; rebuild if >= 1000 rows changed
    sql.scheduleUpdate("docs_body_ftx", "now", "2 hours", 1000);

The schedule is stored in the database's ``SYSUPDATE`` table, and a
monitor process is launched automatically to perform the updates.  See
the *Text Index Maintenance* section and the ``scheduleUpdate()``
function in the ``rampart-sql`` documentation for full details.

Regular B-tree indexes (``CREATE INDEX``) are maintained automatically on
every INSERT, UPDATE, and DELETE — this applies only to full-text
indexes.


How do I build a full-text search over documents (PDF, DOCX, etc.)?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Use ``rampart-totext`` to extract plain text from documents, then store
and index the text with ``rampart-sql``.

``rampart-totext`` handles a wide range of formats out of the box —
DOCX, PPTX, XLSX, ODT, PDF, HTML, Markdown, RTF, LaTeX, man pages,
EPUB, and more.  Most formats are processed entirely in C with no
external dependencies.  PDF requires the ``pdftotext`` utility
(``poppler-utils`` package), and legacy ``.doc`` requires ``catdoc``.

Here is a complete example that imports a directory of documents into a
searchable database:

.. code-block:: javascript

    rampart.globalize(rampart.utils);
    var Sql    = require("rampart-sql");
    var totext = require("rampart-totext");

    var sql = new Sql.connection("/path/to/searchdb", true);

    sql.exec(
        "CREATE TABLE docs (filename VARCHAR(256), body VARCHAR(64000))"
    );

    // Import documents from a directory
    var files = readdir("/path/to/documents");
    for (var i = 0; i < files.length; i++) {
        var filepath = "/path/to/documents/" + files[i];
        try {
            var text = totext.convertFile(filepath);
            sql.exec("INSERT INTO docs VALUES(?, ?)", [files[i], text]);
        } catch(e) {
            printf("Skipping %s: %s\n", files[i], e.message);
        }
    }

    // Create a full-text index
    sql.exec("CREATE FULLTEXT INDEX docs_body_ftx ON docs(body)");

    // Search
    var results = sql.exec(
        "SELECT filename FROM docs WHERE body LIKEP ?",
        ["search terms here"],
        {maxRows: 20}
    );

You can also use ``totext.convert()`` to extract text from in-memory
content — for example, from a file uploaded via the HTTP server:

.. code-block:: javascript

    function handleUpload(req) {
        var totext = require("rampart-totext");

        if (req.formData && req.formData.content.length) {
            var file = req.formData.content[0];
            var text = totext.convert(file.content);
            // index 'text' into your database
        }
        return {json: {status: "ok"}};
    }

For details on ``convertFile()`` and ``convert()`` options, including
MIME type detection via the ``details`` parameter, see the
``rampart-totext`` documentation.


When should I use rampart-sql vs rampart-lmdb vs rampart-redis?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Each serves a different purpose:

* **rampart-sql** (Texis) — Use when you need relational queries, SQL
  joins, full-text search, or structured data with complex query
  patterns.  Best for content-heavy applications.

* **rampart-lmdb** — Use when you need a fast, embedded key-value store
  with ACID transactions.  Ideal for configuration data, caches,
  session stores, or any workload that maps naturally to key-value
  lookups.  Very high read performance.

* **rampart-redis** — Use when you need a shared in-memory data
  structure server.  Best for pub/sub messaging, real-time counters,
  queues, and scenarios where multiple processes or machines need to
  share state.  Requires a running Redis server.


What is the difference between sql.exec() and sql.query()?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Both execute SQL statements, but they differ in error handling:

* ``sql.exec()`` **throws on errors that prevent the statement from
  executing** — for example, a syntax error or a missing table.  However,
  it does **not** throw for all error conditions.  For instance, inserting
  a duplicate row into a table with a unique index will not throw; the
  insert silently fails (``rowCount`` is 0) and the error is reported in
  ``sql.errMsg``.

* ``sql.query()`` **never throws**.  Instead, it sets ``sql.errMsg``
  and returns normally.  Use this when you want full control over error
  handling.

For both functions, ``sql.errMsg`` is always set to the most recent
error or message.  Check it after any call where you need to know
whether something went wrong:

.. code-block:: javascript

    // exec() — throws on hard errors, but not on duplicate insert
    sql.exec("INSERT INTO users VALUES(?)", [name]);
    if (sql.errMsg) {
        // e.g., unique constraint violation — no throw, but errMsg is set
        console.log("Insert issue: " + sql.errMsg);
    }

    // query() — never throws, always check errMsg
    sql.query("INSERT INTO users VALUES(?)", [name]);
    if (sql.errMsg) {
        console.log("Insert issue: " + sql.errMsg);
    }

    // exec() WILL throw for hard errors like bad syntax:
    try {
        sql.exec("SELET * FORM users");  // typo
    } catch(e) {
        console.log("SQL error: " + e.message);
    }

Also be aware that SELECT statements default to returning a maximum of
**10 rows**.  Set ``maxRows`` to get more, or ``-1`` for unlimited:

.. code-block:: javascript

    var results = sql.exec("SELECT * FROM bigtable", {maxRows: 1000});
    var all     = sql.exec("SELECT * FROM bigtable", {maxRows: -1});


How do I prevent SQL injection?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Always use parameterized queries.  Pass values as an :green:`Array` or
:green:`Object` — never concatenate user input into SQL strings:

.. code-block:: javascript

    // SAFE — parameterized
    sql.exec("SELECT * FROM users WHERE name = ?", [userInput]);

    // SAFE — named parameters
    sql.exec("SELECT * FROM users WHERE name = ?name", {name: userInput});

    // DANGEROUS — string concatenation
    sql.exec("SELECT * FROM users WHERE name = '" + userInput + "'");

Note that even a single parameter must be wrapped in an :green:`Array`:
``[value]``, not ``value``.


File I/O and System
-------------------

How does file I/O work compared to Node's fs module?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Rampart's file I/O lives in ``rampart.utils`` and follows a style closer
to C ``stdio`` than Node's ``fs`` module:

.. code-block:: javascript

    rampart.globalize(rampart.utils);

    // Read an entire file (returns a Buffer by default)
    var buf = readFile("/path/to/file");

    // Read as a string
    var str = readFile("/path/to/file", 0, 0, true);

    // Write to a file
    fprintf("/path/to/output.txt", "Hello %s\n", "world");

    // C-style file handle operations
    var fh = fopen("/path/to/file", "r");
    var line = fgets(fh, 4096);  // read up to 4096 bytes, stopping at newline
    fclose(fh);

    // Read lines with an iterator pattern
    var rl = readLine("/path/to/file");
    var line;
    while ((line = rl.next()) !== null) {
        // process line
    }

    // Get file metadata (like C stat())
    var info = stat("/path/to/file");
    // info.size, info.permissions, info.mtime, info.isFile, etc.

There are no streams or ``fs.createReadStream()`` equivalents.  For
large files, use ``readFile()`` with ``offset`` and ``length``
parameters, or ``readLine()`` for line-by-line reading of text.


What are the extended printf format codes?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Rampart's ``printf``/``sprintf`` support all standard C format
specifiers plus several useful extensions:

+--------+-----------------------------+-----------------------------------------------+
| Code   | Purpose                     | Example                                       |
+========+=============================+===============================================+
| ``%s`` | String                      | ``sprintf("Hello %s", "world")``              |
+--------+-----------------------------+-----------------------------------------------+
| ``%d`` | Integer                     | ``sprintf("Count: %d", 42)``                  |
+--------+-----------------------------+-----------------------------------------------+
| ``%f`` | Float                       | ``sprintf("Pi: %.2f", 3.14159)``              |
+--------+-----------------------------+-----------------------------------------------+
| ``%J`` | JSON                        | ``sprintf("%2J", obj)`` — pretty-printed JSON |
+--------+-----------------------------+-----------------------------------------------+
| ``%H`` | HTML encode                 | ``sprintf("%H", "<script>")``                 |
|        |                             | → ``&lt;script&gt;``                          |
+--------+-----------------------------+-----------------------------------------------+
| ``%!H``| HTML decode                 | ``sprintf("%!H", "&amp;")`` → ``&``           |
+--------+-----------------------------+-----------------------------------------------+
| ``%U`` | URL encode                  | ``sprintf("%U", "a b")`` → ``a%20b``          |
+--------+-----------------------------+-----------------------------------------------+
| ``%B`` | Base64 encode               | ``sprintf("%B", data)``                       |
+--------+-----------------------------+-----------------------------------------------+
| ``%!B``| Base64 decode               | ``sprintf("%!B", b64str)``                    |
+--------+-----------------------------+-----------------------------------------------+
| ``%P`` | Pretty-print with wrapping  | ``sprintf("%40P", longText)``                 |
+--------+-----------------------------+-----------------------------------------------+

These are available in ``printf()``, ``sprintf()``, ``fprintf()``, and
``bprintf()`` (which returns a :green:`Buffer`).

.. code-block:: javascript

    rampart.globalize(rampart.utils);

    // Pretty-print an object as JSON with 3-space indent
    printf("%3J\n", {name: "Rampart", version: 1});

    // HTML-encode user input for safe output
    var safe = sprintf("%H", userInput);

    // Base64-encode binary data
    var encoded = sprintf("%B", binaryBuffer);


How do I run external commands?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Use ``rampart.utils.exec()`` for fine-grained control, or
``rampart.utils.shell()`` for quick bash commands:

.. code-block:: javascript

    rampart.globalize(rampart.utils);

    // exec() — run a command with arguments
    var res = exec("ls", "-la", "/tmp");
    // res.stdout, res.stderr, res.exitStatus

    // With options
    var res = exec("mycommand", {
        timeout: 5000,           // kill after 5 seconds
        stdin: "input data",     // pipe data to stdin
        background: true,        // don't wait for completion
        env: {PATH: "/usr/bin"}, // set environment variables
        cd: "/working/dir"       // change directory before executing
    }, "arg1", "arg2");

    // shell() — run a bash command string
    var res = shell("cat /etc/hostname | tr -d '\\n'");

Both return an :green:`Object` with ``stdout``, ``stderr``,
``exitStatus``, and ``timedOut`` properties.


How do fork() and daemon() work?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

These are real POSIX ``fork()`` and double-fork operations — familiar
territory for C developers, but potentially new for Node.js developers.
Both work the same way: they return the child's PID to the parent and
``0`` to the child.  The difference is that ``daemon()`` double-forks and
detaches from the controlling terminal, so the child runs as a
background daemon.

.. code-block:: javascript

    rampart.globalize(rampart.utils);

    // fork() — create a child process
    var pid = fork();
    if (pid > 0) {
        // parent process — pid is the child's PID
    } else if (pid == 0) {
        // child process
    } else {
        // error
    }

    // daemon() — same interface, but double-forks and detaches
    var pid = daemon();
    if (pid > 0) {
        // original process — pid is the daemon's PID
        // typically exit here
    } else if (pid == 0) {
        // daemon process — detached from terminal
    }

**Important:** ``fork()`` and ``daemon()`` cannot be used while threads
are open.  If you have created any ``rampart.thread`` instances, calling
``fork()`` or ``daemon()`` will throw an error.

For inter-process communication between forked processes, use
``newPipe()``:

.. code-block:: javascript

    var pipe = newPipe();
    var pid = fork(pipe);

    if (pid > 0) {
        pipe.write({message: "hello from parent"});
    } else if (pid == 0) {
        pipe.onRead(function(data) {
            console.log(data.message);  // "hello from parent"
        });
    }


Buffers and Data
----------------

What buffer types are available and how do they differ?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Rampart (via Duktape) provides several buffer types.  They share the
same underlying memory model but have different APIs and capabilities:

**Plain buffers** — lightweight, no property table, created with
``Uint8Array.allocPlain()``.  These are what
``rampart.utils.stringToBuffer()`` and ``rampart.utils.bprintf`` return.

**ArrayBuffer** — the standard ES2015 backing store.  Cannot be indexed
directly; use a typed array or DataView to access data.

**TypedArrays** — ``Uint8Array``, ``Int8Array``, ``Uint16Array``,
``Int16Array``, ``Uint32Array``, ``Int32Array``, ``Uint8ClampedArray``,
``Float32Array``, ``Float64Array``.  Provide indexed access with a
specific element type.  Multiple typed arrays can share the same
``ArrayBuffer``.

**DataView** — provides explicit get/set methods with endianness
control (``getInt16()``, ``setFloat32()``, etc.).

**Node.js Buffer** — Duktape's compatibility implementation.  Provides
``slice()``, ``copy()``, ``fill()``, ``equals()``, ``compare()``,
``concat()``, and typed read/write methods (``readUInt32LE()``,
``writeFloatBE()``, etc.).

The following table summarizes what works in Rampart:

+----------------------------+-------+--------+-----------+----------+--------+
| Feature                    | Plain | Array  | Typed     | DataView | Node.js|
|                            | Buf   | Buffer | Array     |          | Buffer |
+============================+=======+========+===========+==========+========+
| Index read/write           | Yes   | No     | Yes       | No       | Yes    |
+----------------------------+-------+--------+-----------+----------+--------+
| ``.length``                | Yes   | No     | Yes       | No       | Yes    |
+----------------------------+-------+--------+-----------+----------+--------+
| ``.byteLength``            | Yes   | Yes    | Yes       | Yes      | Yes    |
+----------------------------+-------+--------+-----------+----------+--------+
| ``.byteOffset``            | Yes   | No     | Yes       | Yes      | Yes    |
+----------------------------+-------+--------+-----------+----------+--------+
| ``.buffer`` (ArrayBuffer)  | Yes   | N/A    | Yes       | Yes      | Yes    |
+----------------------------+-------+--------+-----------+----------+--------+
| ``.subarray()``            | Yes   | No     | Yes       | No       | Yes    |
+----------------------------+-------+--------+-----------+----------+--------+
| ``.set()``                 | Yes   | No     | Yes       | No       | Yes    |
+----------------------------+-------+--------+-----------+----------+--------+
| ``.slice()``               | No    | Yes    | No        | No       | Yes    |
+----------------------------+-------+--------+-----------+----------+--------+
| ``.copy()``                | No    | No     | No        | No       | Yes    |
+----------------------------+-------+--------+-----------+----------+--------+
| ``.fill()``                | No    | No     | No        | No       | Yes    |
+----------------------------+-------+--------+-----------+----------+--------+
| ``.concat()``              | No    | No     | No        | No       | Yes    |
+----------------------------+-------+--------+-----------+----------+--------+
| ``.equals()`` / compare    | No    | No     | No        | No       | Yes    |
+----------------------------+-------+--------+-----------+----------+--------+
| ``.toString()`` / encoding | No    | No     | No        | No       | Yes    |
+----------------------------+-------+--------+-----------+----------+--------+
| ``.toJSON()``              | No    | No     | No        | No       | Yes    |
+----------------------------+-------+--------+-----------+----------+--------+
| read/writeUInt16LE, etc.   | No    | No     | No        | No       | Yes    |
+----------------------------+-------+--------+-----------+----------+--------+
| getInt32/setFloat64, etc.  | No    | No     | No        | Yes      | No     |
+----------------------------+-------+--------+-----------+----------+--------+
| Endianness control         | No    | No     | No        | Yes      | Yes    |
+----------------------------+-------+--------+-----------+----------+--------+
| forEach/map/filter/etc.    | No    | No     | No        | No       | No     |
+----------------------------+-------+--------+-----------+----------+--------+

**Important notes for Node.js developers:**

* ``Buffer.from()`` accepts a :green:`String`, :green:`Buffer`,
  :green:`ArrayBuffer`, typed array, or :green:`Array` of numbers
  (e.g., ``Buffer.from([0x68, 0x65, 0x6c, 0x6c, 0x6f])``).  Values
  are truncated to 0–255.
* ``Buffer.alloc(n, fill)`` accepts a :green:`Number`, :green:`String`,
  or :green:`Buffer` as the fill value (e.g., ``Buffer.alloc(4, 0xFF)``).
* ``Buffer.toString("hex")`` and ``Buffer.toString("base64")`` are
  **not supported**.  Use ``rampart.utils.hexify()`` and
  ``sprintf("%B", buf)`` instead.
* ``buf.indexOf()``, ``buf.includes()``, ``buf.swap16()``, and
  ``buf.swap32()`` are **not available**.
* TypedArrays do **not** have higher-order methods (``forEach``,
  ``map``, ``filter``, ``reduce``, ``sort``, ``indexOf``, etc.).
  Convert to an :green:`Array` first if needed.

**Concatenating buffers:** The easiest and most efficient way to
concatenate two buffers is with ``bprintf()``, which works with any
buffer type and returns a plain buffer:

.. code-block:: javascript

    var combined = bprintf('%s%s', buf1, buf2);

This works regardless of whether the arguments are plain buffers,
Node.js Buffers, or TypedArrays.

**Printf format codes and buffer types:** The ``%s``, ``%B``/``%!B``
(base64), ``%U``/``%!U`` (URL encode), and ``%H``/``%!H`` (HTML encode)
formats all accept any buffer type — plain buffers, Node.js Buffers,
TypedArrays, and strings work interchangeably.

**Practical guidance:**

For most Rampart scripting, you will work with plain buffers (returned by
``readFile()``, ``stringToBuffer()``, etc.) and Node.js Buffers (created
with ``Buffer.from()`` / ``Buffer.alloc()``).  Use ``DataView`` when you
need to read or write multi-byte values with explicit endianness.  Use
``rampart.utils.stringToBuffer()`` and ``rampart.utils.bufferToString()``
to convert between strings and buffers.

.. code-block:: javascript

    rampart.globalize(rampart.utils);

    // rampart.utils functions return plain buffers
    var data = readFile("/path/to/file");
    var str  = bufferToString(data);
    var buf  = stringToBuffer("hello");

    // Node.js Buffer for richer API (slice, copy, typed read/write)
    var nbuf = Buffer.from("hello");
    var s    = nbuf.slice(0, 3);           // shared view
    nbuf.copy(otherBuf, 0, 0, 5);         // copy bytes
    var val  = nbuf.readUInt16LE(0);       // read little-endian uint16

    // DataView for explicit endianness
    var ab = new ArrayBuffer(8);
    var dv = new DataView(ab);
    dv.setFloat64(0, 3.14159, true);       // little-endian
    var pi = dv.getFloat64(0, true);

    // Hex and Base64 via rampart.utils
    var hex = hexify(data);                // buffer to hex string
    var raw = dehexify("deadbeef");        // hex string to buffer
    var b64 = sprintf("%B", data);         // buffer to base64
    var dec = sprintf("%!B", b64);         // base64 to string

    // Concatenate any buffer types
    var combined = bprintf('%s%s', data, nbuf);


How do I handle objects with cyclic references?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

JavaScript's ``JSON.stringify()`` throws an error on objects that
reference themselves.  Rampart provides a round-trip solution:

**Serialize** with ``sprintf("%!J", obj)`` — cyclic references are
replaced with ``{"_cyclic_ref": "$"}`` markers instead of throwing:

.. code-block:: javascript

    rampart.globalize(rampart.utils);

    var obj = {name: "test", count: 42};
    obj.self = obj;  // cyclic reference

    var json = sprintf("%!J", obj);
    // '{"name":"test", "count":42, "self":{"_cyclic_ref": "$"}}'

**Restore** with ``JSON.parse(json, true)`` — passing ``true`` as the
second argument tells Rampart to resolve the ``_cyclic_ref`` markers
back into actual object references:

.. code-block:: javascript

    var restored = JSON.parse(json, true);

    restored.self === restored;              // true
    restored.self.self.self.name;            // "test"

The ``true`` second argument to ``JSON.parse()`` is a Rampart extension
— in standard JavaScript, the second argument is a reviver function.
Note that ``%J`` (without ``!``) will also fall back to this safe mode
automatically if it detects that normal serialization would fail due to
cyclic references.


Deployment
----------

How do I daemonize and deploy the Rampart server?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Using rampart --server** — the ``rampart`` executable can start a
server directly from the command line using the standard directory
layout.  It daemonizes by default, serves from the current directory
(or a specified root), and accepts options on the command line:

.. code-block:: bash

    # Start a server from the current directory
    rampart --server

    # Specify a root directory and port
    rampart --server --port 8080 --bindAll true /path/to/web_server

    # HTTPS with Let's Encrypt
    rampart --server --letsencrypt example.com --redir true

    # Stop it
    rampart --server --stop

    # Quick test server (foreground, single-threaded, directory listings)
    rampart --quickserver --port 3000

Run ``rampart --server --help`` for usage, ``--lsopts`` for all
available options, and ``--showdefaults`` to see the default
configuration.  ``--quickserver`` uses different defaults suited for
development: it runs in the foreground, uses a single thread, enables
directory listings, and disables logging.

**Using web_server_conf.js** — for deployments where you want a
persistent, version-controlled configuration, copy the ``web_server/``
directory from the distribution and edit ``web_server_conf.js`` (see
`What is web_server_conf.js and when should I use it?`_).  It provides
``start``, ``stop``, ``restart``, and ``status`` commands, log rotation,
and process monitoring:

.. code-block:: bash

    rampart web_server_conf.js start
    rampart web_server_conf.js stop
    rampart web_server_conf.js status

**Using the server module directly** — for full control over routing
and request handling, use ``rampart-server`` in your own script.  The
``daemon`` option (defaults to ``false``) detaches from the terminal:

.. code-block:: javascript

    var server = require("rampart-server");

    server.start({
        bind: "0.0.0.0:8080",
        daemon: true,
        user: "www-data",       // drop privileges
        map: { /* ... */ }
    });


How do I set up HTTPS?
~~~~~~~~~~~~~~~~~~~~~~

Pass SSL options to ``server.start()``:

.. code-block:: javascript

    var server = require("rampart-server");

    server.start({
        bind: "0.0.0.0:443",
        secure: true,
        sslKeyFile:  "/etc/letsencrypt/live/example.com/privkey.pem",
        sslCertFile: "/etc/letsencrypt/live/example.com/fullchain.pem",
        sslMinVersion: "tls1.2",  // default
        map: { /* ... */ }
    });

When ``secure`` is ``true``, all bound addresses use HTTPS.  The
``rampart-webserver.js`` extras module also provides Let's Encrypt
integration for automated certificate management.


Interoperability
----------------

Can I call Python code from Rampart?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Yes.  The ``rampart-python`` module embeds a Python interpreter and
provides automatic type conversion between JavaScript and Python:

.. code-block:: javascript

    var python = require("rampart-python");

    // Import a Python module
    var math = python.import("math");
    var result = math.sqrt.toValue(16);   // 4.0

    // Run arbitrary Python code
    var mymod = python.importString(`
    def greet(name):
        return f"Hello, {name}!"
    `);

    var msg = mymod.greet("Rampart").toValue();
    console.log(msg);  // "Hello, Rampart!"

Type mapping:

+------------------------+------------------------+
| JavaScript             | Python                 |
+========================+========================+
| Number                 | float                  |
+------------------------+------------------------+
| String                 | str                    |
+------------------------+------------------------+
| Array                  | tuple                  |
+------------------------+------------------------+
| Object                 | dict                   |
+------------------------+------------------------+
| Buffer                 | bytes                  |
+------------------------+------------------------+
| Date                   | datetime               |
+------------------------+------------------------+

Note: Due to the Python GIL, Python code running in separate Rampart
threads will execute in separate processes rather than true threads.

The Rampart distribution also includes ``python3r`` and ``pip3r`` in its
``bin/`` directory.  These are standalone Python and pip executables that
share the same ``site-packages`` and library paths as the embedded Python
in ``rampart-python``.  Use ``pip3r`` to install packages that will be
available to both ``python3r`` and ``rampart-python``:

.. code-block:: bash

    pip3r install requests

Packages installed this way can then be imported from within Rampart:

.. code-block:: javascript

    var python = require("rampart-python");
    var requests = python.import("requests");
