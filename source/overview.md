# Rampart Overview for LLM Coding Assistants

## What is Rampart?

Rampart is a server-side JavaScript runtime built on the Duktape engine. It is
**not** Node.js. It uses a different JS engine, different module system, different
threading model, and ships with different built-in capabilities. Do not assume
Node.js APIs, patterns, or npm packages will work.

Rampart's philosophy: JavaScript orchestrates high-performance C functions. The
JS interpretation is slower than V8, but the C-backed modules (SQL, HTTP server,
crypto, etc.) provide the actual performance.

## Critical Differences from Node.js

### No npm. No node_modules.
There is no package manager. Functionality comes from built-in globals and
included C modules. Pure-JS libraries with no Node.js dependencies may work
but must be tested.

### Synchronous by default
Most operations block. `readFile()` returns data, `curl.fetch()` returns a
response, `sql.exec()` returns rows. Async variants exist for curl and redis
but must be opted into.

### Module system
Uses CommonJS-style `require()` but with a different search path:
1. Absolute path
2. Calling module's directory
3. `process.scriptPath`
4. `process.scriptPath/modules/`
5. `~/.rampart/modules/`
6. `$RAMPART_PATH`
7. `process.modulesPath` (system modules)

No `node_modules` directory. No ES module `import/export` without a transpiler.

### Threading model
Rampart has real POSIX threads via `new rampart.thread()`. Each thread gets its
own JS interpreter. The HTTP server automatically dispatches requests across a
thread pool. Threads do not share JS state — use SQL, LMDB, Redis, or the
thread clipboard (`rampart.thread.put/get`) for shared data.

### ECMAScript support
Duktape supports partial ES2015/ES2016 natively. For async/await, arrow
functions, destructuring, classes, etc., add `"use transpiler"` (fast, C-based)
or `"use babel"` (slower, more complete) at the top of the script. Transpiled
output is cached to disk and reused if the source hasn't changed.

**Transpiler gotchas:**
- `const` is transpiled to `var` — not enforced at runtime
- `await` inside loops may not work per-iteration with `"use transpiler"`
- Destructuring combined with `await` may fail with `"use transpiler"`

**When to use the transpiler or babel:**
Rampart's APIs are designed for ES5 — none of the built-in modules or
standard patterns require post-ES5 features. Do not add `"use transpiler"`
or `"use babel"` unless the user specifically requests ES2015+ syntax.

## Architecture: What's Built-in vs What Requires Loading

### Built into the executable (no require needed)
- `rampart.utils` — file I/O, printf/sprintf, exec/shell, fork/daemon, stat,
  sleep, hexify/dehexify, stringToBuffer/bufferToString, CSV import, date
  functions, and much more. **This is the workhorse module.**
- `rampart.thread` — POSIX threads, locks, thread clipboard
- `rampart.vector` — typed vectors, distance metrics for semantic search
- `rampart.event` — cross-thread event system
- `rampart.import` — CSV parsing

### C modules (require() to load)
- `rampart-server` — multi-threaded HTTP/HTTPS/WebSocket server
- `rampart-sql` — Texis SQL database with Metamorph full-text search
- `rampart-curl` — HTTP/FTP/SMTP client (libcurl)
- `rampart-crypto` — encryption, hashing, HMAC (OpenSSL)
- `rampart-html` — HTML parsing, cleanup, DOM manipulation (Tidy-HTML5)
- `rampart-lmdb` — fast key-value store (LMDB)
- `rampart-redis` — Redis client
- `rampart-net` — TCP sockets with SSL/TLS
- `rampart-python` — embedded Python interpreter with type conversion
- `rampart-totext` — text extraction from DOCX, PDF, HTML, RTF, EPUB, etc.
- `rampart-cmark` — CommonMark Markdown to HTML
- `rampart-url` — URL parsing and resolution
- `rampart-gm` — image processing (GraphicsMagick)
- `rampart-robots` — robots.txt compliance checking
- `rampart-almanac` — celestial calculations, holidays

## Common Patterns (from real-world code)

