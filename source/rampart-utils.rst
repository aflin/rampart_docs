rampart.utils
=============

Utility functions are provided in the global ``rampart.utils`` :green:`Object`.
These functions bring file io and other functionality to Duktape JavaScript.


License
"""""""

The modified ``printf`` code used in the rampart utilities and in
:ref:`the Rampart Server Module <rampart-server:The rampart-server HTTP module>`
is provided by
`Marco Paland <https://github.com/mpaland/printf>`_ under the
`MIT License <https://github.com/mpaland/printf/blob/master/LICENSE>`_\ .

The ``%!H`` HTML escape decoding is provided by
`Christoph Gärtner <https://bitbucket.org/cggaertner/cstuff/src/master/entities.c>`_
under the  `Boost License <https://www.boost.org/users/license.html>`_\ .

The utilities are included in Rampart JavaScript and as such are licensed under
the same MIT license.

General Utilities
"""""""""""""""""

printf
''''''

Print a formatted string to stdout.  Provides C-like
`printf(3) <https://man7.org/linux/man-pages/man3/printf.3.html>`_
functionality in JavaScript.


Usage:

.. code-block:: javascript

   rampart.utils.printf(fmt, ...)

Return Value:
   :green:`Number`. The length in bytes of the printed string.

Standard formats:  Most of the normal flags and formats are respected.
See standard formats and flags from
`printf(3) <https://man7.org/linux/man-pages/man3/printf.3.html>`_.

Extended (non-standard) formats:

   * ``%s`` - corresponding argument is treated as a :green:`String`
     (converted/coerced if necessary; :green:`Objects` are converted the
     same as for ``%J`` and :green:`Buffers`
     are printed as is).

   * ``%S`` - same as ``%s`` except an error is thrown if the corresponding argument is
     not a :green:`String`.

   * ``%J`` - print :green:`Object` as JSON.  An optional width (i.e.
     ``printf("%4J", obj);``) may be given which will print with new lines and
     indentation of the specified amount. Thus ``printf("%4J", obj);`` is
     equivalent to ``printf("%s", JSON.stringify(obj, null, 4) );``.

      * if ``!`` flag is present, a safe version of JSON will be printed where
        any references to inner :green:`Objects` are marked.  See second
        example below.  Note: if ``!`` is omitted but printing would fail
        because of cyclic references, then ``!`` is implied.  Also this flag 
        will print any methods of an object which would otherwise be hidden
        with values such as ``myfunc: {"_ecmascript_func": true}``.

   * ``%B`` - print contents of a :green:`Buffer` or :green:`String` as
     base64.

      * If ``!`` flag present, it decodes a :green:`Buffer` or
        :green:`String` containing base64 (throws an error if not valid
        base64).

      * If a width is given (e.g. ``%80B``), a newline will be printed
        after every ``width`` characters.

      * If the ``-`` flag is present and ``!`` is not present, the output
        will be a modified url safe base64 (using ``-`` and ``_`` in place
        of ``+`` and ``/``).

      * If the ``0`` flag is given (e.g. ``%0B`` or ``%-080B``), and ``!``
        is not present, the output will not be padded with ``=`` characters.

   * ``%U`` - url encode (or if ``!`` flag present, decode) a :green:`String`.

   * ``%H`` - html encode (or if ``!`` flag present, decode) a :green:`String`.

   * ``%P`` - pretty print a :green:`String` or :green:`Buffer`.  Expects
     text with white space.  Format is ``%[!][-][i][.w]P`` where:

     * ``i`` is the optional level of indentation.  Each output line will be indented
       by this amount.  Default is ``0``.  If ``0``, the indent level for
       each paragraph will match the indentation of the first line of the corresponding
       paragraph in the input text (number of spaces at beginning of the paragraph).

     * ``-`` when used with the ``!`` flag optionally sets indentation to 0
       on all lines regardless of ``i`` or leading white space on first line.

     * ``.w`` where ``w`` is the optional length of each line (default ``80`` if not
       specified).

     * ``!`` specifies, if present, that newlines are not converted to spaces (but text
       after newlines is still indented).  In all cases, a double newline
       ("\\n\\n") is considered a separator of paragraphs and is respected.

   * ``%w`` - a shortcut format for ``%!-.wP`` - where ``w`` is effectively unlimited.
     Remove all leading white space from each line and don't wrap lines.

   * ``%C`` - like ``%c`` but prints multi-byte character.  Example:

     ``rampart.utils.printf("%C", 0xf09f9983);`` prints ``🙃``.

     Requires a number, 1-4 bytes (``0``-``4294967295``, or ``0x0``-``0xffffffff``).

Example:

.. code-block:: javascript

   var uenc = "a+url+encoded+string.+%27%23%24%3f%27";

   rampart.utils.printf("Encoded: %s\nDecoded: %!U\n", uenc, uenc);

   /* expected output:
   Encoded: a+url+encoded+string.+%27%23%24%3f%27
   Decoded: a url encoded string. '#$?'
   */

   var getty = "Four score and seven years ago our fathers\n" +
            "brought forth on this continent, a new nation,\n" +
            "conceived in Liberty, and dedicated to the proposition\n" +
            "that all men are created equal."

   rampart.utils.printf("%5.40P\n", getty);
   /* or
        rampart.utils.printf("%*.*P\n", 5, 40, getty);
   */

   /* expected output:
        Four score and seven years ago our
        fathers brought forth on this
        continent, a new nation, conceived
        in Liberty, and dedicated to the
        proposition that all men are
        created equal.
   */

    var html =
    "<html>\n"+
    "  <body>\n"+
    "    <div>\n"+
    "      content\n"+
    "    </div>\n"+
    "  </body>\n"+
    "</html>\n";

    /* remove leading white space */
    /* rampart.utils.printf("%!-.1000P", html); */
    /* or more simply as */
    rampart.utils.printf("%w", html);

    /* expected output
    <html>
    <body>
    <div>
    content
    </div>
    </body>
    </html>
    */

Example printing JSON with cyclic references:

.. code-block:: javascript

   var x = {a:{c:1},b:{} };
   x.b.a = x.a;

   // without "!", it is printed as normal
   rampart.utils.printf("%3J\n", x);

   /* expected results
      {
         "a": {
            "c": 1
         },
         "b": {
            "a": {
               "c": 1
            }
         }
      }
   */

   // with "!" all self references are printed
   rampart.utils.printf("%!3J\n", x);

   /* expected results:
      {
         "a": {
            "c": 1
         },
         "b": {
            "a": {
               "_cyclic_ref": "$.a"
            }
         }
      }
   */

   // add cyclic ref
   x.x_ref = x;

   // with a cyclic ref present, "!" is implied
   rampart.utils.printf("%3J\n", x);

   /* expected results:
      {
         "a": {
            "c": 1
         },
         "b": {
            "a": {
               "_cyclic_ref": "$.a"
            }
         },
         "x_ref": {
            "_cyclic_ref": "$"
         }
      }
   */

sprintf
'''''''

Same as ``printf()`` except a :green:`String` is returned

Return Value:
   :green:`String`. The formatted string.

bprintf
'''''''

Same as ``sprintf()`` except a :green:`Buffer` is returned.

Return Value:
   :green:`Buffer`.  The formatted string as a :green:`Buffer`.

abprintf
''''''''

Same as ``bprintf()`` except a provided :green:`Buffer` is resized and appended.

Usage:

.. code-block:: javascript

    var newBuf = abprintf(oldbuf[, start], fmt, ...);

Where:

    * ``oldbuf`` is a :green:`Buffer` - the :green:`Buffer` to be appended.

    * ``start`` is an optional :green:`Number`, where in ``oldbuf`` to start
      writing data.  Default is the end of ``oldbuf``.  May be a negative
      number, signifying how many bytes from the end of the string to start.

    * ``fmt, ...`` - A format :green:`String` and optional format
      parameters.

Return Value:
   :green:`Buffer`.  The formatted string appended to ``oldbuf`` as a dynamic :green:`Buffer`.

Note:
    The :green:`Buffer` ``oldbuf`` will be altered if it is a dynamic
    buffer.  Otherwise, it will be copied and ``oldbuf`` remains unaltered.

hexify
''''''

Convert data to a hex string.

Usage:

.. code-block:: javascript

   var hexstring = rampart.utils.hexify(data [, upper]);

Where ``data`` is the string of bytes (:green:`String` or :green:`Buffer`)
to be converted and ``upper`` is an optional :green:`Boolean`, which if
``true`` prints using upper-case ``A-F``.

Return Value:
   :green:`String`. Each byte in data is converted to its two character hex representation.

Example:  See `dehexify`_ below.

dehexify
''''''''

Convert a hex string to a string of bytes.

Usage:

.. code-block:: javascript

   var data = rampart.utils.dehexify(hexstring);

Return Value:
   :green:`Buffer`.  Each two character hex representation converted to a
   byte in the binary string.


Example:

.. code-block:: javascript

   rampart.globalize(rampart.utils);

   var s=sprintf("%c%c%c%c",0xF0, 0x9F, 0x98, 0x8A);

   printf("0x%s\n", hexify(s) );
   printf("%s\n", dehexify(hexify(s)) );

   /* expected output:
   0xf09f988a
   😊
   */

stringToNumber
''''''''''''''

Convert various plain English :green:`Strings` to a :green:`Number` or 
:green:`Number` range.

Usage:

.. code-block:: javascript

   var buf = rampart.utils.stringToNumber(nstr [, retObj ]);

Where ``nstr`` is a :green:`String` and optional ``retObj`` is a :green:`Boolean`.

Examples:

.. code-block:: javascript

   rampart.globalize(rampart.utils);

   var res = strintToNumber("five");
   // res = 5

   res = stringToNumber("three and a half");
   // res = 3.5

   res = stringToNumber("four score and seven");
   // res = 87

   res = stringToNumber("five dozen");
   // res = 60

   res = stringToNumber("a gazillion");
   // res = NaN

   res = stringToNumber("five dozen", true);
   /* res = {
         "value": 60,
         "op": "=",
         "rem": ""
      }  */

   res = stringToNumber("five dozen cookies",true);
   /* res = {
         "value": 60,
         "op": "=",
         "rem": "cookies"
      }  */

   res = stringToNumber("less than twenty",true);
   /* res = {
         "value": 20,
         "op": "<",
         "rem": ""
      }  */

   res = stringToNumber("less than twenty greater than one half is our range",true);
   /* res = {
         "value": 20,
         "min": 0.5,
         "max": 20,
         "rem": "is our range"
      }  */


stringToBuffer
''''''''''''''

Performs a byte-for-byte copy of a :green:`String` into a :green:`Buffer`.
Also convert one :green:`Buffer` to a :green:`Buffer` of another type.
See ``duk_to_buffer()`` in the
`Duktape documentation <https://wiki.duktape.org/howtobuffers2x#string-to-buffer-conversion>`_

Usage:

.. code-block:: javascript

   var buf = rampart.utils.stringToBuffer(data [, buftype ]);

Where ``data`` is a :green:`String` or :green:`Buffer` and ``buftype`` is one of the following
:green:`Strings`:

   * ``"fixed"`` - returned :green:`Buffer` is a "fixed" :green:`Buffer`.
   * ``"dynamic"`` - returned :green:`Buffer` is a "dynamic" :green:`Buffer`.

If no ``buftype`` is given and ``data`` is a :green:`Buffer`, the same type of :green:`Buffer`
is returned.  If no ``buftype`` is given and ``data`` is a :green:`String`, a "fixed"
:green:`Buffer` is returned.

See `Duktape documentation <https://wiki.duktape.org/howtobuffers2x>`_ for
more information on different types of :green:`Buffers`.

Return Value:
   :green:`Buffer`.  Contents of :green:`String`/:green:`Buffer` copied to a new :green:`Buffer` :green:`Object`.

bufferToString
''''''''''''''

Performs a 1:1 copy of the contents of a :green:`Buffer` to a :green:`String`.

See ``duk_buffer_to_string()`` in the
`Duktape documentation <https://wiki.duktape.org/howtobuffers2x#buffer-to-string-conversion>`_

Usage:

.. code-block:: javascript

   var str = rampart.utils.bufferToString(data);

Where data is a :green:`Buffer` :green:`Object`.

Return Value:
   :green:`String`.  Contents of :green:`Buffer` copied to a new :green:`String`.

objectToQuery
'''''''''''''

Convert an :green:`Object` of key/value pairs to a :green:`String` suitable for use as a query
string in an HTTP request.

Usage:

.. code-block:: javascript

   var qs = rampart.utils.objectToQuery(kvObj [, arrayOpt]);

Where ``kvObj`` is an :green:`Object` containing the key/value pairs and ``arrayOpt``
controls how :green:`Array` values are treated. A :green:`String`,
one of the following:

   * ``"repeat"`` - default value if not specified.  Repeat the key in the
     query string with each value from the array.  Example:
     ``{key1: ["val1", "val2"]}`` becomes ``key1=val1&key1=val2``.

   * ``"bracket"`` - similar to repeat, except url encoded ``[]`` is appended
     to the keys.  Example: ``{key1: ["val1", "val2"]}`` becomes
     ``key1%5B%5D=val1&key1%5B%5D=val2``.

   * ``"comma"`` - One key with corresponding values separated by a ``,``
     (comma).  Example: ``{key1: ["val1", "val2"]}`` becomes
     ``key1=val1,val2``.

   * ``"json"`` - encode array as JSON.  Example:
     ``{key1: ["val1", "val2"]}`` becomes
     ``key1=%5b%22val1%22%2c%22val2%22%5d``.

Note that the values ``null`` and ``undefined`` will be translated as the
:green:`Strings` ``"null"`` and ``"undefined"`` respectively.  Also values which
themselves are :green:`Objects` will be converted to JSON.

queryToObject
'''''''''''''

Convert a query string to an :green:`Object`.  Reverses the process, with caveats, of
`objectToQuery`_\ ().

Usage:

.. code-block:: javascript

   var kvObj = rampart.utils.queryToObject(qs);

Caveats:

*  All primitive values will be converted to :green:`Strings` unless
   ``json`` was used.

*  If ``repeat`` or ``bracket`` was used to create the
   query string, all values will be returned as strings (even if an :green:`Array` of
   :green:`Numbers` was given to `objectToQuery`_\ ().

*  If ``comma`` was used to create the query string, no separation of comma
   separated values will occur and the entire value will be returned as a :green:`String`.

*  If ``json`` was used, numeric values will be preserved as :green:`Numbers`.

*  If the query string contains object like notation (e.g.
   ``"myvar[mykey]=myval&myvar[mykey2]=myval2"``), it will be converted into
   an :green:`Object` (``{myvar: {mykey:"myval", mykey2:"myval2"} }``).

Example:

.. code-block:: javascript

   var obj= {
     key1: null,
     key2: [1,2,3],
     key3: ["val1","val2"]
   }

   var type = [ "repeat", "bracket", "comma", "json" ];

   for (var i=0; i<4; i++) {
       var qs = rampart.utils.objectToQuery(obj, type[i] );
       var qsobj = rampart.utils.queryToObject(qs);
       rampart.utils.printf("queryToObject(\n     '%s'\n    ) = \n%3J\n", qs, qsobj);
   }

   /* expected output:
   queryToObject(
        'key1=null&key2=1&key2=2&key2=3&key3=val1&key3=val2'
       ) =
   {
      "key1": "null",
      "key2": [
         "1",
         "2",
         "3"
      ],
      "key3": [
         "val1",
         "val2"
      ]
   }
   queryToObject(

   'key1=null&key2%5B%5D=1&key2%5B%5D=2&key2%5B%5D=3&key3%5B%5D=val1&key3%5B%5D=val2'
       ) =
   {
      "key1": "null",
      "key2": [
         "1",
         "2",
         "3"
      ],
      "key3": [
         "val1",
         "val2"
      ]
   }
   queryToObject(
        'key1=null&key2=1,2,3&key3=val1,val2'
       ) =
   {
      "key1": "null",
      "key2": "1,2,3",
      "key3": "val1,val2"
   }
   queryToObject(
        'key1=null&key2=%5b1%2c2%2c3%5d&key3=%5b%22val1%22%2c%22val2%22%5d'
       ) =
   {
      "key1": "null",
      "key2": [
         1,
         2,
         3
      ],
      "key3": [
         "val1",
         "val2"
      ]
   }
   */


getchar
'''''''

Get one or more characters from ``stdin``.

Usage:

.. code-block:: javascript

   var instr = rampart.utils.getchar([nchar]);

Where ``nchar`` is an optional :green:`number`, the number of characters
to read from ``stdin``.  The default is ``1``.

Return Value:
   A :green:`String` of length ``nchars``.

Note:
   If ``stdin`` is from an interactive terminal, execution
   will be paused until ``nchar`` chars are input.  Unlike
   ``fread(stdin);`` :ref:`below <rampart-utils:fread>`, the terminal will be
   set to return characters in without waiting for a newline.

readFile
''''''''

Read the contents of a file.

Usage:

.. code-block:: javascript

   var contents = rampart.utils.readFile({
      file: filename
      [, offset: offsetPos]
      [, length: rLength]
      [, returnString: return_str]
   });

   /* or */

   var contents = rampart.utils.readFile(filename [, offsetPos [, rLength]] [, return_str]);


Where values ``filename`` and optional values
``offsetPos``, ``rLength`` and/or ``return_str`` are:


+------------+-----------------+--------------------------------------------------------------+
|Argument    |Type             |Description                                                   |
+============+=================+==============================================================+
|filename    |:green:`String`  | Path to the file to be read                                  |
+------------+-----------------+--------------------------------------------------------------+
|offsetPos   |:green:`Number`  | If positive, start position to read from beginning of file.  |
|            |                 +--------------------------------------------------------------+
|            |                 | If negative, start position to read from end of file.        |
+------------+-----------------+--------------------------------------------------------------+
|rLength     |:green:`Number`  | If greater than zero, amount in bytes to be read.            |
|            |                 +--------------------------------------------------------------+
|            |                 | If 0 or negative, position from end of file to stop reading. |
+------------+-----------------+--------------------------------------------------------------+
|return_str  |:green:`Boolean` | If not set, or ``false``, return a :green:`Buffer`.          |
|            |                 +--------------------------------------------------------------+
|            |                 | If ``true``, return contents as a :green:`String`.           |
|            |                 | May be truncated if the file contains null characters.       |
+------------+-----------------+--------------------------------------------------------------+

Return Value:
   :green:`Buffer` or :green:`String`.  The contents of the file.

Example:

.. code-block:: javascript

   rampart.utils.fprintf("/tmp/file.txt","This is a text file\n");

   var txt = rampart.utils.readFile({
      filename:  "/tmp/file.txt",
      offset:    10,
      length:    -6,
      retString: true
   });

   /* or var txt = rampart.utils.readFile("/tmp/file.txt", 10, -6, true); */

   rampart.utils.printf("'%s'\n", txt);

   /* expected output:
   'text'
   */

Note:
    If ``return_str`` is ``true`` and ``offsetPos`` and/or ``rLength`` are
    set, the returned :green:`String` may be shortened to ensure that the
    return value is a valid UTF-8 string.  If that behavior is not desired,
    returning a :green:`Buffer` and converting to a string with, e.g.
    `sprintf`_\ () or `bufferToString`_\ () will bypass the UTF-8
    character/byte boundary check.


trim
''''

Remove whitespace characters from the beginning and end of a :green:`String`.

Usage:

.. code-block:: javascript

   var trimmed = rampart.utils.trim(str);

Where ``str`` is a :green:`String`.

Return Value:
   :green:`String`. ``str`` with whitespace removed from beginning and end.

Example:

.. code-block:: javascript

   var str = "\n a line of text \n";
   rampart.utils.printf("'%s'", rampart.utils.trim(str));
   /* expected output:
   'a line of text'
   */

stat
''''

Return information on a file.

Usage:

.. code-block:: javascript

   var st = rampart.utils.stat(file);

Where ``file`` is a :green:`String` (name of file).

Return Value:
   :green:`Boolean`/:green:`Object`. ``false`` if file does not exist.  Otherwise an :green:`Object` with the following
   properties:

.. code-block:: javascript

   {
      "dev":               Number,
      "ino":               Number,
      "mode":              Number,
      "nlink":             Number,
      "uid":               Number,
      "gid":               Number,
      "rdev":              Number,
      "size":              Number,
      "blksize":           Number,
      "blocks":            Number,
      "atime":             Date,
      "mtime":             Date,
      "ctime":             Date,
      "readable":          Boolean,
      "writable":          Boolean,
      "executable":        Boolean,
      "owner":             String,
      "group":             String,
      "isBlockDevice":     Boolean,
      "isCharacterDevice": Boolean,
      "isDirectory":       Boolean,
      "isFIFO":            Boolean,
      "isFile":            Boolean,
      "isSocket":          Boolean,
      "permissions":       String  /* i.e. "-rw-r--r--" */
   }

See `stat (2) <https://man7.org/linux/man-pages/man2/stat.2.html>`_ for the
meaning of each property.  The ``is*`` :green:`Booleans` are set to ``true`` if the
corresponding file property is true.

Example:

.. code-block:: javascript

   var st = rampart.utils.stat("/tmp/file.txt");

   if(st) {
      /* print file mode as octal number */
      rampart.utils.printf("%o\n", st.mode & 0777)
   } else {
      console.log("file /tmp.file.txt does not exist");
   }
   /* expected output: 644 */

lstat
'''''

Same as `stat`_\ () except if ``file`` is a link, return information about the link itself.

Return Value:
   Same as `stat`_\ () with the addition of the property
   ``isSymbolicLink`` which is set ``true`` if the file is a symbolic link.
   ``readable`` and ``writable`` refer to the link, not the target.

exec
''''

Run an executable file.

Usage:

.. code-block:: javascript

   var ret = rampart.utils.exec(command [, options] [,arg1, arg2, ..., argn] );

Where:

*  ``command`` - :green:`String`. An absolute path to an executable or the name of
   an executable that may be found in the current ``PATH`` environment variable.

*  ``options`` - :green:`Object`. Containing the following properties:

   *  ``timeout`` - :green:`Number`. Maximum amount of time in milliseconds before
      the process is automatically killed.  Valid if ``background`` is unset
      or ``false``.

   *  ``killSignal`` - :green:`Number`. If timeout is reached, use this
      signal.  Valid if ``background`` is unset
      or ``false`` and a ``timeout`` value is set.

   *  ``background`` - :green:`Boolean`.  Whether to execute detached and return
      immediately.  If ``true``, ``stdout`` and ``stderr`` below will be set to ``null``.  Any ``timeout``
      value is ignored.

   *  ``env`` - :green:`Object`. Key/value pairs to be used as environment variables for the executed process.
      Default, if not provided is :ref:`process.env <rampart-main:env>`.  An empty :green:`Object`
      (``{}``) removes all environment variables.

   *  ``appendEnv`` - :green:`Boolean`.  If ``false`` (the default),
      only the environment variables given in ``env`` will be available.  If
      ``true``, variables provided in ``env`` will be appended to :ref:`process.env <rampart-main:env>`.
      Duplicate keys in :ref:`process.env <rampart-main:env>` are replaced with the value from ``env``.

   *  ``stdin`` - :green:`String` or :green:`Buffer`.  If specified, the content
      of the :green:`String` or :green:`Buffer` is piped to the command as stdin.

   *  ``returnBuffer`` - :green:`Boolean`.  Whether content is returned in a
      :green:`Buffer` rather than a :green:`String`.  Useful for capturing
      binary data output.

   *  ``args`` - :green:`Array`.  An array of arguments to be passed to the
      executable.  If arguments are also given as parameters to ``exec()``,
      the :green:`Array` of arguments are appended.

   *  ``changeDirectory`` - :green:`String`.  Change the working directory
      to value before executing.

   *  ``cd`` - Alias for ``changeDirectory`` .

*  ``argn`` - :green:`String`/:green:`Number`/:green:`Object`/:green:`Boolean`/:green:`Null` - Arguments to be passed to
   ``command``.  Non-Strings are converted to a :green:`String` (e.g. "true", "null",
   "42" or for :green:`Object`, the equivalent of ``JSON.stringify(obj)``).

Return Value:
   :green:`Object`.  Properties as follows:

   * ``stdout`` - :green:`String`. Output of command if ``background`` is not set ``true``.
     Otherwise ``null``.

   * ``stderr`` - :green:`String`. stderr output of command if ``background`` is not set ``true``.
     Otherwise ``null``.

   * ``exitStatus`` - :green:`Number`.  The returned exit status of the command.

   * ``timedOut`` - :green:`Boolean`.  Set true if the program was killed after
     ``timeout`` milliseconds has elapsed.

   * ``pid`` - :green:`Number`. Process id of the executed command.

shell
'''''

Execute :green:`String` in a bash shell. Equivalent to
``rampart.utils.exec("bash", "-c", shellcmd);``.

Usage:

.. code-block:: javascript

   var ret = rampart.utils.shell(shellcmd[, options]);

Where ``shellcmd`` is a :green:`String` containing the command and arguments to be
passed to bash and ``options`` are the same as specified for `exec`_\ .

Return Value:
   Same as `exec`_\ ().

Example:

.. code-block:: javascript

   var ret = rampart.utils.shell('echo -n "hello"; echo "hi" 1>&2;');
   console.log(JSON.stringify(ret, null, 3));

   /* expected output:
   {
      "stdout": "hello",
      "stderr": "hi\n",
      "timedOut": false,
      "exitStatus": 0,
      "pid": 24658
   }
   */

fork
''''

Fork the current process.

Usage:

.. code-block:: javascript

   var pid = rampart.utils.fork([pipe, pipe2, ..., pipeX]);

   if(pid=-1)
      rampart.utils.fprintf(rampart.utils.stderr, "error forking\n");

   if(pid) {
      //parent
   } else {
      //child
   }

Where ``pipeX`` is one or several pipes created with `newPipe`_ below.

Return Value:
   A :green:`Number` - The pid of the child in the parent process, ``0`` in
   the child process and ``-1`` if there is an error and fork failed.

Note:
    ``fork`` will throw an error if there are any threads running at the
    time of the fork, either from ``rampart.thread`` or ``rampart-server``.
    Threads, however, can be created after the fork in either the child
    or parent process.

newPipe
'''''''

Create a bi-directional pipe for passing variables between processes created
with `fork`_ above.

Usage:

.. code-block:: javascript

   var pipe = rampart.utils.newPipe();

   var pid = fork(pipe);

Return Value:
   An :green:`Object` of :green:`Functions`:

   * ``write(data)`` - write to the pipe, where data is any variable which
     can be serialized using ``CBOR``.  Return value is the number of bytes
     written. Note: writes may block if the pipe is full until the reading
     process reads with one of the two read functions below.  Throws an
     error if pipe has been closed.

   * ``read([function])``  - perform a blocking read of data sent from
     another process using ``write()`` above.  If a function is provided
     (i.e. ``function(value, error){}``) the value or error will be passed
     to that callback (with the other being undefined).  Return value will
     be undefined. If no function is provided, the return value will be an
     :green:`Object` with either ``value`` or ``error`` set.

   * ``onRead(function)`` - same as ``read``, except that a
     :green:`Function` is required, the call is non-blocking and the
     callback :green:`Function` will be called in the event loop each time
     data is available.  On error, the pipe will close and the event will be
     removed.

   * ``close()`` - close the pipe.  Any further reads or writes from either
     process will produce or throw an error.

Example:

.. code-block:: javascript

   var pipe = rampart.utils.newPipe();

   // fork and set the pipe for parent and child processes
   var pid = fork(pipe);

   if(pid ==-1) {
      rampart.utils.fprintf(rampart.utils.stderr, "error piping\n");
      process.exit(1);
   }

   if(pid) {
      //parent

      pipe.write("My first message");
      pipe.write("My second message");

   } else {
      //child

      var msg = pipe.read();
      if(msg.err)
         rampart.utils.fprintf(rampart.utils.stderr, "error reading- %s\n", msg.error);
      else
         rampart.utils.printf("msg = '%s'\n", msg.value);

      //run non-blocking in event loop
      pipe.onRead(function(val,err) {
         if(err)
            rampart.utils.fprintf(rampart.utils.stderr, "read event: error reading- %s\n", err);
         else
            rampart.utils.printf("read event: msg = '%s'\n", val);
      });

   }

daemon
''''''

Same as `fork`_ above, except it double forks, detaches and creates its own session.  Thus the child process
will continue to run after the parent and the controlling terminal exit.

forkpty
'''''''

Run an executable file in a pseudo-terminal with unbuffered IO.  IO is
performed asynchronously in the event loop of the current thread.

Usage:

.. code-block:: javascript

   var pty = rampart.utils.forkpty(command [, options] [,arg1, arg2, ..., argn] );

Where:

*  ``command`` - :green:`String`. An absolute path to an executable or the name of
   an executable that may be found in the current ``PATH`` environment variable.

*  ``options`` - :green:`Object`. Containing the following properties:

   *  ``env`` - :green:`Object`. Key/value pairs to be used as environment variables for the executed process.
      Default, if not provided is :ref:`process.env <rampart-main:env>`.  An empty :green:`Object`
      (``{}``) removes all environment variables.

   *  ``appendEnv`` - :green:`Boolean`.  If ``false`` (the default),
      only the environment variables given in ``env`` will be available.  If
      ``true``, variables provided in ``env`` will be appended to :ref:`process.env <rampart-main:env>`.
      Duplicate keys in :ref:`process.env <rampart-main:env>` are replaced with the value from ``env``.

*  ``argn`` - :green:`String`/:green:`Number`/:green:`Object`/:green:`Boolean`/:green:`Null` - Arguments to be passed to
   ``command``.  Non-Strings are converted to a :green:`String` (e.g. "true", "null",
   "42" or for :green:`Object`, the equivalent of ``JSON.stringify(obj)``).

Return Value:
   :green:`Object`.  Properties as follows:

   * ``read`` - :green:`Function`.  Read data from the stdout of the executed
     process.

      .. code-block:: javascript

         pty.read([buffersize [, maxread]] [, retstring]);

      Where: ``buffersize`` defaults to ``4096``, ``maxread`` defaults to
      unlimited and ``retstring`` (default ``false`` for
      :green:`Buffer`) is a :green:`Boolean` - whether the return
      contents should be converted to :green:`String`.

   * ``write`` - :green:`Function`. Write data to the stdin of the executed
     process.

     .. code-block:: javascript

        pty.write([buffer|string]);

   * ``resize`` - :green:`Function`. Set a new size for the pseudo-terminal.

       .. code-block:: javascript

          pty.resize(width, height);

      Where: ``width`` and ``height`` are :green:`Numbers` - number of
      character rows and columns.


   * ``on`` - :green:`Function`:  Two events are currently allowed:
     ``"data"`` and ``"close"``.  If, ``"data"`` is specified, when new data
     is available to be read, the provided callback function will be called.
     If ``"close"`` is specified, the provided callback function will be
     called when the process exits.

     .. code-block:: javascript

	pty.on(['data'|'close'], callback);


   If there is an initial error executing ``command``, ``forkpty()`` will throw an
   error.  When the command exits, the functions in the return object will be deleted.
   Therefore a check should be run before accessing any functions in case the pty has
   closed:

   .. code-block:: javascript

      var pty = rampart.utils.forkpty(command [, options] [,arg1, arg2, ..., argn] );

      if(pty.write)
         pty.write(msg);
      else
         do_cleanup();

   An example for using ``forkpty()`` with websockets to run a terminal in
   a web browser can be found
   `here <https://github.com/aflin/rampart/tree/main/unsupported_extras/forkpty-term>`_\ .


kill
''''

Terminate a process or send a signal.

Usage:

.. code-block:: javascript

   var ret = rampart.utils.kill(pid [, signal[, throwOnError]]);

Where:
   * ``pid`` is a :green:`Number`, the process id of process which will
     receive the signal.
   * ``signal`` is a :green:`Number`, or :green:`String`, the signal to send.
     If ``signal`` is not specified, ``15`` (``SIGTERM``) is used.  See manual
     page for kill(1) for a list of signals, which may vary by platform.  Setting
     ``signal`` to ``0`` sends no signal, but checks for the existence of the
     process identified by ``pid``. ``signal`` may also be a :green:`String`, a well
     known signal such as ``"SIGTERM"`` or ``"SIGUSR1"``.

   * ``throwOnError`` - :green:`Boolean` - whether to throw an error with a specified
     reason upon failure.  Default is ``false``.

Return Value:
   :green:`Boolean`.  ``true`` if the signal was successfully sent.  If ``throwOnError``
   is not ``true``, will return ``false`` if there was an error or process does not exist.

Example:

.. code-block:: javascript

   var ret = rampart.utils.exec("sleep", "100", {background:true});
   var pid=ret.pid;

   if (rampart.utils.kill(pid,0)) {
       console.log("process is still running");
       rampart.utils.kill(pid);
       rampart.utils.sleep(0.2);
       if( rampart.utils.kill(pid,0) == 0 )
          console.log("and now is dead");
   } else
       console.log("not running");
   /* expected output:
      process is still running
      and now is dead
   */


getcwd
''''''

Return the current working directory as a :green:`String`.

Usage:

.. code-block:: javascript

   rampart.utils.getcwd();

Return Value:
   A :green:`String`, the current working directory of the script.

chdir
'''''

Change the current working directory.

Usage:

.. code-block:: javascript

   rampart.utils.chdir(path);

Where ``path`` is a :green:`String`, the location of the new working
directory.  This command throws an error if it fails to change to the
specified directory.

Return Value:
   ``undefined``.

mkdir
'''''

Create a directory.

Usage:

.. code-block:: javascript

   rampart.utils.mkdir(path [, mode]);

Where ``path`` is a :green:`String`, the directory to be created and ``mode`` is a
:green:`Number` or :green:`String`, the octal permissions mode. Any parent directories which
do not exist will also be created.  Throws error if lacking permissions or
if another error was encountered.

Note that ``mode`` is normally given as an octal.  As such it can be, e.g.,
``0755`` (octal number) or ``"755"`` (:green:`String` representation of an octal
number), but ``755``, as a decimal number will give the octal ``01363``,
which is likely not what was intended.



Return Value:
   ``undefined``.

rmdir
'''''

Remove an empty directory.

Usage:

.. code-block:: javascript

   rampart.utils.rmdir(path [, recurse]);

Where ``path`` is a :green:`String`, the directory to be removed and ``recurse`` is an
optional :green:`Boolean`, which if ``true``, parent directories explicitly present in
``path`` will also be removed.  Throws an error if the directory cannot be
removed (.e.g., not empty or lacking permission).

Return Value:
   ``undefined``.

Example:

.. code-block:: javascript

   /* make the following directories in the
      current working directory             */
   rampart.utils.mkdir("p1/p2/p3",0755);

   /* remove the directories recursively */
   rampart.utils.rmdir("p1/p2/p3", true);



readDir
'''''''

Get listing of directory files.

Usage:

.. code-block:: javascript

   var files = rampart.utils.readdir(path [, showhidden]);

Where ``path`` is a :green:`String`, the directory whose content will be listed and
``showhidden`` is a :green:`Boolean`, which if ``true``, files or directories
beginning with ``.`` (hidden files) will be included in the return value.

Return Value:
   :green:`Array`.  An :green:`Array` of :green:`Strings`, each filename in the directory.


copyFile
''''''''

Make a copy of a file.

Usage:

.. code-block:: javascript

   rampart.utils.copyFile({src: source, dest: destination [, overwrite: overWrite]});

   /* or */

   rampart.utils.copyFile(source, destination [, overWrite]);

Where ``source`` is a :green:`String`, the file to be copied, ``destination`` is a
:green:`String`, the name of the target file and optional ``overWrite`` is a :green:`Boolean`
which if ``true`` will overwrite ``destination`` if it exists.

Return Value:
   ``undefined``.

rmFile
''''''

Delete a file.

Usage:

.. code-block:: javascript

   rampart.utils.rmFile(filename);

Where ``filename`` is a :green:`String`, the name of the file to be removed.

Return Value:
   ``undefined``.

link
''''

Create a hard link.

Usage:

.. code-block:: javascript

   rampart.utils.link({src: sourceName, target: targetName});

   /* or */

   rampart.utils.link(sourceName, targetName);

Where ``sourceName`` is the existing file and ``targetName`` is the name of
the to-be-created link.

Return Value:
   ``undefined``.

symlink
'''''''
Create a soft (symbolic) link.

Usage:

.. code-block:: javascript

   rampart.utils.symlink({src: sourceName, target: targetName});

   /* or */

   rampart.utils.symlink(sourceName, targetName);

Where ``sourceName`` is the existing file and ``targetName`` is the name of
the to-be-created symlink.

Return Value:
   ``undefined``.

chmod
'''''

Change the file mode bits of a file or directory.

Usage:

.. code-block:: javascript

   rampart.utils.chmod(path [, mode]);

Where ``path`` is a :green:`String`, the file or directory upon which to be operated
and ``mode`` is a :green:`Number` or :green:`String`, the octal permissions mode.  Any parent
directories which do not exist will also be created.  Throws error if
lacking permissions or if another error was encountered.

Note that ``mode`` is normally given as an octal.  As such it can be, e.g.,
``0755`` (octal number) or ``"755"`` (:green:`String` representation of an octal
number), but ``755``, as a decimal number will likely not work as intended.

Return Value:
   ``undefined``.

realPath
''''''''

Find the canonical form of a file system path.  The path or file must exist.

Usage:

.. code-block:: javascript

   rampart.utils.realPath(path);

Where ``path`` is a :green:`String`, not necessarily in canonical form.

Return Value:
   A :green:`String`, the canonical form of the path.  Throws an error if path does not exist.

touch
'''''

Create an empty file, or update the access timestamp of an existing file.

Usage:

.. code-block:: javascript

   rampart.utils.touch(file);

   /* or */

   rampart.utils.touch({
      path: file
      [, nocreate: noCreate]
      [, setaccess: setAccess]
      [, setmodify: setModify]
      [, reference: referenceFile]
   });

Where:

* ``file`` is a :green:`String`, the name of the file upon which to operate,

* ``noCreate`` is a :green:`Boolean` (default ``false``) which, if ``true``
  will only update the timestamp, and will not create a non-existing
  ``file``.

* ``setAccess`` is a :green:`Boolean` (default ``true``), a :green:`Date Object`,
  or an :green:`Number` (seconds since unix epoch).  Update access time of
  the file to specified date or current date if ``true``.  Do not update if
  ``false``.

* ``setModify`` is a :green:`Boolean` (default ``true``), a :green:`Date Object`,
  or an :green:`Number` (seconds since unix epoch).  Update modification time of
  the file to specified date or current date if ``true``.  Do not update if
  ``false``.

* ``referenceFile`` is a :green:`String`.  If specified, the named file's access and
  modification timestamps will be used rather than the current time/date.

Return Value:
   ``undefined``.

rename
''''''

Rename or move a file.

Usage:

.. code-block:: javascript

   rampart.utils.rename(source, destination);

Where ``source`` is a :green:`String`, the file to be renamed or moved, ``destination`` is a
:green:`String`, the name of the target file.

Return Value:
   ``undefined``.

sleep
'''''

Pause execution for specified number of seconds.

Usage:

.. code-block:: javascript

   rampart.utils.sleep(seconds);

Where ``seconds`` is a :green:`Number`.  Seconds may be a fraction of seconds.
Internally `nanosleep <https://man7.org/linux/man-pages//man2/nanosleep.2.html>`_
is used.

Example:

.. code-block:: javascript

   /* wait 1.5 seconds */
   rampart.utils.sleep(1.5);

getType
'''''''

Get the type of variable. A simplified but more specific version of
``typeof``.

Usage:

.. code-block:: javascript

    var type = rampart.utils.getType(myvar);

Return Value:
  A :green:`String`, one of ``String``, ``Array``, ``Number``, ``Function``,
  ``Boolean``, ``Buffer`` (any buffer type), ``Nan``, ``Null``,
  ``Undefined``, ``Date`` or ``Object`` (excluding any of the other types of
  :green:`Objects` such as ``Null``, ``Array`` or ``Function``) .

timezone
''''''''

Retrieve system timezone information.

Usage:

.. code-block:: javascript

   var tz = rampart.utils.timezone([directory]);

Where ``directory`` is an optional directory with timezone information.  Default
is ``"/usr/share/zoneinfo"``.

Return Value:
  An :green:`Object` with the following functions: ``findZone()``, ``findAbbr()`` and ``dump()``.

* ``tz.findZone(tzname)`` - Return an :green:`Object` with timezone information.  If the timezone 
  does not exist, returns ``undefined``.

* ``tz.findAbbr(abbrname)`` - Return an :green:`Object` with a list of timezones that match the given
  abbreviation.  If the abbreviation does not exist, returns ``undefined``.

* ``tz.dump()`` - Return an :green:`Object` with the entire database organized by timezones and 
  abbreviations.


Example:

.. code-block:: javascript

   var tz = rampart.utils.timezone();

   var pstZones = tz.findAbbr("PST");
   /*  ambiguous     => whether there are zones in "entries" with differing offsets
       zoneAbbrIndex => where in the "abbreviations" section of the zone info
                        below "PST" is found
   {
      "ambiguous": true,
      "entries": [
         {
            "offset": -28800,
            "offsetString": "-8:00",
            "zoneName": "America/Bahia_Banderas",
            "zoneAbbrIndex": 5
         },
         {
            "offset": -28800,
            "offsetString": "-8:00",
            "zoneName": "America/Boise",
            "zoneAbbrIndex": 2
         },
         ...
      ]
   }
   */   

   var LAZone = tz.findZone("America/Los_Angeles");
   /*
   {
      "name": "America/Los_Angeles",
      "abbreviations": [
         {
            "Abbreviation": "LMT",
            "UTCOffset": -28378,
            "isDST": false
         },
         {
            "Abbreviation": "PDT",
            "UTCOffset": -25200,
            "isDST": true
         },
         {
            "Abbreviation": "PST",
            "UTCOffset": -28800,
            "isDST": false
         },
         {
            "Abbreviation": "PWT",
            "UTCOffset": -25200,
            "isDST": true
         },
         {
            "Abbreviation": "PPT",
            "UTCOffset": -25200,
            "isDST": true
         },
         {
            "Abbreviation": "PST",
            "UTCOffset": -28800,
            "isDST": false
         }
      ],
      "transitions": [
         {
            "transitionDate": "1901-12-13T20:45:52.000Z",
            "transition": {
               "Abbreviation": "PST",
               "UTCOffset": -28800,
               "isDST": false
            }
         },
         {
            "transitionDate": "1918-03-31T10:00:00.000Z",
            "transition": {
               "Abbreviation": "PDT",
               "UTCOffset": -25200,
               "isDST": true
            }
         },
         ...
      ]
   }
   */

dateFmt
'''''''

Format a date :green:`String`.

Usage:

.. code-block:: javascript

    var datestr = rampart.utils.dateFmt(format[, date][, input_format])

Where:

   * ``format`` is a `strftime <https://linux.die.net/man/3/strftime>`_ style format
     :green:`String`.

   * ``date`` is an optional date as a :green:`String`, :green:`Number` (seconds since 1970-01-01),
     or a :green:`Date`.  The default value is the current time.

   * ``input_format`` is an optional format if ``date`` is a :green:`String`, in the style of
     `strptime <https://linux.die.net/man/3/strptime>`_\ .  The default is to try the following in order:

.. code-block:: javascript

    "%Y-%m-%d %H:%M:%S %z"
    "%A %B %d %H:%M:%S %Y %z"
    "%Y-%m-%d %H:%M:%S"
    "%A %B %d %H:%M:%S %Y"
    "%Y-%m-%dT%H:%M:%S"
    "%c"

Return Value:
   The formatted date as a :green:`String`.

Note:

   *  Millisecond notation in the string in the form of ``.123`` or ``.123Z`` is disregarded.

   *  The return :green:`String` is a date in local time.

   *  If year or year/month/day formats are missing, the current year or date respectively is assumed.

   *  If the ``%z`` format is specified in the ``input_format`` :green:`String`,
      the date will be converted from that timezone offset to local time.

   *  The ``%Z`` format has no effect on the time zone.

Example:

.. code-block:: javascript

   rampart.globalize(rampart.utils);

   var d = new Date();

   printf( "%s\n%s\n%s\n%s\n%s\n%s\n%s\n%s\n",
       dateFmt("%c", "Mon Jul 26 12:00:01 2021"),
       dateFmt("%c", "Mon Jul 26 12:00:01 2021 -04:00"),
       dateFmt("%c", "1999-12-31 23:59:59 -0000"),
       dateFmt("%c", "2020", "%Y"),
       dateFmt("%c", d),
       dateFmt("%Y-%m-%d"),
       dateFmt("%m/%d/%Y %H:%M:%S %Z", 946713599),
       dateFmt("Today's lunch:  %c", "12:15", '%H:%M')
   );

   /* Expected output:
   Mon Jul 26 12:00:01 2021
   Mon Jul 26 09:00:01 2021
   Fri Dec 31 15:59:59 1999
   Wed Jan  1 00:00:00 2020
   Tue Jul 27 01:06:57 2021
   2021-07-27
   12/31/1999 23:59:59 PST
   Today's lunch:  Tue Jul 27 12:15:00 2021
   */

scanDate
''''''''

Scan a date :green:`String` and return a JavaScript date.

Usage:

.. code-block:: javascript

   var mydate = rampart.utils.scanDate(dateString[, default_offset][, input_format]);

Where:

   * ``dateString`` is the same as ``date`` (as a :green:`String`) in `dateFmt`_ above.

   * ``default_offset`` is the time zone offset in seconds to use if not provided in ``dateString``.
     The default is ``0`` (UTC).

   * ``input_format`` is the same as in `dateFmt`_ above.

Return Value:
   A JavaScript :green:`Date`.


autoScanDate
''''''''''''

Attempt to match a date from a :green:`String` using various formats.

Usage:

.. code-block:: javascript

    var dateRes = autoScanDate(dateString);


Return Value: An :green:`Object`.

   If no timezone offset or abbreviation is present, the return object has 
   the following properties:
   
   * ``date``          - a JavaScript :green:`Date`.
   * ``offset``        - timezone offset (in this case ``0`` for GMT).
   * ``endIndex``      - last character position in ``dateString`` of the match.
   * ``matchedFormat`` - the format that was successfully matched.

   If a timezone offset is present, offset will be set to that timezone and 
   and GMT will be returned with the offset set.

   If a timezone abbreviation is present and valid, offset will be set to 
   the best matching timezone (as sorted by distance from the system timezone).
   Also present is ``dates`` for all the possible timezones which match the 
   abbreviation, filtered by the validity of the Abbreviation (i.e. PST vs PDT) 
   on the given date.

   If ``dateString`` could not be parsed, ``Null`` is returned.

Example:


.. code-block:: javascript

   var dateRes = autoScanDate("Jan 5 03:20 pm 2002");
   /*
   {
      "date": "2002-01-05T15:20:00.000Z",
      "offset": 0,
      "endIndex": 19,
      "matchedFormat": "%b %e %I:%M %p %Y"
   }
   */

   dateRes=autoScanDate("Jan 5 03:20 pm 2002 -0800");
   /*
   {
      "date": "2002-01-05T23:20:00.000Z",
      "offset": -28800,
      "endIndex": 25,
      "matchedFormat": "%b %e %I:%M %p %Y %z"
   }
   */

   dateRes=autoScanDate("Jan 5 03:20 pm 2002 PST");
   /* "dates" is sorted by distance from current timezone offset
      "ambiguous" is true because Manila has a timezone abbv "PST"
      "date" is set to the first record in "dates"
   {
      "ambiguous": true,
      "dates": {
         "America/Dawson": "2002-01-05T23:20:00.000Z",
         "America/Fort_Nelson": "2002-01-05T23:20:00.000Z",
         "America/Metlakatla": "2002-01-05T23:20:00.000Z",
         "America/Ensenada": "2002-01-05T23:20:00.000Z",
         "America/Santa_Isabel": "2002-01-05T23:20:00.000Z",
         "America/Tijuana": "2002-01-05T23:20:00.000Z",
         "America/Los_Angeles": "2002-01-05T23:20:00.000Z",
         ...
         "Asia/Manila": "2002-01-05T07:20:00.000Z",
         "posix/Asia/Manila": "2002-01-05T07:20:00.000Z",
         "right/Asia/Manila": "2002-01-05T07:20:00.000Z"
      },
      "date": "2002-01-05T23:20:00.000Z",
      "offset": -28800,
      "endIndex": 23,
      "matchedFormat": "%b %e %I:%M %p %Y %Z"
   }
   */

   dateRes=autoScanDate("Aug 5 03:20 pm 2002 PST");
   /* note that most timezones that would match PST are observing
      PDT in August, so they are excluded.
   {
      "ambiguous": true,
      "dates": {
         "America/Metlakatla": "2002-08-05T23:20:00.000Z",
         "posix/America/Metlakatla": "2002-08-05T23:20:00.000Z",
         "right/America/Metlakatla": "2002-08-05T23:20:00.000Z",
         "Asia/Manila": "2002-08-05T07:20:00.000Z",
         "posix/Asia/Manila": "2002-08-05T07:20:00.000Z",
         "right/Asia/Manila": "2002-08-05T07:20:00.000Z"
      },
      "date": "2002-08-05T23:20:00.000Z",
      "offset": -28800,
      "endIndex": 23,
      "matchedFormat": "%b %e %I:%M %p %Y %Z"
   }
   */

use
'''

Shortcut and alternative for importing modules with :ref:`require <rampart-main:Using the require Function to Import Modules>`\ .

Usage:

.. code-block:: javascript

    rampart.globalize(rampart.utils);//put utils in the global namespace

    var Sql = use.sql; //same as var Sql = require("rampart-sql");

The ``use`` :green:`Object` is a proxy object which uses the property name referenced (here ``"sql``) and searches for
a module named ``"rampart-sql"``.  Failing that it will search for a module named (``"sql"``).  It will then call
the :ref:`require <rampart-main:Using the require Function to Import Modules>` function to import and return that value.
If no module can be found, it will throw an error.

Return Value:
    The exported module.

load
''''

Same as `use`_ above except that the property name is also put in the global namespace.

Example:

.. code-block:: javascript

    rampart.globalize(rampart.utils);//put utils in the global namespace

    load.curl;  //same as global.curl = require("rampart-curl");

    var res = curl.fetch("http...");

Note:
    The file name of the module must be lowercase, while the variable name may be
    mixed case.  Example: ``load.Sql;`` is equivalent to
    ``global.Sql=require("rampart-sql");``.

Caveat:
    This cannot be used to load a module whose name contains illegal JavaScript variable name characters. Thus,
    ``load["my@mod"]`` will not work since ``'@'`` is not legal in javaScript even though it is legal in a file name.
    However ``'-'`` and ``'.'`` characters will be replaced with ``'_'``.  Thus, ``load["rampart-curl.so"]`` will
    load the Curl Module and put it in the global namespace similar to ``var rampart_curl_so = require("rampart-curl.so")``.

errorConfig
'''''''''''

Configure the format of reported errors.

Usage:

.. code-block:: javascript

    rampart.utils.errorConfig(options);

   /* or */

   rampart.utils.errorConfig(simple, lines);

Where:

* ``options`` is an :green:`Object` with the properties ``simple`` and
  ``lines``.

* ``simple`` is a :green:`Boolean` (default ``false``) - whether to reduce
  the verbosity of the stack trace.

* ``lines`` is a :green:`Number` (default ``0``) - the number of lines of
  the source code surrounding the error to print.  If greater than ``0`` and
  an even number, it will be incremented up to the next odd number.
  
Examples:

.. code-block:: javascript

   /* default settings */
   rampart.utils.errorConfig(false,0);
    
   function myfunc(myvar) {
      console.log(myvar.x);
   }

   myfunc();

   /* expected output
      TypeError: cannot read property 'x' of undefined
          at [anon] (/usr/local/src/rampart/src/duktape/core/duktape.c:60539) internal
          at myfunc (myscript.js:4)
          at global (myscript.js:7) preventsyield
   */

.. code-block:: javascript

   /* simple stack */
   rampart.utils.errorConfig({simple:true,lines:0});

   function myfunc(myvar) {
      console.log(myvar.x);
   }

   myfunc();

   /* expected output
      TypeError: cannot read property 'x' of undefined
          at myfunc (myscript.js:4)
          at global (myscript.js:7)
   */


.. code-block:: javascript

   /* simple stack and 3 lines */
   rampart.utils.errorConfig({simple:true,lines:3});

   function myfunc(myvar) {
      console.log(myvar.x);
   }

   myfunc();

   /* expected output
      TypeError: cannot read property 'x' of undefined
          at myfunc (myscript.js:4)
          at global (myscript.js:7)

      File: myscript.js
      line 3:    |function myfunc(myvar) {
      line 4: -> |    console.log(myvar.x);
      line 5:    |}
   */

deepCopy
''''''''

Make a deep copy of one or more :green:`Objects`.

Usage:

.. code-block:: javascript

   var target = rampart.utils.deepCopy([appendArrays [, copyBuffers]], target, obj1[, obj2, obj3, ...]);

Where:

    * ``appendArrays`` - a :green:`Boolean`, whether to append an :green:`Array` with the same key
      instead of replace it with the source :green:`Array`.  Default is ``false``.

    * ``copyBuffers`` - a :green:`Boolean`, whether to copy the full binary contents of a :green:`Buffer`
      rather than its reference.  Default is ``true``.

    * ``target`` - an :green:`Object` into which the subsequent :green:`Object` parameters will be copied.

    * ``objn``- Source :green:`Objects` to copy from, with later :green:`Objects` overwriting duplicate keys in earlier ones.


Example:

.. code-block:: javascript

    var target, 
        source1 = {
            account: {
                firstName: "John"
            },
            links: [
                'http://example.com/jsmith1.html'
            ]
        },
        source2 = {
            account: {
                lastName: "Smith"
            },
            links: [
                'http://example.com/jsmith_about.html'
            ]
        };

    target = rampart.utils.deepCopy({}, source1, source2);
    rampart.utils.printf("%3J\n", target);
    /* expected output:
        {
           "account": {
              "firstName": "John",
              "lastName": "Smith"
           },
           "links": [
              "http://example.com/jsmith_about.html"
           ]
        }
    */

    // true == append the "links" array
    target = rampart.utils.deepCopy(true, {}, source1, source2);
    rampart.utils.printf("%3J\n", target);
    /* expected output:
        {
           "account": {
              "firstName": "John",
              "lastName": "Smith"
           },
           "links": [
              "http://example.com/jsmith1.html",
              "http://example.com/jsmith_about.html"
           ]
        }
    */


eventCallback
'''''''''''''

Register a callback :green:`Function` to catch warnings or errors produced by Rampart's event loop (libevent2).

Usage:

.. code-block:: javascript

   rampart.utils.eventCallback(function(level,msg){ /* handle or report here */ });

Where:

    * ``level`` - a :green:`String`, one of ``"msg"``, ``"warn"`` or ``"error"``.
    * ``msg`` - a :green:`String`, the message from libevent2.

Note:
    In normal usage, this function should not be necessary.  If used, the callback function must
    not call any asychronous functions.  See `the libevent2 reference <https://libevent.org/libevent-book/Ref1_libsetup.html>`_
    for more information.
    

File Handle Utilities
"""""""""""""""""""""

