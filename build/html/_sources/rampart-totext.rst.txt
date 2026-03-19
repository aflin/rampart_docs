The rampart-totext module
=========================

Preface
-------

Acknowledgment
~~~~~~~~~~~~~~

The rampart-totext module uses the
`libdeflate <https://github.com/ebiggers/libdeflate>`_ library for
decompressing ZIP-based document formats (DOCX, PPTX, XLSX, ODT, ODP,
ODS, EPUB).  The developers of Rampart extend our thanks to the author
for this fast and portable decompression library.

For HTML text extraction, the module relies on the
:ref:`rampart-html module <rampart-html:The rampart-html module>` and
for Markdown conversion, the
:ref:`rampart-cmark module <rampart-cmark:The rampart-cmark module>`.

For PDF conversion, the module optionally uses the
`pdftotext <https://www.xpdfreader.com/pdftotext-man.html>`_ utility
from the Xpdf or Poppler utilities package.  For legacy Microsoft Word
``.doc`` conversion, it optionally uses the
`catdoc <https://www.wagner.pp.ru/~vitus/software/catdoc/>`_ utility on
Linux and FreeBSD, or the built-in ``textutil`` command on macOS.

License
~~~~~~~

The rampart-totext module is released under the MIT license.

The `libdeflate <https://github.com/ebiggers/libdeflate>`_ library is
released under the
`MIT License <https://github.com/ebiggers/libdeflate/blob/master/COPYING>`_\ .

What does it do?
~~~~~~~~~~~~~~~~

The rampart-totext module extracts plain text from a variety of document
formats.  It is designed for use with search engines and semantic search,
where the primary goal is to retrieve all textual content from a
document while preserving paragraph boundaries.  Formatting such as
bold, italic, font changes and indentation are discarded — only the
text content and paragraph structure are retained.

How does it work?
~~~~~~~~~~~~~~~~~

The module identifies the file format by inspecting the content of the
file (magic bytes, document structure) and falls back to the file
extension when the content is ambiguous.  Based on the detected type, it
applies the appropriate extraction method:

*  **Built-in C converters** handle plain text, XML/Docbook, LaTeX, RTF,
   and troff/man page formats directly.

*  **Rampart module converters** use the ``rampart-html`` and
   ``rampart-cmark`` modules (via internal JavaScript evaluation) for
   HTML and Markdown formats.

*  **ZIP-based formats** (DOCX, PPTX, XLSX, ODT, ODP, ODS, EPUB) are
   decompressed in C using libdeflate, and the extracted XML or HTML
   content is then parsed for text.

*  **External tool converters** invoke ``pdftotext`` for PDF files and
   ``catdoc`` or ``textutil`` for legacy ``.doc`` files.  If the
   required external tool is not installed, an error is thrown.

*  **Gzip-compressed files** are transparently decompressed before
   processing.  This is particularly useful for man pages, which are
   typically stored as ``.1.gz``, ``.2.gz``, etc. on the filesystem.
   After decompression, the ``.gz`` extension is stripped and the inner
   file format is detected normally.  Any supported format may be
   gzip-compressed.

*  **Unknown formats** are scanned for readable ASCII/UTF-8 text
   chunks.  Significant runs of text are extracted as paragraphs,
   allowing partial text recovery even from unrecognized binary formats.

*  **Source code and structured text** files (e.g. ``.csv``, ``.json``,
   ``.py``, ``.c``, ``.js``) are recognized by extension and returned
   as-is without whitespace normalization, preserving their original
   formatting.


Supported Formats
-----------------

The following table lists all supported formats, their detection method,
and any external dependencies.

