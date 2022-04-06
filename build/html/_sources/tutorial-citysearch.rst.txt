Find Cities and their Closest Neighbors
=======================================

Preface
-------

In this tutorial, we will use the :ref:`SQL module <sqltoc:The rampart-sql module>`
and the :ref:`Server module <rampart-server:The rampart-server HTTP module>`, along 
with some client side scripting to create a search of city names, which also
lists the nearest cities to the selected city. 

You can download the complete project from our 
`Tutorial Repository <https://github.com/aflin/rampart_tutorials>`_
in the `geonames directory <https://github.com/aflin/rampart_tutorials/tree/main/geonames>`_\ .

License
~~~~~~~

The code related to this tutorial is released under the MIT license.
The data used to populate the database is licensed under a 
`Creative Commons License <https://creativecommons.org/licenses/by/4.0/>`_\ .

Concepts
--------

This module will demonstrate:

*  Using the :ref:`SQL module <sqltoc:The rampart-sql module>` to 
   :ref:`import <rampart-sql:importCsvFile()>` csv data.
*  Using the :ref:`SQL module <sqltoc:The rampart-sql module>` to create a Fulltext search for
   the client side autocomplete search.  
*  Using the :ref:`SQL geocode functions <sql-server-funcs:Geographical coordinate functions>` 
   to encode latitude/longitude pairs for each entry in the database, and to
   find the closest cities to any given latitude/longitude pair.

In order to complete this tutorial, you should have basic knowledge of
JavaScript, SQL and client side scripting using JavaScript (a passing
knowledge of jQuery is also helpful).  This tutorial will not provide an
in-depth explanation of how client-side scripting works.

Getting Started
---------------

In order to search by name and by location, we need to create a database
that contains both place names and latitude/longitude information. 
Fortunately, the good folks at `GeoNames.org <http://www.geonames.org/>`_
have provided us a CSV formatted file that accomplishes that and which is
licensed under a 
`Creative Commons License <https://creativecommons.org/licenses/by/4.0/>`_\ .

You can navigate to `<http://download.geonames.org/export/zip/>`_ and choose
the file that suits your needs.  In this tutorial, we will use the world
database titled `AllCountries.zip
<http://download.geonames.org/export/zip/allCountries.zip>`_\ .

Your first task will be to download your file of choice and unzip it in a
working directory (here we use ``~/geonames/``).  We will assume your
working directory contains the ``allCountries.txt`` file.

Importing the Data
------------------

Examine your CSV
~~~~~~~~~~~~~~~~

The first step for importing a CSV file is to have a look at the format of the
data in the file.  CSV can vary quite a bit, and to import it, we will want to 
know a few thing such as (but not limited to):

*  Does every column contain the same type?
*  Are text columns quoted?
*  Are single quotes present inside unquoted text fields?
*  Are records separated by ``,`` or by ``\t``?
*  Is there a header row as the first line in the file?

Let's examine the first few rows of ``allCountries.txt``:

::

    $ head ./allCountries.txt
    AD      AD100   Canillo Canillo 02                                      42.5833 1.6667  6
    AD      AD200   Encamp  Encamp  03                                      42.5333 1.6333  6
    AD      AD400   La Massana      La Massana      04                                      42.5667 1.4833  6
    AD      AD300   Ordino  Ordino  05                                      42.6    1.55    6
    AD      AD600   Sant Julià de Lòria     Sant Julià de Lòria     06                                      42.4667 1.5     6
    AD      AD500   Andorra la Vella        Andorra la Vella        07                                      42.5    1.5     6
    AD      AD700   Escaldes-Engordany      Escaldes-Engordany      08                                      42.5    1.5667  6
    AR      3636    POZO CERCADO (EL CHORRO (F), DPTO. RIVADAVIA (S))       Salta   A                                       -23.4933        -61.9267        3
    AR      4123    LAS SALADAS     Salta   A                                       -25.7833        -64.5   4
    AR      4126    TALA    Salta   A                                       -26.1167        -65.2833        4

Immediately we can see that records are separated by tabs (``\t``), that the second column (postal codes)
has both number and text types and that text fields are not quoted.  Also the first row appears to be data, and not
column names.

Next let's check if there are embedded single quotes in text fields:

