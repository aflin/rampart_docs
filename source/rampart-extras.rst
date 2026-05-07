The rampart-url module
======================

Preface
-------

What is in this section?
~~~~~~~~~~~~~~~~~~~~~~~~

This section of the documentation is intended to document feature (supported
or not) that do not neatly fit into other sections.


rampart-webserver.js Module
---------------------------

The ``rampart-webserver.js`` module is a JavaScript module that aims to
simplify the functionality of 
:ref:`the rampart-server module <rampart-server:The rampart-server HTTP module>`.
It is part of the complete rampart distribution and lives in the
``process.modulesPath`` directory.

Loading the module.
~~~~~~~~~~~~~~~~~~~

The module can be loaded in the normal manner.

.. code-block:: javascript

    var wserv = require("rampart-webserver");


Standard Server Layout
~~~~~~~~~~~~~~~~~~~~~~

Using the ``rampart-webserver`` module assumes a standard layout for 
static and dynamic web content.  Refer to the 
`example webserver <https://github.com/aflin/rampart/tree/main/web_server>`_
for a view of the expected location of content and scripts.

Usage from a configuration file
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The easiest method of starting the rampart webserver is to copy the
example webserver `<https://github.com/aflin/rampart/tree/main/web_server>`_
directory and edit the settings found in the ``web_server_conf.js`` script.

After editing, the server can be used as follows:

.. code-block:: none

    rampart@machine:~>$ rampart /path/to/web_server/web_server_conf.js start
    Server has been started.

    rampart@machine:~>$ rampart /path/to/web_server/web_server_conf.js help
    usage:
      rampart web_server_conf.js [start|stop|restart|letssetup|status|dump|help]
          start     -- start the http(s) server
          stop      -- stop the http(s) server
          restart   -- stop and restart the http(s) server
          letssetup -- start http only to allow letsencrypt verification
          status    -- show status of server processes
          dump      -- dump the config object used for server.start()
          help      -- show this message

The usable settings in ``web_server_conf.js`` include all the possible settings 
applicable to the :ref:`server.start() <rampart-server:start()>` function
as well as extras to simplify the process and add extra functionality.


