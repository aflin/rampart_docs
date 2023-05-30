The rampart-python module
=========================

Preface
-------

License
~~~~~~~

The Python library is licensed under the `PSF LICENSE <https://docs.python.org/3/license.html#psf-license>`_\ .

The rampart-python module is released under the MIT license.

What does it do?
~~~~~~~~~~~~~~~~

The rampart-python module includes functions which import Python modules
and scripts, executes them and translates variables between Python and
JavaScript.

How does it work?
~~~~~~~~~~~~~~~~~

The module and the embedded Python interpreter are used to load Python
modules and scripts into the Python environment.  Translation of variables
between the two languages are handled automatically.  As the Python Library
does not function in parallel in multiple threads, if run in 
:ref:`rampart.threads <rampart-thread:Rampart Thread Functions>` the module
will run in multiple processes.


Loading the Javascript Module
-----------------------------

    Loading of the sql module from within Rampart JavaScript is a simple matter
    of using the ``require`` statement:

    .. code-block:: javascript

        var python=require("rampart-python");

    Return value:
        An :green:`Object` with the functions listed below.
    

Python Module Functions
-----------------------

python.import()
~~~~~~~~~~~~~~~

    Import a python module.

    Usage:

    .. code-block:: javascript
    
        var python=require("rampart-python");

        /* same as "import mymod" in Python */
        var mymod=python.import("mymod");

        
    Return Value:
        An :green:`Object` with callable properties corresponding to the functions of the imported module.

    Example:

    .. code-block:: javascript

        var python = require("rampart-python");

        var pathlib = python.import('pathlib');

        var pvar = pathlib.PosixPath('./');