The functions `fprintf`_ (), `fseek`_\ (), `rewind`_\ (), `ftell`_\ (), `fflush`_\ (),
`fread`_\ (), `fgets`_\ (), `fwrite`_\ (), and `readLine`_\ () take a filehandle, which may be obtained
using `fopen`_\ () or `fopenBuffer`_\ ().


Calling Methods:
   The above listed functions (functions which take filehandles) may be called using one of
   two alternative syntaxes.

   .. code-block:: javascript

      var handle = rampart.utils.fopen(filename, mode);

      rampart.utils.fprintf(handle, fmt, ...);

      /* or */

      handle.fprintf(fmt, ...);

   The return value for each of the file handle functions is the same for either
   syntax, with the exception that `fseek`_\ (), `rewind`_\ () and `fflush`_\ ()
   return undefined in the first syntax and ``handle`` in the second.

   Below, only the first syntax is documented.

Pre-opened file handles:
   rampart.utils.stdin:
      A handle that corresponds to the UNIX standard in stream.

   rampart.utils.stdout:
      A handle that corresponds to the UNIX standard out stream.

   rampart.utils.stderr:
      A handle that corresponds to the Unix standard error stream.

   rampart.utils.accessLog:
      A handle that corresponds to the ``accessLog`` file option in ``server.start()`` for the
      ``rampart-server`` module.  If not specified, or not loaded, same as
      ``rampart.utils.stdout``.

   rampart.utils.errorLog:
      A handle that corresponds to the ``errorLog`` file option in ``server.start()`` for the
      ``rampart-server`` module.  If not specified, or not loaded, same as
      ``rampart.utils.stderr``.

   The ``rampart.utils.stdin`` handle includes in its properties the `fread`_\ (), `fgets`_\ () and `readLine`_\ () functions
   while the other four include the `fprintf`_\ (), `fflush`_\ () and `fwrite`_\ () functions.
   Example:

   .. code-block:: javascript

      var line, inf = rampart.utils.stdin.readLine();

      while ( line = inf.next() )
         rampart.utils.stdout.fprintf("%s", line); //same as rampart.utils.printf


