Rampart Thread Functions
========================

Preface
-------

License
~~~~~~~

The rampart.thread functions are built into the rampart executable
and as such are covered under the same MIT license.

What does it do?
~~~~~~~~~~~~~~~~

The rampart.thread functions provides utility functions to create threads
from within JavaScript and run functions asynchronously in them, as well as
share variables between them.

How does it work?
~~~~~~~~~~~~~~~~~

The rampart.thread functions allow for the creation of native POSIX threads
which when created, are paired with a separate JavaScript interpreter and event
loop.  When created the event loop starts immediately and functions can be
passed into the thread's event loop in a manner similar to the
:ref:`setTimeout() function <rampart-main:setTimeout()>`\ .  Variables can
be provided directly or by putting and getting from an internally maintained
clipboard.  Global variables which are defined and set **when the thread is
created** will be copied to the stack of the newly created JavaScript
interpreter.


Thread Functions
----------------

new rampart.thread()
~~~~~~~~~~~~~~~~~~~~

    Calling ``new rampart.thread()`` function creates the new thread.

    Usage:

    .. code-block:: javascript
    
        var thr = new rampart.thread(); 

    Return Value:
        An :green:`Object` with two functions: `exec` and `close`.


thr.exec()
~~~~~~~~~~

    Execute a function in a thread.

    Usage:

    .. code-block:: javascript
    
        var thr = new rampart.thread(); 

        thr.exec(options);

            /* or */

        thr.exec(threadFunc[, threadArg[, callbackFunc[, threadDelay]]]);

    Where:

        * ``options`` - an :green:`Object` with optional keys ``threadFunc``,
          ``threadArg``, ``callbackFunc`` and/or ``threadDelay``.

        * ``threadFunc`` - a :green:`Function` that will be executed in the
          thread.

        * ``threadArg`` - a single variable of any type that will be passed to
          the ``threadFunc`` :green:`Function` as its sole parameter.

        * ``callbackFunc`` - a :green:`Function` that will be executed in the
          current event loop (in the thread in which ``new rampart.thread()``
          was called).  It will be passed a single parameter, the return
          value of ``threadFunc``.

        * ``threadDelay`` - a delay, similar to the :ref:`setTimeout() function <rampart-main:setTimeout()>`\ ,
          measured in milliseconds.  If omitted, the ``threadFunc`` :green:`Function`
          will execute immediately.


    Example:

    .. code-block:: javascript

        var iscopied = true;

        var thr = new rampart.thread(); 

        var notcopied = true;

        function thrfunc(myarg) {
            /* var iscopied is available, var notcopied is not */
            console.log("from inside the thread:", myarg);
            return myarg + 1;
        }

        function callback(myarg) {
            console.log("back in the main thread:", myarg);
        }

        thr.exec({
            threadFunc: thrfunc,
            threadArg: 3,
            callbackFunc: callback,
            threadDelay: 1000
        });

        /* or */

        // thr.exec(thrfunc, 3, callback, 1000);

        /* 
            after one second, output will be:
                from inside the thread: 3
                back in the main thread: 4
        */

    Return Value: 
        ``undefined``.

    Caveats:

        * Threads may be created in inside threads, but they must be called
          from within the thread in which they were created.

        * Only global variables are copied to threads at the time of
          creation.  The variable ``iscopied`` in the example above will be copied and
          available to the thread as a global variable.  The variable
          ``notcopied`` will not be copied since it was set after the thread was
          created.

thr.close()
~~~~~~~~~~~

    Close a thread, releasing its resources.

    Example:

    .. code-block:: javascript

        var thr = new rampart.thread(); 

        function thrfunc(myarg) {
            console.log("from inside the thread:", myarg);
            return myarg + 1;
        }

        function callback(myarg) {
            console.log("back in the main thread:", myarg);
        }

        thr.exec(thrfunc, 3, callback, 1000);

        /* 
            after one second, output will be:
                from inside the thread: 3
                back in the main thread: 4
        */

        thr.close();

        /* in this case, the thread will stay open until its event loop
           is empty.  Thus there will be no difference in the output.
           However in a long lived script, closing a thread when no longer
           in use can free up significant resources                       */

    Return Value: 
        ``undefined``.

thr.getId()
~~~~~~~~~~~

    Get a thread's unique identification number.  This number is used to 
    identify a thread, and may be reused after the thread is closed.

    Return Value: 
        A :green:`Number`, the positive integer for identifying the thread.

rampart.thread.put()
~~~~~~~~~~~~~~~~~~~~

    Put a named variable to the clipboard.

    Usage:

    .. code-block:: javascript

        rampart.thread.put(varName, varValue);

    Where:

        * ``varName`` is a :green:`String`, the key to later retrieve
          ``varValue``.

        * ``varValue`` is any normal JavaScript variable.

    Return Value: 
        ``undefined``.

