The rampart-almanac module
==========================

Preface
-------

Acknowledgment
~~~~~~~~~~~~~~

The rampart-almanac module uses 
`astronomy.c library <https://github.com/cosinekitty/astronomy>`_
and the `date-holidays JavaScript module <https://github.com/commenthol/date-holidays>`_
The authors of Rampart extend our thanks to authors of these libraries.

License
~~~~~~~

The astronomy.c library is licensed under the
`MIT license <https://github.com/cosinekitty/astronomy/blob/master/LICENSE>`_\ .
The date-holidays Javascript module is licensed under an
`ISC license <https://github.com/commenthol/date-holidays/blob/master/LICENSE>`_
and includes other licenses therein.

What does it do?
~~~~~~~~~~~~~~~~

The rampart-astronomy module calculates Sun, Moon and Planet rise, set and positions
given a date and time, and latitude and longitude, and seasons given a year.  It also includes
rampart-date-holidays.js which calculates holidays for a particular locale and year.

Loading and Using the Module
----------------------------

Loading
~~~~~~~

Loading the module is a simple matter of using the ``require()`` function:

.. code-block:: javascript

    var almanac = require("rampart-almanac");



Celestial Positions
-------------------

almanac.suntimes()
~~~~~~~~~~~~~~~~~~

Calculate sun position times for a given day, longitude and latitude.

Usage:

.. code-block:: javascript

    var almanac = require("rampart-almanac");

    var times = almanac.suntimes(date, latitude, longitude);

Where:

* ``date`` is a JavaScript :green:`Date` or a :green:`String` (which is converted using
  :ref:`autoScanDate <rampart-utils:autoScanDate>`).

* ``latitude`` is a :green:`Number` (negative for south).

* ``longitude`` is a :green:`Number` (negative for west).

Return Value: An :green:`Object` with the relevant information.

Example:

.. code-block:: javascript

    var almanac = require("rampart-almanac");

    var times = almanac.suntimes("2024-01-01 -0700", 37.77, -122.42);
    /* times = 
       {
           "daylightHours": 9.605555555555556,
           "civilTwilightHours": 10.580555555555556,
           "nauticalTwilightHours": 11.674444444444445,
           "astronomicalTwilightHours": 12.7375,
           "solarNoon": "2024-01-01T20:13:08.000Z",
           "sunrise": "2024-01-01T15:25:03.000Z",
           "sunset": "2024-01-02T01:01:23.000Z",
           "civilTwilightStart": "2024-01-01T14:55:47.000Z",
           "civilTwilightEnd": "2024-01-02T01:30:37.000Z",
           "nauticalTwilightStart": "2024-01-01T14:22:59.000Z",
           "nauticalTwilightEnd": "2024-01-02T02:03:27.000Z",
           "astronomicalTwilightStart": "2024-01-01T13:51:05.000Z",
           "astronomicalTwilightEnd": "2024-01-02T02:35:18.000Z",
           "sunriseAzimuth": 118.89538324193013,
           "sunsetAzimuth": 241.1489255497421
       }
    */
    /* get sunrise as a local time by using '%z' */
    var sunrise = rampart.utils.dateFmt("%c %z\n", times.sunrise);
    /* sunrise = "Mon Jan  1 07:25:03 2024 -0800" */

almanac.moontimes()
~~~~~~~~~~~~~~~~~~~

Calculate moon position times for a given day, longitude and latitude.
Also return dates of the next moon phases.

Usage:

.. code-block:: javascript

    var almanac = require("rampart-almanac");

    var times = almanac.suntimes(date, latitude, longitude);

Where:

* ``date`` is a JavaScript :green:`Date` or a :green:`String` (which is converted using
  :ref:`autoScanDate <rampart-utils:autoScanDate>`).

* ``latitude`` is a :green:`Number` (negative for south).

* ``longitude`` is a :green:`Number` (negative for west).

Return Value: An :green:`Object` with the relevant information.

Example:

.. code-block:: javascript

    var almanac = require("rampart-almanac");

    var times = almanac.moontimes("2024-01-01 -0700", 37.77, -122.42);
    /*  times = 
        {
           "moonrise": "2024-01-01T05:39:21.000Z",
           "moonset": "2024-01-01T19:02:42.000Z",
           "newMoon": "2024-01-11T11:57:54.000Z",
           "firstQuarter": "2024-01-18T03:53:09.000Z",
           "fullMoon": "2024-01-25T17:54:41.000Z",
           "lastQuarter": "2024-01-04T03:31:09.000Z",
           "moonriseAzimuth": 75.56532169981396,
           "moonsetAzimuth": 280.6774632262042,
           "moonPhase": 0.6554114447709545,
           "moonIllumination": 0.779971673366036
        }
    */