fopen
'''''

Open a filehandle for use with `fprintf`_\ (), `fclose`_\ (), `fseek`_\ (),
`rewind`_\ (), `ftell`_\ (), `fflush`_\ () `fread`_\ (), `fgets`_\ (), `fwrite`_\ () and
`readLine`_\ ().

Return Value:
   :green:`Object`. An object which opaquely contains the opened file handle along with
   the above functions.

Usage:

.. code-block:: javascript

   var handle = rampart.utils.fopen(filename, mode[, stdRedir]);

Where ``filename`` is a :green:`String` containing the file to be opened.

Where ``mode`` is a :green:`String` (one of the following):

*  ``"r"`` - Open text file for reading.  The stream is positioned at the
   beginning of the file.

*  ``"r+"`` - Open for reading and writing.  The stream is positioned at the
   beginning of the file.

*  ``"w"`` - Truncate file to zero length or create text file for writing.
   The stream is positioned at the beginning of the file.

*  ``"w+"`` - Open for reading and writing.  The file is created if it does
   not exist, otherwise it is truncated.  The stream is positioned at the
   beginning of the file.

*  ``"a"`` - Open for appending (writing at end of file).  The file is
   created if it does not exist.  The stream is positioned at the end of the
   file.

*  ``"a+"`` - Open for reading and appending (writing at end of file).  The
   file is created if it does not exist.  The initial file position for reading
   is at the beginning of the file, but output is always appended to the end of the
   file.

Where optional ``stdRedir`` is one of ``rampart.utils.stdin``, ``rampart.utils.stdout`` 
or ``rampart.utils.stderr`` and the mode is set appropriately (``"r"`` for stdin, ``"w"``
or ``a`` for stdout/stderr; no ``"+"`` allowed).  Any data read or written to one of the
``std`` filehandles will be redirected to the newly opened file.  When the filehandle
is closed, the ``std`` filehandle will be restored to its previous value.

fopenBuffer
'''''''''''