Notable extras:

    * ``bindAll``      - :green:`Boolean`, if true, bind the server to ``0.0.0.0`` and ``[::]`` ip addresses

    * ``port``         - :green:`Number`, use this value to set ``ipPort`` and
      ``ipv6Port``.

    * ``redirPort``    - :green:`Number`, when launching a secure ``https``
      server, also launch a ``http`` server using this port to redirect
      requests to the https server (assuming default port ``443``).

    * ``redir``        - :green:`Boolean`, if true, set ``redirPort`` to
      ``80``.

    * ``rotateLogs``   - :green:`Boolean`, if true, launch a monitor process
      to rotate the access and error log files at a given time. Default is
      ``false``.

    * ``rotateStart``  - :green:`String`, the time to start rotating the
      logs.  Default is ``00:00`` (for localtime, midnight).

    * ``rotateInterval`` - :green:`Number`, how often to rotate the logs. 
      Default is ``86400`` (for every 24 hours).  It may also be given as
      the :green:`Strings` ``"hourly"``, ``"daily"`` or ``"weekly"``.

    * ``letsencrypt``  - :green:`String`, for secure serving, the directory
      where the letsencrypt certificates can be found.  Set to ``"example.com``
      would therefore look for certificates in the
      ``/etc/letsencrypt/live/example.com/`` directory.  See 
      `Use with Letsencrypt`_ below.

    * ``serverRoot``   - :green:`String`, the root directory (e.g.
      ``"/path/to/my/web_server"``. Default is the current working
      directory.

    * ``map``          - :green:`Object`, replace the map and only use this :green:`Object`
      to pass to the :ref:`server.start() <rampart-server:start()>` function.

    * ``appendMap``    - :green:`Object`, append default mappings 
      passed to the :ref:`server.start() <rampart-server:start()>` function.

    * ``monitor``      - :green:`Boolean`, if true, launch a monitor process
      to continuously check that the server is running (every 10 seconds)
      and that the root index.html file can be reached (every 60 seconds). 
      Default is false.

    * ``stop``         - :green:`Boolean`, if true, stop the server, along
      with the redirect server and monitor processes if either was launched.

Building a command line utility
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To aid in starting a server from the command line without having to
configure it from a JavaScript script, a small script such as the following
can be used:

.. code-block:: javascript

    var wserv = require("rampart-webserver");
    webserv.cmdLine(2);


The ``webserv.cmdLine(2);`` function will process options
from command line arguments, starting with the second one (skipping
argv[0] (``rampart``) and argv[1] (``script_name.js``).  It will
then launch a server using the processed options.

The same functionality is also available from the main rampart executable and can be used
as such:

.. code-block:: none

    rampart@machine:~>$ rampart --server ~/web_server/
    Server has been started.
    rampart@machine:~>$ rampart --server --stop ~/web_server/
    server stopped    
    rampart@machine:~>$ rampart --server --help
    rampart built-in server help:

    Usage: rampart --[quick]server [options] [root_dir]
        --server        - run as a full server
        --quickserver   - run as a test server
        --help, -h      - this help message
        --lsopts        - print details on all options
        --showdefaults  - print the list of default settings for --server or --quickserver
        --OPTION [val]  - where OPTION is one of options listed from '--lsopts'

    If root_dir is not specified, the current directory will be used

    rampart@machine:~>$ rampart --server --lsopts
    --ipAddr             String. The ipv4 address to bind
    --ipv6Addr           String. The ipv6 address to bind
    --bindAll            Bool.   Set ipAddr and ipv6Addr to '0.0.0.0' and '[::]' respectively
    --ipPort             Number. Set ipv4 port
    --ipv6Port           Number. Set ipv6 port
    --port               Number. Set both ipv4 and ipv6 port
    --redirPort          Number. Launch http->https redirect server and set port
    --redir              Bool.   Launch http->https redirect server and set to port 80
    --htmlRoot           String. Root directory from which to serve files
    --appsRoot           String. Root directory from which to serve apps
    --wsappsRoot         String. Root directory from which to serve wsapps
    --dataRoot           String. Setting for user scripts
    --logRoot            String. Log directory
    --accessLog          String. Log file name. "" for stdout
    --errorLog           String. error log file name. "" for stderr
    --log                Bool.   Whether to log requests and errors
    --rotateLogs         Bool.   Whether to rotate the logs
    --rotateInterval     Number. Interval between log rotations in seconds
    --rotateStart        String. Time to start log rotations
    --user               String. If started as root, switch to this user
    --threads            Number. Limit the number of threads used by the server.
                         Default (-1) is the number of cores on the system
    --sslKeyFile         String. If https, the ssl/tls key file location
    --sslCertFile        String. If https, the ssl/tls cert file location
    --secure             Bool.   Whether to use https.  If true sslKeyFile and sslCertFile must be set
    --developerMode      Bool.   Whether script errors result in 500 and return a stack trace.  Otherwise 404
    --letsencrypt        String. If using letsencrypt, the 'domain.tld' name for automatic setup of https
                         (assumes --secure true and looks for '/etc/letsencrypt/live/domain.tld/' directory)
                         (if redir is set, also map ./letsencrypt-wd/.well-known/ --> http://mydom.com/.well-known/)
                         (if set to "setup", don\'t start https server, but do map ".well-known/" for http)
                         (sets port:443 unless set otherwise)
    --rootScripts        Bool.   Whether to treat *.js files in htmlRoot as apps (not secure)
    --directoryFunc      Bool.   Whether to provide a directory listing if no index.html is found
    --daemon             Bool.   whether to detach from terminal
    --monitor            fork and run a monitor as a daemon which restarts server w/in 10 seconds if it dies
    --scriptTimeout      Number  Max time to wait for a script module to return a reply in seconds (default 20)
    --connectTimeout     Number  Max time to wait for client send request in seconds (default 20)
    -d                   alias for '--daemon true'
    --detach             alias for '--daemon true'
    --stop               stop the server.  Also stop the monitor and log rotation, if started

The default settings, whether used from the command line or with a script
such as the included ``web_server_conf.js`` script are visible with the
following commands:

.. code-block:: none

    rampart@machine:~>$ rampart --server --showdefaults ~/web_server
    Defaults for --server:
    {
       "ipAddr": "127.0.0.1",
       "ipv6Addr": "[::1]",
       "bindAll": false,
       "ipPort": 8088,
       "ipv6Port": 8088,
       "port": -1,
       "redirPort": -1,
       "redir": false,
       "htmlRoot": "/home/rampart/web_server/html",
       "appsRoot": "/home/rampart/web_server/apps",
       "wsappsRoot": "/home/rampart/web_server/wsapps",
       "dataRoot": "/home/rampart/web_server/data",
       "logRoot": "/home/rampart/web_server/logs",
       "accessLog": "/home/rampart/web_server/logs/access.log",
       "errorLog": "/home/rampart/web_server/logs/error.log",
       "log": true,
       "rotateLogs": false,
       "rotateInterval": 86400,
       "rotateStart": "00:00",
       "user": "nobody",
       "threads": -1,
       "sslKeyFile": "",
       "sslCertFile": "",
       "secure": false,
       "developerMode": true,
       "letsencrypt": "",
       "rootScripts": false,
       "directoryFunc": false,
       "monitor": false,
       "daemon": true,
       "scriptTimeout": 20,
       "connectTimeout": 20,
       "quickserver": false,
       "appendProcTitle": false,
       "serverRoot": "/home/rampart/web_server",
       "fullServer": 1
    }

    rampart@machine:~/dir_with_files>$ rampart --quickserver --showdefaults
    Defaults for --quickserver:
    {
       "ipAddr": "127.0.0.1",
       "ipv6Addr": "[::1]",
       "bindAll": false,
       "ipPort": 8088,
       "ipv6Port": 8088,
       "port": -1,
       "redirPort": -1,
       "htmlRoot": "/home/rampart/dir_with_files/",
       "appsRoot": "",
       "wsappsRoot": "",
       "dataRoot": "",
       "logRoot": "/home/rampart/dir_with_files/logs",
       "accessLog": "",
       "errorLog": "",
       "log": false,
       "rotateLogs": false,
       "rotateInterval": 86400,
       "rotateStart": "00:00",
       "user": "nobody",
       "threads": 1,
       "sslKeyFile": "",
       "sslCertFile": "",
       "secure": false,
       "developerMode": true,
       "letsencrypt": "",
       "rootScripts": false,
       "directoryFunc": true,
       "monitor": false,
       "daemon": false,
       "scriptTimeout": 20,
       "connectTimeout": 20,
       "quickserver": true,
       "appendProcTitle": false,
       "serverRoot": "/home/rampart/dir_with_files",
       "fullServer": 0
    }

Use with Letsencrypt
~~~~~~~~~~~~~~~~~~~~

A shortcut for setting up a secure server with `letsencrypt <https://letsencrypt.org/>`_
is available via the ``letsencrypt`` keys in ``web_server_conf`` or using
``rampart --server --letsencrypt example.com``.  Setting the value to
the appropriate domain name (e.g. ``example.com``) will set the following
keys automatically:

.. code-block:: javascript

    {
        "secure":        true,
        "sslKeyFile":    "/etc/letsencrypt/live/example.com/privkey.pem",
        "sslCertFile":   "/etc/letsencrypt/live/example.com/fullchain.pem",
    }

Obtaining a key via the letsencrypt ``certbot`` utility requires access to
``http://example.com:80/.well-known/`` and the corresponding mapped
directory on the filesystem.  If the ``redir`` or ``redirPort`` setting is
set along with the ``letsencrypt:"example.com"``, the directory
``/path/to/my/web_server/letsencrypt_wd/.well-known`` will automatically be
created and mapped to ``http://example.com:80/.well-known/``.

In addition, the ``letsencrypt`` key may be set to ``"setup"``
(or by doing ``rampart ./web_server_conf.js letssetup``) to prevent
starting the secure server when the certificates have not yet been
issued by letsencrypt.

A full example of obtaining a certificate using ``certbot``, substituting
the desired domain name with ``example.com``:

.. code-block:: shell

    # work must be performed as root
    ~>$ sudo bash

    # install the certbot using appropriate package manager
    root@example.com:~# apt install certbot

    # change to the location of your web_server.
    root@example.com:~# cd /path/to/my/web_server
    
    # edit web_server_conf.js file and set ``"letsencrypt": "example.com"``
    root@example.com:/path/to/my/web_server# vi ./web_server_conf.js

    # start the http webserver in letsencrypt setup mode (don't start https)
    root@example.com:/path/to/my/web_server# rampart ./web_server_conf.js letssetup

    # verify redirect server has mapped .well-known/
    root@example.com:/path/to/my/web_server# ls -a letsencrypt_wd/
    .  ..  .well-known

    # request a certificate (this machine must be reachable at [www.]example.com)
    root@example.com:/path/to/my/web_server# certbot certonly --webroot \
    --webroot-path /path/to/my/web_server/letsencrypt_wd \
    -d example.com,www.example.com

    # if certs were issued without error, the server can now be restarted
    # with https enabled
    root@example.com:/path/to/my/web_server# rampart ./web_server_conf.js restart


A root crontab entry will keep the certificate up to date:

.. code-block:: none

    0 5 * * * /usr/bin/certbot renew --quiet --renew-hook "rampart /path/to/my/web_server/web_server_conf.js restart" 2>/dev/null

Single-File Bundles
-------------------

The ``rampart`` executable can be turned into a self-contained, single-file
application by appending a zip archive to it.  Scripts, ``require()``-able
JavaScript and native modules, web-server static assets, configuration files
and any other read-only resources can be packaged inside the zip and loaded
by the runtime through a virtual ``:zip:/`` namespace.

The resulting binary is a normal executable on Linux, macOS and FreeBSD.
It can be copied or renamed, and runs without an installer or external
files (other than what the application itself requires from disk at
runtime, such as databases or log files).

What a Bundle Is (And Is Not)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

A bundle is, byte-for-byte:

.. code-block:: none

    [ rampart executable ][ standard zip archive ]

That is all.  The zip End-of-Central-Directory marker is found by scanning
backwards from the end of the file at startup; if found, every entry in the
archive becomes accessible under a ``:zip:/`` virtual path.

A bundle is **not** a container or chroot.  Unlike Docker, the bundle does
not provide an isolated filesystem, network namespace, or live writable
overlay:

* The contents of the zip are **read-only**.  Anything you write to a
  ``:zip:/...`` path is rejected with ``EROFS`` ("Read-only file system").
* The zip contents are **frozen** at build time.  Edits to source files
  during the run do not persist, and changes never propagate back to the
  zip.  Re-bundle to update.
* Outside the ``:zip:/`` namespace the process sees the **normal host
  filesystem**.  Databases, log files, user uploads, sockets and so on
  must live on disk.

Think of it as "a shippable read-only resource pack glued onto the
interpreter," not a runtime sandbox.

Building a Bundle
~~~~~~~~~~~~~~~~~

Lay out everything you want inside the bundle in a directory::

    mybundle/
    ├── entry_script.js          # auto-run when the bundle is invoked
    ├── auth-conf.js             # any other configs your app reads
    ├── apps/                    # web_server JS apps
    │   └── myapp.js
    ├── html/                    # web_server static files
    │   ├── index.html
    │   └── css/style.css
    ├── wsapps/                  # websocket apps
    ├── modules/                 # require()-able JS modules (optional)
    └── rampart-server.so        # any native modules your app uses
        rampart-sql.so
        ...

Then create the bundle in two steps -- zip the directory, then concatenate
it onto a copy of ``rampart``:

.. code-block:: bash

    #!/bin/bash
    # mkapp.sh
    cd mybundle
    zip -qr ../payload.zip .
    cd ..
    cp /path/to/rampart mybundle-bin
    cat payload.zip >> mybundle-bin
    chmod +x mybundle-bin

The result, ``mybundle-bin``, is a single executable that can be copied
anywhere and run directly.

How a Bundle Starts
~~~~~~~~~~~~~~~~~~~

When you invoke a bundle, ``rampart`` chooses what to run as follows:

1. **Explicit script in the zip** --
   ``mybundle-bin :zip:/path/foo.js [args...]`` runs ``foo.js`` from inside
   the zip.  ``process.argv`` is unchanged from what the user typed
   (``["mybundle-bin", ":zip:/path/foo.js", ...args]``), and
   ``process.scriptPath`` is set to ``:zip:/path``.

2. **Auto-run entry script** -- with no positional argument, ``rampart``
   looks for one of these names at the zip root, in order:

       ``entry_script.js``, ``entry-script.js``, ``entryScript.js``, ``entryscript.js``

   The first match is run.  The script name is spliced into ``process.argv``
   at index 1 so user code sees ``["mybundle-bin", "entry_script.js", ...args]``,
   and ``process.scriptPath`` is set to ``:zip:`` (the zip root).

3. **No bundle / no entry** -- behaves like the unbundled ``rampart``
   executable: REPL with no args, runs a positional script if given, etc.

The :zip:/ Filesystem
~~~~~~~~~~~~~~~~~~~~~

A script being prepared for bundling can be developed and tested
unchanged, against ordinary disk files.  Plain relative requires and
script-relative paths simply work in both contexts:

.. code-block:: javascript

    var helpers = require("helpers.js");      // resolves to ./helpers.js on disk
                                               // or to :zip:/helpers.js when bundled

    var conf = rampart.utils.readFile(
        process.scriptPath + "/config.json", true);
    // process.scriptPath is the script's directory on disk during testing,
    // and ":zip:" (or a subdir thereof) at runtime inside a bundle.

When you do need to be explicit -- for instance to extract a resource
from the bundle, hash one of its entries, or list entries by prefix --
the ``:zip:/`` prefix is recognised by every file-reading API in the
runtime.  These all work transparently with either disk paths or
``:zip:/`` paths:

.. code-block:: javascript

    var u = rampart.utils;

    // require modules from the bundle (or from disk)
    var helpers  = require(":zip:/lib/helpers.js");
    var myAuth   = require(":zip:/auth-conf.js");

    // generic file reads
    var conf = u.readFile(":zip:/config.json", true);
    var st   = u.stat(":zip:/apps/auth.js");
    if (u.fileExists(":zip:/data.csv")) { /* ... */ }

    var fh = u.fopen(":zip:/big.txt", "r");   // read-mode only
    var line = u.readLine(fh);
    fh.fclose();

    // directory enumeration
    var files = u.readdir(":zip:/apps");      // ["auth.js","priv","..."]

    // hashFile, csv, totext, curl post-from-file all accept :zip:/
    var sum = u.hashFile(":zip:/data.csv");
    var rows = rampart.import.csvFile(":zip:/data.csv");
    var text = require("rampart-totext").convertFile(":zip:/manual.pdf");

    // SQL searchFile reads in-zip text directly
    var hits = require("rampart-sql").searchFile("phrase",
                                                  ":zip:/big-doc.txt");

    // include() resolves zip first, then disk
    rampart.include(":zip:/lib/setup.js");

Trying to open a ``:zip:/`` path for writing fails with ``EROFS``:

.. code-block:: javascript

    u.fopen(":zip:/foo", "w");
    // throws: Read-only file system

Bundle-Specific JS APIs
^^^^^^^^^^^^^^^^^^^^^^^

A small set of utilities is exposed only when a zip payload is present
(use ``if (rampart.utils.payloadGet) { ... }`` to feature-detect):

``rampart.utils.payloadList()``
    Returns an :green:`Object` mapping every entry's name to a
    stat-like object (``size``, ``mode``, ``mtime`` (Date), ``isFile``,
    ``isDirectory``, ``isSymlink``, ``permissions`` etc.).

``rampart.utils.payloadGet(name)``
    Returns the entry's contents as a :green:`Buffer` (decompressed).

``rampart.utils.payloadExtract(name|nameArray|null, destDir)``
    Extracts one entry, an array of entries, or every entry
    (when first argument is ``null``) to ``destDir``.  File modes,
    mtimes and symlinks are preserved.

A second set works on **any** zip file on disk -- not the appended
payload -- and is always available:

``rampart.utils.zipList(zipPath)``
``rampart.utils.zipGet(zipPath, name)``
``rampart.utils.zipExtract(zipPath, name|nameArray|null, destDir)``

These are useful for installers, update packages and similar tooling
that needs to inspect a zip without unpacking it first.

Use With the Web Server
~~~~~~~~~~~~~~~~~~~~~~~

The standard webserver layout (see
`Standard Server Layout`_) maps cleanly into a bundle.  The example
``rampart/web_server`` directory ships with an ``entry_script.js``
symlink pointing at ``web_server_conf.js``, so the same configuration
file is used both as the script you run during development
(``rampart web_server_conf.js start``) and as the auto-run entry script
when the directory is bundled.  No second script to maintain.

In ``web_server_conf.js`` set ``serverRoot`` to the script's directory
in the normal way:

.. code-block:: javascript

    var working_directory = process.scriptPath;   // ":zip:" in a bundle

    var serverConf = {
        bindAll: true,
        ipPort:  8088,

        serverRoot: working_directory,            // becomes ":zip:"
        // htmlRoot, appsRoot, wsappsRoot default to
        //   serverRoot + "/html", "/apps", "/wsapps"
    };

The webserver will then serve static files out of ``:zip:/html/``, app
modules out of ``:zip:/apps/``, websocket apps out of ``:zip:/wsapps/``
and so on -- including ``Range:`` requests, gzip pre-cached pages
(``foo.html.gz`` siblings), and ``Last-Modified`` based on the entry's
zip-time mtime.

**The two directories that cannot live in the bundle** are ``dataRoot``
(LMDB / SQL databases, sessions, uploads) and ``logRoot`` (access /
error logs), since both must be writable.  Compute them at runtime
to a per-user, per-port location on disk:

.. code-block:: javascript

    if (rampart.utils.payloadGet) {  // true only when running as a bundle
        var iam   = rampart.utils.exec('whoami').stdout.trim();
        var home  = (iam === 'root') ? '/tmp' : (process.env.HOME || '/tmp');
        var port  = serverConf.ipPort || 8088;
        var rpdir = home + '/.rampart/' + iam + '_server_' + port;

        rampart.utils.mkdir(rpdir + '/data', true);
        rampart.utils.mkdir(rpdir + '/logs', true);

        serverConf.dataRoot = rpdir + '/data';
        serverConf.logRoot  = rpdir + '/logs';
    }

When ``dataRoot`` is set, modules that ask the server for a default DB
location (``rampart-auth``, etc.) will use it -- specifically,
``authMod`` defaults its LMDB to ``serverConf.dataRoot + "/auth"``
rather than the read-only ``:zip:/data/auth``.

Pre-Compiled Caches
~~~~~~~~~~~~~~~~~~~

Scripts that begin with ``"use transpiler"`` or ``"use babel"`` are
normally re-transpiled on every load.  In a bundle, this still happens
in memory but the on-disk cache file (``foo.transpiled.js`` /
``foo.babel.js``) is **not** written to the user's working directory,
since the bundle's own filesystem is read-only.

If you want to skip the transpiler/babel step entirely at run time,
pre-build the cache files at bundle-build time and ship them alongside
the source:

.. code-block:: none

    mybundle/
    ├── apps/
    │   ├── myapp.js               # the source
    │   └── myapp.transpiled.js    # pre-built cache; runtime uses this
    └── ...

The runtime will detect a same-named ``.transpiled.js`` (or ``.babel.js``)
inside the zip, verify its mtime is no older than the source, and serve
its bytes directly to the engine -- the transpiler library does not need
to load.  This applies equally to the entry script and to anything
``require()``\d from the zip.

Native Modules and Daemons
~~~~~~~~~~~~~~~~~~~~~~~~~~

Native modules (``.so``) cannot be ``dlopen()``-ed from a memory buffer
on POSIX systems, so the runtime extracts them to a unique
``/tmp/rampart-zipso-XXXXXX`` file, ``dlopen()``\s the temp file, and
``unlink()``\s it immediately.  The mapping survives the unlink via
the dlopen handle, so no on-disk trace remains even if the process
crashes mid-load.  Each ``.so`` entry is loaded at most once per
process and shared by all worker threads.

The same trick is used to launch ``texislockd`` (the SQL / vector-index
lock daemon) when needed: the bundled binary is extracted, ``exec``\ed
with a self-unlink flag and an idle-timeout flag, and removes its own
on-disk file once running.

What Is Not Supported
~~~~~~~~~~~~~~~~~~~~~

* **TLS key and certificate files must live on disk.**  ``sslKeyFile``
  and ``sslCertFile`` paths are rejected if they begin with ``:zip:``.
  This is intentional: shipping a private key inside a redistributable
  binary is almost always a mistake, and OpenSSL loads these by path
  internally (``SSL_CTX_use_PrivateKey_file`` etc.) so a ``:zip:`` path
  could not be used end-to-end without staging the file to disk anyway.

* **Modifications inside the zip never persist.**  A bundle is a
  shipping format, not a working directory.  All mutable state must
  go through ``serverConf.dataRoot`` (or some other on-disk path).

* **Encrypted or password-protected zip entries are not supported.**
  Compression methods 0 (stored) and 8 (deflate) are recognised; zip64,
  encryption and the streaming "data descriptor" format are rejected
  at bundle-load time.

* **No incremental update.**  To change anything in the bundle, rebuild
  the whole thing.  Bundles are typically a few MB to a few tens of MB,
  so this is fast.

Running a Specific Script From the Bundle
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

In addition to the auto-run ``entry_script.js`` flow, you can run any
script that lives inside the bundle by passing its ``:zip:/`` path on
the command line:

.. code-block:: bash

    ./mybundle-bin :zip:/apps/admin.js add-user alice
    ./mybundle-bin :zip:/maintenance/reindex.js
    ./mybundle-bin :zip:/tools/dbcheck.js --verbose

This lets one bundle act as a CLI multiplexer.  A common pattern is
to have ``entry_script.js`` start the web server when invoked bare,
and provide a number of admin / maintenance scripts under
``:zip:/admin/...`` that the operator runs explicitly.  Both modes
share the bundled assets and modules, but each invocation runs in a
fresh process -- there is no daemon shared between the
"start the server" run and the "run a one-off CLI" run.

websocket_client
----------------

NOTE: superseded by :ref:`WebSocket Client Functions <rampart-net:Websocket Client Functions>`.

A command line websocket client and rampart module can be found in the
`unsupported_extras/websocket_client <https://github.com/aflin/rampart/tree/main/unsupported_extras/websocket_client>`_
directory of the rampart distribution.

It can be used from the command line as such:

.. code-block:: none

    rampart@machine:~>$ /rampart/unsupported_extras/websocket_client>$ rampart wsclient.js
    wsclient.js [ -h header] [-s] url:
        url    where scheme is ws:// or wss://
        -H     header is a header to be added ('headername=headerval'). May be used more than once.
        -s     show raw http request to server on connect

Once connected, text entered will be sent to the server while sent messages
will appear in the terminal.  There are also commands that can be run from
the prompt:

    * ``.save filename`` - save the last binary message sent by the server.
      to a file.

    * ``.send filename`` - send a file as a binary message to the server.
 
    * ``.close``         - close the connection and quit.

More information is in the `file itself <https://github.com/aflin/rampart/blob/main/unsupported_extras/websocket_client/wsclient.js>`_\ .

forkpty-term
------------

The `unsupported_extras/forkpty-term <https://github.com/aflin/rampart/blob/main/unsupported_extras/forkpty-term>`_
directory of the rampart distribution contains a sample web terminal emulator 
that uses the ``rampart-server`` module, :ref:`websockets <rampart-server:Websockets>` 
and the :ref:`rampart.utils.forkpty() <rampart-utils:forkpty>` on
the server side, and `xterm.js <https://xtermjs.org/>`_ on the client to
create a fully functioning xterm in the browser.

The relevant files may be copied directly into the
`example webserver <https://github.com/aflin/rampart/tree/main/web_server>`_
directory.

rampart-converter
-----------------

NOTE: superseded by :doc:`rampart-totext module <rampart-totext>`.

The included rampart-converter module uses command line utilities to convert
various file formats into plain text suitable for indexing with the 
:ref:`sql module<rampart-sql:Preface>`.

The following programs/modules should be installed and available before usage:

    * pandoc - for docx, odt, markdown, rtf, latex, epub and docbook
    * catdoc (linux/freebsd) or textutil (macos) - for doc
    * pdftotext from the xpdf utils - for pdfs
    * man - for man files (if not available, pandoc will be used)
    * file - to identify file types
    * head - for linux optimization identifying files
    * gunzip - to decompress any gzipped document
    * the rampart-html module for html and as a helper for pandoc conversions

Minimally, pandoc and file must be available for this module to load.

The following file formats are supported (if appropriate program
above is available):

    docx, doc, odt, markdown, rtf, latex, epub, docbook, pdf & man
    Also files identified as txt (text/plain) will be returned as is.

Usage:

.. code-block:: javascript

    var converter = require("rampart-converter.js");
    var convert = new converter(defaultOptions);

Where ``defaultOptions`` is :green:`Undefined` or an :green:`Object` of command line flags for each
of the converting programs.  Example to only include the first two pages
for a pdf (pdftotext) and to convert a docx (pandoc) to markdown instead
of to text:

.. code-block:: javascript

    var convert = new converter({
        pdftotext: {f:1, l:2},
        pandoc :   {t: 'markdown'}
    });

To convert a document:

.. code-block:: javascript

    var converter = require("rampart-converter.js");
    var convert = new converter();
    var txt = convert.convertFile('/path/to/my/file.ext', options);
        or
    var txt = convert.convert(myFileBufferOrString, options);

where ``options`` overrides the ``defaultOptions`` above and 
is either of:

    1) same format as defaultOptions above: 
       ``{pdftotext: {f:1, l:2}}``; or
    2) options for the utility to be used:
       ``{f:1, l:2}``

Full example:

.. code-block:: javascript

    var converter=require('rampart-converter.js');

    // specify options optionally as defaults
    //var c = new convert({
    //    pandoc : { 't': 'markdown' },
    //    pdftotext: {f:1, l:2}
    //});

    var convert = new converter();

    //options per invocation
    var ptxt = convert.convertFile('convtest/test.pdf', {pdftotext: {f:1, l:2}});
    var dtxt = convert.convertFile('convtest/test.docx', { pandoc : { 't': 'markdown' }});

    // OR - alternative format for options:
    var ptxt = convert.convertFile('convtest/test.pdf', {f:1, l:2});
    var dtxt = convert.convertFile('convtest/test.docx', { 't': 'markdown' });

    rampart.utils.printf("%s\n\n%s\n", ptxt, dtxt);

Command Line usage:

.. code-block:: shell

    > rampart /path/to/rampart-converter.js /path/to/document.ext

rampart-email
-------------

The ``rampart-email.js`` module sends email via SMTP using the
:ref:`rampart-curl module <rampart-curl:The rampart-curl module>` and
:ref:`rampart-net module <rampart-net:The rampart-net module>`.  It supports
direct delivery (MX lookup), local relay, authenticated SMTP, and Gmail
with App Passwords.

Loading the module
~~~~~~~~~~~~~~~~~~

.. code-block:: javascript

    var email = require("rampart-email.js");

send()
~~~~~~

    The ``send()`` function sends an email message using the specified
    delivery method.

    Usage:

    .. code-block:: javascript

        var result = email.send(options);

    Where ``options`` is an :green:`Object` with the following properties:

    * ``from`` - :green:`String` - **Required**.  The sender email address.

    * ``to`` - :green:`String` or :green:`Array` of :green:`Strings` -
      **Required**.  One or more recipient email addresses.

    * ``subject`` - :green:`String` - The email subject line.  Default is
      ``""``.

    * ``message`` - :green:`String` or :green:`Object` - The message body.
      If a :green:`String`, it is sent as plain text.  If an :green:`Object`,
      it may contain:

      * ``html`` - :green:`String` - HTML body (sent as ``text/html``).
      * ``text`` - :green:`String` - Plain text body (sent as
        ``text/plain``).
      * ``attach`` - :green:`Array` of :green:`Objects` - File attachments.
        Each :green:`Object` may have:

        * ``data`` - :green:`String` or :green:`Buffer` - **Required**.  The
          attachment data.  If a :green:`String` starting with ``@``, the
          data is read from a file (e.g. ``"@/path/to/file.pdf"``).
        * ``name`` - :green:`String` - The attachment filename.
        * ``type`` - :green:`String` - The MIME type (e.g.
          ``"application/pdf"``).
        * ``cid`` - :green:`String` - Content-ID for inline images
          referenced in the HTML body via ``<img src="cid:mycid">``.

      If both ``html`` and ``text`` are provided, they are sent as
      ``multipart/alternative``.

    * ``cc`` - :green:`String` or :green:`Array` of :green:`Strings` -
      Carbon copy recipients.  Added to both the ``Cc:`` header and the
      envelope recipient list.

    * ``reply-to`` - :green:`String` - Address for the ``Reply-To:`` header.

    * ``date`` - :green:`Date` - The ``Date:`` header value.  Default is
      ``new Date()``.

    * ``method`` - :green:`String` - The delivery method.  One of
      ``"direct"`` (default), ``"relay"``, ``"smtp"``, or ``"gmailApp"``.
      See `Delivery Methods`_ below.

    * ``timeout`` - :green:`Number` - Maximum total time in seconds for the
      SMTP transaction.  Default is ``30``.

    * ``connectTimeout`` - :green:`Number` - Maximum time in seconds to
      establish a connection.  Default is ``10``.

    * ``insecure`` - :green:`Boolean` - If ``true``, allow TLS connections
      without verifying the server certificate.  For ``"direct"`` method,
      this adds an insecure TLS fallback to the attempt sequence.  For
      other methods, it is passed directly to the underlying
      ``curl.fetch()`` call.  Default is ``false``.

    Return Value:
        An :green:`Object` with the following properties:

        * ``ok`` - :green:`Boolean` - ``true`` if all recipients were
          accepted.

        * ``sent`` - :green:`Number` - Count of successful recipients.

        * ``failed`` - :green:`Number` - Count of failed recipients.

        * ``results`` - :green:`Array` of :green:`Objects`, one per
          domain (for ``"direct"``) or one total (for other methods).
          Each :green:`Object` contains:

          * ``domain`` - :green:`String` - The recipient domain.
          * ``rcpt`` - :green:`Array` of :green:`Strings` - The recipient
            addresses in this group.
          * ``ok`` - :green:`Boolean` - Whether this group was accepted.
          * ``status`` - :green:`Number` - The SMTP status code (``250``
            on success).
          * ``mx`` - :green:`String` - The server that accepted (or
            attempted) delivery.
          * ``errMsg`` - :green:`String` - Error details on failure.
          * ``sslMode`` - :green:`String` - (``"direct"`` only) The TLS
            mode that succeeded: ``"ssl"``, ``"ssl+insecure"``, or
            ``"no-ssl"``.

.. _delivery-methods:

Delivery Methods
~~~~~~~~~~~~~~~~

method: "direct"
""""""""""""""""

    The default method.  Looks up MX records for each recipient's domain
    using ``net.resolve(domain, "MX")`` and connects directly to the
    destination mail server on port 25.  Recipients sharing a domain are
    batched into a single SMTP session.

    The connection is attempted with verified TLS (STARTTLS) first, then
    falls back to plain SMTP.  If ``insecure`` is ``true``, an additional
    insecure TLS attempt is made between verified TLS and plain:

    * Default: **ssl** → **plain**
    * ``insecure: true``: **ssl** → **ssl+insecure** → **plain**
    * ``requireSsl: true``: **ssl** only
    * ``requireSsl: true`` + ``insecure: true``: **ssl** → **ssl+insecure**

    If no MX records are found, the domain itself is tried as the mail
    host per RFC 5321 section 5.1.

    Additional options:

    * ``requireSsl`` - :green:`Boolean` - If ``true``, do not fall back to
      plain (unencrypted) SMTP.  Default is ``false``.

    .. code-block:: javascript

        var email = require("rampart-email.js");

        var result = email.send({
            from:    "me@myserver.com",
            to:      "them@example.com",
            subject: "Hello",
            message: "Hi there"
        });

method: "relay"
"""""""""""""""

    Sends all recipients through a local or specified SMTP relay server
    (e.g. Postfix), which handles onward delivery, retries, and queuing.

    Note: the relay accepts the message into its queue immediately
    (status 250).  Delivery errors occur asynchronously and are reported
    in the relay's logs or as bounce emails to the sender, not in the
    return value.

    Additional options:

    * ``relay`` - :green:`String` - The relay hostname.  Default is
      ``"localhost"``.

    * ``relayPort`` - :green:`Number` - The relay port.  Default is ``25``.

    .. code-block:: javascript

        email.send({
            from:    "me@myserver.com",
            to:      "them@example.com",
            subject: "Hello",
            message: "Hi there",
            method:  "relay"
        });

method: "smtp"
""""""""""""""

    Sends through any authenticated SMTP server.  The full URL including
    protocol and port must be provided.

    Additional options:

    * ``smtpUrl`` - :green:`String` - **Required**.  The SMTP server URL
      (e.g. ``"smtps://smtp.example.com:465"``).

    * ``user`` - :green:`String` - The authentication username.

    * ``pass`` - :green:`String` - The authentication password.

    .. code-block:: javascript

        email.send({
            from:    "me@example.com",
            to:      "them@example.com",
            subject: "Hello",
            message: "Hi there",
            method:  "smtp",
            smtpUrl: "smtps://smtp.example.com:465",
            user:    "me@example.com",
            pass:    "mypassword"
        });

method: "gmailApp"
""""""""""""""""""

    Sends through Gmail's SMTP server (``smtps://smtp.gmail.com:465``)
    using a Google App Password.  The SMTP URL is handled automatically.

    Additional options:

    * ``user`` - :green:`String` - **Required**.  Your full Gmail or Google
      Workspace email address.

    * ``pass`` - :green:`String` - **Required**.  The 16-character App
      Password.

    .. code-block:: javascript

        email.send({
            from:    "me@gmail.com",
            to:      "them@example.com",
            subject: "Hello",
            message: "Hi there",
            method:  "gmailApp",
            user:    "me@gmail.com",
            pass:    "xxxx xxxx xxxx xxxx"
        });

    **Creating a Gmail App Password:**

    1. Go to ``myaccount.google.com``.
    2. Click **Security** in the left sidebar.
    3. Ensure **2-Step Verification** is enabled under "How you sign in to
       Google".
    4. Search for **App passwords** in the search bar at the top, or go
       directly to ``myaccount.google.com/apppasswords``.
    5. Enter a name (e.g. "rampart-email") and click **Create**.
    6. Copy the 16-character password shown.

    Note: "App passwords" will not appear if 2-Step Verification is not
    enabled, or if a Google Workspace admin has disabled the feature.

HTML email with attachment
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: javascript

    var email = require("rampart-email.js");

    var result = email.send({
        from:    "me@gmail.com",
        to:      ["alice@example.com", "bob@example.com"],
        cc:      "boss@example.com",
        subject: "Report attached",
        message: {
            html: '<p>See attached report.</p><img src="cid:logo">',
            text: "See attached report.",
            attach: [
                {data: "@/tmp/report.pdf", name: "report.pdf",
                 type: "application/pdf"},
                {data: "@/tmp/logo.png", name: "logo.png",
                 type: "image/png", cid: "logo"}
            ]
        },
        method:  "gmailApp",
        user:    "me@gmail.com",
        pass:    "xxxx xxxx xxxx xxxx"
    });

    if (!result.ok)
        rampart.utils.printf("Send failed: %3J\n", result.results);


rampart-llm
-----------

The ``rampart-llm.js`` module provides a streaming interface to LLM servers
that expose an OpenAI-compatible API.  It supports both
`llama.cpp's llama-server <https://github.com/ggml-org/llama.cpp>`_ and
`Ollama <https://ollama.com/>`_, and handles SSE parsing, thinking/reasoning
model output, and cancellation.

The module lives in the ``process.modulesPath`` directory.

Loading the module
~~~~~~~~~~~~~~~~~~

.. code-block:: javascript

    var llm = require("rampart-llm.js");

Creating a connection
~~~~~~~~~~~~~~~~~~~~~

The module exports two constructors, one for each supported backend.  Both
accept an :green:`Object` of options and verify that the server is reachable
on construction.

.. code-block:: javascript

    // llama-server (llama.cpp)
    var client = new llm.llamaCpp({
        server: "127.0.0.1",   // default
        port:   8080            // default
    });

    // Ollama
    var client = new llm.ollama({
        server: "127.0.0.1",   // default
        port:   11434           // default
    });

An error is thrown if the server is not running at the given address.

Note: ``llama-server`` loads a single model at startup, so the ``model``
property described below is required by the API format but its value is
ignored.  With Ollama, the ``model`` name selects which model to use.

Instance properties
~~~~~~~~~~~~~~~~~~~

After construction, set properties on the instance before calling ``query()``.

    * ``model`` - :green:`String`.  The model name.  Required for Ollama
      (e.g. ``"qwen2.5-coder:7b"``).  For llamaCpp, any non-empty string
      will do since llama-server always uses its loaded model.

    * ``params`` - :green:`Object`.  Sampling and generation parameters that
      are merged directly into the ``/v1/chat/completions`` POST body.
      Common parameters include:

      - ``temperature`` - :green:`Number`.  Controls randomness (0.0 – 2.0).
      - ``max_tokens`` - :green:`Number`.  Maximum tokens to generate.
      - ``top_p`` - :green:`Number`.  Nucleus sampling threshold (0.0 – 1.0).
      - ``top_k`` - :green:`Number`.  Top-k sampling.
      - ``repeat_penalty`` - :green:`Number`.  Repetition penalty (1.0 = off; 1.1 – 1.3 typical).
      - ``frequency_penalty`` - :green:`Number`.  Penalize tokens by frequency (0.0 – 1.0).
      - ``presence_penalty`` - :green:`Number`.  Penalize tokens by presence (0.0 – 1.0).

    * ``cancel`` - :green:`Boolean`.  Set to ``true`` to abort an in-flight
      query.  The stream will stop on the next chunk and the final callback
      will fire.

Example:

.. code-block:: javascript

    client.model  = "qwen2.5-3b-instruct-q4_k_m.gguf";
    client.params = {temperature: 0.2, max_tokens: 4096};

query()
~~~~~~~

The ``query()`` method sends a prompt to the server and streams the response
back through callbacks.

.. code-block:: javascript

    client.query(prompt, perTokenCallback, finalCallback);

Where:

    * ``prompt`` - :green:`Array` or :green:`String`.  If an :green:`Array`,
      it is sent as ``messages`` to the ``/v1/chat/completions`` endpoint
      (chat mode).  Each element is an :green:`Object` with ``role``
      (``"system"``, ``"user"``, or ``"assistant"``) and ``content``
      properties.  If a :green:`String`, it is sent as ``prompt`` to the
      ``/v1/completions`` endpoint (completion mode).

    * ``perTokenCallback`` - :green:`Function`.  Called for each streamed
      token and on error or completion.  May be ``null`` if only
      ``finalCallback`` is needed.  The callback receives a single
      :green:`Object` argument with the following properties:

      - ``token`` - :green:`String`.  The token text.
      - ``thinking`` - :green:`Boolean`.  ``true`` if this token is
        reasoning/thinking content (from ``<think>`` tags or the
        ``--reasoning-format`` flag in llama-server).
      - ``error`` - Set if the server returned an error.
      - ``done`` - :green:`Boolean`.  ``true`` when the stream has ended.
      - ``serverResponse`` - The raw HTTP response object.

    * ``finalCallback`` - :green:`Function`.  Called once after the stream
      ends.  Receives a single :green:`Object` with:

      - ``fullText`` - :green:`String`.  The complete response text
        (excluding thinking content).
      - ``thinkingText`` - :green:`String`.  The complete thinking/reasoning
        text (only present if the model produced thinking output).
      - ``answer`` - :green:`String`.  The answer portion after thinking
        (only present if ``thinkingText`` is present).
      - ``serverResponse`` - The raw HTTP response object.
      - ``error`` - Set if the query failed.

At least one of ``perTokenCallback`` or ``finalCallback`` must be provided.

Chat example
~~~~~~~~~~~~

A basic chat completion with streaming output:

.. code-block:: javascript

    var llm = require("rampart-llm.js");
    var client = new llm.llamaCpp({server: "127.0.0.1", port: 8080});

    client.params = {temperature: 0.7, max_tokens: 2048};

    var prompt = [
        {role: "system",  content: "You are a helpful assistant."},
        {role: "user",    content: "What is the capital of France?"}
    ];

    client.query(
        prompt,

        // per-token callback — print each token as it arrives
        function(res) {
            if (res.error) {
                fprintf(stderr, "Error: %J\n", res.error);
                return;
            }
            if (res.done) return;

            if (res.thinking)
                fprintf(stderr, "(thinking) %s", res.token);
            else
                printf("%s", res.token);
        },

        // final callback — runs once when the stream ends
        function(res) {
            if (res.error) {
                fprintf(stderr, "Query failed: %J\n", res.error);
                return;
            }
            printf("\n\n--- Complete response ---\n%s\n", res.fullText);
        }
    );

Multi-turn conversation
~~~~~~~~~~~~~~~~~~~~~~~

To maintain a conversation, accumulate messages and send the full array
on each turn.  The server is stateless — it needs the entire history
every time.

.. code-block:: javascript

    var conversation = [
        {role: "system", content: "You are a helpful assistant."}
    ];

    function ask(question, callback) {
        conversation.push({role: "user", content: question});

        client.query(conversation, null, function(res) {
            if (!res.error) {
                conversation.push({role: "assistant", content: res.fullText});
                printf("%s\n", res.fullText);
            }
            if (callback) callback();
        });
    }

    ask("What is the capital of France?", function() {
        ask("What is its population?");
    });

Cancelling a query
~~~~~~~~~~~~~~~~~~

Setting ``cancel`` to ``true`` on the instance will abort the current stream
on the next chunk.

.. code-block:: javascript

    // start a query
    client.query(prompt, function(res) {
        if (res.done) {
            printf("(cancelled or complete)\n");
            return;
        }
        printf("%s", res.token);
    });

    // cancel it after 2 seconds
    setTimeout(function() {
        client.cancel = true;
    }, 2000);

Overriding params per query
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The ``params`` property can be saved and temporarily replaced for a
side-query (e.g. a short classification task) without affecting the main
conversation settings.

.. code-block:: javascript

    var savedParams = client.params;
    client.params = {temperature: 0.1, max_tokens: 2048};

    client.query(classifyPrompt, null, function(res) {
        client.params = savedParams;  // restore original params
        printf("Classification: %s\n", res.fullText);
    });

Thinking/reasoning models
~~~~~~~~~~~~~~~~~~~~~~~~~

Some models produce internal reasoning wrapped in ``<think>...</think>`` tags
or via a separate ``reasoning_content`` field (when llama-server is started
with ``--reasoning-format deepseek``).  The module handles both formats
transparently:

- In the per-token callback, ``res.thinking`` is ``true`` for reasoning tokens
  and ``false`` for answer tokens.
- In the final callback, ``res.thinkingText`` contains the full reasoning
  and ``res.answer`` contains only the answer.  ``res.fullText`` contains
  the full non-thinking output.

Note that thinking tokens consume the ``max_tokens`` budget but do not
appear in ``fullText``.  When using thinking models, set ``max_tokens``
high enough to accommodate both reasoning and answer (4096 or more is
recommended, as reasoning can easily consume several thousand tokens
before the visible answer begins).

Context window management
~~~~~~~~~~~~~~~~~~~~~~~~~

When a conversation grows long enough to exceed the server's context
window, the server will return an error.  There are two approaches to
handling this:

**llama-server (llama.cpp):**  Start the server with the ``--context-shift``
flag to allow automatic context shifting — older tokens are discarded
from the KV cache to make room for new ones.  This is a server-start
flag and cannot be set per-request.  The context size is set with ``-c``
(e.g. ``-c 32768``).  When using
``--parallel`` for multiple slots, the context is divided evenly among
slots.

llama-server also exposes several useful REST endpoints beyond the
OpenAI-compatible ``/v1/`` API:

- ``/props`` — returns server properties including
  ``default_generation_settings.n_ctx`` (the configured context size).
- ``/slots`` — returns per-slot information including ``n_ctx`` (the
  actual per-slot context size, which accounts for ``--parallel``).
- ``/health`` — returns server health status.

These can be queried with ``rampart-curl`` to discover the context size
at runtime, for example to display a token usage indicator to the user.

**Ollama:**  Context shifting is handled automatically.  The context
window size defaults to 2048 tokens but can be increased by passing
``num_ctx`` in the params (e.g. ``client.params = {num_ctx: 32768}``).
Ollama will silently shift context when the window fills up.

Using with the Rampart web server
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The module is designed to work well in
:ref:`websocket scripts <rampart-server:Websockets>`.
The ``req`` object in a websocket handler persists across messages, so
an ``llm`` instance created during the handshake (``req.count == 0``) can be
reused for all subsequent messages in the connection.  See the
``llmchat.js`` example in the Rampart LLM demo for a complete working
implementation.

.. code-block:: javascript

    var llm = require("rampart-llm.js");

    function handler(req) {
        if (req.count == 0) {
            // handshake — create connection, store on req
            req.llm = new llm.llamaCpp({server: "127.0.0.1", port: 8080});
            req.llm.params = {temperature: 0.5};
            return;
        }

        // subsequent messages
        var userText = sprintf("%s", req.body);  // Buffer to string

        var prompt = [
            {role: "system", content: "You are a helpful assistant."},
            {role: "user",   content: userText}
        ];

        req.llm.query(prompt,
            function(res) {
                if (res.error || res.done) return;
                req.wsSend(res.token);
            },
            function(res) {
                req.wsSend({end: true});
            }
        );
    }

    module.exports = handler;


The c_module_template_maker utility
-----------------------------------

Included in the rampart unsupported extras is a utility script to help with
the creation of rampart modules written in C.  It can be found in 
the `unsupported_extras/c_module_template_maker <https://github.com/aflin/rampart/tree/main/unsupported_extras/c_module_template_maker>`_
directory of the rampart distribution.

Creating a C Module template
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The first step is to copy the ``make_cmod_template.js`` into a new directory
for the project.  After copying, it can be run as such:

.. code-block:: none

    rampart@machine:~>$ mkdir my_module
    rampart@machine:~>$ cd my_module
    rampart@machine:~/my_module>$ cp /usr/local/rampart/unsupported_extras/c_module_template_maker/make_cmod_template.js  ./
    rampart@machine:~/my_module>$ rampart make_cmod_template.js -- --help
    usage:
        make_cmod_template.js -h 
            or
        make_cmod_template.js c_file_name [-f function_args] [-m make_file_name] [-t test_file_name]

    where:

        c_file_name     - The c template file to write.

        make_file_name  - The name of the makefile to write (default "Makefile")

        test_file_name  - The name of the JavaScript test file (default c_file_name-test.js)

        function_args   - Create c functions that will be exported to JavaScript. 
                        - May be specified more than once.
                        - Format: cfunc_name:jsfunc_name[:nargs[:input_types]]

        function_args format (each argument separated by a ':'):

            cfunc_name:  The name of the c function.

            jsfunc_name: The name of the javascript function to export.

            nargs: The number of arguments the javascript function can take (-1 for variadic)

            input_types: Require a variable type for javascript options:
                A character for each argument. [n|i|u|s|b|B|o|a|f].
                Corresponding to require 
                 [  number|number(as int)|number(as int>-1)|string|
                    boolean|buffer|object|array|function             ]

    A ready to compile, testable module will be produced if both "nargs" and "input_types" are provided.

    Example to create a module that exports two functions which each take a String and Number:

    rampart make_cmod_template example.c -f my_func:myFunc:2:sn -f my_func2:myFunc2:2:sn

Example usage to create a module
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The following is an example of how to make a simple C module that
capitalizes a string.

First, run the script with appropriate options to create the template files.
In this case it is used to create a module named ``"myutil.so"`` which will
export an :green:`Object` with the function ``"capitalize"``.  Calling this
function from JavaScript will run a C function named
``my_capitalization_func``.

.. code-block:: none

    rampart@machine:~/my_module>$ rampart make_cmod_template.js myutil -f my_capitalize_func:capitalize:1:s
    rampart@machine:~/my_module>$ ls
    make_cmod_template.js  Makefile  myutil.c  myutil-test.js
    rampart@machine:~/my_module>$ make
    cc -Wall -g -O2 -std=c99 -I/usr/local/rampart/include  -fPIC -shared -Wl,-soname,myutil.so -o myutil.so myutil.c
    myutil.c: In function ‘my_capitalize_func’:
    myutil.c:5:18: warning: unused variable ‘js_arg1’ [-Wunused-variable]
        5 |     const char * js_arg1 = REQUIRE_STRING(ctx, 0, "capitalize: argument 1 must be a string");
          |                  ^~~~~~~

At this stage, the function does not actually do anything (hence the warning
above).  But it is a fully functioning module which can now be edited to add
actual functionality. The ``myutil.c`` file will contain the following:

.. code-block:: c

    #include "/usr/local/rampart/include/rampart.h"

    static duk_ret_t my_capitalize_func(duk_context *ctx)
    {
        const char * js_arg1 = REQUIRE_STRING(ctx, 0, "capitalize: argument 1 must be a string");

        /* YOUR CODE GOES HERE */

        return 1;
    }

    /* **************************************************
       Initialize module
       ************************************************** */
    duk_ret_t duk_open_module(duk_context *ctx)
    {
        /* the return object when var mod=require("myutil") is called. */
        duk_push_object(ctx);


        /* js function is mod.capitalize and it calls my_capitalize_func */
        duk_push_c_function(ctx, my_capitalize_func, 1);
        duk_put_prop_string(ctx, -2, "capitalize");

        return 1;
    }

We can add the needed ``#includes`` and replace the ``/* YOUR CODE GOES HERE */`` with the following:

.. code-block:: c

    //for linux and strdup and -std=c99
    #define _DEFAULT_SOURCE
    #include <ctype.h>
    #include <string.h>
    #include "/usr/local/rampart/include/rampart.h"

    static duk_ret_t my_capitalize_func(duk_context *ctx)
    {
        const char * js_arg1 = REQUIRE_STRING(ctx, 0, "capitalize: argument 1 must be a string");

        char *capped = strdup(js_arg1), *s=capped;
        while(*s) *(s++)=toupper(*s);
        duk_push_string(ctx, capped);
        free(capped);

        return 1;
    }

Then recompile:

.. code-block:: none

    rampart@machine:~/my_module>$ make


Also created is a script to test the new module named ``mymod-test.js``.

.. code-block:: javascript

    rampart.globalize(rampart.utils);

    var myutil = require("myutil");

    function testFeature(name,test,error)
    {
        if (typeof test =='function'){
            try {
                test=test();
            } catch(e) {
                error=e;
                test=false;
            }
        }
        printf("testing %-50s - ", name);
        if(test)
            printf("passed\n")
        else
        {
            printf(">>>>> FAILED <<<<<\n");
            if(error) printf('%J\n',error);
            process.exit(1);
        }
        if(error) console.log(error);
    }


    testFeature("myutil.capitalize basic functionality", function(){
        var lastarg = "String";
        return lastarg == myutil.capitalize(lastarg);
    });



Next step is to modify the ``testFeature()`` call in ``mymod-test.js`` to verify
the new function works as expected:

.. code-block:: javascript

    testFeature("myutil.capitalize basic functionality", function(){
        var mystring = "String";
        var expected = "STRING";
        return expected == myutil.capitalize(mystring);
    });

Running the test script results in the following output:

.. code-block:: none

    rampart@machine:~/my_module>$ rampart myutil-test.js
    testing myutil.capitalize basic functionality              - passed

See: 
    :ref:`Macros <rpmacros>` below for some useful macros.

See also:
    `Duktape Api <https://duktape.org/api>`_

rampart-cmodule
---------------

With the rampart-cmodule, it is possible to embed c code that will be
automatically compiled for use as a javascript function.

Usage:

.. code-block:: javascript

    var cmodule = require('rampart-cmodule.js');
    
    var myfunc = cmodule(funcName, funcCode, supportFuncs, flags, libs, extraSearchPath);

    /* or */

    var myfunc = cmodule({
        name:funcName, 
        exportFunction:funcCode, 
        supportCode: supportFuncs,
        compileFlags: flags,
        libraries: libs,
        rpHeaderLoc: extraSearchPath
    });

Where:
    * ``funcName`` is a :green:`String` - the name of your C function and module.
    * ``exportFunction`` is a :green:`String` - code that contains 
      ``#include`` lines and a single function block
      **without** the function name and signature.
    * ``supportFuncs`` is a :green:`String` - support functions which will be placed
      above the ``exportFunction`` and below the ``#include`` lines, so they can be
      called from the exportFunction without forward declarations.
    * ``flags`` is a :green:`String` - any desired flags like ``-g -O2`` and the like.
    * ``libs``  is a :green:`String` -  libraries to be included when compiling, such as ``-lm``. 
    * ``rpHeaderLoc`` is a :green:`String` - a path to first search for ``rampart.h``.  If omitted
      the search will include ``process.installPath + "/include/rampart.h"`` and other standard locations.

Example:

.. code-block:: javascript

    var cmodule = require('rampart-cmodule.js');

    var name = "squareRoot";

    // include lines and function block only.  Any extra, including
    // comments not inside the function will throw an error.
    var func =  `
    #include <math.h>

    {
        double d = REQUIRE_NUMBER(ctx, 0, "squareRoot: argument 1 must be a Number");

        duk_push_number(ctx, _square_root(d) );

        return 1;
    }`;

    // support functions are written as normal C and placed above the main function
    var supportFuncs = `
    static double _square_root (double a) {
        return sqrt(a);
    }`;

    var extraFlags="-g -O3";

    var libs = "-lm"

    //build squareRoot.so, or throw error
    var sqRt = cmodule(name, func, supportFuncs, extraFlags, libs);
    console.log(sqRt(64));

    // second go, don't need program if it is already built
    // effectively the same as var myfunc2 = require('squareRoot.so');
    var sqRt2 = cmodule(name);
    console.log(sqRt2(111));

    /* expected output:
       Files:
            Two files named squareRoot.c and squareRoot.so
       Stdout:
            8
            10.535653752852738
    */

See:
    `Duktape Api <https://duktape.org/api>`_

.. |br| raw:: html

    <br />

.. _rpmacros:

Rampart Macros for C Modules
----------------------------

    Require macros require that the particular JavaScript variable be of the specified type, or throws
    the given error, which is a variadic printf type format.
    
    +------------------------------------------------+---------------------+-------------------------------+
    | Macro                                          | Return Type         | Notes                         |
    +================================================+=====================+===============================+
    | ``REQUIRE_STRING(ctx,idx,...)``                | const char *        |                               |
    +------------------------------------------------+---------------------+-------------------------------+
    | ``REQUIRE_LSTRING(ctx,idx,sz,...)``            | const char *        | sz is a ``duk_size_t *``      |
    +------------------------------------------------+---------------------+-------------------------------+
    | ``REQUIRE_INT(ctx,idx,...)``                   | int                 | ``(int) double``              |
    +------------------------------------------------+---------------------+-------------------------------+
    | ``REQUIRE_UINT(ctx,idx,...)``                  | unsigned int        | ``(unsigned int) double`` |br||
    |                                                |                     | throws error if double < 0    |
    +------------------------------------------------+---------------------+-------------------------------+
    | ``REQUIRE_POSINT(ctx,idx,...)``                | int                 | throws error                  |
    |                                                |                     | if int < 0                    |
    +------------------------------------------------+---------------------+-------------------------------+
    | ``REQUIRE_INT64(ctx,idx,...)``                 | int64_t             | ``(int64_t) double``          |
    +------------------------------------------------+---------------------+-------------------------------+
    | ``REQUIRE_UINT64(ctx,idx,...)``                | uint64_t            | ``(uint64_t) double``   |br|  |
    |                                                |                     | throws error                  |
    |                                                |                     | if double < 0                 |
    +------------------------------------------------+---------------------+-------------------------------+
    | ``REQUIRE_BOOL(ctx,idx,...)``                  | int                 |  ``0`` | ``1``                |
    +------------------------------------------------+---------------------+-------------------------------+
    | ``REQUIRE_NUMBER(ctx,idx,...)``                | double              |                               |
    +------------------------------------------------+---------------------+-------------------------------+
    | ``REQUIRE_FUNCTION(ctx,idx,...)``              | none                | no return                     |
    +------------------------------------------------+---------------------+-------------------------------+
    | ``REQUIRE_OBJECT(ctx,idx,...)``                | none                | no return                     |
    +------------------------------------------------+---------------------+-------------------------------+
    | ``REQUIRE_PLAIN_OBJECT(ctx,idx,...)``          | none                | no return |br|                | 
    |                                                |                     | throw if array or function    |
    +------------------------------------------------+---------------------+-------------------------------+
    | ``REQUIRE_ARRAY(ctx,idx,...)``                 | none                | no return                     |
    +------------------------------------------------+---------------------+-------------------------------+
    | ``REQUIRE_BUFFER_DATA(ctx,idx,sz,...)``        | void *              | sz is a ``duk_size_t *`` |br| |
    |                                                |                     | any buffer type               |
    +------------------------------------------------+---------------------+-------------------------------+
    | ``REQUIRE_STR_TO_BUF(ctx,idx,sz,...)``         | void *              | sz is a ``duk_size_t *`` |br| |
    |                                                |                     | If string, converts           |
    |                                                |                     | to buffer first               |
    +------------------------------------------------+---------------------+-------------------------------+
    | ``REQUIRE_STR_OR_BUF(ctx,idx,sz,...)``         | const char *        | sz is a ``duk_size_t *`` |br| |
    |                                                |                     | casts to ``(const char *)``   |
    |                                                |                     | if buffer                     |
    +------------------------------------------------+---------------------+-------------------------------+

    Example:

    For a function that must be called as ``myfunc(bufData, myPosInt)`` where ``bufData`` must
    be a :green:`Buffer` and ``myPosInt`` must be a :green:`Number` equal to or greater than ``0``. 

    .. code-block:: C

        duk_size_t mybufsz;
        void *mybuf = REQUIRE_BUFFER_DATA(ctx, 0, &mybufsz, "myfunc - First argument must be a Buffer");

        duk_idx_t idx = 1;
        int myposInt = REQUIRE_POSINT(ctx, idx, "myfunc - Argument #%d must be a positive integer", (int)(idx+1));


Throw Macro:
    At any point in any function, a JavaScript error can be thrown and flow of the program can be returned
    to Javascript by using RP_THROW (which uses `duk_push_error_object() <https://duktape.org/api#duk_push_error_object>`_ 
    and `duk_throw() <https://duktape.org/api#duk_throw>`_\ ).

.. code-block:: C

    if(something_bad)
        RP_THROW(ctx, "Something bad happened at line %d", __LINE__);

Getting duk_context:
    The ``exportFunction`` will already have ``duk_context *ctx`` passed to it.  In other functions, you can continue to pass
    the ``ctx`` pointer, or, if necessary, it can be retrieved as such:

.. code-block:: C

    RPTHR *thr = get_current_thread();
    duk_context *ctx = thr->ctx;
    
Note:
    ``* ctx`` is not a global variable, and may change depending on the current thread.  Nothing special
    needs to be done to retrieve the valid ``ctx`` other than the above.

Debugging stack:
    Keeping track of variables on the duktape value stack can be aided with a few macros that
    print out the stack contents.

    * ``printstack(ctx)`` - A simple printout of the value stack contents.
    * ``prettyprintstack(ctx)`` - A JSON-like printout of the stack.
    * ``safeprintstack(ctx)``  - Prints stack, taking care to not infinitely regress if there are 
      self referencing or cyclic :green:`Objects` present.
    * ``safeprettyprintstack(ctx)`` - combines the two above.
    * ``printat(ctx, idx)`` - prints the variable at stack index ``idx``
    * ``printenum(ctx, idx)`` - enumerate :green:`Object` at idx, printing out
      key/value pairs and including non-enumerable, symbols and hidden symbols.

Returning a value to JavaScript:
    Pushing a value to the top of the stack and returning ``1`` will set the return value in Javascript.
    Returning ``0`` sets the return value to ``undefined``.  See the ``duk_push_*`` functions in the
    `Duktape Api <https://duktape.org/api>`_\ .  If the value to be returned is not on the top of the
    stack, `duk_dup() <https://duktape.org/api#duk_dup>`_  
    or `duk_pull() <https://duktape.org/api#duk_pull>`_
    functions may be used to place the variable on top of the stack before returning.

Simple Type Check:
    A simple type check of a value can be performed using ``rp_gettype()``.

    .. code-block:: C

        int type = rp_gettype(ctx, idx);
        /* type is one of:
             RP_TYPE_STRING
             RP_TYPE_ARRAY
             RP_TYPE_NAN
             RP_TYPE_NUMBER
             RP_TYPE_FUNCTION
             RP_TYPE_BOOLEAN
             RP_TYPE_BUFFER
             RP_TYPE_NULL
             RP_TYPE_UNDEFINED
             RP_TYPE_SYMBOL
             RP_TYPE_DATE
             RP_TYPE_OBJECT
             RP_TYPE_FILEHANDLE
             RP_TYPE_UNKNOWN
       */

    This allows you to, e.g., check for a :green:`Date Object` without getting ``"object"`` back as you would
    with ``typeof`` and obviates the need to use of ``instanceOf Date`` or ``Array.isArray()`` where is not cleanly
    codable in C. It is also the basis of the :ref:`rampart.utils.getType() JavaScript call <rampart-utils:getType>`.