### The globalize pattern
Most scripts start with:
```javascript
rampart.globalize(rampart.utils);
```
This makes utility functions global: `printf`, `fprintf`, `sprintf`, `readFile`,
`stat`, `exec`, `shell`, `fork`, `sleep`, `fopen`, `fclose`, `fgets`, etc.
After globalizing, code reads like C: `fprintf(stderr, "Error: %s\n", msg)`.

### Dual-mode scripts
Many apps serve as both web handlers and CLI setup tools:
```javascript
if(module && module.exports) {
    // Web server mode — export handlers
    module.exports = {
        "/":              index_page,
        "/search.json":   search_handler
    };
} else {
    // CLI mode — build/import data
    build_the_database();
}
```
Run directly with `rampart myscript.js` to set up the database, then serve
it via the web server automatically.

### Multi-path module exports
A single script can handle multiple URL endpoints:
```javascript
module.exports = {
    "/":                 index_html,
    "/index.html":       index_html,
    "/search.json":      ajax_search,
    "/autocomplete.html": typeahead
};
```
Or export a single function for simple handlers:
```javascript
module.exports = function(req) {
    return {json: {results: []}};
};
```

### printf format extensions
Beyond standard C printf codes, Rampart adds:
- `%J` / `%!J` — JSON (with optional indent width). `!` handles cyclic refs.
- `%B` / `%!B` — base64 encode/decode
- `%U` / `%!U` — URL encode/decode
- `%H` / `%!H` — HTML entity encode/decode
- `%P` — pretty-print text with wrapping

The `!` flag inverts the operation (encode vs decode) for `%B`, `%U`, `%H`.

All of `%s`, `%B`, `%U`, `%H` accept strings and any buffer type. Without `!`,
`%U` and `%H` also accept Objects (converted to JSON first).

`bprintf()` returns a Buffer. Use `bprintf('%s%s', buf1, buf2)` to concatenate
buffers of any type.

### HTML generation
The most common pattern uses template literals with sprintf format codes:
```javascript
return {html: `
<!DOCTYPE html>
<html><body>
  <h3>${%H:query}</h3>
  <pre>${%3J:results}</pre>
</body></html>
`};
```
`%H` HTML-escapes the variable, `%3J` pretty-prints JSON with 3-space indent.
This only works with `"use transpiler"` or without any transpiler (not babel).

For large responses, use the server buffer instead of string concatenation:
```javascript
function handler(req) {
    req.put('<!DOCTYPE HTML><html><body>');
    for(var i = 0; i < rows.length; i++) {
        req.printf('<div>%H</div>', rows[i].title);
    }
    return {html: '</body></html>'};
}
```

### HTTP server and the standard layout
The standard deployment uses `web_server_conf.js` or `rampart --server`:
```
web_server/
    web_server_conf.js   — edit this to configure
    html/                — static files (document root)
    apps/                — server-side JS modules (auto-mapped to /apps/)
    wsapps/              — WebSocket modules (auto-mapped to ws://wsapps/)
    data/                — application data (databases, etc.)
    logs/                — access and error logs
```
A module at `apps/search.js` is automatically served at `/apps/search.html`
or `/apps/search/`. No explicit route registration needed.

For custom routes, use `rampart-server` directly:
```javascript
var server = require("rampart-server");
server.start({
    bind: "0.0.0.0:8080",
    map: {
        "/":           "/path/to/html",
        "/api/data":   function(req) { return {json: {ok: true}}; },
        "ws:/chat":    function(req) { ... }
    }
});
```

### Request object
```javascript
function handler(req) {
    req.query.q          // URL query parameter ?q=...
    req.params.q         // merged: query + POST + cookies (use for flexibility)
    req.postData.content // parsed POST body (form data or JSON)
    req.formData.content // multipart file uploads (array)
    req.body             // raw body (Buffer)
    req.method           // "GET", "POST", etc.
    req.path.file        // requested filename
    req.path.path        // requested path
    req.ip               // client IP
    req.cookies          // parsed cookies
    req.headers          // request headers
}
```