Open a filehandle that writes to a dynamically sized opaque buffer
for use with `fprintf`_\ (), `fclose`_\ (), `fseek`_\ (),
`rewind`_\ (), `ftell`_\ (), `fflush`_\ () `fread`_\ (), `fgets`_\ (), `fwrite`_\ () and
`readLine`_\ ().

Return Value:
   :green:`Object`. An object which opaquely contains the opened file handle along with
   the above functions.

Usage:

.. code-block:: javascript

   var handle = rampart.utils.fopenBuffer([chunkSize][, sdtRedir]);

Where ``chunkSize`` is a :green:`Number` (default is ``4096``), amount of memory to allocate each
time the buffer is resized.  When the filehandle is closed, the buffer will
be sized to fit the data written, if necessary.

Where optional ``stdRedir`` is one of ``rampart.utils.stdout`` or
``rampart.utils.stderr``.  Any data written to one of the ``std``
filehandles will be redirected to the newly opened filehandle and placed in
the buffer.  When the filehandle is closed, the ``std`` filehandle will be
restored to its previous value.

Return Value:
   :green:`Object`. An object which opaquely contains the opened file handle along with
   the same functions as in ``fopen()`` above, as well as ``destroy()``, ``getBuffer()`` and ``getString()``
   functions, which will delete the backing data or copy the backing data and return the corresponding 
   JavaScript type.