almanac.celestials()
~~~~~~~~~~~~~~~~~~~~

Calculate sun, moon and planet times for a given day, longitude and latitude.

Usage:

.. code-block:: javascript

    var almanac = require("rampart-almanac");

    var times = almanac.celestials(date, latitude, longitude);

Where:

* ``date`` is a JavaScript :green:`Date` or a :green:`String` (which is converted using
  :ref:`autoScanDate <rampart-utils:autoScanDate>`).

* ``latitude`` is a :green:`Number` (negative for south).

* ``longitude`` is a :green:`Number` (negative for west).

Return Value: An :green:`Object` with the relevant information.

Example:

.. code-block:: javascript

    var almanac = require("rampart-almanac");

    var times = almanac.celestials("2024-01-01", 37.77, -122.42);
    /*  times =
        {
           "sun": {
              "currentRightAscension": 18.70381774294387,
              "currentDeclination": -23.082972736894366,
              "currentAzimuth": 231.2447789386162,
              "currentAltitude": 9.200955835755252,
              "nextRise": "2024-01-01T15:25:03.000Z",
              "nextSet": "2024-01-02T01:01:23.000Z"
           },
           "moon": {
              "currentRightAscension": 10.585655630489418,
              "currentDeclination": 12.06431630189065,
              "currentAzimuth": 358.2427660196457,
              "currentAltitude": -39.911128386544675,
              "nextRise": "2024-01-01T05:39:21.000Z",
              "nextSet": "2024-01-01T19:02:42.000Z"
           },
           "mercury": {
              "currentRightAscension": 17.42857713438222,
              "currentDeclination": -20.134230004864982,
              "currentAzimuth": 245.65820797921364,
              "currentAltitude": -1.1285066854169088,
              "nextRise": "2024-01-01T13:56:35.000Z",
              "nextSet": "2024-01-01T23:48:43.000Z"
           },
           "venus": {
              "currentRightAscension": 16.04024593585745,
              "currentDeclination": -18.703696660954833,
              "currentAzimuth": 258.8170836590166,
              "currentAltitude": -16.054068589788287,
              "nextRise": "2024-01-01T12:31:52.000Z",
              "nextSet": "2024-01-01T22:35:04.000Z"
           },
           "mars": {
              "currentRightAscension": 17.77925369534947,
              "currentDeclination": -23.951999465047503,
              "currentAzimuth": 239.58535957726625,
              "currentAltitude": 0.013586371580359469,
              "nextRise": "2024-01-01T14:34:09.000Z",
              "nextSet": "2024-01-01T23:59:15.000Z"
           },
           "jupiter": {
              "currentRightAscension": 2.224206624688085,
              "currentDeclination": 12.150270854695547,
              "currentAzimuth": 101.66782757086347,
              "currentAltitude": 34.25711749414994,
              "nextRise": "2024-01-01T20:58:35.000Z",
              "nextSet": "2024-01-02T10:19:59.000Z"
           },
           "saturn": {
              "currentRightAscension": 22.363992244102082,
              "currentDeclination": -11.961562816580198,
              "currentAzimuth": 182.50892699669285,
              "currentAltitude": 40.37470253011248,
              "nextRise": "2024-01-01T18:23:44.000Z",
              "nextSet": "2024-01-02T05:13:29.000Z"
           },
           "uranus": {
              "currentRightAscension": 3.1122566235436486,
              "currentDeclination": 17.187443780343074,
              "currentAzimuth": 88.20667075806635,
              "currentAltitude": 26.70533930046701,
              "nextRise": "2024-01-01T21:34:37.000Z",
              "nextSet": "2024-01-02T11:30:03.000Z"
           },
           "neptune": {
              "currentRightAscension": 23.711146313700397,
              "currentDeclination": -3.221011807290628,
              "currentAzimuth": 153.3716388125294,
              "currentAltitude": 45.795412016162715,
              "nextRise": "2024-01-01T19:16:31.000Z",
              "nextSet": "2024-01-02T07:01:13.000Z"
           },
           "pluto": {
              "currentRightAscension": 20.118773598789403,
              "currentDeclination": -23.058689775023026,
              "currentAzimuth": 214.92988354299945,
              "currentAltitude": 20.68436892218172,
              "nextRise": "2024-01-01T16:48:25.000Z",
              "nextSet": "2024-01-02T02:19:56.000Z"
           }
        }
    */