### Response object
Return an object with a key matching the content type:
```javascript
return {html: "<h1>Hello</h1>"};
return {json: {status: "ok"}};
return {txt: "plain text"};
return {jpg: "@/path/to/image.jpg"};  // serve file with @ prefix
return {status: 302, headers: {"Location": "/newurl"}};  // redirect
return {status: 404, html: "Not found"};  // error
```

### SQL patterns
```javascript
var Sql = require("rampart-sql");
var sql = new Sql.connection("/path/to/db", true);  // true = create

// Check if table exists (no IF NOT EXISTS support)
if(!sql.one("SELECT * FROM SYSTABLES WHERE NAME='docs'"))
    sql.exec("CREATE TABLE docs (title VARCHAR(128), body VARCHAR(8000))");

// Insert with parameterized query
sql.exec("INSERT INTO docs VALUES(?, ?)", [title, body]);

// Single row lookup (returns object or undefined)
var row = sql.one("SELECT * FROM docs WHERE id = ?", [id]);

// Query with maxRows (default is 10!)
var results = sql.exec("SELECT * FROM docs", {maxRows: -1});  // -1 = all

// Row-by-row callback (return false to stop early)
sql.exec("SELECT * FROM docs WHERE body LIKEP ?", {maxRows: 100},
    [searchTerms],
    function(row, i, cols, info) {
        // process each row; i is 0-based index
        if(done) return false;
    }
);

// Full-text search — always include WORDEXPRESSIONS for UTF-8 support
sql.exec("CREATE FULLTEXT INDEX docs_ftx ON docs(body) " +
    "WITH WORDEXPRESSIONS ('[\\alnum\\x80-\\xFF]{2,99}')");
// or to also match email addresses, URLs, etc.:
// "WITH WORDEXPRESSIONS ('[\\alnum\\x80-\\xFF]{2,99}', '[\\alnum\\$%@\\-_\\+]{2,99}')"
var results = sql.exec("SELECT * FROM docs WHERE body LIKEP ?",
    ["search terms"], {maxRows: 50});

// Tune full-text search
sql.set({
    likeprows: 100,      // candidates for full-text ranking
    minwordlen: 5,       // minimum word length for suffix processing
    useequivs: true      // enable synonym expansion
});
```
- `sql.exec()` throws on hard errors (bad syntax) but NOT on soft errors
  (duplicate on unique index). Check `sql.errMsg` after calls.
- `sql.query()` never throws — always check `sql.errMsg`.
- Always use `?` parameterized queries for user input.

### Data directory resolution
Apps typically find their data directory like this:
```javascript
var db_location;
if(global.serverConf && serverConf.dataRoot) {
    db_location = serverConf.dataRoot + "/mydb";
} else {
    db_location = process.scriptPath + "/../data/mydb";
}
```

### curl for HTTP requests
```javascript
var curl = require("rampart-curl");
var res = curl.fetch("https://api.example.com/data", {maxTime: 10});
if(res.status === 200) {
    var data = JSON.parse(res.text);
}
```

### WebSocket patterns
```javascript
function chat(req) {
    if(req.count == 0) {
        // First call: connection established, do setup
        req.username = req.query.user || "anonymous";  // state on req persists
        req.wsOnDisconnect(function() { /* cleanup */ });
        return;
    }
    // Subsequent calls: client sent data
    var msg = sprintf("%s", req.body);  // Buffer to string
    req.wsSend("Echo: " + msg);
    // or send JSON: req.wsSend({type: "response", data: result});
}
module.exports = chat;
```
Store per-connection state as properties on `req` — it persists across messages.

### Password hashing
```javascript
var crypto = require("rampart-crypto");
var kiv = crypto.passToKeyIv({
    password: password,
    salt: crypto.sha1(salt_string),
    iter: 10000
});
var hash = kiv.key;  // use for comparison
```

### File path validation
Prevent directory traversal with:
```javascript
function legal_path(filename) {
    try {
        return realPath(filename).startsWith(allowed_root);
    } catch(e) { return false; }
}
```

## Pitfalls to Watch For

1. **No Node.js APIs.** No `fs`, `http`, `path`, `stream`, `child_process`.
   Don't write Node code.

2. **SQL 10-row default.** SELECT returns max 10 rows unless you set `maxRows`.