::

    grep "'" ./allCountries.txt | head
    AR      6646    GENERAL O'BRIEN Buenos Aires    B                                       -34.9   -60.75  4
    AR      6748    O'HIGGINS       Buenos Aires    B                                       -34.5833        -60.7   4
    AR      7541    D'ORBIGNY       Buenos Aires    B                                       -37.6833        -61.7167        4
    AR      8514    VICEALMIRANTE EDUARDO O'CONNOR (ESTACION FCGR)  Rio Negro       R                                       -40.7722        -63.9889        3
    AR      2117    COLONIA O'FARRELL       Santa Fe        S                                       -33.3278        -60.8694        1
    AR      3050    LUCIO D'ABREU   Santa Fe        S                                       -29.9   -60.3   3
    AR      3358    COLONIA LIEBIG'S        Corrientes      W                                       -27.9   -55.8583        3
    AR      2645    CAPITAN GENERAL BERNARDO O'HIGGINS      Cordoba X                                       -33.25  -62.2833        4
    AR      2645    PIEDRAS ANCHAS (CAP.GRAL.B.O'HIGGINS, DPTO.MARCOS JUAREZ)       Cordoba X                                       -33.2708        -62.2375     3
    AU      2602    O'Connor        Australian Capital Territory    ACT     CANBERRA                                -35.2584        149.1202        4

And indeed there are single quotes in place names.

So to answer our earlier questions:

*  Does every column contain the same type? -- :red:`NO`
*  Are text columns quoted?  -- :red:`NO`
*  Are single quotes present inside unquoted text fields? -- :green:`YES`
*  Are records separated by ``,`` or by ``\t``?  -- :green:`Uses tabs`
*  Is there a header row as the first line in the file? :red:`NO`

Note that although the file is separated by tabs, we will continue to use the term
``CSV``.

Next lets find out which field is which.  According to GeoNames.org:

::

    The data format is tab-delimited text in utf8 encoding, with the following fields :

    country code      : iso country code, 2 characters
    postal code       : varchar(20)
    place name        : varchar(180)
    admin name1       : 1. order subdivision (state) varchar(100)
    admin code1       : 1. order subdivision (state) varchar(20)
    admin name2       : 2. order subdivision (county/province) varchar(100)
    admin code2       : 2. order subdivision (county/province) varchar(20)
    admin name3       : 3. order subdivision (community) varchar(100)
    admin code3       : 3. order subdivision (community) varchar(20)
    latitude          : estimated latitude (wgs84)
    longitude         : estimated longitude (wgs84)
    accuracy          : accuracy of lat/lng from 1=estimated, 4=geonameid, 6=centroid of addresses or shape

From this we can see that except for ``latitude``, ``longitude`` and ``accuracy``, every one of our fields
is text.  While the ``country code`` is always 2 characters, the rest of the fields are of variable length.

Armed with this knowledge, we are ready to create a script that imports our data.

Creating the table
~~~~~~~~~~~~~~~~~~

We will create a column for each column of the CSV file.  In addition we will add
two more columns.  

The first will be a Texis ``counter`` type.  This will be used to create
a unique identifier for each row (similar to a primary key, but automatically
generated).

The second requires a bit of knowledge of how a bounded geographic search works.  
We will get to that later.  For now, trust that you need another field that is
typed as ``long``.  We will call it ``geocode``.

So let's create a script that will make our table.

To begin, we need to load the SQL module and open a database;

.. code-block:: javascript

   var Sql = require("rampart-sql");

   var sql = new Sql.init("~/geonames/geonames_db", true);


In the above code, the ``var Sql = require("rampart-sql");`` line
loads the SQL module that is distributed with Rampart as 
``rampart-sql.so``.  The second line, 
``var sql = new Sql.init("~geonames/geonames_db", true);`` opens the database.

Note the ``true`` in ``Sql.init()``.  It signifies that if the database
does not exist, create the directory and the metadata files necessary
for a new, blank database.

When creating a new database, be sure that:

*  The directory does not (yet) exist (it will be created).  If 
   it exists and does not contain the metadata files, the opening
   of the database will fail.

*  The parent directory (in this case ``./``) does exist, and that
   you have read/write permissions.

So now that we have the code to open, and optionally create our
database, let's make our table.

.. code-block:: javascript

   var Sql = require("rampart-sql");

    // use process.scriptPath to make sure we have the
    // correct path if running from another working directory
    var sql = new Sql.init(process.scriptPath + "/geonames_db", true);

    // put the create statement into its own function
    // since we are doing this in stages

    function create_table() {

        sql.exec("create table geonames (" +
            "id           counter, "       +
            "country_code char(2), "       +
            "postal_code  varchar(8), "    +
            "place_name   varchar(16), "   +
            "admin_name1  varchar(16), "   +
            "admin_code1  varchar(8), "    +
            "admin_name2  varchar(16), "   +
            "admin_code2  varchar(8), "    +
            "admin_name3  varchar(16), "   +
            "admin_code3  varchar(8), "    +
            "latitude     double, "        +
            "longitude    double, "        +
            "geocode      long, "          +
            "accuracy     int           );"
        );

    }

    create_table();

This should all be self expanatory.  If not, please brush up on
your `SQL <https://www.w3schools.com/sql/sql_create_table.asp>`_\ .

Note though that ``varchar(x)`` in Texis SQL, the size ``x`` is
merely a suggestion.  If the text put into this field is larger
that what is specified, it will not truncate the text or affect any indexing.

Now we have our table.  Let's get that data in!

Importing the CSV
~~~~~~~~~~~~~~~~~

The Settings
^^^^^^^^^^^^

The SQL module has a convenient function to import CSV data.  It has many options
and often takes careful examination of the data to be imported to get it correct.
Fortunately the large number of options allows us to get well formatted
CSV data imported correctly.

See the section for :ref:`importCsvFile() <rampart-sql:importCsvFile()>` for a full
listing.

Knowing what we discovered when we examined the ``allCountries.txt`` file above, we
can make our ``importCsvFile()`` call look like this:

.. code-block:: javascript

    var total = sql.importCsvFile(
        "allCountries.txt",  //file to import
        {
            normalize:       false,
            singleQuoteNest: false,
            delimiter:       '\t',
            hasHeaderRow:    false,
            tableName:       "geonames",
        },
        /* numbers are column-in positions (-1 means leave blank, or add counter if field type is 'counter')
           position in array is column-out positions  */
        [-1,0,1,2,3,4,5,6,7,8,9,10,-1,11]
    );

So the :green:`Object` of settings passed to ``importCsvFile()`` addresses the answers to all our
questions above (``singleQuoteNest: false`` is because there are single quotes present AND they
are not quoted in double quotes -- one setting for those two questions).

We also pass an array (``[-1,0,1,2,3,4,5,6,7,8,9,10,-1,11]``).

Column numbers start at ``0`` and end at ``n-1`` columns.

The array is like the layout of a SQL table row.  The numbers in the array
correspond to columns in the CSV.  As such, the array lets the import
function know which columns from the CSV file go to which columns in the SQL
table.  

In this case, column 0 in the SQL database is a ``counter`` type. 
We want this to be created automatically.  So the first member of this array
(``-1``) tells the import function to fill the first column in the SQL
database with the default value.

For default values using ``-1``, the actual value depends on the column
type.  For ``varchar`` it is a blank string.  For ``int`` it is ``0``.  And
for ``counter`` it is a unique number based on a time stamp and a counter
value.

Moving on, the second number in the array is ``0`` ("[-1,\ :red:`0`\
,1,...]").  Since it is in the ``array[1]`` position, it refers to column 1
(the second column) of SQL table.  Since it is ``0``, the data from column 0
of the CSV will be used to populate column 1 of the SQL table.

The rest follow suit with column 1 of the CSV populating column 2 of the 
SQL table and so on.

We want to insert zeros into the `geocode` field since it will be calculated
later.  Hence there is the ``-1`` in the ``array[12]`` position (again,
starting at 0; "[-1,0,1,2,3,4,5,6,7,8,9,10,\ :red:`-1`\ ,11]).

We are ready to import the data.  But before we do, we know this will take a bit of time.
Let's set up a function to monitor the progress so we aren't staring at a blank screen
wondering when the import will be finished.

Monitoring the Import
^^^^^^^^^^^^^^^^^^^^^

There are two major stages at which we can monitor the import.  The first
is while ``importCsvFile()`` is analysing the data, and the second is
as the data is being inserted into the SQL table.

In the first, analysis stage, a monitoring function is passed two parameters:
``monitor_import(count, stage)``.  The analysis takes at least two passes.
If ``normalize``, is set ``true``, two more passes are added for each column.

Note that the first stage is significantly faster than the second.  Therefore if your
dataset is not very large, you might want to skip reporting on the progress
of the first page.

In the second, insert stage, a monitoring function is passed only one parameter:
``monitor_import(count)``.  There is only one pass for the second stage.

Knowing this, we can write a single function to print out our progress, which may be used
at either of or both of the major stages.

.. code-block:: javascript

    // cuz no one likes writing out 'rampart.utils.printf()'
    rampart.globalize(rampart.utils);

    var step = 100; //set in importCsvFile(), only report every 100th row
    var total = -1; //we won't know the total until we finish the first pass

    function monitor_import(count, stg) {
        var stage = "Import";

        if(count==0)
            printf("\n");

        if(stg!==undefined) { // progressfunc
            stage=stg;
        }

        if(stg === 0) //differentiate between 0 and undefined
        {
            total=count; //update our total in the first stage.
            printf("Stage: %s, Count: %d       \r", stage, count);
        } else {
            printf("Stage: %s, Count: %d of %d      \r", stage, count, total);
        }
        fflush(stdout);

    }


Putting it Together
^^^^^^^^^^^^^^^^^^^

Putting this all together, and using the ``callbackStep`` and ``progressStep``
settings, we end up with this:

.. code-block:: javascript

    // cuz no one likes writing out 'rampart.utils.printf()'
    rampart.globalize(rampart.utils);

    var step = 100; //set in importCsvFile(), only report every 100th row
    var total = -1; //we won't know the total until we finish the first pass

    function monitor_import(count, stg) {
        var stage = "Import";

        if(count==0)
            printf("\n");

        if(stg!==undefined) { // progressfunc
            stage=stg;
        }

        if(stg === 0) //differentiate between 0 and undefined
        {
            total=count; //update our total in the first stage.
            printf("Stage: %s, Count: %d       \r", stage, count);
        } else {
            printf("Stage: %s, Count: %d of %d      \r", stage, count, total);
        }
        fflush(stdout);

    }

    total = sql.importCsvFile(
        "allCountries.txt",  //file to import
        {
            normalize:       false,
            singleQuoteNest: false,
            delimiter:       '\t',
            hasHeaderRow:    false,
            tableName:       "geonames",
            callbackStep:    step, //callback run every 100th row
            progressStep:    step, //progressfunc run every 100th row for each stage
            progressFunc:    monitor_import //progress function while processing csv 
        },
        /* numbers are column-in positions (-1 means leave blank, or add counter if field type is 'counter')
           position in array is column-out positions  */
        [-1,0,1,2,3,4,5,6,7,8,9,10,-1,11],
        monitor_import //callback function upon actual import
    );
    printf('\n');//end with a newline

The Script Thus Far
^^^^^^^^^^^^^^^^^^^

We can wrap the import into its own function and add it to our script from above: 

.. code-block:: javascript

    var Sql = require("rampart-sql");

    // use process.scriptPath to make sure we have the
    // correct path if running from another working directory
    var sql = new Sql.init(process.scriptPath + "/geonames_db", true);

    // cuz no one likes writing out 'rampart.utils.printf()'
    rampart.globalize(rampart.utils);

    // put the create statement into its own function
    // since we are doing this in stages

    function create_table() {

        sql.exec("create table geonames (" +
            "id           counter, "       +
            "country_code char(2), "       +
            "postal_code  varchar(8), "    +
            "place_name   varchar(16), "   +
            "admin_name1  varchar(16), "   +
            "admin_code1  varchar(8), "    +
            "admin_name2  varchar(16), "   +
            "admin_code2  varchar(8), "    +
            "admin_name3  varchar(16), "   +
            "admin_code3  varchar(8), "    +
            "latitude     double, "        +
            "longitude    double, "        +
            "geocode      long, "          +
            "accuracy     int           );"
        );

    }


    var step = 100; //set in importCsvFile(), only report every 100th row
    var total = -1; //we won't know the total until we finish the first pass

    /* a single function to monitor the import for both pre-processing (progressFunc)
       and import (callback function supplied to sql.importCsvFile as a paramater)   */
    function monitor_import(count, stg) {
        var stage = "Import";

        if(count==0)
            printf("\n");

        if(stg!==undefined) { // progressfunc
            stage=stg;
        }

        if(stg === 0) //differentiate between 0 and undefined
        {
            total=count; //update our total in the first stage.
            printf("Stage: %s, Count: %d       \r", stage, count);
        } else {
            printf("Stage: %s, Count: %d of %d      \r", stage, count, total);
        }
        fflush(stdout);

    }

    function import_data() {
        total = sql.importCsvFile(
            "allCountries.txt",  //file to import
            {
                normalize:       false,
                singleQuoteNest: false,
                delimiter:       '\t',
                hasHeaderRow:    false,
                tableName:       "geonames",
                callbackStep:    step, //callback run every 100th row
                progressStep:    step, //progressfunc run every 100th row for each stage
                progressFunc:    monitor_import //progress function while processing csv 
            },
            /* numbers are column-in positions (-1 means leave blank, or add counter if field type is 'counter')
               position in array is column-out positions  */
            [-1,0,1,2,3,4,5,6,7,8,9,10,-1,11],
            monitor_import //callback function upon actual import
        );
        printf('\n');//end with a newline
    }

    create_table();
    import_data();

Computing Geocodes
~~~~~~~~~~~~~~~~~~

Now we have all the data from the CSV imported into the SQL table.  But
remember the ``geocode`` field?  They have all been set to ``0``.  So what
is this field for?  We will use it to store a "geocode" that allows us to
search bounded regions.  The function ``latlon2geocode`` will compute it for
us using the latitude and longitude already in each row of the table.

According to the :ref:`documentation <sql-server-funcs:latlon2geocode, latlon2geocodearea>`:

::

   The latlon2geocode function encodes a given latitude/longitude coordinate
   into one long return value.  This encoded value – a “geocode” value – can
   be indexed and used with a special variant of Texis’ BETWEEN operator for
   bounded-area searches of a geographical region.  

That is exactly what we need to efficiently search for other places close to a given one.

So lets compute that field.  Fortunately it can be done in a single sql statement:

.. code-block:: sql

    update geonames set geocode = latlon2geocode(latitude, longitude);

Once again, let's wrap that in a function and put it in our script:

.. code-block:: javascript

    function make_geocode() {
        printf("Computing geocode column:\n");

        sql.exec("update geonames set geocode = latlon2geocode(latitude, longitude);",
                 //monitor our progress with a callback
                 function(row,i) {
                     if(! (i%100) ) {
                         printf("%d of %d    \r", i, total);
                         fflush(stdout);
                     }
                 }
        );
        printf('\n');//end with a newline
    }

Like magic, we now have everything we need to do a geographic bounded search.

Lets prove it.  After computing the ``geocode`` column, lets find zip codes
in Oakland, CA and surrounding cities.  From the command line, we will use
the ``tsql`` utility to try this out.

::

    $ tsql -l 30 -d geonames_db/ "select place_name, postal_code,  
      distlatlon(37.8, -122.3, latitude, longitude) MilesAway
      from geonames where geocode between (select latlon2geocodearea(37.8, -122.3, 0.2)) order by 3 asc"

     place_name  postal_code   MilesAway  
    ------------+------------+------------+
    Oakland      94615            0.463117
    Oakland      94607            0.949234
    Oakland      94604             1.62171
    Oakland      94623             1.62171
    Oakland      94624             1.62171
    Oakland      94649             1.62171
    Oakland      94659             1.62171
    Oakland      94660             1.62171
    Oakland      94661             1.62171
    Oakland      94666             1.62171
    Oakland      94617              1.6351
    Oakland      94612             1.90388
    Emeryville   94662             2.30697
    Emeryville   94608             2.73752
    Alameda      94501             2.79463
    Oakland      94606             3.12938
    Oakland      94610             3.16062
    Oakland      94609              3.1832
    Oakland      94622             3.61777
    Piedmont     94620             4.09376
    San Francisco 94130             4.10287
    Berkeley     94701             4.18801
    Oakland      94618             4.41511
    Berkeley     94703             4.56013
    Berkeley     94702             4.60167
    Oakland      94601             4.74365
    Berkeley     94705             4.79358
    Berkeley     94710             4.81075
    Oakland      94602             4.88881
    San Francisco 94105             4.95664

Yes, that worked.  But why was it so slow?

Building Indexes
~~~~~~~~~~~~~~~~

The geocode index
^^^^^^^^^^^^^^^^^

We need to create an index to speed up the bounded "geocode" search above. 
And we should do that in our script.  And once again, we are going to wrap
it in a function.

.. code-block:: javascript

    function make_geocode_index() {
        printf("creating index on geocode\n");
        sql.exec("create index geonames_geocode_x on geonames(geocode) WITH INDEXMETER 'on';");
    }

A couple of things to note:

First -- when this index is made, it will backed by a
file named ``geonames_geocode_x.btr``.  It is so named because it will be
easy to find using ``ls -l`` (it will come right before the table, named
``geonames.tbl``, and it lets you know the field indexed (``_geocode``) and
the type of index (``_x`` for plain index, i.e.  - not Fulltext or unique). 
Your methodology for naming indexes is not as important as making sure you
are consistent, can read it and know what the index is for without having to
resort to looking it up.

However if you do not know what an index is for, you can always look it up in the System
Catalog:

::

    # tsql -d geonames_db/ "select * from SYSINDEX where NAME='geonames_geocode_x'"

        NAME        TBNAME       FNAME       COLLSEQ        TYPE      NON_UNIQUE     FIELDS       PARAMS   
    ------------+------------+------------+------------+------------+------------+------------+------------+
    geonames_geocode_x geonames     geonames_geocode_x A            B                      01 geocode      stringcomparemode=unicodemulti,respectcase;


Second --  note the ``WITH INDEXMETER 'on'`` in the SQL statement.  This will tell
Texis to print a pretty meter to let you know the progress of your index creation.

When you have built your index, try the ``tsql`` query above again.  It should be much, much faster.

The id index
^^^^^^^^^^^^

Eventually, when we write our client-side script, we will want to look up records based on the
``id counter`` field.  So we will make a function to make an index on that as well.  

.. code-block:: javascript

    function make_id_index(){
        printf("creating index on id\n");
        sql.exec("create index geonames_id_x on geonames(id) WITH INDEXMETER 'on';");
    }


The Fulltext index
^^^^^^^^^^^^^^^^^^

When making a Fulltext index, often it is best to leave most settings as is.  The one exception
is the :ref:`rex <rampart-sql:rex()>` expressions used to define what is a word. 
Often we want to make sure we include utf-8 encoded text.

The default is ``\alnum{2,99}``, which is similar to doing ``mydoc.match(/[a-zA-Z0-9]+/g)``.
Since we are processing utf-8 text, and since we have names of places from all over the world,
we had better accommodate bytes larger than ``0x79``.

To change the expression used during Fulltext index creation, we can use
:ref:`delExp <sql-set:delExp>` and :ref:`addExp <sql-set:addExp>`.  However
as a shortcut, we can specify the expressions that will be used in the SQL
statement itself by utilizing the ``WITH`` keyword:

``WITH WORDEXPRESSIONS ('[\\alnum\\x80-\\xFF]{2,99}')``

That will find words consisting of 7-bit ascii letters and numbers, plus utf-8 multibyte characters as well.

Now we also have a database that does not contain normal text.  It is worth
thinking about where this might bite us when we perform a search.  Let's
look at the :ref:`list of noise words <sql-set:noiseList>`.  The excluded
``us``, ``to`` and ``in`` look suspect.  They are the same as some of our
country codes.  And ``or`` is an ``admin_code1`` abbreviation for Oregon.

Normally when searching normal English text, removing all the noise words
would hurt performance.  However, in this very specific circumstance, noise
words serve no purpose.  Further, they will exclude some codes we want in
our index.  So we will delete the noiseList.

You should always have a very good reason for altering or deleting the
noiseList.  For English text, there is rarely a need to do so and it can
have adverse consequences on performance and quality of results.  However, 
this time we do have a good reason.

Now - what exactly do we want to index?  Naturally we want to be able to
look up a place based upon any of the text fields.  So we will create one
"virtual" field made up of all our text fields.  To do that, in the SQL
statement we separate all the fields using a ``\``; But since it is
JavaScript, we will need to escape the backslash with another backslash.  We
should end up with this:

::

    place_name\\postal_code\\admin_name1\\admin_code1\\country_code\\admin_name2\\admin_code2\\admin_name3\\admin_code3

Ordering is important.  The queries we will do later, that have matches at
the beginning of our virtual field will match higher than those at the end.
(This, along with other ranking knobs can be adjusted -- see 
:ref:`Rank Knobs <sql-set:Rank knobs>`).

So, let's see our SQL statement, within a ``sql.exec()``, in its own function:

.. code-block:: javascript
    
    function make_text_index(){
        printf("creating indexes on location names\n");

        // noiselist as detailed at https://rampart.dev/docs/sql-set.html#noiselist
        // This is not English text and some geographic abbreviations like OR IN DO TO SO and US
        // are also on the noise words list.
        sql.set({ noiseList:[]});

        sql.exec("create fulltext index geonames_textcols_ftx on geonames"+
            "(place_name\\postal_code\\admin_name1\\admin_code1\\country_code\\admin_name2\\admin_code2\\admin_name3\\admin_code3)"+
            " WITH WORDEXPRESSIONS ('[\\alnum\\x80-\\xFF]{2,99}') INDEXMETER 'on';");
    }

The Final Import Script
~~~~~~~~~~~~~~~~~~~~~~~

We put it all together and it looks something like this:

.. code-block:: javascript

    var Sql = require("rampart-sql");

    // use process.scriptPath to make sure we have the
    // correct path if running from another working directory
    var sql = new Sql.init(process.scriptPath + "/geonames_db", true);

    // cuz no one likes writing out 'rampart.utils.printf()'
    rampart.globalize(rampart.utils);

    // put the create statement into its own function
    // since we are doing this in stages

    function create_table() {

        sql.exec("create table geonames (" +
            "id           counter, "       +
            "country_code char(2), "       +
            "postal_code  varchar(8), "    +
            "place_name   varchar(16), "   +
            "admin_name1  varchar(16), "   +
            "admin_code1  varchar(8), "    +
            "admin_name2  varchar(16), "   +
            "admin_code2  varchar(8), "    +
            "admin_name3  varchar(16), "   +
            "admin_code3  varchar(8), "    +
            "latitude     double, "        +
            "longitude    double, "        +
            "geocode      long, "          +
            "accuracy     int           );"
        );

    }


    var step = 100; //set in importCsvFile(), only report every 100th row
    var total = -1; //we won't know the total until we finish the first pass

    /* a single function to monitor the import for both pre-processing (progressFunc)
       and import (callback function supplied to sql.importCsvFile as a paramater)   */
    function monitor_import(count, stg) {
        var stage = "Import";

        if(count==0)
            printf("\n");

        if(stg!==undefined) { // progressfunc
            stage=stg;
        }

        if(stg === 0) //differentiate between 0 and undefined
        {
            total=count; //update our total in the first stage.
            printf("Stage: %s, Count: %d       \r", stage, count);
        } else {
            printf("Stage: %s, Count: %d of %d      \r", stage, count, total);
        }
        fflush(stdout);

    }

    function import_data() {
        total = sql.importCsvFile(
            "allCountries.txt",  //file to import
            {
                normalize:       false,
                singleQuoteNest: false,
                delimiter:       '\t',
                hasHeaderRow:    false,
                tableName:       "geonames",
                callbackStep:    step, //callback run every 100th row
                progressStep:    step, //progressfunc run every 100th row for each stage
                progressFunc:    monitor_import //progress function while processing csv 
            },
            /* numbers are column-in positions (-1 means leave blank, or add counter if field type is 'counter')
               position in array is column-out positions  */
            [-1,0,1,2,3,4,5,6,7,8,9,10,-1,11],
            monitor_import //callback function upon actual import
        );
        printf('\n');//end with a newline
    }

    function make_geocode() {
        printf("Computing geocode column:\n");

        sql.exec("update geonames set geocode = latlon2geocode(latitude, longitude);",
                 //monitor our progress with a callback
                 function(row,i) {
                     if(! (i%100) ) {
                         printf("%d of %d    \r", i, total);
                         fflush(stdout);
                     }
                 }
        );
        printf('\n');//end with a newline
    }

    function make_geocode_index() {
        printf("creating index on geocode\n");
        sql.exec("create index geonames_geocode_x on geonames(geocode) WITH INDEXMETER 'on';");
    }

    function make_id_index(){
        printf("creating index on id\n");
        sql.exec("create index geonames_id_x on geonames(id) WITH INDEXMETER 'on';");
    }

    function make_text_index() {
        printf("creating indexes on location names\n");

        // noiselist as detailed at https://rampart.dev/docs/sql-set.html#noiselist
        // This is not English text and some geographic abbreviations like OR IN DO TO SO and US
        // are also on the noise words list.
        sql.set({ noiseList:[]});

        sql.exec("create fulltext index geonames_textcols_ftx on geonames"+
            "(place_name\\postal_code\\admin_name1\\admin_code1\\country_code\\admin_name2\\admin_code2\\admin_name3\\admin_code3)"+
            " WITH WORDEXPRESSIONS ('[\\alnum\\x80-\\xFF]{2,99}') INDEXMETER 'on';");
    }

    create_table();
    import_data();
    make_geocode();
    make_geocode_index();
    make_id_index();
    make_text_index();

    printf("All Done\n");

Web Server Script
-----------------

Web Server Layout
~~~~~~~~~~~~~~~~~

In the Rampart binary distribution is a sample web server tree.  For our
purposes here, we assume you have downloaded and unzipped the Rampart binary
distribution into a directory named ``~/downloads/rampart``. We will use
that for this project.  
The :ref:`The rampart-server HTTP module <rampart-server:The rampart-server HTTP module>`
is configured and loaded from the included ``web_server/web_server_conf.js``
script.  It defines ``web_server/html`` as the default directory for static
html, ``web_server/apps`` as the default directory for scripts and
``web_server/data`` as a standard location for databases.

To get started, copy the ``web_server`` directory to a convenient place for
this project, then copy the ``geonames_db`` folder to
``web_server/data/geonames_db``.  Also, for our purposes, we do not need
anything in the ``web_server/apps/test_modules`` or
``web_server/apps/wsapps`` directories, so you can delete the copy of those
files. We will also add an empty file for our web interface at 
``web_server/apps/citysearch.js``.

::

    user@localhost:~$ mkdir citysearch_demo
    user@localhost:~$ cd citysearch_demo
    user@localhost:~/citysearch_demo$ cp -a ~/downloads/rampart/web_server ./
    user@localhost:~/citysearch_demo$ cd web_server/
    user@localhost:~/citysearch_demo/web_server$ cp -a ~/geonames/geonames_db data/
    user@localhost:~/citysearch_demo/web_server$ sudo chown -R nobody data/geonames_db/
    user@localhost:~/citysearch_demo/web_server$ rm -rf apps/test_modules wsapps/* html/index.html
    user@localhost:~/citysearch_demo/web_server$ touch ./apps/citysearch.js
    user@localhost:~/citysearch_demo/web_server$ find .
    .
    ./start_server.sh
    ./stop_server.sh
    ./web_server_conf.js
    ./apps
    ./apps/citysearch.js
    ./html
    ./html/images
    ./html/images/inigo-not-fount.jpg
    ./logs
    ./data
    ./data/geonames_db
    ./data/geonames_db/SYSUSERS.tbl
    ./data/geonames_db/geonames.tbl
    ./data/geonames_db/geonames_textcols_ftx_P.tbl
    ./data/geonames_db/geonames_textcols_ftx.tok
    ./data/geonames_db/geonames_textcols_ftx_D.btr
    ./data/geonames_db/geonames_geocode_x.btr
    ./data/geonames_db/geonames_textcols_ftx_T.btr
    ./data/geonames_db/SYSPERMS.tbl
    ./data/geonames_db/SYSINDEX.tbl
    ./data/geonames_db/geonames_textcols_ftx.btr
    ./data/geonames_db/SYSSTATS.tbl
    ./data/geonames_db/SYSCOLUMNS.tbl
    ./data/geonames_db/SYSTABLES.tbl
    ./data/geonames_db/geonames_textcols_ftx.dat
    ./data/geonames_db/SYSMETAINDEX.tbl
    ./data/geonames_db/geonames_id_x.btr
    ./data/geonames_db/SYSTRIG.tbl
    ./wsapps

Web Server Script Mapping
~~~~~~~~~~~~~~~~~~~~~~~~~

We will start by editing the ``apps/citysearch.js`` file in order to map 
functions to urls.

With your preferred editor, open the ``apps/citysearch.js`` file and
use this stub script as our starting point:

.. code-block:: javascript

    // Load the sql module
    var Sql=require("rampart-sql");

    // serverConf is defined in web_server/web_server_conf.js
    var sql=new Sql.init(serverConf.dataRoot + '/geonames_db');

    // function stubs
    function htmlpage(req) {
    }

    function ajaxres(req) {
    }

    function autocomp(req) {
    }


    // url to function mapping
    module.exports= {
        "/":               htmlpage,  //http://localhost:8088/apps/citysearch/
        "/index.html":     htmlpage,  //http://localhost:8088/apps/citysearch/index.html
        "/autocomp.json":  autocomp,  //http://localhost:8088/apps/citysearch/autocomp.json
        "/ajaxres.json":   ajaxres    //http://localhost:8088/apps/citysearch/ajaxres.json
    }


Notice that ``module.exports`` is set to an :green:`Object`.  This allows a
single module script to serve pages at multiple URLs.  Here ``/`` and
``/index.html`` will be used to return html and ``/autocomp.json`` and
``/ajaxres.json`` will be used for AJAX requests and will return JSON.

Delivering Static Content
~~~~~~~~~~~~~~~~~~~~~~~~~

Looking at the stub script above, there are two distinct times that the code
therein will be run: 1) once upon module load and 2) upon each request from
a client as mapped in the ``module.exports`` :green:`Object`.  For security
purposes, it is important to keep this in mind as you write scripts. 
Variables set in the module outside of the ``htmlpage()``, ``ajaxres()`` and
``autocomp()`` functions are long lived and span multiple requests.

That being said, we can set a single variable in the script to deliver
static content.  It only needs to be loaded once as it contains the
html and client side javascript that will be delivered to every client, and
does not change.

.. code-block:: javascript

    // Load the sql module
    var Sql=require("rampart-sql");

    // serverConf is defined in web_server/web_server_conf.js
    var sql=new Sql.init(serverConf.dataRoot + '/geonames_db');

    var client_script = `
        // client-side javascript goes here
    `;


    // page is defined once upon script load here rather than upon each request in 
    // htmlpage() below.
    var page=`<!DOCTYPE HTML>
    <html>
        <head><meta charset="utf-8">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.devbridge-autocomplete/1.4.11/jquery.autocomplete.min.js"></script>
        <style>
            body,h1,h2,h3,h4,h5,h6 {font-family: "Varela Round", Sans-Serif;}
            .autocomplete-suggestions { 
                border: 1px solid #999; 
                background: #FFF; 
                overflow: auto; 
                width: auto !important; 
                padding-right:5px;
            }
            .autocomplete-suggestion { 
                padding: 2px 5px; 
                white-space: nowrap; 
                overflow: hidden; 
            }
            .autocomplete-suggestions strong { 
                font-weight: normal; 
                color: #3399FF; 
            }
            .autocomplete-group strong { 
                display: block; 
                border-bottom: 1px solid #000; 
            }
            .autocomplete-selected { background: #F0F0F0; }
            .autocomplete-group { padding: 2px 5px; }
            .zip { display: inline-block; width:140px;}
            #main {
                background-color: white;
                margin: auto;
                min-height: 300px;
                width: 600px;
            }
            #idiv {
                width:500px;
                height:39px;
                border-bottom: lightGray 1px solid;
                padding:15px 0px 15px 0px;
            }
            #cstextbox {
                min-width:150px;
                width:100%;
                height:30px;
                font:normal 18px arial,sans-serif;
                padding: 1px 3px;
                border: 2px solid #ccc;
                box-sizing: border-box;
            }
        </style>
        <title>City Search Tutorial</title>
        </head>
        <body>
        <div id="main">
          <form id="mf">
              <div id="idiv">
                  <input type="text" id="cstextbox" name="q" value="" placeholder="Search for a city">
              </div>
          </form>
          <div id="res"></div>
          </body>
          <script>
              ${client_script}
          </script>
    </html>`;

    function htmlpage(req) {
        // just return the html.
        return {html:page};
    }

    function ajaxres(req) {
    }

    function autocomp(req) {
    }


    // url to function mapping
    module.exports= {
        "/":               htmlpage,  //http://localhost:8088/apps/citysearch/
        "/index.html":     htmlpage,  //http://localhost:8088/apps/citysearch/index.html
        "/autocomp.json":  autocomp,  //http://localhost:8088/apps/citysearch/autocomp.json
        "/ajaxres.json":   ajaxres    //http://localhost:8088/apps/citysearch/ajaxres.json
    }
 

The variable ``page`` is set to a basic web page with a form and text box for
searching, as well as loading some external JavaScript.  We will use the
variable ``client_script`` for our inline client-side scripting.

We will use the text input in the form to search for cities and load the
nearest cities, displaying the results in the ``<div id="res"></div>`` div
at the bottom of the page.

Note that the ``page`` variable is returned in an :green:`Object` at
the end of the ``htmlpage()`` function (``return {html:page};``).  The
property ``html`` sets the mime-type of the returned page to ``text/html``
and the value is set to the ``page`` variable to set the content to
be returned to the client. 

Client-Side Scripting
~~~~~~~~~~~~~~~~~~~~~

In order to make the AJAX autocomplete search, we will use 
`jQuery <https://jquery.com/>`_ and 
`jQuery-Autocomplete <https://github.com/devbridge/jQuery-Autocomplete>`_\ ,
both of which are included at the top of the script.  Please see the
`jQuery-Autocomplete page <https://github.com/devbridge/jQuery-Autocomplete>`_
for more information on how it works.

Below is our script so far, with the client-side JavaScript added.

.. code-block:: javascript

    // Load the sql module
    var Sql=require("rampart-sql");

    // serverConf is defined in web_server/web_server_conf.js
    var sql=new Sql.init(serverConf.dataRoot + '/geonames_db');

    var useKilometers=true;

    var distvar = "mi";

    if(useKilometers)
        distvar = "km";

    var client_script = `
    // function to get query parameters from url
    function getparams() {
        if (window.location.search.length==0)
            return {};

        var qstr  = window.location.search.substring(1);
        var pairs = qstr.split('&');
        var ret = {}, i=0;

        for (i = 0; i < pairs.length; i++) {
            var kv = pairs[i].split('=');
            ret[kv[0]]=kv[1];
        }
        return ret;
    };

    $(document).ready(function(){

        var curzip, curid;
        var params = getparams();

        // format the results, stick them in the div below the search form
        // update url to match state if curid is set
        function format_res(res_cities) {
            var resdiv = $('#res');
            var places = Object.keys(res_cities);
            var reshtml="<h2>Closest places to " + $('#cstextbox').val() +'</h2>';;
            resdiv.html('');

            for (var i=0;i<places.length;i++) {
                var j=0, place=places[i];
                var placeObj = res_cities[place];
                var zkeys = Object.keys(placeObj);
                var ziphtml='';
                var is_self=false; //flag if we are processing zip codes in the current city          

                for(j=0;j<zkeys.length;j++) {
                    var zip=zkeys[j];
                    if(zip == 'avgdist')
                        continue;
                    if(zip == curzip ) {
                        is_self=true;
                        continue;
                    }
                    var zipObj = placeObj[zip];
                    //console.log(zipObj);
                    ziphtml+='<a class="zip" href="#" data-zip="' + zip + '" data-lat="' + zipObj.lat + '" data-lon="' +
                             zipObj.lon + '" data-id="' + zipObj.id + '">' + zip + '(' + zipObj.dist.toFixed(1) +
                             '&nbsp;' + zipObj.heading + ')</a> ';
                }
                if(ziphtml) {// skip self if only one zip.
                    if(is_self)
                        reshtml += '<span><h3>Other zip codes in <span class="place">' + place + '</span></h3>'  
                                + ziphtml + "</span>";
                    else
                        reshtml += '<span><h3><span class="place">' + place + '</span> (' +
                                    parseFloat(placeObj.avgdist).toFixed(1)  +' ${distvar}.)</h3>' +
                                    ziphtml + "</span>";
                }
            }
            resdiv.html(reshtml);

            if(curid){
                var nurl = window.location.origin + window.location.pathname + '?id=' + curid;
                window.history.pushState({},'',nurl);
            }
        }

        // Use 'body' and filter with class 'zip' so the event will pick up not-yet-written content
        $('body').on('click','.zip',function(e) {
            //perform a new search on the zip code that was clicked.
            var t = $(this);
            var lat = t.attr('data-lat'), 
                lon=t.attr('data-lon'),
                zip=t.attr('data-zip');
            var place = t.closest('span').find('.place').text();

            //curid is for the change of url in order to save the state.
            curid = t.attr('data-id');

            // recreate the place name with the zip code in it
            place = place.substring(0, place.length-2) +zip + ', ' + place.substring(place.length-2, place.length);
            // put it in the search box
            $('#cstextbox').val(place);

            // fetch new list of closest cities and display
            $.getJSON(
                "/apps/citysearch/ajaxres.json",
                {lat:lat, lon: lon},
                function(res) {
                    curzip=zip;
                    format_res(res.cities);
                }
            );
            return false; //don't actually go to the href in the clicked <a>
        });

        // the autocomplete plugin from  https://github.com/devbridge/jQuery-Autocomplete
        // jquery and plugin included from cloudflare in <script src="xyz"> tags above.
        $('#cstextbox').autocomplete(
            {
                serviceUrl: '/apps/citysearch/autocomp.json',
                minChars: 2,
                autoSelectFirst: true,
                showNoSuggestionNotice: true,
                onSelect: function(sel)
                {
                    $.getJSON(
                        "/apps/citysearch/ajaxres.json",
                        {lat:sel.latitude, lon: sel.longitude},
                        function(res) {
                            curzip = sel.zip;
                            curid = sel.id;
                            format_res(res.cities);
                        }
                    );
                }
            }
        );

        // prevent form submission - all results are already in the autocomplete
        $('#cstextbox').on('keypress', function(e){
            var key = e.charCode || e.keyCode || 0;
            if (key == 13) {
                e.preventDefault();
                return false;
            }
        });

        function refresh(id) {
            $.getJSON(
                "/apps/citysearch/ajaxres.json",
                {id:params.id},
                function(res) {
                    curzip = res.zip;
                    $('#cstextbox').val(res.place);
                    //no curid necessary here
                    format_res(res.cities);
                }
            );
        }
        // if we refresh the page, then reload the content
        if(params.id) {
            refresh(params.id);
        }
        
        window.onpopstate = function(event) {
            // url has changed, but page was not reloaded
            params = getparams();
            curid=false;
            if(params.id)
                refresh(params.id);
            else {
                $('#cstextbox').val('');
                $('#res').html('');
            }
        };

    });
    `;


    // page is defined once upon script load here rather than upon each request in 
    // htmlpage() below.
    var page=`<!DOCTYPE HTML>
    <html>
        <head><meta charset="utf-8">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.devbridge-autocomplete/1.4.11/jquery.autocomplete.min.js"></script>
        <style>
            body,h1,h2,h3,h4,h5,h6 {font-family: "Varela Round", Sans-Serif;}
            .autocomplete-suggestions { 
                border: 1px solid #999; 
                background: #FFF; 
                overflow: auto; 
                width: auto !important; 
                padding-right:5px;
            }
            .autocomplete-suggestion { 
                padding: 2px 5px; 
                white-space: nowrap; 
                overflow: hidden; 
            }
            .autocomplete-suggestions strong { 
                font-weight: normal; 
                color: #3399FF; 
            }
            .autocomplete-group strong { 
                display: block; 
                border-bottom: 1px solid #000; 
            }
            .autocomplete-selected { background: #F0F0F0; }
            .autocomplete-group { padding: 2px 5px; }
            .zip { display: inline-block; width:140px;}
            #main {
                background-color: white;
                margin: auto;
                min-height: 300px;
                width: 600px;
            }
            #idiv {
                width:500px;
                height:39px;
                border-bottom: lightGray 1px solid;
                padding:15px 0px 15px 0px;
            }
            #cstextbox {
                min-width:150px;
                width:100%;
                height:30px;
                font:normal 18px arial,sans-serif;
                padding: 1px 3px;
                border: 2px solid #ccc;
                box-sizing: border-box;
            }
        </style>
        <title>City Search Tutorial</title>
        </head>
        <body>
        <div id="main">
          <form id="mf">
              <div id="idiv">
                  <input type="text" id="cstextbox" name="q" value="" placeholder="Search for a city">
              </div>
          </form>
          <div id="res"></div>
          </body>
          <script>
              ${client_script}
          </script>
    </html>`;



    function htmlpage(req) {
        // just return the html.
        return {html:page};
    }

    function ajaxres(req) {
    }

    function autocomp(req) {
    }


    // url to function mapping
    module.exports= {
        "/":               htmlpage,  //http://localhost:8088/apps/citysearch/
        "/index.html":     htmlpage,  //http://localhost:8088/apps/citysearch/index.html
        "/autocomp.json":  autocomp,  //http://localhost:8088/apps/citysearch/autocomp.json
        "/ajaxres.json":   ajaxres    //http://localhost:8088/apps/citysearch/ajaxres.json
    }
 
As mentioned before, we are going to concentrate on the server side
functionality, so explaining the client-side JavaScript functionality
is beyond the scope of this tutorial.  Instead, know that the script expects
the following:

.. code-block:: javascript

    // autocomp() results must be formatted as such:
    {
        "suggestions": [
            {
                "value":"Vaulion, Canton de Vaud, 1325, CH",
                "id":"6233eaf65bd",
                "latitude":46.6848,
                "longitude":6.3832,
                "zip":"1325"
            },
            {
                "value":"Vallorbe, Canton de Vaud, 1337, CH",
                "id":"6233eaf65c6",
                "latitude":46.7078,
                "longitude":6.3714,
                "zip":"1337"
            },
            {
                "value":"Valeyres-sous-Rances, Canton de Vaud, 1358, CH",
                "id":"6233eaf6608",
                "latitude":46.7482,
                "longitude":6.5354,
                "zip":"1358"
            },
            {
                "value":"Valeyres-sous-Ursins, Canton de Vaud, 1412, CH",
                "id":"6233eaf663b",
                "latitude":46.7453,
                "longitude":6.6533,
                "zip":"1412"
            },
            // ...
        ]
    }

    // ajaxres() results must be formatted as such:
    {
        "cities": {
            "Dixon, California, US": {
                "95620":{
                    "dist":0,
                    "lon":-121.8088,
                    "lat":38.4403,
                    "id":"6233ef9f79d",
                    "heading":"N"
                },
                "avgdist":0
            },
            "Davis, California, US":{
                "95616":{
                    "dist":13.892710766687838,
                    "lon":-121.7418,
                    "lat":38.5538,
                    "id":"6233ef9fa43",
                    "heading":"NNE"
                },
                "95617":{
                    "dist":14.13145261199491,
                    "lon":-121.7253,
                    "lat":38.5494,
                    "id":"6233ef9fa46",
                    "heading":"NNE"
                },
                "95618":{
                    "dist":13.052788618796216,
                    "lon":-121.7405,
                    "lat":38.5449,
                    "id":"6233ef9fa49",
                    "heading":"NNE"
                },
                "avgdist":13.692317332492989
            },
            // ...
        }
        // included if lookup by id:
        "place": "Dixon, California, 95620, US",
        "zip": "95620"
    }


Also added is the variable ``useKilometers``, which will be used both
client-side and for formatting the JSON results.

Formatting Auto-Complete Results
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

First step will be to construct our SQL statement and query in order
to get a list of cities that are closest to a city or lat/lon requested.

When we made our Fulltext index on our table, we used the virtual field
``place_name\postal_code\admin_name1\admin_code1\country_code\admin_name2\admin_code2\admin_name3\admin_code3``
in order to concatenate all the text we might want to use to look up a city.

So to find a city, let's construct a SQL statement which will return cities
that match a query

.. code-block:: sql

    SELECT 
    place_name +', ' + admin_name1 + ', ' + postal_code + ', ' + country_code value,
    id, latitude, longitude, postal_code zip
    FROM geonames WHERE
    place_name\postal_code\admin_name1\admin_code1\country_code\admin_name2\admin_code2\admin_name3\admin_code3
    LIKEP ?; 

Taking it line by line:

``SELECT`` - We are looking up and returning rows in the table.

``place_name +', ' + admin_name1 + ', ' + postal_code + ', ' + country_code value,``
- We are formatting several column so it will return, e.g., 
``San Francisco, CA, 94143, US`` and naming the string ``value``.

``id, latitude, longitude, postal_code zip`` - Other columns we need.

``FROM geonames WHERE`` - The name of the table, and ``WHERE`` for the
search on the next line.

``place_name\...\admin_name3\admin_code3``
- Specifying the virtual field upon which the Fulltext index is build.

``LIKEP ?`` - ``likep`` signifies a Fulltext search where word positions are
significant.  This will be your most used type of ``like`` search for normal
Fulltext queries.  The ``?`` corresponds to a variable we will give
``sql.exec()``, as explained below.

So lets start writing our ``autocomp()`` function, using this query:

.. code-block:: javascript

    /* autocomp() results must be formatted as such:
    {
        "suggestions": [
            {"value":"Vaulion, Canton de Vaud, 1325, CH","id":"6233eaf65bd","latitude":46.6848,"longitude":6.3832,"zip":"1325"},
            {"value":"Vallorbe, Canton de Vaud, 1337, CH","id":"6233eaf65c6","latitude":46.7078,"longitude":6.3714,"zip":"1337"},
            {"value":"Valeyres-sous-Rances, Canton de Vaud, 1358, CH","id":"6233eaf6608","latitude":46.7482,"longitude":6.5354,"zip":"1358"},
            {"value":"Valeyres-sous-Ursins, Canton de Vaud, 1412, CH","id":"6233eaf663b","latitude":46.7453,"longitude":6.6533,"zip":"1412"},
            ...
        ]
    }
    */
    function autocomp(req) {
        var res;
        var q = req.query.query;

        res = sql.exec(`SELECT 
            place_name +', ' + admin_name1 + ', ' + postal_code + ', ' + country_code value,
            id, latitude, longitude, postal_code zip
            FROM geonames WHERE
            place_name\\postal_code\\admin_name1\\admin_code1\\country_code\\admin_name2\\admin_code2\\admin_name3\\admin_code3
            LIKEP ?;`,
            [q] // corresponding to the "?" in "LIKEP ?"
        );
        return {json: { "suggestions": res.rows}};
    }


Indeed this will return JSON formatted results in the format needed by the
client-side JavaScript.  Unfortunately, it will not match cities unless the 
query contains full words.  Further, if jquery.autocomplete doesn't get
results for, e.g., ``ber``, it will not look for ``berk``, making our search pretty
much non-functional.

We would like a query like ``ber`` to match ``Berkeley`` and all other
results that have words beginning with ``ber``.  So lets add a ``*`` to the
last word in our search.  However, note that we only want to do that if the
last partial word is at least two characters long, since looking up every
city starting with ``b*`` would produce too many results to be meaningful.

.. code-block:: javascript

    /* autocomp() results must be formatted as such:
    {
        "suggestions": [
            {"value":"Vaulion, Canton de Vaud, 1325, CH","id":"6233eaf65bd","latitude":46.6848,"longitude":6.3832,"zip":"1325"},
            {"value":"Vallorbe, Canton de Vaud, 1337, CH","id":"6233eaf65c6","latitude":46.7078,"longitude":6.3714,"zip":"1337"},
            {"value":"Valeyres-sous-Rances, Canton de Vaud, 1358, CH","id":"6233eaf6608","latitude":46.7482,"longitude":6.5354,"zip":"1358"},
            {"value":"Valeyres-sous-Ursins, Canton de Vaud, 1412, CH","id":"6233eaf663b","latitude":46.7453,"longitude":6.6533,"zip":"1412"},
            ...
        ]
    }
    */
    function autocomp(req) {
        var res;
        var q = req.query.query;

        // ignore one character partial words

        // remove any spaces at the beginning of q
        q = q.replace(/^\s+/, '');

        // if query is only one char, return an empty set
        //   (even though client-side autocomplete is set to 2 char min)
        if(q.length<2)
            return {json: { "suggestions": []}}

        // we will need at least two chars in our last word
        // since it will get a '*' wildcard added to it
        q = q.replace(/ \S$/, ' ');
        

        // if last character is not a space, add wildcard
        if(q.charAt(q.length-1) != ' ')
            q += '*';

        // perform a text search on the words or partial words we have, and return a list of best matching locations
        res = sql.exec(`SELECT 
            place_name +', ' + admin_name1 + ', ' + postal_code + ', ' + country_code value,
            id, latitude, longitude, postal_code zip
            FROM geonames WHERE
            place_name\\postal_code\\admin_name1\\admin_code1\\country_code\\admin_name2\\admin_code2\\admin_name3\\admin_code3
            LIKEP ?;`,
            [q] 
        );
        return {json: { "suggestions": res.rows}};
    }

Using the example of ``be`` as a search, our script will add a ``*`` to it
and pass it to ``sql.exec()``.
 
Texis' Fulltext search will first search its index for all words beginning
with ``be`` and add them to the query.  Since this could potentially be
thousands of words added to our query, we need to make a few adjustments to
the default limits.

.. code-block:: javascript

        sql.set({
            'qMaxWords'    : 5000,  // allow query and sets to be larger than normal for '*' wildcard searches
            'qMaxSetWords' : 5000   // see https://rampart.dev/docs/sql-set.html#qmaxsetwords 
                                    // and https://rampart.dev/docs/sql-set.html#qmaxwords .
        });

 

For our next tweak -- normally we want to return the best results for a given
query, even if every word in the query is not match in any single document. 
However, in this case, we want to handle things a bit differently.  Our
objective is to narrow down our list of possible matches as we type.  So we
want to make sure that we do not return rows unless they match every term
given.  So we will set ``likepAllmatch`` to ``true``.
 

.. code-block:: javascript

        sql.set({
            'likepAllmatch': true,  // match every word or partial word
            'qMaxWords'    : 5000,  // allow query and sets to be larger than normal for '*' wildcard searches
            'qMaxSetWords' : 5000   // see https://rampart.dev/docs/sql-set.html#qmaxsetwords 
                                    // and https://rampart.dev/docs/sql-set.html#qmaxwords .
        });


Our completed function now looks like this:

.. code-block:: javascript

    /* autocomp() results must be formatted as such:
    {
        "suggestions": [
            {"value":"Vaulion, Canton de Vaud, 1325, CH","id":"6233eaf65bd","latitude":46.6848,"longitude":6.3832,"zip":"1325"},
            {"value":"Vallorbe, Canton de Vaud, 1337, CH","id":"6233eaf65c6","latitude":46.7078,"longitude":6.3714,"zip":"1337"},
            {"value":"Valeyres-sous-Rances, Canton de Vaud, 1358, CH","id":"6233eaf6608","latitude":46.7482,"longitude":6.5354,"zip":"1358"},
            {"value":"Valeyres-sous-Ursins, Canton de Vaud, 1412, CH","id":"6233eaf663b","latitude":46.7453,"longitude":6.6533,"zip":"1412"},
            ...
        ]
    }
    */
    function autocomp(req) {
        var res;
        var q = req.query.query;

        // ignore one character partial words

        // remove any spaces at the beginning of q
        q = q.replace(/^\s+/, '');

        // if query is only one char, return an empty set
        //   (even though client-side autocomplete is set to 2 char min)
        if(q.length<2)
            return {json: { "suggestions": []}}

        // we will need at least two chars in our last word
        // since it will get a '*' wildcard added to it
        q = q.replace(/ \S$/, ' ');
        

        // if last character is not a space, add wildcard
        if(q.charAt(q.length-1) != ' ')
            q += '*';

        sql.set({
            'likepAllmatch': true,  // match every word or partial word
            'qMaxWords'    : 5000,  // allow query and sets to be larger than normal for '*' wildcard searches
            'qMaxSetWords' : 5000   // see https://rampart.dev/docs/sql-set.html#qmaxsetwords 
                                    // and https://rampart.dev/docs/sql-set.html#qmaxwords .
        });
        
        // perform a text search on the words or partial words we have, and return a list of best matching locations
        res = sql.exec(`SELECT 
            place_name +', ' + admin_name1 + ', ' + postal_code + ', ' + country_code value,
            id, latitude, longitude, postal_code zip
            FROM geonames WHERE
            place_name\\postal_code\\admin_name1\\admin_code1\\country_code\\admin_name2\\admin_code2\\admin_name3\\admin_code3
            LIKEP ?;`,
            [q] 
        );
        return {json: { "suggestions": res.rows}};
    }

Finding and Formatting Nearest Cities
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

In the ``ajaxres()`` function, we will return a set of results
corresponding to the closest cities to a given city or lat/lon query.

To do so, we will use Texis' built-in SQL server function
:ref:`latlon2geocodearea <sql-server-funcs:latlon2geocode, latlon2geocodearea>`.
We also want to retrieve how far away the location is from the given
lat/lon (using :ref:`distlatlon <sql-server-funcs:distlatlon>` function), as
well as which compass direction the location is from the given lat/lon
(using the :ref:`azimuthlatlon <sql-server-funcs:azimuthlatlon>` and
:ref:`azimuth2compass <sql-server-funcs:azimuth2compass>` functions).

.. code-block:: sql

    SELECT
    place_name +', ' + admin_name1 + ', ' + country_code place,
    id, postal_code, latitude, longitude, 
    DISTLATLON(?lat, ?lon, latitude, longitude) dist,
    AZIMUTH2COMPASS( AZIMUTHLATLON(?lat, ?lon, latitude, longitude), 3 ) heading
    FROM geonames WHERE 
    geocode BETWEEN (SELECT LATLON2GEOCODEAREA(?lat, ?lon, 1.0))
    ORDER BY 6 ASC;

``SELECT`` - We are looking up and returning rows in the table.

``place_name +', ' + admin_name1 + ', ' + country_code place,``
- We are formatting several column so it will return, e.g., 
``San Francisco, CA, US`` and naming the string ``place``.

``id, postal_code, latitude, longitude`` - Other columns we need.

``DISTLATLON(?lat, ?lon, latitude, longitude) dist,`` - Calculate the
distance between the given lat/lon and the ``latitude`` and ``longitude``
columns of the selected row.  Name the result ``dist``.

``AZIMUTH2COMPASS( AZIMUTHLATLON(?lat, ?lon, latitude, longitude), 3 ) heading`` - 
First calculate the compass direction (azimuth) from lat/lon to the row's
``latitude`` and ``longitude`` columns.  Then convert that to a more friendly 2 or 3
letter direction abbreviation (i.e. - ``SE``, ``NW``, ``ENE``).

``FROM geonames WHERE`` - The name of the table, and ``WHERE`` for the
search on the next line.

``geocode BETWEEN (SELECT LATLON2GEOCODEAREA(?lat, ?lon, 1.0))`` - We use
our computed ``geocode`` field to limit returned rows to those that are
within one (``1.0``) degrees of our given lat/lon (see
:ref:`latlon2geocodearea <sql-server-funcs:latlon2geocode, latlon2geocodearea>` 
for precise definition of bounding box search).  This will give us a search
radius (box center to side) of about 69 miles (111 km) at the equator,
decreasing in width as we approach the poles.

``ORDER BY 6 ASC`` - we will order by the sixth selected column (in this
case -- ``dist``).

So lets start writing our ``ajaxres()`` function, using this query:

.. code-block:: javascript

    function ajaxres(req) {
        var res;
        var lon = req.params.lon, lat=req.params.lat;

        if(!lon || !lat)
            return {json:{}};

        res = sql.exec(`SELECT
            place_name +', ' + admin_name1 + ', ' + country_code place,
            id, postal_code, latitude, longitude, 
            DISTLATLON(?lat, ?lon, latitude, longitude) dist,
            AZIMUTH2COMPASS( AZIMUTHLATLON(?lat, ?lon, latitude, longitude), 3 ) heading
            FROM geonames WHERE 
            geocode BETWEEN (SELECT LATLON2GEOCODEAREA(?lat, ?lon, 1.0))
            ORDER BY 6 ASC;`,
            {lat:lat, lon:lon},
            {maxRows: 100 }
        );


Here we use the object ``{lat:lat, lon:lon}`` to fill in the ``?lat`` and
``?lon`` in the SQL query.  In this case it is easier than the using ``?,?``
style and providing an :green:`Array` since the same lat/lon values are
being use multiple times.

We also provide the object ``{maxRows: 100}`` to override the default of ten
rows.

This will return something similar to:

.. code-block:: javascript

    res = {
        "columns":["place","id","postal_code","latitude","longitude","dist","heading"],
        "rows":[
            {
                "place":"Dixon, California, US",
                "id":"6233ef9f79d",
                "postal_code":"95620",
                "latitude":38.4403,
                "longitude":-121.8088,
                "dist":0,
                "heading":"N"
            },
            {
                "place":"Davis, California, US",
                "id":"6233ef9fa49",
                "postal_code":"95618",
                "latitude":38.5449,
                "longitude":-121.7405,
                "dist":8.110646984972856,
                "heading":"NNE"
            },
            // ...
        ],
        "rowCount":100}
    }

That's nice, but not in the format that we need.  We need to group results by
``place`` and format the result as needed by the client-side JavaScript.

So let's write a function to do that:

.. code-block:: javascript

    var distconv = 1;

    if(useKilometers)
        distconv=1.60934

    // reorganize our data for easy handling client side.
    function reorg_places(places) {
        var i=0, j=0, ret={};
        /* group by city, with entries for distance for each zip code */
        for (; i<places.length;i++) {
            var p = places[i];
            if(!ret[p.place])
                ret[p.place]={};
            ret[p.place][p.postal_code] = {
                dist: p.dist * distconv,
                lon: p.longitude,
                lat: p.latitude,
                id: p.id,
                heading: p.heading
            };
        } 
        // calc average distance
        var keys = Object.keys(ret);
        for (i=0;i<keys.length;i++) {
            var placeName = keys[i];
            var placeObj = ret[placeName];
            var zkeys = Object.keys(placeObj);
            var cnt=0, avg=0;
            for (j=0;j<zkeys.length;j++) {
                var zkey = zkeys[j];
                avg += placeObj[zkey].dist;
                cnt++;
            }
            avg /= cnt;
            placeObj.avgdist=avg;
        }

    /* ret will be something like:
    {
        "Rocklin, California, US":
        {
            "95677":{"dist":0,"lon":-121.2366,"lat":38.7877,"id":"6232be7e18b","heading":"N"},
            "95765":{"dist":3.9415328848914677,"lon":-121.2677,"lat":38.8136,"id":"6232be7e1b2","heading":"NW"},
            "avgdist":1.9707664424457338
        },
        "Roseville, California, US":{
            "95661":{"dist":5.904624610176184,"lon":-121.234,"lat":38.7346,"id":"6232be7e185","heading":"S"},
            "95678":{"dist":5.2635315744972475,"lon":-121.2867,"lat":38.7609,"id":"6232be7e18e","heading":"SW"},
            "95747":{"dist":8.926222554334897,"lon":-121.3372,"lat":38.7703,"id":"6232be7e1af","heading":"WSW"},
            "avgdist":6.698126246336109
        },
        ...
    }
    */
        return ret;
    }

This function groups each ``place`` (city) name and adds the rows indexed by
the property ``postal_code`` (AKA zip code in the US).  It also calculates
an average distance for each ``postal_code`` and adds that as the property
``avgdist``.

Using that function, we can update our ``ajaxres()`` function to look like
this:

.. code-block:: javascript

    function ajaxres(req) {
        var res;
        var lon = req.params.lon, lat=req.params.lat;

        if(!lon || !lat)
            return {json:{}};

        res = sql.exec(`SELECT
            place_name +', ' + admin_name1 + ', ' + country_code place,
            id, postal_code, latitude, longitude, 
            DISTLATLON(?lat, ?lon, latitude, longitude) dist,
            AZIMUTH2COMPASS( AZIMUTHLATLON(?lat, ?lon, latitude, longitude), 3 ) heading
            FROM geonames WHERE 
            geocode BETWEEN (SELECT LATLON2GEOCODEAREA(?lat, ?lon, 1.0))
            ORDER BY 6 ASC;`,
            {lat:lat, lon:lon},
            {maxRows: 100 }
        );

        var ret = {cities: reorg_places(res.rows)};

        return {json:ret}
    }

This is looking good so far.  However the client-side JavaScript
also needs to look up by the location ``id`` column.  and when it
does so, it will also need to provide the name and postal code of 
that location. So we will add a bit more functionality to 
``ajaxres()`` for our final version:

.. code-block:: javascript

    function ajaxres(req) {
        var res, id_res;
        var lon = req.params.lon, lat=req.params.lat;

        // if we are given an id, look up the lat/lon
        if(req.params.id)
        {
            id_res= sql.one("SELECT " +
                "place_name +', ' + admin_name1 + ', ' + postal_code + ', ' +country_code place, "  +
                "postal_code zip, latitude lat, longitude lon " + 
                "FROM geonames WHERE id=?;",
                [req.params.id]
            );
            if(id_res) {
                lon=id_res.lon;
                lat=id_res.lat;
            }
        }

        if(!lon || !lat)
            return {json:{}};

        res = sql.exec(`SELECT
            place_name +', ' + admin_name1 + ', ' + country_code place,
            id, postal_code, latitude, longitude, 
            DISTLATLON(?lat, ?lon, latitude, longitude) dist,
            AZIMUTH2COMPASS( AZIMUTHLATLON(?lat, ?lon, latitude, longitude), 3 ) heading
            FROM geonames WHERE 
            geocode BETWEEN (SELECT LATLON2GEOCODEAREA(?lat, ?lon, 1.0))
            ORDER BY 6 ASC;`,
            {lat:lat, lon:lon},
            {maxRows: 100 }
        );
        var ret = {cities: reorg_places(res.rows)};

        // if look up by id, add name and zip for display
        if(req.params.id)
        {
            ret.place = id_res.place;
            ret.zip = id_res.zip;
        }

        return {json:ret}
    }

The Complete Server-Side Script
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

We now have all we need to perform the autocomplete search and nearest
city search.  This is the final script which, as layed out may be accessed
at ``http://localhost:8088/apps/citysearch/``.

.. code-block:: javascript

    // Load the sql module
    var Sql=require("rampart-sql");

    // serverConf is defined in web_server/web_server_conf.js
    var sql=new Sql.init(serverConf.dataRoot + '/geonames_db');

    var useKilometers=true;

    var distvar = "mi";

    if(useKilometers)
        distvar = "km";

    var client_script = `
    // function to get query parameters from url
    function getparams() {
        if (window.location.search.length==0)
            return {};

        var qstr  = window.location.search.substring(1);
        var pairs = qstr.split('&');
        var ret = {}, i=0;

        for (i = 0; i < pairs.length; i++) {
            var kv = pairs[i].split('=');
            ret[kv[0]]=kv[1];
        }
        return ret;
    };

    $(document).ready(function(){

        var curzip, curid;
        var params = getparams();

        // format the results, stick them in the div below the search form
        // update url to match state if curid is set
        function format_res(res_cities) {
            var resdiv = $('#res');
            var places = Object.keys(res_cities);
            var reshtml="<h2>Closest places to " + $('#cstextbox').val() +'</h2>';;
            resdiv.html('');

            for (var i=0;i<places.length;i++) {
                var j=0, place=places[i];
                var placeObj = res_cities[place];
                var zkeys = Object.keys(placeObj);
                var ziphtml='';
                var is_self=false; //flag if we are processing zip codes in the current city          

                for(j=0;j<zkeys.length;j++) {
                    var zip=zkeys[j];
                    if(zip == 'avgdist')
                        continue;
                    if(zip == curzip ) {
                        is_self=true;
                        continue;
                    }
                    var zipObj = placeObj[zip];
                    //console.log(zipObj);
                    ziphtml+='<a class="zip" href="#" data-zip="' + zip + '" data-lat="' + zipObj.lat + '" data-lon="' +
                             zipObj.lon + '" data-id="' + zipObj.id + '">' + zip + '(' + zipObj.dist.toFixed(1) +
                             '&nbsp;' + zipObj.heading + ')</a> ';
                }
                if(ziphtml) {// skip self if only one zip.
                    if(is_self)
                        reshtml += '<span><h3>Other zip codes in <span class="place">' + place + '</span></h3>'  
                                + ziphtml + "</span>";
                    else
                        reshtml += '<span><h3><span class="place">' + place + '</span> (' +
                                    parseFloat(placeObj.avgdist).toFixed(1)  +' ${distvar}.)</h3>' +
                                    ziphtml + "</span>";
                }
            }
            resdiv.html(reshtml);

            if(curid){
                var nurl = window.location.origin + window.location.pathname + '?id=' + curid;
                window.history.pushState({},'',nurl);
            }
        }

        // Use 'body' and filter with class 'zip' so the event will pick up not-yet-written content
        $('body').on('click','.zip',function(e) {
            //perform a new search on the zip code that was clicked.
            var t = $(this);
            var lat = t.attr('data-lat'), 
                lon=t.attr('data-lon'),
                zip=t.attr('data-zip');
            var place = t.closest('span').find('.place').text();

            //curid is for the change of url in order to save the state.
            curid = t.attr('data-id');

            // recreate the place name with the zip code in it
            place = place.substring(0, place.length-2) +zip + ', ' + place.substring(place.length-2, place.length);
            // put it in the search box
            $('#cstextbox').val(place);

            // fetch new list of closest cities and display
            $.getJSON(
                "/apps/citysearch/ajaxres.json",
                {lat:lat, lon: lon},
                function(res) {
                    curzip=zip;
                    format_res(res.cities);
                }
            );
            return false; //don't actually go to the href in the clicked <a>
        });

        // the autocomplete plugin from  https://github.com/devbridge/jQuery-Autocomplete
        // jquery and plugin included from cloudflare in <script src="xyz"> tags above.
        $('#cstextbox').autocomplete(
            {
                serviceUrl: '/apps/citysearch/autocomp.json',
                minChars: 2,
                autoSelectFirst: true,
                showNoSuggestionNotice: true,
                onSelect: function(sel)
                {
                    $.getJSON(
                        "/apps/citysearch/ajaxres.json",
                        {lat:sel.latitude, lon: sel.longitude},
                        function(res) {
                            curzip = sel.zip;
                            curid = sel.id;
                            format_res(res.cities);
                        }
                    );
                }
            }
        );

        // prevent form submission - all results are already in the autocomplete
        $('#cstextbox').on('keypress', function(e){
            var key = e.charCode || e.keyCode || 0;
            if (key == 13) {
                e.preventDefault();
                return false;
            }
        });

        function refresh(id) {
            $.getJSON(
                "/apps/citysearch/ajaxres.json",
                {id:params.id},
                function(res) {
                    curzip = res.zip;
                    $('#cstextbox').val(res.place);
                    //no curid necessary here
                    format_res(res.cities);
                }
            );
        }
        // if we refresh the page, then reload the content
        if(params.id) {
            refresh(params.id);
        }
        
        window.onpopstate = function(event) {
            // url has changed, but page was not reloaded
            params = getparams();
            curid=false;
            if(params.id)
                refresh(params.id);
            else {
                $('#cstextbox').val('');
                $('#res').html('');
            }
        };

    });
    `;


    // page is defined once upon script load here rather than upon each request in 
    // htmlpage() below.
    var page=`<!DOCTYPE HTML>
    <html>
        <head><meta charset="utf-8">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.devbridge-autocomplete/1.4.11/jquery.autocomplete.min.js"></script>
        <style>
            body,h1,h2,h3,h4,h5,h6 {font-family: "Varela Round", Sans-Serif;}
            .autocomplete-suggestions { 
                border: 1px solid #999; 
                background: #FFF; 
                overflow: auto; 
                width: auto !important; 
                padding-right:5px;
            }
            .autocomplete-suggestion { 
                padding: 2px 5px; 
                white-space: nowrap; 
                overflow: hidden; 
            }
            .autocomplete-suggestions strong { 
                font-weight: normal; 
                color: #3399FF; 
            }
            .autocomplete-group strong { 
                display: block; 
                border-bottom: 1px solid #000; 
            }
            .autocomplete-selected { background: #F0F0F0; }
            .autocomplete-group { padding: 2px 5px; }
            .zip { display: inline-block; width:140px;}
            #main {
                background-color: white;
                margin: auto;
                min-height: 300px;
                width: 600px;
            }
            #idiv {
                width:500px;
                height:39px;
                border-bottom: lightGray 1px solid;
                padding:15px 0px 15px 0px;
            }
            #cstextbox {
                min-width:150px;
                width:100%;
                height:30px;
                font:normal 18px arial,sans-serif;
                padding: 1px 3px;
                border: 2px solid #ccc;
                box-sizing: border-box;
            }
        </style>
        <title>City Search Tutorial</title>
        </head>
        <body>
        <div id="main">
          <form id="mf">
              <div id="idiv">
                  <input type="text" id="cstextbox" name="q" value="" placeholder="Search for a city">
              </div>
          </form>
          <div id="res"></div>
          </body>
          <script>
              ${client_script}
          </script>
    </html>`;



    function htmlpage(req) {
        // just return the html.
        return {html:page};
    }


    var distconv = 1;

    if(useKilometers)
        distconv=1.60934

    // reorganize our data for easy handling client side.
    function reorg_places(places) {
        var i=0, j=0, ret={};
        /* group by city, with entries for distance for each zip code */
        for (; i<places.length;i++) {
            var p = places[i];
            if(!ret[p.place])
                ret[p.place]={};
            ret[p.place][p.postal_code] = {
                dist: p.dist * distconv,
                lon: p.longitude,
                lat: p.latitude,
                id: p.id,
                heading: p.heading
            };
        } 
        // calc average distance
        var keys = Object.keys(ret);
        for (i=0;i<keys.length;i++) {
            var placeName = keys[i];
            var placeObj = ret[placeName];
            var zkeys = Object.keys(placeObj);
            var cnt=0, avg=0;
            for (j=0;j<zkeys.length;j++) {
                var zkey = zkeys[j];
                avg += placeObj[zkey].dist;
                cnt++;
            }
            avg /= cnt;
            placeObj.avgdist=avg;
        }

    /* ret will be something like:
    {
        "Rocklin, California, US":
        {
            "95677":{"dist":0,"lon":-121.2366,"lat":38.7877,"id":"6232be7e18b","heading":"N"},
            "95765":{"dist":3.9415328848914677,"lon":-121.2677,"lat":38.8136,"id":"6232be7e1b2","heading":"NW"},
            "avgdist":1.9707664424457338
        },
        "Roseville, California, US":{
            "95661":{"dist":5.904624610176184,"lon":-121.234,"lat":38.7346,"id":"6232be7e185","heading":"S"},
            "95678":{"dist":5.2635315744972475,"lon":-121.2867,"lat":38.7609,"id":"6232be7e18e","heading":"SW"},
            "95747":{"dist":8.926222554334897,"lon":-121.3372,"lat":38.7703,"id":"6232be7e1af","heading":"WSW"},
            "avgdist":6.698126246336109
        },
        ...
    }
    */
        return ret;
    }

    function ajaxres(req) {
        var res, id_res;
        var lon = req.params.lon, lat=req.params.lat;

        // if we are given an id, look up the lat/lon
        if(req.params.id)
        {
            id_res= sql.one("SELECT " +
                "place_name +', ' + admin_name1 + ', ' + postal_code + ', ' +country_code place, "  +
                "postal_code zip, latitude lat, longitude lon " + 
                "FROM geonames WHERE id=?;",
                [req.params.id]
            );
            if(id_res) {
                lon=id_res.lon;
                lat=id_res.lat;
            }
        }

        if(!lon || !lat)
            return {json:{}};

        res = sql.exec(`SELECT
            place_name +', ' + admin_name1 + ', ' + country_code place,
            id, postal_code, latitude, longitude, 
            DISTLATLON(?lat, ?lon, latitude, longitude) dist,
            AZIMUTH2COMPASS( AZIMUTHLATLON(?lat, ?lon, latitude, longitude), 3 ) heading
            FROM geonames WHERE 
            geocode BETWEEN (SELECT LATLON2GEOCODEAREA(?lat, ?lon, 1.0))
            ORDER BY 6 ASC;`,
            {lat:lat, lon:lon},
            {maxRows: 100 }
        );

        var ret = {cities: reorg_places(res.rows)};

        // if look up by id, add name and zip for display
        if(req.params.id)
        {
            ret.place = id_res.place;
            ret.zip = id_res.zip;
        }

        return {json:ret}
    }

    /* autocomp() results must be formatted as such:
    {
        "suggestions": [
            {"value":"Vaulion, Canton de Vaud, 1325, CH","id":"6233eaf65bd","latitude":46.6848,"longitude":6.3832,"zip":"1325"},
            {"value":"Vallorbe, Canton de Vaud, 1337, CH","id":"6233eaf65c6","latitude":46.7078,"longitude":6.3714,"zip":"1337"},
            {"value":"Valeyres-sous-Rances, Canton de Vaud, 1358, CH","id":"6233eaf6608","latitude":46.7482,"longitude":6.5354,"zip":"1358"},
            {"value":"Valeyres-sous-Ursins, Canton de Vaud, 1412, CH","id":"6233eaf663b","latitude":46.7453,"longitude":6.6533,"zip":"1412"},
            ...
        ]
    }
    */
    function autocomp(req) {
        var res;
        var q = req.query.query;

        // ignore one character partial words

        // remove any spaces at the beginning of q
        q = q.replace(/^\s+/, '');

        // if query is only one char, return an empty set
        //   (even though client-side autocomplete is set to 2 char min)
        if(q.length<2)
            return {json: { "suggestions": []}}

        // we will need at least two chars in our last word
        // since it will get a '*' wildcard added to it
        q = q.replace(/ \S$/, ' ');
        

        // if last character is not a space, add wildcard
        if(q.charAt(q.length-1) != ' ')
            q += '*';

        sql.set({
            'likepAllmatch': true,  // match every word or partial word
            'qMaxWords'    : 5000,  // allow query and sets to be larger than normal for '*' wildcard searches
            'qMaxSetWords' : 5000   // see https://rampart.dev/docs/sql-set.html#qmaxsetwords 
                                    // and https://rampart.dev/docs/sql-set.html#qmaxwords .
        });
        
        // perform a text search on the words or partial words we have, and return a list of best matching locations
        res = sql.exec(`SELECT 
            place_name +', ' + admin_name1 + ', ' + postal_code + ', ' + country_code value,
            id, latitude, longitude, postal_code zip
            FROM geonames WHERE
            place_name\\postal_code\\admin_name1\\admin_code1\\country_code\\admin_name2\\admin_code2\\admin_name3\\admin_code3
            LIKEP ?;`,
            [q] 
        );
        return {json: { "suggestions": res.rows}};
    }

    // url to function mapping
    module.exports= {
        "/":               htmlpage,  //http://localhost:8088/apps/citysearch/
        "/index.html":     htmlpage,  //http://localhost:8088/apps/citysearch/index.html
        "/autocomp.json":  autocomp,  //http://localhost:8088/apps/citysearch/autocomp.json
        "/ajaxres.json":   ajaxres    //http://localhost:8088/apps/citysearch/ajaxres.json
    }


Enjoy.