Note:
   Calling ``fclose()`` will close the file handle, but the backing buffer is still available for use with
   ``getBuffer()`` and ``getString()``.  Calling ``destroy()`` will close close the file handle if still open
   and delete the backing buffer.  There is no finalizer on the returned object, so it is important
   to call ``destroy()`` when it is no longer needed.  Also note that the ``fopenBuffer()`` return object can be
   used in several threads at the same time, so long as it hasn't been destroyed in any thread.  Attempting to 
   use a destroyed ``fopenBuffer()`` object will throw an error.

Example:

.. code-block:: javascript

   rampart.globalize(rampart.utils);

   var fh = fopenBuffer(stdout);

   // prints to buffer
   printf("line 1\n");
   // also prints to buffer
   console.log("line 2");

   //stdout restored after close
   fclose(fh); // or fh.fclose()

   printf("file handle closed\n");
   // this goes to the terminal like expected
   printf("%s", fh.getString() );

   // manual cleanup is necessary
   fh.destroy();

   /* expected output"

         file handle closed
         line 1
         line 2
   */


fclose
''''''

Close a previously opened handle :green:`Object` opened with `fopen`_\ () or
`fopenBuffer`_\ ().

Example:

.. code-block:: javascript

   var handle = rampart.utils.fopen("/tmp/out.txt", "a");

   ...

   rampart.utils.fclose(handle);

     /* or */

   handle.fclose();