rampart.thread.get()
~~~~~~~~~~~~~~~~~~~~

    Get a named variable from the clipboard.

    Usage:

    .. code-block:: javascript

        var myval = rampart.thread.get(varName[, timeOut]);

    Where:

        * ``varName`` is a :green:`String`, the key used in
          `rampart.thread.put()`_.

        * ``timeOut`` is a positive :green:`Number`.  If provided and the
          return value would be ``undefined``,  `rampart.thread.waitfor()`_
          below will be called with ``varName`` and ``timeOut``.  

    Return Value: 
        A **copy** of the variable stored with `rampart.thread.put()`_.

    Caveat:  
        The variable retrieved is a deep copy of the variable put.  If
        the original variable that was put is altered, the changes will
        not affect the retrieved version. 

    Example:

    .. code-block:: javascript

        var thr1 = new rampart.thread();
        var thr2 = new rampart.thread();

        function thrfunc(myarg) {
            console.log("from inside thread 1:", myarg);
            rampart.thread.put('mycopiedvar', myarg + 10);
            return myarg + 1;
        }

        function callback(myarg) {
            console.log("back in the main thread:", myarg);
        }

        thr1.exec({
            threadFunc: thrfunc,
            threadArg: 3,
            callbackFunc: callback,
            threadDelay: 1000
        });

        thr2.exec(function(){

            // wait a max of five seconds for 'mycopiedvar' to be defined
            var retrieved_var = rampart.thread.get('mycopiedvar', 5000);

            console.log("from inside thread 2:", retrieved_var);
        });

        /* output:
            from inside thread 1: 3
            from inside thread 2: 13
            back in the main thread: 4
        
           Note that thr1's callbackFunc runs last.  The event loop
           of threads start immediately while the main event loop in
           which the callbackFunc runs starts at the end of the script.
        */

rampart.thread.del()
~~~~~~~~~~~~~~~~~~~~

    Get a named variable and remove it from the clipboard.

    Usage:

    .. code-block:: javascript

        var myval = rampart.thread.del(varName[, timeOut]);

    Where:

        * ``varName`` is a :green:`String`, the key used in
          `rampart.thread.put()`_.

        * ``timeOut`` is a positive :green:`Number`.  If provided and the
          return value would be ``undefined``,  `rampart.thread.waitfor()`_
          below will be called with ``varName`` and ``timeOut``.  

    Return Value: 
        A **copy** of the variable stored with `rampart.thread.put()`_.

rampart.thread.waitfor()
~~~~~~~~~~~~~~~~~~~~~~~~

    Wait for the named variable to be updated by another thread and return
    it.

    .. code-block:: javascript

        var myval = rampart.thread.waitfor(varName[, timeOut]);

    Where:

        * ``varName`` is a :green:`String`, the key used in
          `rampart.thread.put()`_.

        * ``timeOut`` is a positive :green:`Number` in milliseconds.  If 
          provided, return ``undefined`` if the varable ``varName`` has not been
          updated within the given time. If ``timeout`` is omitted, the
          function will wait indefinely for the variable to be updated.

    Return Value: 
        A **copy** of the variable stored with `rampart.thread.put()`_ or
        ``undefined`` if the ``timeOut`` is reached.

    Note:
        Unlike `rampart.thread.get()`_ above, this function will wait even
        if ``varName`` is defined and will return only when it changes or
        the ``timeOut`` is reached.

Lock Functions
--------------

new rampart.lock()
~~~~~~~~~~~~~~~~~~

     Calling ``new rampart.lock()`` function creates a new 
     `POSIX backed mutex <https://linux.die.net/man/3/pthread_mutex_lock>`_
     which can be used to isolate critical sections of code running in
     multiple threads.

    Usage:

    .. code-block:: javascript
    
        var thrlock = new rampart.lock(); 

    Return Value:
        An :green:`Object` with two functions: `lock` and `unlock`.

thrlock.lock()
~~~~~~~~~~~~~~

    Lock the mutex referenced by ``thrlock``.  If the mutex is not locked,
    a lock will be obtained.  If the mutex is locked in another thread,
    execution in the current thread will be paused until the other thread
    calls `thrlock.unlock()`_ and a lock will be obtained.

    Usage:

    .. code-block:: javascript
    
        var thrlock = new rampart.lock(); 

        // ... while inside a threaded function
        
        thrlock.lock();

    Return Value: 
        ``undefined``.

thrlock.unlock()
~~~~~~~~~~~~~~~~

    Unlock the mutex referenced by ``thrlock``.

    Usage:

    .. code-block:: javascript
    
        var thrlock = new rampart.lock(); 

        // ... while inside a threaded function
        
        thrlock.lock();
        /* critical section */
        thrlock.unlock();

    Return Value: 
        ``undefined``.

thrlock.trylock()
~~~~~~~~~~~~~~~~~

    Same as `thrlock.lock()` except it always returns immediatedly.

    Usage:

    .. code-block:: javascript
    
        var thrlock = new rampart.lock(); 

        // ... while inside a threaded function
        
        if(thrlock.trylock())
        {
            /* critical section */
            thrlock.unlock();
        } else {
            /* do something else */
        }

    Return Value: 
        A :green:`Boolean`: ``true`` if the lock was obtained and ``false``
        if not.

Lock Caveats
~~~~~~~~~~~~

    * A mutex locked in a thread must be unlocked in the same thread. 

    * A ``rampart.lock`` should be created before the threads in which it
      will be used are created so that the ``thrlock`` variable is copied to
      each thread.

    * Normal operations do not require explicit locking using
      ``rampart.lock``.  However updating variables on the clipboard might
      require using a lock.

    Example:

    .. code-block:: javascript

        var thread=rampart.thread;

        var thrlock = new rampart.lock();
        
        var thr1 = new thread();
        var thr2 = new thread();

        thread.put("i", 0);

        thr1.exec(function() {
            var i, j=0;
            
            for(j=0; j<50; j++)
            {
                thrlock.lock();
            
                i=thread.get("i");
                i++;
                thread.put("i", i);

                thrlock.unlock();
            }
        });

        thr2.exec(function() {
            var i, j=0;
            
            for(j=0; j<50; j++)
            {
                thrlock.lock();
            
                i=thread.get("i");
                i++;
                thread.put("i", i);

                thrlock.unlock();
            }

            rampart.utils.sleep(0.25);
            i=thread.get("i");
            console.log("i =",i);
        });

        /* output:
            i = 100
        */