3. **No `IF NOT EXISTS` in SQL.** Check `SYSTABLES` instead:
   `if(!sql.one("SELECT * FROM SYSTABLES WHERE NAME='mytable'")) ...`

4. **Server threads don't share state.** Module variables are per-thread.
   Use SQL, LMDB, Redis, or thread clipboard for shared data.

5. **Thread variable scoping.** Only globals that exist BEFORE
   `new rampart.thread()` are copied. Variables defined after are invisible.

6. **fgets default is 1 byte.** Use `fgets(handle, 4096)` to read a line.

7. **Event callback signature.** `rampart.event.on()` callbacks receive
   `(uservar, triggerval)` — the trigger value is the SECOND argument.

8. **TypedArrays lack array methods.** No forEach, map, filter, sort, etc.

9. **Buffers are not Node.js Buffers.** See the buffer table in `faq.rst`
   for what works on which type. `Buffer.from()` accepts String, Buffer,
   ArrayBuffer, TypedArray, or Array. `Buffer.alloc(n, fill)` accepts
   Number, String, or Buffer fill.

## External Projects

These are separate repositories that extend Rampart. Items marked with *
are included in the binary distribution.

| Project | Description |
|---------|-------------|
| [Langtools](https://github.com/aflin/rampart-langtools) * | AI embeddings, FAISS vector indexing, and tokenization via llama.cpp |
| [Webview](https://github.com/aflin/rampart-webview) * | Cross-platform desktop apps with HTML/CSS/JS and native rendering |
| [Rampart Iroh](https://github.com/aflin/rampart-iroh) * | P2P networking with encrypted QUIC, pub/sub, and blob transfer |
| [Iroh Webproxy](https://github.com/aflin/iroh-webproxy) * | Expose remote web servers locally via encrypted P2P tunnels |
| [Lang Derivs](https://github.com/aflin/rampart_lang_derivs) ** | Suffix matching rules for multilingual full-text search |
| [WebDAV](https://github.com/aflin/rampart_webdav) | Full WebDAV server with web file manager, media playback, and document editing |
| [Webshield](https://github.com/aflin/rampart_webshield) | Text and image obfuscation to protect content from scraping |
| [Self-Hosted Search](https://github.com/aflin/Self_Hosted_Search_Engine) | Personal search engine from your browsing history via browser extension |
| [Wikipedia Search](https://github.com/aflin/rampart_wikipedia_search) | Full-text keyword and semantic search across Wikipedia articles |
| [Rampart Docs](https://github.com/aflin/rampart_docs) | Documentation source with integrated search and typeahead |

\* included in binary distribution  \*\* partially included (English only)

## Documentation Map

Detailed docs are in reStructuredText files in the `source/` directory:

| Topic | File |
|-------|------|
| Core runtime, globals, require, threads, events, transpiler | `rampart-main.rst` |
| Utility functions (printf, file I/O, exec, fork, dates, HLL) | `rampart-utils.rst` |
| HTTP server (routes, request/response, WebSocket) | `rampart-server.rst` |
| SQL database and full-text search | `rampart-sql.rst` (via `sqltoc.rst`) |
| SQL utility functions (rex, sandr, stringFormat) | `sql-utils.rst` |
| HTTP client (curl) | `rampart-curl.rst` |
| Crypto (OpenSSL) | `rampart-crypto.rst` |
| HTML parsing and DOM manipulation | `rampart-html.rst` |
| LMDB key-value store | `rampart-lmdb.rst` |
| Redis client | `rampart-redis.rst` |
| TCP/SSL sockets | `rampart-net.rst` |
| Python interop | `rampart-python.rst` |
| Text extraction (DOCX, PDF, etc.) | `rampart-totext.rst` |
| Vector operations and semantic search | `rampart-vector.rst` |
| Rex pattern matching (**not** Perl regex) | `rex-sandr.md` |
| FAQ, buffer table, deployment, gotchas | `faq.rst` |
| Extras (webserver module, LLM module) | `rampart-extras.rst` |
| Tutorials (citysearch, wschat, pi_news) | `tutorial-*.rst` |