Return Value:
   ``undefined``.

fprintf
'''''''

Same as `printf`_\ () except output is sent to the file provided by
a :green:`String` or filehandle :green:`Object` opened and returned from `fopen`_\ ().

Usage:

.. code-block:: javascript

   var filename = "/home/user/myfile.txt";

   var output = rampart.utils.fopen(filename, mode);
   rampart.utils.fprintf(output, fmt, ...);
   rampart.utils.fclose(output);

   /* or */

   var output = filename;
   var outputLen = rampart.utils.fprintf(output, [, append], fmt, ...);
   /* file is automatically closed after function returns */

Where:

* ``output`` may be a :green:`String` (a file name), or an :green:`Object` returned from `fopen`_\ ().

* ``fmt`` is a :green:`String`, a `printf`_\ () format.

* ``append`` is an optional :green:`Boolean` only used when output is a filename- if ``true`` 
  the file will be appended instead of overwritten.

Return Value:
   A :green:`Number`. The length in bytes of the printed string.

Example:

.. code-block:: javascript

   rampart.globalize(rampart.utils);

   var handle = fopen("/tmp/out.txt", "w+");
   fprintf(handle, "A number: %d\n", 123);
   fclose(handle);

   /* OR */

   fprintf("/tmp/out.txt", "A number: %d\n", 123); /* implicit fclose */