.. list-table::
   :header-rows: 1
   :widths: 15 15 35 35

   * - Format
     - Extensions
     - Detection
     - Dependencies
   * - Plain Text
     - ``.txt``
     - Fallback (extension only)
     - None
   * - Source / Config
     - ``.csv``, ``.json``, ``.py``, ``.c``, ``.js``, etc.
     - Fallback (extension only)
     - None
   * - HTML
     - ``.html``, ``.htm``
     - ``<!DOCTYPE html>``, ``<html``
     - ``rampart-html``
   * - Markdown
     - ``.md``, ``.markdown``
     - Heuristic (headings, fenced divs, attributes)
     - ``rampart-cmark``, ``rampart-html``
   * - XML / Docbook
     - ``.xml``, ``.docbook``
     - ``<?xml``, docbook root elements
     - None
   * - LaTeX
     - ``.tex``, ``.latex``
     - ``\section{``, ``\href{``, ``\documentclass``, etc.
     - None
   * - RTF
     - ``.rtf``
     - ``{\rtf``
     - None
   * - Man Page
     - ``.1`` through ``.9``
     - ``.\"``, ``'.\"``, ``.TH``, ``.SH``
     - None
   * - DOCX
     - ``.docx``
     - ZIP with ``word/`` entries
     - None (libdeflate is built-in)
   * - PPTX
     - ``.pptx``
     - ZIP with ``ppt/`` entries
     - None (libdeflate is built-in)
   * - XLSX
     - ``.xlsx``
     - ZIP with ``xl/`` entries
     - None (libdeflate is built-in)
   * - ODT
     - ``.odt``
     - ZIP with mimetype ``application/vnd.oasis.opendocument.text``
     - None (libdeflate is built-in)
   * - ODP
     - ``.odp``
     - ZIP with mimetype ``application/vnd.oasis.opendocument.presentation``
     - None (libdeflate is built-in)
   * - ODS
     - ``.ods``
     - ZIP with mimetype ``application/vnd.oasis.opendocument.spreadsheet``
     - None (libdeflate is built-in)
   * - EPUB
     - ``.epub``
     - ZIP with mimetype ``application/epub+zip``
     - ``rampart-html`` (libdeflate is built-in)
   * - PDF
     - ``.pdf``
     - ``%PDF-``
     - ``pdftotext`` (external)
   * - Legacy Word (.doc)
     - ``.doc``
     - OLE2 magic bytes (``\xD0\xCF\x11\xE0``)
     - ``catdoc`` (Linux/FreeBSD) or ``textutil`` (macOS)


External Dependencies
---------------------

Most formats are handled entirely within the module.  Two formats
require external command-line utilities:

pdftotext
~~~~~~~~~

The ``pdftotext`` utility is used to extract text from PDF files.  It
is available in the ``poppler-utils`` or ``xpdf-utils`` package on most
systems:

*  **Debian/Ubuntu**: ``sudo apt install poppler-utils``
*  **Fedora/RHEL**: ``sudo dnf install poppler-utils``
*  **macOS**: ``brew install poppler``
*  **FreeBSD**: ``pkg install poppler-utils``

If ``pdftotext`` is not installed and a PDF file is passed to
``convertFile()`` or ``convert()``, an error will be thrown.

catdoc
~~~~~~

The ``catdoc`` utility is used to extract text from legacy Microsoft
Word ``.doc`` files on Linux and FreeBSD.  On macOS, the built-in
``textutil`` command is used instead.

*  **Debian/Ubuntu**: ``sudo apt install catdoc``
*  **Fedora/RHEL**: ``sudo dnf install catdoc``
*  **FreeBSD**: ``pkg install catdoc``
*  **macOS**: No installation required (``textutil`` is built-in).

If neither ``catdoc`` nor ``textutil`` is available and a ``.doc`` file
is passed to ``convertFile()`` or ``convert()``, an error will be thrown.


Loading and Using the Module
----------------------------

Loading
~~~~~~~

Loading the module is a simple matter of using the ``require()``
function:

.. code-block:: javascript

    var totext = require("rampart-totext");


Functions
---------

The rampart-totext module exports three functions: ``convertFile()``,
``convert()``, and ``identify()``.


convertFile
~~~~~~~~~~~

Extract plain text from a document file on disk.

Usage:

.. code-block:: javascript

    var text = totext.convertFile(filename[, details]);

Where:

*  ``filename`` is a :green:`String`, the path to the file to convert.
   If the file is gzip-compressed (e.g. ``myfile.1.gz``), it will be
   transparently decompressed before conversion.

*  ``details`` is an optional :green:`Boolean` or :green:`Object`.
   If ``true`` or ``{details: true}`` is passed, the function returns
   an :green:`Object` instead of a :green:`String` (see below).

Return Value:
   By default, a :green:`String` containing the extracted plain text.

   If ``details`` is set, an :green:`Object` with the following
   properties:

   *  ``text`` — a :green:`String`, the extracted plain text.

   *  ``mimeType`` — a :green:`String`, the MIME type of the detected
      input format (e.g. ``"text/html"``,
      ``"application/vnd.openxmlformats-officedocument.wordprocessingml.document"``).
      For unknown formats, the MIME type is
      ``"application/octet-stream"``.

Example:

.. code-block:: javascript

    var totext = require("rampart-totext");

    /* convert an HTML file to text */
    var text = totext.convertFile("/path/to/document.html");
    console.log(text);

    /* convert a DOCX file with details */
    var result = totext.convertFile("/path/to/report.docx", true);
    console.log(result.mimeType);  // "application/vnd.openxmlformats-..."
    console.log(result.text);

    /* convert a gzipped man page */
    var text = totext.convertFile("/usr/share/man/man1/ls.1.gz");
    console.log(text);

    /* convert a PDF (requires pdftotext) */
    try {
        var text = totext.convertFile("/path/to/paper.pdf");
        console.log(text);
    } catch(e) {
        console.log("PDF conversion failed:", e.message);
    }


convert
~~~~~~~

Extract plain text from in-memory document content.  This function
behaves the same as ``convertFile()`` but takes a :green:`String` or
:green:`Buffer` of document content instead of a filename.

Usage:

.. code-block:: javascript

    var text = totext.convert(content[, details]);

Where:

*  ``content`` is a :green:`String` or :green:`Buffer` containing the
   document data to convert.  If the data is gzip-compressed, it will
   be transparently decompressed before conversion.

*  ``details`` is an optional :green:`Boolean` or :green:`Object`,
   with the same behavior as in ``convertFile()``.

Return Value:
   Same as ``convertFile()``.

   Note: since no filename is available, file type detection relies
   entirely on content inspection.  For ambiguous formats (e.g. plain
   text vs. Markdown), the content heuristic determines the type.

   For PDF and legacy ``.doc`` formats, the content is passed to the
   external tool via standard input.

Example:

.. code-block:: javascript

    var totext = require("rampart-totext");
    rampart.globalize(rampart.utils);

    /* convert a buffer read from a file */
    var buf = readFile("/path/to/document.docx");
    var text = totext.convert(buf);
    console.log(text);

    /* convert with details */
    var result = totext.convert(buf, {details: true});
    console.log(result.mimeType);  // "application/vnd.openxmlformats-..."

    /* convert an HTML string directly */
    var html = "<h1>Hello</h1><p>World</p>";
    var text = totext.convert(html);
    console.log(text);  // "Hello\n\nWorld"


identify
~~~~~~~~

Identify the file format of a document without converting it.

Usage:

.. code-block:: javascript

    var type = totext.identify(filename);

    /* or */

    var type = totext.identify(buffer);

Where:

*  ``filename`` is a :green:`String`, the path to the file to identify.

*  ``buffer`` is a :green:`Buffer` containing the document data.

   If the data is gzip-compressed, it will be transparently
   decompressed before identification.

Return Value:
   A :green:`String`, one of the following type names:

   ``"text"``, ``"plaintext"``, ``"html"``, ``"markdown"``, ``"xml"``,
   ``"latex"``, ``"rtf"``, ``"man"``, ``"pdf"``, ``"docx"``, ``"pptx"``,
   ``"xlsx"``, ``"odt"``, ``"odp"``, ``"ods"``, ``"epub"``, ``"doc"``,
   or ``"unknown"``.

   The file type is determined primarily by inspecting the content.
   If the content is ambiguous, the file extension is used as a
   fallback (when a filename is provided).

Example:

.. code-block:: javascript

    var totext = require("rampart-totext");
    rampart.globalize(rampart.utils);

    var type = totext.identify("myfile.docx");
    console.log(type);  // "docx"

    var buf = readFile("presentation.pptx");
    console.log(totext.identify(buf));  // "pptx"


Output Format
-------------

The ``convertFile()`` and ``convert()`` functions return plain text
formatted for search indexing and semantic analysis:

*  **Paragraph separation** — Block-level elements (headings,
   paragraphs, list items, table cells) are separated by double
   newlines (``\n\n``).

*  **Whitespace normalization** — For document formats (HTML, DOCX,
   RTF, etc.), consecutive spaces, tabs and single newlines within a
   paragraph are collapsed to a single space.  For source code and
   structured text files (``.csv``, ``.json``, ``.py``, etc.), the
   original formatting is preserved.

*  **Trimming** — Leading and trailing whitespace is removed from the
   output.

*  **Entity decoding** — HTML and XML entities (e.g. ``&amp;``,
   ``&#8220;``, ``&nbsp;``) are decoded to their Unicode equivalents.

*  **Formatting removal** — Bold, italic, font changes, colors,
   indentation, and other visual formatting are discarded.

*  **Tag stripping** — All markup tags (HTML, XML, RTF control words,
   LaTeX commands, troff macros) are removed.  An inline tag that is
   stripped will leave a space to prevent adjacent words from being
   concatenated.


Notes on Specific Formats
-------------------------

DOCX
~~~~

The module extracts text from the main document body
(``word/document.xml``).  The actual document path is resolved by
parsing ``_rels/.rels``, so non-standard paths (e.g.
``word/document2.xml``) are handled correctly.  Headers, footers,
footnotes, endnotes, and comments stored in separate XML files within
the ZIP archive are not currently extracted.

PPTX
~~~~

The module iterates over all slide XML files
(``ppt/slides/slide1.xml``, ``slide2.xml``, etc.) in the ZIP archive
and extracts text from each.  Text from all slides is concatenated
with paragraph breaks between slides.

XLSX
~~~~

The module extracts text from the shared string table
(``xl/sharedStrings.xml``), which contains all unique string values
used in the spreadsheet.  This captures cell text content without
duplicating repeated values.

ODT / ODP / ODS
~~~~~~~~~~~~~~~~

The module extracts text from ``content.xml``, which in the ODF format
contains the main document body as well as headers, footers, footnotes,
and annotations.  All three OpenDocument formats (text, presentation,
spreadsheet) use the same ``content.xml`` structure.  The module is
compatible with ODF versions 1.0 through 1.3 and files produced by
OpenOffice, LibreOffice, and other ODF-compliant applications.

EPUB
~~~~

The module extracts and concatenates text from all ``.xhtml``,
``.html``, and ``.htm`` files found in the EPUB archive.  The
extracted HTML is then processed using the ``rampart-html`` module.

Markdown
~~~~~~~~

The module preprocesses the Markdown source to remove Pandoc extensions
(fenced div markers ``:::``, attribute spans ``{.class #id}``) before
passing the content to ``rampart-cmark`` for conversion to HTML and
then to ``rampart-html`` for text extraction.  Standard CommonMark
syntax is fully supported.

PDF
~~~

PDF text extraction is delegated to the external ``pdftotext`` utility,
which is invoked with UTF-8 encoding.  When using ``convertFile()``,
the filename is passed directly to ``pdftotext``.  When using
``convert()`` with a buffer, the content is passed via standard input.

The quality of the extracted text depends on the PDF's internal
structure — PDFs created from text documents generally produce excellent
results, while scanned documents (image-only PDFs) will produce no text
output.

Legacy Word (.doc)
~~~~~~~~~~~~~~~~~~

The legacy ``.doc`` format (OLE2 Compound Document) is a proprietary
binary format.  Text extraction is delegated to ``catdoc`` on Linux
and FreeBSD, or to ``textutil`` on macOS.  When using ``convert()``
with a buffer, the content is passed to the tool via standard input.