almanac.seasons()
~~~~~~~~~~~~~~~~~

Calculate the start of seasons for a given year.

Usage:

.. code-block:: javascript

    var almanac = require("rampart-almanac");

    var times = almanac.seasons(year);

Where:

* ``date`` is a :green:`Number`, the year to calculate.

Return Value: An :green:`Object` with dates for each season.

Example:

.. code-block:: javascript

    var almanac = require("rampart-almanac");

    var seasons = almanac.seasons(2025);
    /*  seasons = 
        {
           "spring": "2025-03-20T09:01:26.000Z",
           "summer": "2025-06-21T02:42:17.000Z",
           "autumn": "2025-09-22T18:19:33.000Z",
           "winter": "2025-12-21T15:03:03.000Z"
        }
    */
    console.log( dateFmt("Happy Nowruz! %c %z", seasons.spring) );
        /* Happy Nowruz! Thu Mar 20 02:01:26 2025 -0700 */

Holidays
--------

new almanac.Holiday()
~~~~~~~~~~~~~~~~~~~~~

Create a new ``Holidays`` object.

Usage:

.. code-block:: javascript

    var almanac = require("rampart-almanac");

    var hd = new almanac.Holidays();

    /* or */

    var hd = new almanac.Holidays(countryCode [, LocaleCode [, LocaleCode]]);

    hd.getHolidays(year);

More information, and this example (slightly modified) can be found `here <https://www.npmjs.com/package/date-holidays#Usage>`_\ :

.. code-block:: javascript

    var almanac = require('rampart-almanac');
    var Holidays = almanac.holidays;
    var printf = rampart.utils.printf;

    var hd = new Holidays();

    // get supported countries
    var res = hd.getCountries();
    printf("%3J\n", res);
    /*  res = 
        {
           "AD": "Andorra",
           "AE": "دولة الإمارات العربية المتحدة",
           "AG": "Antigua & Barbuda",
            ...
           "ZM": "Zambia",
           "ZW": "Zimbabwe"
        }
    */

    // get supported states e.g. for US
    var res = hd.getStates('US');
    printf("%3J\n", res);
    /*  res = 
        {
           al: 'Alabama',
           ...
           wy: 'Wyoming'
        }
    */

    // get supported regions e.g. for US, Lousiana
    res = hd.getRegions('US', 'la');
    printf("%3J\n", res);
    /*  res = 
        {
           "NO": "New Orleans"
        }
    */

    // initialize holidays for US, Lousiana, New Orleans
    hd.init('US', 'la', 'no');

    /* or using a new instance */
    //hd = new Holidays('US', 'la', 'no');

    // get all holidays for the year 2016
    res = hd.getHolidays(2016);
    printf("%3J\n", res);
    /*  res = 
        {
           "date": "2016-01-01 00:00:00",
           "start": "2016-01-01T06:00:00.000Z",
           "end": "2016-01-02T06:00:00.000Z",
           "name": "New Year's Day",
           "type": "public",
           "rule": "01-01 and if sunday then next monday if saturday then previous friday"
        },
        {
           "date": "2016-01-18 00:00:00",
           "start": "2016-01-18T06:00:00.000Z",
           "end": "2016-01-19T06:00:00.000Z",
           "name": "Martin Luther King Jr. Day",
           "type": "public",
           "rule": "3rd monday in January"
        },
        ...
        {
           "date": "2016-12-31 00:00:00",
           "start": "2016-12-31T06:00:00.000Z",
           "end": "2017-01-01T06:00:00.000Z",
           "name": "New Year's Eve",
           "type": "observance",
           "rule": "12-31"
        }
    */

    // check if date is a holiday while respecting timezones
    res = hd.isHoliday(new Date('2016-02-09 00:00:00'));
    printf("%3J\n", res);
    // res = false

    res = hd.isHoliday(rampart.utils.autoScanDate('2016-02-09 00:00:00 -0600').date);
    printf("%3J\n", res);
    /*  res = 
        [
           {
              "date": "2016-02-09 00:00:00",
              "start": "2016-02-09T06:00:00.000Z",
              "end": "2016-02-10T06:00:00.000Z",
              "name": "Mardi Gras",
              "type": "public"
           }
        ]
    */