fseek
'''''

Set file position for file operations.

Usage:

.. code-block:: javascript

   rampart.utils.fseek(handle, offset[, whence]);

+------------+----------------+----------------------------------------------------------+
|Argument    |Type            |Description                                               |
+============+================+==========================================================+
|handle      |:green:`Object` | A handle opened with `fopen`_\ ()                        |
+------------+----------------+----------------------------------------------------------+
|offset      |:green:`Number` | offset in bytes from whence                              |
+------------+----------------+----------------------------------------------------------+
|whence      |:green:`String` | "seek_set" - measure offset from start of file (default) |
+            +                +----------------------------------------------------------+
|            |                | "seek_cur" - measure offset from current position        |
+            +                +----------------------------------------------------------+
|            |                | "seek_end" - measure offset from end of file.            |
+------------+----------------+----------------------------------------------------------+

Return Value:
   ``undefined``

Example

.. code-block:: javascript

   rampart.globalize(rampart.utils,
     ["fopen","printf","fprintf","fseek","fread"]);

   var handle = fopen("/tmp/out.txt", "w+");

   fprintf(handle, "123def");

   fseek(handle, 0, "seek_set");

   fprintf(handle, "abc");

   fseek(handle, 0, "seek_set");

   var out=fread(handle);

   printf("'%s'\n", out);
   /*
   expect output:
   'abcdef'
   */

   fclose(handle);


rewind
''''''

Set the file position to the beginning of the file.  It is equivalent to:

.. code-block:: javascript

   rampart.utils.fseek(handle, 0, "seek_set")

Usage:

.. code-block:: javascript

   rampart.utils.rewind(handle);

Return Value:
   ``undefined``

ftell
'''''

Obtain the current value of the file position for the handle opened with
`fopen`_\ ().

Usage:

.. code-block:: javascript

   var pos = rampart.utils.ftell(handle);

Return Value:
   :green:`Number`. Current position of ``handle``.


fflush
''''''

For output file handles opened with `fopen`_\ (), or for
``stdout``/``stderr``/``accessLog``/``errorLog``, ``fflush()`` forces a
write of buffered data.

Usage:

.. code-block:: javascript

    rampart.utils.fflush(handle);

Return Value:
   ``undefined``

Example:

.. code-block:: javascript

   /* normally a flush happens automatically
      when a '\n' is printed.  Since we are using
      '\r', flush manually                        */

   for (var i=0; i< 10; i++) {
      rampart.utils.printf("doing #%d\r", i);
      rampart.utils.fflush(rampart.utils.stdout);
      rampart.utils.sleep(1);
   }

   rampart.utils.printf("blast off!!!\n");

fread
'''''

Read data from a file, handle opened with `fopen`_\ () or the pre-opened handle ``stdin``.

Usage:

.. code-block:: javascript

    var data = rampart.utils.fread([handle|file] [, max_size [, chunk_size [,returnString]]]);

+------------+-----------------+---------------------------------------------------+
|Argument    |Type             |Description                                        |
+============+=================+===================================================+
|handle      |:green:`Object`  | A handle opened with `fopen`_\ ()                 |
+------------+-----------------+---------------------------------------------------+
|file        |:green:`String`  | A filename -- file will be auto opened and closed |
+------------+-----------------+---------------------------------------------------+
|max_size    |:green:`Number`  | Maximum number of bytes to read.  Unlimited if    |
|            |                 | not specified.                                    |
+------------+-----------------+---------------------------------------------------+
|chunk_size  |:green:`Number`  | Initial size of return :green:`Buffer` and number |
|            |                 | of bytes to read at a time. If the total number of|
|            |                 | bytes read is greater, the buffer grows as needed.|
|            |                 | If total bytes read is less, the returned buffer  |
|            |                 | will be reduced in size to match. Default is 4096 |
|            |                 | if not specified.                                 |
+------------+-----------------+---------------------------------------------------+
|returnString|:green:`Boolean` | Whether return value is returned as a             |
|            |                 | :green:`String`.  Default is ``false``.           |
+------------+-----------------+---------------------------------------------------+

Return Value:
    A :green:`Buffer` or a :green:`String` if ``returnString`` is ``true``.

fgets
'''''

Usage:

.. code-block:: javascript

    var data = rampart.utils.fgets([handle|file] [, options[, max_size]]);


Read data from file, up to ``max_size`` bytes (default ``1``), stopping at
and including the first ``\n`` or the end of the file.

If ``options`` is included, it must be an :green:`Object`, where if set to ``{"echo":false}``, and reading from
``stdin``, echoing typed characters on the terminal will be disabled (e.g., for entering
passwords).

Return Value:
    A :green:`String`.

fwrite
''''''

Write data to a file, a handle opened with `fopen`_\ () or a pre-opened
output handle (``stdout``/``stderr``/``accessLog``/``errorLog``).  If using
a handle, the start of the write will be the current position based on how
the file was opened and whether any seeks have been performed.  If using a
file name, the ``append`` parameter will determine whether the file is
appended or truncated.

Usage:

.. code-block:: javascript

    var nbytes = rampart.utils.fwrite([handle|file], data [, max_bytes][, append]);

