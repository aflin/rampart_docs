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
      with the redirect server and monitor processs if either was launched.

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

        function_args format (each argument seperated by a ':'):

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

GraphicsMagick Module
---------------------

Included in the rampart unsupported extras is a module to perform
transformations on images using the ``graphicsMagick`` library.

Because it relies on an external library, it is unsupported and
must be compiled from the souce.

Details on usage and how to compile can be found in the 
`unsupported_extras/graphicsmagick <https://github.com/aflin/rampart/tree/main/unsupported_extras/graphicsmagick>`_
directory of the rampart distribution.

websocket_client
----------------

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