python.importString()
~~~~~~~~~~~~~~~~~~~~~

    Import a python module or script from a :green:`String`.

    Usage:

    .. code-block:: javascript
    
        var python=require("rampart-python");

        var mymod = python.importString(pyscript[, scriptName);

    Where:

    * ``script`` is a :green:`String`, the python source code
    * ``scriptName`` is a :green:`String`, an optional name for this script for 
      error reporting.  Default is ``"module_from_string"``.

    Return Value:
        An :green:`Object` with callable properties corresponding to the functions of the imported module.

    Example:

    .. code-block:: javascript

        var python=require("rampart-python");

        var pyscript=`
        def makedict(k,v):
            return {k:v}
        `;

        var mymod = python.importString(pyscript);

        var pvar = mymod.makedict("mykey", ["val1", "val2"]);

python.importFile()
~~~~~~~~~~~~~~~~~~~

    Import a python module or script from a file.  Same as
    `python.importString()`_ except the source is loaded from
    the named file.

    Usage:

    .. code-block:: javascript
    
        var python=require("rampart-python");

        var mymod = python.importFile(fileName);

    Where:

    * ``fileName`` is a :green:`String`, the path of the file to be imported.

    Return Value:
        An :green:`Object` with callable properties corresponding to the functions of the imported module.

pvar.toString()
~~~~~~~~~~~~~~~

    Return the string version of the python variable.

    Example:

    .. code-block:: javascript

        var python = require("rampart-python");

        var pathlib = python.import('pathlib');

        var pvar = pathlib.PosixPath('./');

        rampart.utils.printf( "pathlib=%s\npvar=%s\npvar.resolve()=%s\n", 
            pathlib.toString(), pvar.toString(), pvar.resolve().toString() );

        /* output:
            pathlib=<module 'pathlib' from '/usr/local/rampart/modules/python3-lib/pathlib.py'>
            pvar=.
            pvar.resolve()=/path/to/my/current/directory
        */

    Return Value:
        An :green:`String`.

pvar.toValue()
~~~~~~~~~~~~~~

    Translate the python variable referenced in ``pyvar`` to a JavaScript
    variable.

    Example:

    .. code-block:: javascript
    
        var python=require("rampart-python");
        var printf = rampart.printf;

        var mymod = python.importString("/path/to/myscript.py");

        var pvar = mymod.makedict("mykey", ["val1", "val2"]);

        printf( "mykey = %s\nmykey.toValue=%3J\n",
            pvar.mykey.toString(), pvar.mykey.toValue() );

        /* output:
            mykey = ('val1', 'val2')
            mykey.toValue=[
               "val1",
               "val2"
            ]
        */

Handling Variables
------------------

From Javascript to Python
~~~~~~~~~~~~~~~~~~~~~~~~~

    Variables passed to Python functions are automatically converted as follows:

    +-----------------------+------------------------------------------+
    |    JavaScript Type    | Python Type                              |
    +=======================+==========================================+
    |  :green:`Number`      | Float                                    |
    +-----------------------+------------------------------------------+
    |  :green:`String`      | String                                   |
    +-----------------------+------------------------------------------+
    |  :green:`Array`       | Tuple                                    |
    +-----------------------+------------------------------------------+
    |  :green:`Object`      | Dictionary                               |
    +-----------------------+------------------------------------------+
    |  :green:`Buffer`      | Bytes Object                             |
    +-----------------------+------------------------------------------+
    |  :green:`Date`        | Datetime                                 |
    +-----------------------+------------------------------------------+
    |  :green:`Undefined`   | None                                     |
    +-----------------------+------------------------------------------+
    |  :green:`null`        | None                                     |
    +-----------------------+------------------------------------------+

    Where possible, translations can be specified by creating an
    :green:`Object` with ``pyType`` and ``value`` properties set.

    Example:

    .. code-block:: javascript

        var python=require("rampart-python");
        var printf = rampart.utils.printf;

        var pyscript=`
        def printvar(v):
            print( "%-30s %s" % (type(v), v))
        `;
        var mymod = python.importString(pyscript);
        mymod.printvar({pyType: "date",    value: 946713599999});
        mymod.printvar({pyType: "int",     value: "1234567800000000000000000000000000000000000000"});
        mymod.printvar({pyType: "list",    value: ["a", "b", "c"]});
        mymod.printvar({pyType: "tuple",   value: "d"});
        mymod.printvar({pyType: "complex", value: [1,2]});
        mymod.printvar({pyType: "dict",    value: "e"});

        /* output:
            <class 'datetime.datetime'>    1999-12-31 23:59:59.999000
            <class 'int'>                  1234567800000000000000000000000000000000000000
            <class 'list'>                 ['a', 'b', 'c']
            <class 'tuple'>                ('d',)
            <class 'complex'>              (1+2j)
            <class 'dict'>                 {'0': 'e'}
        */

From Python to JavaScript
~~~~~~~~~~~~~~~~~~~~~~~~~

    Translation of return values from Python are automatic when using
    ``.toValue()``.  For types which cannot be translated, a string
    representation (same as ``.toString()``) will be returned instead.

    Example:

    .. code-block:: javascript

        var python=require("rampart-python");
        var printf = rampart.utils.printf;

        var pyscript=`
        def retvar(v):
            return v
        `;

        var ret;

        ret=mymod.retvar({pyType:"date", value: 946713599999});
        printf("%J\n", ret.toValue());

        ret=mymod.retvar({pyType: "int",     value: "1234567800000000000000000000000000000000000000"});
        printf("%J\n", ret.toValue());

        ret=mymod.retvar({pyType: "list",    value: ["a", "b", "c"]});
        printf("%J\n", ret.toValue());

        ret=mymod.retvar({pyType: "tuple",   value: "d"});
        printf("%J\n", ret.toValue());

        ret=mymod.retvar({pyType: "complex", value: [1,2]});
        printf("%J\n", ret.toValue());

        ret=mymod.retvar({pyType: "dict",    value: "e"});
        printf("%J\n", ret.toValue());

        ret=mymod.retvar(mymod);
        printf("%J\n", ret.toValue());

        /* output:
            "1999-12-31T23:59:59.999Z"
            1.2345678e+45
            ["a","b","c"]
            ["d"]
            [1,2]
            {"0":"e"}
            <module 'module_from_string' from '/home/user/src/mytest.js'>
        */

Python to Python
~~~~~~~~~~~~~~~~

    Variables returned from a Python function can be used as parameters to other Python functions.
    No translation will be performed.

    Example:

    .. code-block:: javascript

        var python=require("rampart-python");
        var printf = rampart.utils.printf;

        var pyscript=`
        def retvar(v):
            return v

        def add(a,b):
            return a+b;
        `;

        var a = mymod.retvar({pyType: "complex", value: [1,2]});
        var b = mymod.retvar({pyType: "complex", value: [3,4]});
        var ret = mymod.add(a, b);
        printf("%J\n", ret.toValue());

        /* output:
            [3,4]

           note that var a and b hold the Python variables and are
           not translated when mymod.add(a,b) is called.
       */

Python Named Arguments
~~~~~~~~~~~~~~~~~~~~~~

    Named arguments to Python functions may be use as shown
    in the following example:

    .. code-block:: javascript

        var python=require("rampart-python");
        var printf = rampart.utils.printf;

        var pyscript=`
        def retvar(v):
            return v

        def add(a,b):
            return a+b;
        `;

        var comp1 = mymod.retvar({pyType: "complex", value: [1,2]});
        var comp2 = mymod.retvar({pyType: "complex", value: [3,4]});

        var myNamedArgs = { pyArgs: {a:comp1, b:comp2} };

        var ret = mymod.add( myNamedArgs );
        printf("%J\n", ret.toValue());

        /* 
           calling in JavaScript:
               mymod.add( {pyArgs: {a:comp1, b:comp2} } );
           is equivalent to calling with named arguments in python:
               add(a=comp1, b=comp2);
        */