+------------+-----------------+---------------------------------------------------+
|Argument    |Type             |Description                                        |
+============+=================+===================================================+
|handle      |:green:`Object`  | A handle opened with `fopen`_\ ()                 |
+------------+-----------------+---------------------------------------------------+
|file        |:green:`String`  | A filename -- file will be auto opened and closed |
+------------+-----------------+---------------------------------------------------+
|data        |:green:`Buffer`/ | The data to be written.                           |
|            |:green:`String`  |                                                   |
+------------+-----------------+---------------------------------------------------+
|max_bytes   |:green:`Number`  | Maximum number of bytes to write. :green:`Buffer`/|
|            |                 | :green:`String` length if not specified.          |
+------------+-----------------+---------------------------------------------------+
|append      |:green:`Boolean` | If opened with ``file`` instead of ``handle``,    |
|            |                 | whether to append the file.  Default is ``false``,|
|            |                 | in which case the file will be truncated.         |
+------------+-----------------+---------------------------------------------------+

Return Value:
    A :green:`Number`. Number of bytes written.

readLine
''''''''

Read a text file line-by-line.

Usage:

.. code-block:: javascript

   var rl = rampart.utils.readLine(file);
   var line = rl.next();

Where ``file`` is a :green:`String` (name of file to be read) or a file handle opened
with with `fopen`_\ () or ``rampart.utils.stdin``. It returns a :green:`Object`
that contains the property ``next`` which is :green:`Function` to retrieve and return the next
line of text in the opened file.

Return Value:
   An :green:`Object`.  Property ``next`` of the return :green:`Object` is a
   :green:`Function` which retrieves and returns the next line of text in
   the file.  After the last line of ``file`` is returned, subsequent calls
   to ``next`` will return ``null``.

Example:

.. code-block:: javascript

    var rl = rampart.utils.readLine("./myfile.txt");
    var i = 0;
    var line, firstline, lastline;

    while ( (line=rl.next()) ) {
        if(i==0)
            firstline = rampart.utils.trim(line);
        i++;
        lastline = line;
    }
    rampart.utils.printf("%s\n%s\n", firstline, lastline);

    /* expected output: first and last line of file "./myfile.txt" */

Rand, Hash and HyperLogLog
""""""""""""""""""""""""""

Included in rampart.utils are several non-cryptographic functions which have been optimized for speed and ease of use.

Note that the `rand`_\ () and `hash`_\ () functions are not of cryptographic quality.  For cryptographic quality hashes
and random numbers, see :ref:`The Rampart-Crypto Module <rampart-crypto:preface>`.

rand
''''

Generate a random number using a fast, non-cryptographic random number generator.

Usage:

.. code-block:: javascript

   var rn = rampart.utils.rand([min, max]);

      /* or */

   var rn = rampart.utils.rand(max);

Where ``min`` is the floor and ``max``
is the ceiling (EXCLUSIVE) of the range of the random number to produce.
If not provided, ``min`` and ``max`` default to ``0.0`` and
``1.0`` respectively.

Return Value:
   A :green:`Number` - the generated random number.

Note that if srand has not been called before use, the random number generator
will be automatically seeded.

irand
'''''

Generate a random integer using a fast, non-cryptographic random number generator.

Usage:

.. code-block:: javascript

   var rn = rampart.utils.irand([min, max]);

      /* or */

   var rn = rampart.utils.irand(max);

      /* or */

   rampart.utils.irand([max[min,max]],callback);

Where ``min`` is the floor and ``max``
is the ceiling (INCLUSIVE) of the range of the random integers to produce.
If not provided, ``min`` and ``max`` default to ``0`` and
``99`` respectively.

If provided, ``callback`` is a :green:`Function` ``callback(r,i)`` where
``r`` is the random integer and ``i`` is the loop count. The :green:`Function`
will be called repeatedly until it returns ``false``.

Return Value:
   A :green:`Number` - the generated random integer as a number. If
   a function is provided, returns ``undefined``.

Note that if `srand`_ has not been called before use, the random number generator
will be automatically seeded.

Note also because of JavaScript :green:`Number` precision, the maximum and
minimum ``max`` or ``min`` that may be provided is ``9007199254740991`` and
``-9007199254740991`` respectively.

gaussrand
'''''''''

The ``gaussrand([sigma])`` function returns a random :green:`Number` using a
fast, non-cryptographic random number generator and based on
a normal distribution centered at zero (``0.0``), where ``sigma`` is one
standard deviation.  ``sigma`` is optional, defaulting to ``1.0``.

normrand
''''''''

The ``normrand([scale])`` function returns a random :green:`Number` using a
fast, non-cryptographic random number generator and based on
a normal distribution centered at zero (``0.0``) and clamped between ``-scale``
and ``scale``.

Similar to the `gaussrand`_ above.  It is equivelant to:

.. code-block:: javascript

    var nrand = scale * rampart.utils.gaussrand(1.0)/5.0;

    if(nrand>scale)
        nrand=scale;
    else if (nrand < -scale)
        nrand = -scale;


With a ``scale`` of ``1.0`` (the default), the distribution of numbers has a
standard deviation of ``0.2``.


srand
'''''

Seed the random number generator for use with the random functions above.

Usage:

.. code-block:: javascript

   rampart.utils.srand([random_num]);

Where ``random_num`` is an optional number to seed the random number generator.  If not specified, a number will
be derived by reading ``/dev/urandom``.

hash
''''

Calculate the hash of data.

Usage:

.. code-block:: javascript

   var myhash = rampart.utils.hash(data,options);

Where ``data`` is the data from which the hash is calculated and options is
an :green:`Object` with the following optional properties:

* ``type`` - the type of hash to be calculated. A :green:`String`, one of:

   * ``"murmur"`` - A 64 bit hash using the `murmur` algorithm.

   * ``"city"`` - A 64 bit hash using the `city` algorithm.

   * ``"city128"`` - A 128 bit hash using the `city` algorithm.  This is the default if not specified.

   * ``"both"`` - A 192 bit hash -- the ``city128`` hash concatenated with the ``murmur`` hash.

* ``function`` - Alias for ``type``.

* ``returnBuffer`` - a :green:`Boolean`, if ``true``, the hash will be returned as the binary value of the hash
  in a a :green:`Buffer`.  If ``false`` (the default), the return value will be a :green:`String` - a hex encoded representation
  of the hash.

Return Value:
   A :green:`String` or :green:`Buffer` - the computed hash.

hll
'''

The ``hll`` function calculates a count of unique items based on Rampart's own
`hyperloglog <https://en.wikipedia.org/wiki/HyperLogLog>`_ algorithm. It allocates and uses
a 16384 byte buffer to calculate a distinct count of items added.

Usage:

.. code-block:: javascript

   var myhll = new rampart.utils.hll(name);

      /* or */

   var myhll = new rampart.utils.hll(name, hllBufferData);

      /* or */

   var myhll = new rampart.utils.hll(name [, hllBufferData], merge_hll1 [, merge_hll2, ...]);

Where:

* ``name`` is an arbitrary :green:`String`.  It may be called again with the same ``name``
  in order to retrieve the same `hll` :green:`Object`.

* ``hllBufferData`` is a :green:`Buffer` - The raw `hll` buffer to initialize the new
  `hll` :green:`Object` with data previously extracted using
  :ref:`getBuffer <rampart-utils:hll.getBuffer>` below.

* ``merge_hll1``, ``merge_hll2``, etc. are `hll` :green:`Objects` created with ``new rampart.utils.hll(name)``
  to be merged into the new (blank) return `hll` :green:`Object` in the same manner as
  :ref:`merge <rampart-utils:hll.merge>` below.

Return Value:
   An opaque `hll` :green:`Object` containing the following functions: ``add``, ``addFile``, ``count``, ``merge``,
   and ``getBuffer``.

Note that an `hll` can be referred to from different threads in the
:ref:`Rampart Server <rampart-server:The rampart-server HTTP module>` or inside :ref:`Rampart threads <rampart-thread:Rampart Thread Functions>`. Each
thread may specify the same `hll` by using the same name.  In addition, the below
functions are thread-safe.


hll.add
'''''''

Add a value or values to the `hll`_\ .

Usage:

.. code-block:: javascript

   var myhll = new rampart.utils.hll(name);

   myhll.add(value);

Where ``value`` is a :green:`String`, :green:`Buffer` or an array of :green:`Strings` and/or :green:`Buffers`.

Return Value:
   The `hll` :green:`Object`.

hll.addFile
'''''''''''

Add values to the `hll`_ from a file, with each value on a separate line.

.. code-block:: javascript

   var myhll = new rampart.utils.hll(name);

   myhll.addFile(file [, delim] );

Where
   * ``file`` is a :green:`String` (name of file to be read) or a file handle opened
     with with `fopen`_\ () or ``rampart.utils.stdin``.

   * ``delim`` is an optional :green:`String`, the first character of which is used
     as a line separator.  The default value is ``"\n"``.

Return Value:
   The `hll` :green:`Object`.

hll.count
'''''''''

Get a current estimate count of distinct items added to the `hll`_\ .

Usage:

.. code-block:: javascript

   var myhll = new rampart.utils.hll(name);

   /* add items */
   ...

   var mycount = myhll.count();


Return Value:
   A :green:`Number`, the estimated number of distinct items added to the `hll`_\ .

hll.merge
'''''''''

Merge one or more `hll` files into the current `hll` in order to calculate an estimate of the number of distinct
items of the union.

Usage:

.. code-block:: javascript

   var mergedHll = myhll.merge(myhll2 [, myhll3, ...]);


Where ``myhll2``, ``myhll3``, etc. are `hlls` created with ``new rampart.utils.hll`` above.

Return Value:
   The `hll` :green:`Object` merged and updated with the provided `hlls`.

hll.getBuffer
'''''''''''''

Get the raw `hll` buffer as a JavaScript :green:`Buffer`, which may be used to save
the `hll` to disk using a command such as `fwrite`_\ () above.

Usage:

.. code-block:: javascript

   var myhll = new rampart.utils.hll(name);

   /* add items */
   ...

   var hllbuf = myhll.getBuffer();

Return Value:
   A :green:`Buffer` 16384 bytes in length.

