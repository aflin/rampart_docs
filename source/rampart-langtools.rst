The rampart-langtools modules
=============================

Preface
-------

Acknowledgment
~~~~~~~~~~~~~~

The rampart-langtools package provides four modules built on
best-in-class machine-learning libraries:

*  The rampart-llamacpp module is built on
   `llama.cpp <https://github.com/ggml-org/llama.cpp>`_, the C/C++
   LLM inference engine created by Georgi Gerganov and contributors.

*  The rampart-onnx module is built on
   `ONNX Runtime <https://onnxruntime.ai/>`_, the cross-platform
   inference engine for ONNX models from Microsoft (with tokenizers
   from
   `onnxruntime-extensions <https://github.com/microsoft/onnxruntime-extensions>`_\ ).

*  The rampart-faiss module is built on
   `FAISS <https://github.com/facebookresearch/faiss>`_, the library
   for efficient similarity search and clustering of dense vectors
   from Meta AI Research.

*  The rampart-sentencepiece module is built on
   `SentencePiece <https://github.com/google/sentencepiece>`_, the
   unsupervised text tokenizer from Google.

The authors of Rampart extend their thanks to the authors and
contributors of each of these libraries.

License
~~~~~~~

The llama.cpp library is licensed under the
`MIT License <https://github.com/ggml-org/llama.cpp/blob/master/LICENSE>`__\ .
The ONNX Runtime library is licensed under the
`MIT License <https://github.com/microsoft/onnxruntime/blob/main/LICENSE>`__\ .
The FAISS library is licensed under the
`MIT License <https://github.com/facebookresearch/faiss/blob/main/LICENSE>`__\ .
The SentencePiece library is licensed under the
`Apache 2.0 License <https://github.com/google/sentencepiece/blob/master/LICENSE>`_\ .

The rampart-langtools modules are released under the MIT license.

What do they do?
~~~~~~~~~~~~~~~~

Together the modules provide the building blocks for semantic
search and local LLM inference inside Rampart:

*  **rampart-llamacpp** runs GGUF models directly inside the rampart
   process: text embedding (`initEmbed`_\ ), reranking
   (`initRerank`_\ ) and text generation (`initGen`_\ ).

*  **rampart-onnx** runs ONNX models: text embedding
   (`onnx.initEmbed`_\ ) and reranking (`onnx.initRerank`_\ ) with
   the same handle API as rampart-llamacpp, plus a general-purpose
   session API (`onnx.initSession`_\ ) for running any ONNX model.

*  **rampart-faiss** builds, trains, saves and searches vector
   indexes, from small exact-search indexes to compressed indexes
   holding hundreds of millions of vectors.

*  **rampart-sentencepiece** tokenizes text into subword pieces
   (and back) using a SentencePiece model.

The package also ships **rampart-models**, a pure-JavaScript helper
that downloads and locates the models the engines above consume —
``models.get('bge-m3')`` returns a ready-to-use local path, fetching
from HuggingFace on first use.  See
`The rampart-models module`_\ .

A typical pipeline embeds documents with rampart-llamacpp or
rampart-onnx, stores the vectors in a rampart-faiss index (and/or a
rampart-sql table), searches that index with an embedded query
vector, and optionally reranks the results with a reranking model.

Note that the rampart-sql module has this pipeline built in:  its
``embed()`` SQL function generates vectors in the SQL engine using
this package's rampart-llamacpp module, and its
``CREATE VECTOR INDEX`` / ``LIKEV`` similarity search uses a
FAISS-backed (IVFPQ) index internally.  When vectors live in a SQL
table, that integrated path is usually the simplest choice — see
:ref:`Vector Search <rampart-sql:Vector Search>` in the rampart-sql
documentation.  The modules documented here are for using the same
engines directly: custom or standalone faiss indexes, embedding
outside the SQL engine, reranking and text generation.

Platform Availability
~~~~~~~~~~~~~~~~~~~~~

The rampart-langtools modules are **not available** on the following
platforms:

*  macOS x86_64 (Intel Macs).

*  32-bit ARM Linux (the ``raspberry_pi_os-buster-armv7l`` build).

On macOS (Apple Silicon):

*  `initEmbed`_ requires macOS 12 (Monterey) or later.

*  `initGen`_ requires macOS 15 (Sequoia) or later, due to a Metal
   regression in older versions of macOS.  The requirement is
   checked at runtime and ``initGen`` will throw a descriptive error
   on macOS 14 and below.

On Linux, the modules are available in CPU and CUDA (GPU) builds.
GPU-only features (such as the faiss `idx.enableGpu()`_ function)
are noted where applicable.

The rampart-onnx module additionally requires glibc 2.28 or later
on Linux (it is not included in the packages built for older
distributions), and its CUDA support requires an NVIDIA driver
supporting CUDA 12 or later — see
`CPU and GPU (runtime selection)`_\ .

Errors, Warnings and Logs
~~~~~~~~~~~~~~~~~~~~~~~~~

The modules never write to ``stdout`` or ``stderr``.  Instead:

*  A **failure** throws a JavaScript :green:`Error` (a model that
   cannot be loaded, a malformed tensor, a session used after
   ``destroy()``).  Catch it as usual.

*  A **warning** — a non-fatal problem that did not stop the call —
   is placed in an ``errMsg`` property, exactly as rampart-sql does.
   The property is set on the object the call was made on: the module
   object for ``onnx.initEmbed()``, a handle for a handle method.  It
   is **cleared at the start of every call**, so it always describes
   the most recent one, and it is ``undefined`` when the call had
   nothing to report.  Typical warnings are a GPU that could not be
   used and silently fell back to the CPU, or an unusable
   ``RAMPART_ONNX_RUNTIME`` override.

.. code-block:: javascript

    var emb = onnx.initEmbed(model);
    if (onnx.errMsg)                       // e.g. "no usable GPU; using CPU"
        console.log("warning: " + onnx.errMsg);

``errMsg`` is deliberately kept separate from `getLog`_ /
`onnx.getLog / onnx.clearLog`_\ , which capture the *informational*
output of the underlying libraries (ggml/llama.cpp and ONNX Runtime).
That log is verbose — a single embedding can produce thousands of
lines — and a warning placed there would be lost in it.  Use
``errMsg`` to find out whether something went wrong, and ``getLog()``
when you want the engine's own diagnostics.

The rampart-llamacpp module
---------------------------

Loading the module is a simple matter of using the ``require()``
function:

.. code-block:: javascript

    var llamacpp = require("rampart-llamacpp");

Models are standard GGUF files, as downloaded from, e.g.,
`Hugging Face <https://huggingface.co/models?library=gguf>`_\ .

modelInfo
~~~~~~~~~

    The ``modelInfo`` function returns a model's key parameters by
    reading only its GGUF metadata and vocabulary.  It does **not**
    load the weight tensors, so there is no GPU upload and the call
    is fast even for multi-gigabyte models.

    Usage:

    .. code-block:: javascript

        var llamacpp = require("rampart-llamacpp");

        var info = llamacpp.modelInfo(path);

    Where ``path`` is a :green:`String`, the path to a ``.gguf``
    model file.

    Return Value:
        An :green:`Object` with the following properties:

        *  ``embedDim`` - A :green:`Number`, the size of the vector
           that `initEmbed`_'s embedding functions produce.  It
           prefers the GGUF ``embedding_length_out`` of a projection
           head, falling back to ``embedding_length``.

        *  ``hiddenDim`` - A :green:`Number`, the model hidden size.

        *  ``nCtxTrain`` - A :green:`Number`, the trained context
           length.

        *  ``nLayer`` - A :green:`Number`, the number of layers.

        *  ``arch`` - A :green:`String`, the GGUF
           ``general.architecture`` (e.g. ``"bert"``, ``"llama"``).

        *  ``pooling`` - A :green:`String`, the model's declared
           pooling type: ``"none"``, ``"mean"``, ``"cls"``,
           ``"last"``, ``"rank"`` or ``"unspecified"``.

        *  ``nParams`` - A :green:`Number`, the parameter count.

    Example:

    .. code-block:: javascript

        var llamacpp = require("rampart-llamacpp");

        var info = llamacpp.modelInfo("bge-m3-FP16.gguf");
        /* {
              embedDim:   1024,
              hiddenDim:  1024,
              nCtxTrain:  8192,
              nLayer:     24,
              arch:       "bert",
              pooling:    "cls",
              nParams:    566703104
           } */

        /* size vector storage from the model itself: */
        var vecDim = info.embedDim;

initEmbed
~~~~~~~~~

    The ``initEmbed`` function loads an embedding model and returns
    a handle used to convert text into semantic vectors.

    Usage:

    .. code-block:: javascript

        var llamacpp = require("rampart-llamacpp");

        var emb = llamacpp.initEmbed(path[, options]);

    Where:

    *  ``path`` is a :green:`String`, the path to a ``.gguf``
       embedding model.

    *  ``options`` is an optional :green:`Object` accepting all of
       the settings in `Common Model and Context Options`_ below,
       plus the following embedding-specific options:

       *  ``pooling`` - A :green:`String`, one of ``"none"``,
          ``"mean"``, ``"cls"``, ``"last"`` or ``"rank"``
          (``--pooling`` in llama-server).  Default: ``"mean"``.

       *  ``attention`` - A :green:`String`, ``"causal"`` or
          ``"non-causal"`` (``--attention``).

       *  ``split`` - A :green:`String` or :green:`Function`.
          ``"auto"`` (the default) chunks long text on its structure —
          paragraphs, merged or packed as configured below;
          ``"window"`` uses plain token windows.  A :green:`Function`
          replaces the built-in chunker entirely: it is called with
          the document text and must return an :green:`Array` of
          :green:`Strings` — N strings always produce N vectors.  A
          string that fits the token window gets its exact vector; an
          oversized string gets its combined (average) vector over
          its sub-chunks, and its ``chunks`` entry is marked
          ``oversized``.  The strings
          may freely transform the input (inject a title, drop
          boilerplate, ...), so the returned ``chunks`` carry
          ``{text, tokens}`` without byte spans.  Two notes: a
          splitter shared with other rampart threads (via a copied
          handle) must be self-contained — it cannot reference
          variables outside itself; and the SQL ``chunkembed()`` /
          5-argument ``abstract()`` machinery always uses the
          built-in chunker, so custom splitters are for JS-side
          pipelines.
          (The built-in chunker is the same as `onnx.initEmbed`_'s —
          the two modules share it, so identical options produce
          identical chunk boundaries for the same tokenizer.)

       *  ``minTokens`` - A :green:`Number`, the paragraph-fragment
          floor: shorter paragraphs are merged with a neighbor.
          ``-1`` disables merging.

       *  ``packParagraphs`` - A :green:`Boolean`.  If ``true``,
          consecutive paragraphs are packed together up to the token
          window (fewer, fuller chunks) instead of one vector per
          paragraph.

       *  ``sentenceSplit`` - A :green:`Boolean`.  If ``true``, an
          oversized paragraph (or structureless text) is split at
          **sentence boundaries** and the sentences greedily packed
          to the token window, instead of being cut at raw token
          windows mid-sentence.  Boundaries come from a multi-script
          terminator table (ASCII ``.!?`` with a whitespace guard;
          self-delimiting CJK ``。！？``, Arabic, Devanagari and
          others with none; fullwidth ``．`` digit-guarded so
          ``３．１４`` never splits), and a chunk never ends on a
          tiny trailing fragment (so a false boundary after "Mr."
          can't take a cut).  Languages without sentence punctuation
          (e.g. Thai) fall back to token windows.  Default ``false``:
          enabling it changes chunk boundaries, which tables built
          WITHOUT value headers depend on for snippet spans.

       The legacy option names ``nctx``, ``ubatch``, ``nthreads``
       and ``nthreads_batch`` are accepted as aliases for ``nCtx``,
       ``nUBatch``, ``threads`` and ``threadsBatch``.

    If ``nCtx`` is not given, the context size defaults to the
    model's trained maximum, capped at 8192 tokens.

    Model weights are shared:  loading the same model file from
    several handles or rampart threads keeps a single copy of the
    weights in memory.  A handle that is copied to another
    :ref:`rampart thread <rampart-thread:Rampart Thread Functions>`
    transparently builds its own per-thread context on first use.

    Note:
        The rampart-sql ``embed()`` SQL function runs this same
        engine inside the SQL module: ``sql.set({llamaEmbed:
        '/path/to/model.gguf'})`` loads the model through
        rampart-llamacpp and ``embed(?)`` then produces the same
        vectors as `emb.embedTextToFp16Buf()`_'s ``avgVec``.  When
        embedding rows of a SQL table, that path avoids round-trips
        through JavaScript — see
        :ref:`Generating embeddings <rampart-sql:Generating embeddings>`
        and the :ref:`llamaEmbed <sql-set:llamaEmbed>` property.

    Return Value:
        An :green:`Object` (the embedding handle) with the functions
        `emb.embedTextToFp16Buf()`_\ , `emb.embedTextToFp32Buf()`_\ ,
        `emb.embedTextToNumbers()`_ and `emb.destroy()`_ documented
        below.

    Example:

    .. code-block:: javascript

        var llamacpp = require("rampart-llamacpp");

        var emb = llamacpp.initEmbed("all-minilm-l6-v2_f16.gguf");

        var v = emb.embedTextToFp16Buf("about a paragraph of text ...");

        /* v = { vecs: [vec1, ...], avgVec: avg, coherence: n,
                 chunks: [ {start,end,tokens,text}, ... ] }
           If the text fits the model's context window,
           v.vecs.length == 1 and v.vecs[0] == v.avgVec.       */

        /* store the vector, e.g., in a sql table */
        sql.exec("insert into vecs values(?,?,?)",
                 [v.avgVec, docId, text]);

        /* unload when no longer needed */
        emb.destroy();

emb.embedTextToFp16Buf()
^^^^^^^^^^^^^^^^^^^^^^^^

    Embed text and return the vector(s) packed as 16-bit floats
    (little-endian) in a :green:`Buffer`.  This is the most compact
    format and is directly usable by
    :ref:`rampart.vector <rampart-vector:Rampart Vector Functions>`
    functions, the :doc:`rampart-sql <rampart-sql>`
    ``vecdist()`` function and the faiss `idx.addFp16()`_ /
    `idx.searchFp16()`_ functions.

    Usage:

    .. code-block:: javascript

        var ret = emb.embedTextToFp16Buf(text);

    Where ``text`` is a :green:`String` (or a :green:`Buffer`
    containing text) to be embedded.

    If the tokenized text does not fit the model's context window,
    it is chunked; with the default ``split: "auto"`` the chunking
    is **structure-aware**: text is split on paragraph boundaries
    (falling back to token windows for oversized paragraphs), so
    each vector corresponds to a semantically meaningful span of the
    input, and the spans are reported in ``chunks``.  Each vector is
    L2-normalized.

    Return Value:
        An :green:`Object` with the following properties:

        *  ``vecs`` - An :green:`Array` of :green:`Buffers`, one
           vector per chunk (``2 * embedDim`` bytes each).

        *  ``avgVec`` - A :green:`Buffer`.  If only one chunk was
           produced, the same vector as ``vecs[0]``.  Otherwise the
           re-normalized average of all the chunk vectors, suitable
           as a single whole-document vector.

        *  ``coherence`` - A :green:`Number` in ``[0, 1]``: the
           average pairwise cosine similarity of the chunk vectors
           (``1.0`` for a single-chunk document).  A low value means
           the document spans several topics and ``avgVec`` is a
           blurrier summary of it.

        *  ``chunks`` - An :green:`Array` of :green:`Objects`, one
           per vector, with ``start`` / ``end`` (the chunk's byte
           span in the input), ``tokens`` (its token count),
           ``text`` (the chunk text itself) and ``oversized``
           (:green:`Boolean` ``true`` when this vector is one of
           several token windows over a single span that exceeded
           the model window; such sub-chunks share their span).

        For empty or whitespace-only input, ``vecs`` is an empty
        :green:`Array` and ``avgVec`` is not set.

emb.embedTextToFp32Buf()
^^^^^^^^^^^^^^^^^^^^^^^^

    The same as `emb.embedTextToFp16Buf()`_ except that vectors are
    packed as 32-bit floats (``4 * embedDim`` bytes per vector).

    Usage:

    .. code-block:: javascript

        var ret = emb.embedTextToFp32Buf(text);

emb.embedTextToNumbers()
^^^^^^^^^^^^^^^^^^^^^^^^

    The same as `emb.embedTextToFp16Buf()`_ except that each vector
    is returned as an :green:`Array` of :green:`Numbers` rather than
    a packed :green:`Buffer`.

    Usage:

    .. code-block:: javascript

        var ret = emb.embedTextToNumbers(text);

emb.destroy()
^^^^^^^^^^^^^

    Free the model context (and release the model weights if this
    was the last handle using them).  Using the handle after calling
    ``destroy()`` throws an error.  Handles are also freed
    automatically when garbage collected, but for large models it is
    good practice to free them deterministically.

    Usage:

    .. code-block:: javascript

        emb.destroy();

initRerank
~~~~~~~~~~

    The ``initRerank`` function loads a reranking model (such as
    `bge-reranker-v2-m3 <https://huggingface.co/BAAI/bge-reranker-v2-m3>`_\ )
    and returns a handle used to score how well documents answer a
    query.  Reranking is commonly applied to the top results of a
    vector search to improve final ordering.

    Usage:

    .. code-block:: javascript

        var llamacpp = require("rampart-llamacpp");

        var rr = llamacpp.initRerank(path[, options]);

    Where:

    *  ``path`` is a :green:`String`, the path to a ``.gguf``
       reranking model.

    *  ``options`` is an optional :green:`Object` accepting the same
       settings as `initEmbed`_ above.  For reranking, ``pooling``
       defaults to ``"rank"``, the context size defaults to the
       model's trained maximum capped at 1024 tokens, and
       ``nUBatch`` defaults to 512.  Input longer than ``nUBatch``
       tokens is truncated.

    Return Value:
        An :green:`Object` (the reranker handle) with the functions
        `rr.rerank()`_ and ``destroy()`` (as in `emb.destroy()`_\ ).

    Note:
        Instruct-style rerankers — the
        `Qwen3-Reranker <https://huggingface.co/Qwen/Qwen3-Reranker-0.6B>`_
        family — judge relevance by answering a yes/no question inside
        a chat prompt rather than through a bert-style classifier
        head.  ``initRerank`` detects them by model architecture and
        wraps each (query, document) pair in the required prompt
        automatically.  Their scores are the probability of "yes"
        (roughly 0.5 – 1.0 for plausible documents) rather than the
        wide-range scores of bert-style rerankers; orderings are
        comparable, magnitudes are not.  Beware that many community
        GGUF conversions of these models were made as plain
        language models and lack the ranking head — such a file loads
        but scores every document identically.  The catalog's
        ``models.ggufGet("qwen3-reranker-0.6b")`` is pinned to a
        verified conversion.

    Example:

    .. code-block:: javascript

        var llamacpp = require("rampart-llamacpp");

        var rr = llamacpp.initRerank("bge-reranker-v2-m3-Q8_0.gguf");

        var question = "How tall is the Eiffel Tower?";

        /* score a single document */
        var score = rr.rerank(question,
            "The Eiffel Tower is 330 metres tall.");

        /* score several documents at once */
        var scored = rr.rerank(question, [
            "The Eiffel Tower is 330 metres tall.",
            "Gustave Eiffel also designed bridges.",
            "Paris is the capital of France."
        ]);
        /* [ { document: "The Eiffel Tower is ...", score: 4.21 },
             { document: "Gustave Eiffel also ...", score: -1.7 },
             ...                                                 ] */

        rr.destroy();

rr.rerank()
^^^^^^^^^^^

    Score one or more documents against a query.

    Usage:

    .. code-block:: javascript

        var score  = rr.rerank(query, document);
        var scored = rr.rerank(query, documents[, scoresOnly]);

    Where:

    *  ``query`` is a :green:`String`, the question or search text.

    *  ``document``/``documents`` is a :green:`String` (a single
       document) or an :green:`Array` of :green:`Strings`.

    *  ``scoresOnly`` is an optional :green:`Boolean` (only
       meaningful with an :green:`Array`).  Default ``false``.

    Return Value:
        *  Given a single :green:`String` document: a
           :green:`Number`, the relevance score.  Higher is more
           relevant; the range depends on the model (scores are
           typically logits, not probabilities).

        *  Given an :green:`Array` of documents: an :green:`Array`
           of :green:`Objects`, each ``{document: String,
           score: Number}``, in the same order as the input.

        *  Given an :green:`Array` and ``scoresOnly`` = ``true``:
           an :green:`Array` of :green:`Numbers`.

initGen
~~~~~~~

    The ``initGen`` function loads a text-generation model and
    returns a handle for synchronous and streaming generation.

    **Experimental.**  ``initGen``, ``predict`` and ``predictAsync``
    are under active development and the API may change.  Vision /
    multimodal input (``mmproj``) is not supported.

    ``initGen`` runs a single shared, continuously-batched engine on
    a dedicated rampart thread.  When the returned handle is shared
    across rampart threads (e.g. server threads), their requests are
    transparently pooled into that one engine: one copy of the model
    in memory, batched decoding.  ``nSeqMax`` sets how many requests
    may decode together.

    On macOS, ``initGen`` requires macOS 15 (Sequoia) or later — see
    `Platform Availability`_\ .

    Usage:

    .. code-block:: javascript

        var llamacpp = require("rampart-llamacpp");

        var gen = llamacpp.initGen(path[, options]);

    Where:

    *  ``path`` is a :green:`String`, the path to a ``.gguf``
       text-generation model.

    *  ``options`` is an optional :green:`Object` accepting all of
       the settings in `Common Model and Context Options`_ below,
       plus the following generation-specific options:

       *  ``jinja`` - A :green:`Boolean`, whether to apply the
          model's chat template via Jinja when ``messages`` are
          given to `gen.predict()`_\ .  Default: ``true``.

       *  ``chatTemplate`` - A :green:`String`, a custom Jinja chat
          template overriding the model's built-in template.

       *  ``chatTemplateFile`` - A :green:`String`, a file from
          which to read the custom chat template.

    Return Value:
        An :green:`Object` (the gen handle) with the properties
        ``nCtx`` and ``nVocab`` (:green:`Numbers`, the resolved
        context size and vocabulary size) and the functions
        `gen.predict()`_\ , `gen.predictAsync()`_\ ,
        `gen.getLast()`_ and `gen.destroy()`_\ .

    Example:

    .. code-block:: javascript

        var llamacpp = require("rampart-llamacpp");

        var gen = llamacpp.initGen("gemma-3-4b-it-Q4_K_M.gguf", {
            nCtx:    4096,
            nSeqMax: 4      /* up to 4 requests batched together */
        });

        /* synchronous: blocks and returns the full text */
        var text = gen.predict({
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user",   content: "What is the capital of France?" }
            ],
            maxTokens: 128
        });
        rampart.utils.printf("%s\n", text);

        /* streaming: tokens are delivered as they are produced */
        var h = gen.predictAsync(
            { prompt: "Explain how a combustion engine works.",
              maxTokens: 256, temp: 0.7 },
            function(res) {   /* per token */
                if (!res.done && !res.error)
                    rampart.utils.printf("%s", res.token);
            },
            function(res) {   /* done: res.fullText, res.error */
                rampart.utils.printf("\n[done]\n");
            }
        );
        /* h.cancel();  -- stop this generation early */

        gen.destroy();

gen.predict()
^^^^^^^^^^^^^

    Generate text synchronously.  The call blocks the current thread
    until generation completes and returns the full generated text.
    On a server, this blocks the worker thread's event loop — use
    `gen.predictAsync()`_ in hot handlers.

    Usage:

    .. code-block:: javascript

        var text = gen.predict(options);

    Where ``options`` is an :green:`Object` with the following
    properties (one of ``prompt`` or ``messages`` is required):

    *  ``prompt`` - A :green:`String`, a plain text prompt.

    *  ``messages`` - An :green:`Array` of
       ``{role: String, content: String}`` :green:`Objects`,
       chat-style messages.  The model's chat template is applied
       (see the ``jinja`` option of `initGen`_\ ).

    *  ``maxTokens`` - A :green:`Number`, the maximum number of
       tokens to generate.  Default: ``512``.

    *  ``temp`` - A :green:`Number`, the sampling temperature.

    *  ``topP`` - A :green:`Number`, top-p (nucleus) sampling.

    *  ``topK`` - A :green:`Number`, top-k sampling.

    *  ``minP`` - A :green:`Number`, min-p sampling.

    *  ``repeatPenalty`` - A :green:`Number`, the repetition
       penalty.

    *  ``repeatLastN`` - A :green:`Number`, how many recent tokens
       the repetition penalty considers.

    *  ``seed`` - A :green:`Number`, the RNG seed.  If not given, a
       random seed is used per request.

    *  ``stop`` - An :green:`Array` of :green:`Strings`; generation
       stops when any of them is produced.

    *  ``addAssistant`` - A :green:`Boolean`, whether to append the
       assistant generation prompt when applying a chat template.
       Default: ``true``.

    Unset sampling options use the model/engine defaults.

    Return Value:
        A :green:`String`, the full generated text.  If the engine
        reports an error, the returned string is
        ``"[gen err:<message>]"``.

gen.predictAsync()
^^^^^^^^^^^^^^^^^^

    Generate text asynchronously, streaming tokens as they are
    produced.  The call returns immediately; callbacks fire from the
    event loop.  Multiple in-flight calls (across threads, or from
    one event loop) batch together through the shared engine.

    Usage:

    .. code-block:: javascript

        var h = gen.predictAsync(options, perToken[, final]);

    Where:

    *  ``options`` is the same :green:`Object` accepted by
       `gen.predict()`_\ .

    *  ``perToken`` is a :green:`Function`, called once per
       generated token with an :green:`Object`:

       *  ``token`` - A :green:`String`, the token text.

       *  ``done`` - A :green:`Boolean`, ``false`` for token
          callbacks.

    *  ``final`` is an optional :green:`Function`, called once when
       the generation ends, with an :green:`Object`:

       *  ``fullText`` - A :green:`String`, the complete generated
          text.

       *  ``error`` - A :green:`String`, set if the generation
          failed.

    Return Value:
        An :green:`Object` with a single function ``cancel()``,
        which stops this generation early and frees its slot in the
        engine.

gen.getLast()
^^^^^^^^^^^^^

    Return the full text of the last completed `gen.predict()`_ call
    made through this handle on the current thread.

    Usage:

    .. code-block:: javascript

        var text = gen.getLast();

gen.destroy()
^^^^^^^^^^^^^

    Shut down the shared generation engine and free the model
    context.  The handle (and any copies of it on other threads)
    must not be used afterwards.

    Usage:

    .. code-block:: javascript

        gen.destroy();

Common Model and Context Options
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    `initEmbed`_\ , `initRerank`_ and `initGen`_ accept a common set
    of model-loading and context options.  Most map 1:1 onto the
    matching ``llama-server`` command-line flag (the camelCase of
    the flag); see the
    `llama.cpp server documentation <https://github.com/ggml-org/llama.cpp/tree/master/tools/server>`_
    for full descriptions of each.

    .. list-table::
       :header-rows: 1
       :widths: 22 24 54

       * - Option
         - llama-server flag
         - Value
       * - ``gpuLayers``
         - ``--gpu-layers``
         - :green:`Number`. Layers to offload to the GPU (``-1`` =
           all).
       * - ``mainGpu``
         - ``--main-gpu``
         - :green:`Number`. GPU device to use.
       * - ``splitMode``
         - ``--split-mode``
         - :green:`String`: ``"none"``, ``"layer"`` or ``"row"``.
       * - ``useMmap``
         - ``--no-mmap``
         - :green:`Boolean`. Memory-map the model file.
       * - ``useMlock``
         - ``--mlock``
         - :green:`Boolean`. Lock the model in RAM.
       * - ``checkTensors``
         - ``--check-tensors``
         - :green:`Boolean`. Validate tensor data while loading.
       * - ``nCtx``
         - ``--ctx-size``
         - :green:`Number`. Context size in tokens (``0`` or ``-1``
           = the model's trained maximum).
       * - ``nBatch``
         - ``--batch-size``
         - :green:`Number`. Logical batch size.
       * - ``nUBatch``
         - ``--ubatch-size``
         - :green:`Number`. Physical (micro-)batch size.
       * - ``nSeqMax``
         - ``--parallel``
         - :green:`Number`. Maximum parallel sequences (`initGen`_:
           how many requests decode together).
       * - ``threads``
         - ``--threads``
         - :green:`Number`. Threads for generation.
       * - ``threadsBatch``
         - ``--threads-batch``
         - :green:`Number`. Threads for batch/prompt processing.
       * - ``flashAttn``
         - ``--flash-attn``
         - :green:`Boolean` or :green:`String`: ``"on"``, ``"off"``
           or ``"auto"``.
       * - ``cacheTypeK``
         - ``--cache-type-k``
         - :green:`String`. KV cache type for K: ``"f32"``,
           ``"f16"``, ``"bf16"``, ``"q8_0"``, ``"q4_0"``,
           ``"q4_1"``, ``"q5_0"``, ``"q5_1"`` or ``"iq4_nl"``.
       * - ``cacheTypeV``
         - ``--cache-type-v``
         - :green:`String`. KV cache type for V (same values).
       * - ``offloadKqv``
         - ``--no-kv-offload``
         - :green:`Boolean`. Offload the KV cache to the GPU.
           ``offloadKQV`` is accepted as an alias.
       * - ``opOffload``
         - ``--op-offload``
         - :green:`Boolean`. Offload host-tensor operations.
       * - ``kvUnified``
         - ``--kv-unified``
         - :green:`Boolean`. Use a unified KV cache.
       * - ``ropeScaling``
         - ``--rope-scaling``
         - :green:`String`: ``"none"``, ``"linear"``, ``"yarn"`` or
           ``"longrope"``.
       * - ``ropeFreqBase``
         - ``--rope-freq-base``
         - :green:`Number`.
       * - ``ropeFreqScale``
         - ``--rope-freq-scale``
         - :green:`Number`.
       * - ``yarnExtFactor``
         - ``--yarn-ext-factor``
         - :green:`Number`.
       * - ``yarnAttnFactor``
         - ``--yarn-attn-factor``
         - :green:`Number`.
       * - ``yarnBetaFast``
         - ``--yarn-beta-fast``
         - :green:`Number`.
       * - ``yarnBetaSlow``
         - ``--yarn-beta-slow``
         - :green:`Number`.
       * - ``yarnOrigCtx``
         - ``--yarn-orig-ctx``
         - :green:`Number`.

getLog
~~~~~~

    llama.cpp produces log output during model loading and
    initialization.  This output is captured in an internal buffer
    rather than printed to stdout/stderr.  ``getLog`` retrieves the
    captured log.

    Usage:

    .. code-block:: javascript

        var llamacpp = require("rampart-llamacpp");

        var emb = llamacpp.initEmbed("all-minilm-l6-v2_f16.gguf");

        var log = llamacpp.getLog();
        console.log(log);

    Return Value:
        A :green:`String`, the captured log output.

    Note:
        The log buffer has a maximum size of 40KB.  If it overflows,
        the oldest half of the log is discarded and the first line
        will read ``WARN: log overflow``.  The log buffer is
        process-global (all threads write to the same,
        mutex-protected buffer), but ``getLog``/``resetLog`` are
        only serviceable from the module object of the thread that
        first loaded the module; on other threads they throw.

resetLog
~~~~~~~~

    Clear the captured log buffer.  See `getLog`_\ .

    Usage:

    .. code-block:: javascript

        llamacpp.resetLog();

Environment Variables
~~~~~~~~~~~~~~~~~~~~~

    *  ``RAMPART_LLAMA_CUDA_GRAPHS`` - On CUDA builds, ggml caches a
       captured CUDA graph per compute-graph shape and only evicts
       entries after they have been idle for 10 seconds.  Batched
       embedding and reranking decode a stream of varying shapes,
       which fills that cache faster than it drains and makes GPU
       memory climb until it runs out.  CUDA graphs only speed up
       single-stream text generation, so `initEmbed`_\ ,
       `initRerank`_ and the rampart-sql embedding path disable them
       automatically.  A process that only calls `initGen`_ never
       disables them, so generation performance is unaffected.  Set
       ``RAMPART_LLAMA_CUDA_GRAPHS`` (to any value) to opt out and
       keep CUDA graphs on even for embedding/reranking, accepting
       the memory growth above.  The setting is process-global and
       read once at startup.  It has no effect on CPU or Metal
       (Apple) builds.

    *  ``RAMPART_METAL_RESIDENCY`` - On macOS, Metal "residency
       sets" are disabled by default to avoid an assertion at
       process exit.  Set ``RAMPART_METAL_RESIDENCY=1`` to keep the
       feature (a marginal performance optimization) enabled.

The rampart-onnx module
-----------------------

Loading the module is a simple matter of using the ``require()``
function:

.. code-block:: javascript

    var onnx = require("rampart-onnx");

The module runs models in the
`ONNX <https://onnx.ai/>`_ format via ONNX Runtime.  It provides
two layers:

*  High-level text embedding (`onnx.initEmbed`_\ ) and reranking
   (`onnx.initRerank`_\ ) with the same handle API as
   rampart-llamacpp's `initEmbed`_ / `initRerank`_ — use it when a
   model is published in ONNX form rather than GGUF (as most
   `sentence-transformers <https://huggingface.co/sentence-transformers>`_
   models are).

*  A general-purpose session API (`onnx.initSession`_\ ) for running
   **any** ONNX model — named tensors in, named tensors out.

For embedding and reranking, the simplest input is a HuggingFace
model *directory* (e.g. a ``git clone`` of
`all-MiniLM-L6-v2 <https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2>`_\ ):
the ``.onnx`` file, the tokenizer, the pooling mode and the token
window are all discovered from the directory contents.  A bare
``.onnx`` file path also works, but then a tokenizer must be
supplied.

CPU and GPU (runtime selection)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    A single ``rampart-onnx.so`` serves both CPU and GPU: the module
    contains a complete CPU-only ONNX Runtime, and GPU installs add
    an optional CUDA runtime directory (``onnx-cu12/`` or
    ``onnx-cu13/``) next to the module.  At first use the module
    picks a runtime:

    1. If the environment variable ``RAMPART_ONNX_RUNTIME`` is set
       (``cpu``, ``cu12``, ``cu13`` or an absolute directory path),
       it wins.

    2. Otherwise, if an NVIDIA driver supporting CUDA 12 or later is
       present **and** reports at least one GPU, the newest CUDA
       runtime directory the driver supports is used, preferring one
       built for the GPU's exact compute capability.

    3. Otherwise (or if the chosen runtime fails to load), the
       built-in CPU runtime is used.

    `onnx.runtimeInfo`_ reports which runtime was picked.  Selecting a
    GPU runtime makes GPU execution *available*, and sessions then use
    it **automatically**: on a build where a GPU runtime was selected,
    `onnx.initSession`_, `onnx.initEmbed`_ and `onnx.initRerank`_ run on
    the GPU by default (the same auto-GPU behavior as the rampart-sql
    embedding path).  Pass ``gpu: false`` (or ``provider: "cpu"``) to
    force CPU.  A session that requests the GPU but cannot create one
    (no device, or a driver problem) falls back to CPU with a one-line
    notice rather than failing.

onnx.initEmbed
~~~~~~~~~~~~~~

    The ``initEmbed`` function loads an ONNX embedding model and
    returns a handle used to convert text into semantic vectors.

    Usage:

    .. code-block:: javascript

        var onnx = require("rampart-onnx");

        var oemb = onnx.initEmbed(modelPath[, options]);

    Where:

    *  ``modelPath`` is a :green:`String`: a HuggingFace-layout
       model **directory** (recommended), or the path of a ``.onnx``
       file.  Given a directory, the module discovers the ``.onnx``
       model file, the tokenizer (a ``*vocab.txt`` selects WordPiece,
       otherwise ``tokenizer.json`` selects a SentencePiece/BPE
       tokenizer), the pooling mode (from ``1_Pooling/config.json``)
       and the model's token window.  Given a bare ``.onnx`` file, the
       module still tries to discover the tokenizer beside the model —
       in the file's own directory and, when the file sits in an
       ``onnx/`` subdirectory (the common HuggingFace layout), in its
       parent — so pointing at a specific ``.onnx`` (e.g. an fp16
       variant) usually works without ``options.tokenizer``; supply it
       explicitly only when discovery cannot find one.

    *  ``options`` is an optional :green:`Object` accepting all of
       the session options of `onnx.initSession`_ (notably ``gpu``),
       plus the following.  Every discovered setting can be
       overridden here.

       *  ``tokenizer`` - A :green:`String` (the path of a
          SentencePiece model, loaded via rampart-sentencepiece) or
          an :green:`Object` with an ``encodeIds(text)`` function
          (e.g. from `onnx.wordPieceTokenizer`_ or
          `onnx.spTokenizer`_\ , or custom JavaScript).

       *  ``pooling`` - A :green:`String`, ``"mean"`` or ``"cls"``.
          Default: the directory's declared pooling, else
          ``"mean"``.

       *  ``normalize`` - A :green:`Boolean`, L2-normalize each
          vector.  Default: ``true``.

       *  ``maxTokens`` - A :green:`Number`, the per-chunk token
          window.  Default: the model's discovered positional
          capacity (capped at 8192), else ``512``.

       *  ``queryPrefix`` / ``passagePrefix`` - :green:`Strings`
          prepended to query / passage text before embedding, for
          models trained with instruction prefixes (e.g. e5's
          ``"query: "`` / ``"passage: "``).  See the ``isQuery``
          argument of `oemb.embedTextToFp16Buf()`_\ .

       *  ``split`` - A :green:`String` or :green:`Function`.
          ``"auto"`` (the default) chunks long text on its structure —
          paragraphs, merged or packed as configured below;
          ``"window"`` uses plain token windows.  A :green:`Function`
          replaces the built-in chunker entirely: it is called with
          the document text and must return an :green:`Array` of
          :green:`Strings` — N strings always produce N vectors.  A
          string that fits the token window gets its exact vector; an
          oversized string gets its combined (average) vector over
          its sub-chunks, and its ``chunks`` entry is marked
          ``oversized``.  The strings
          may freely transform the input (inject a title, drop
          boilerplate, ...), so the returned ``chunks`` carry
          ``{text, tokens}`` without byte spans.  Two notes: a
          splitter shared with other rampart threads (via a copied
          handle) must be self-contained — it cannot reference
          variables outside itself; and the SQL ``chunkembed()`` /
          5-argument ``abstract()`` machinery always uses the
          built-in chunker, so custom splitters are for JS-side
          pipelines.

       *  ``minTokens`` - A :green:`Number`, the paragraph-fragment
          floor: shorter paragraphs are merged with a neighbor.
          ``-1`` disables merging.

       *  ``packParagraphs`` - A :green:`Boolean`.  If ``true``,
          consecutive paragraphs are packed together up to the token
          window (fewer, fuller chunks) instead of one vector per
          paragraph.

       *  ``sentenceSplit`` - A :green:`Boolean`.  If ``true``, an
          oversized paragraph (or structureless text) is split at
          **sentence boundaries** and the sentences greedily packed
          to the token window, instead of being cut at raw token
          windows mid-sentence.  Boundaries come from a multi-script
          terminator table (ASCII ``.!?`` with a whitespace guard;
          self-delimiting CJK ``。！？``, Arabic, Devanagari and
          others with none; fullwidth ``．`` digit-guarded so
          ``３．１４`` never splits), and a chunk never ends on a
          tiny trailing fragment (so a false boundary after "Mr."
          can't take a cut).  Languages without sentence punctuation
          (e.g. Thai) fall back to token windows.  Default ``false``:
          enabling it changes chunk boundaries, which tables built
          WITHOUT value headers depend on for snippet spans.

       *  ``maxChunkBatch`` - A :green:`Number`, the maximum chunks
          per batched model run (bounds memory for many-chunk
          documents).  Default: ``64`` (CPU) or ``32`` (GPU).

       *  ``bosId``, ``eosId``, ``padId``, ``idOffset`` -
          :green:`Numbers`, special-token overrides.  Defaults
          follow the detected tokenizer family (e.g. ``[CLS]``/
          ``[SEP]`` ids 101/102 for WordPiece).

       *  ``lowercase``, ``stripAccents``, ``tokenizeChinese`` -
          :green:`Booleans`, WordPiece tokenizer settings (see
          `onnx.wordPieceTokenizer`_\ ).  Default: ``true``.

    Note:
        The rampart-sql ``embed()``, ``chunkembed()`` and related
        SQL functions can run this same engine inside the SQL
        module: ``sql.set({onnxEmbed: {model: '/path/to/modeldir'}})``
        loads the model through rampart-onnx.  When embedding rows
        of a SQL table, that path avoids round-trips through
        JavaScript — see
        :ref:`Generating embeddings <rampart-sql:Generating embeddings>`,
        :ref:`Chunked documents <rampart-sql:Chunked documents (multi-vector rows)>`
        and the :ref:`onnxEmbed <sql-set:onnxEmbed>` property.

    Return Value:
        An :green:`Object` (the embedding handle) with the functions
        `oemb.embedTextToFp16Buf()`_\ , ``embedTextToFp32Buf()``,
        ``embedTextToNumbers()``, `oemb.embedTextsToNumbers()`_ and
        ``destroy()``, plus ``session`` (the underlying
        `onnx.initSession`_ handle).

    Example:

    .. code-block:: javascript

        var onnx = require("rampart-onnx");

        var oemb = onnx.initEmbed("./all-MiniLM-L6-v2");

        var v = oemb.embedTextToFp16Buf("about a paragraph of text ...");

        /* v = { vecs: [vec1, ...], avgVec: avg, coherence: n,
                 chunks: [ {start,end,tokens,text}, ... ] }      */

        /* store the whole-document vector in a sql table */
        sql.exec("insert into vecs values(?,?,?)",
                 [v.avgVec, docId, text]);

        oemb.destroy();

oemb.embedTextToFp16Buf()
^^^^^^^^^^^^^^^^^^^^^^^^^

    Embed text and return the vector(s) packed as 16-bit floats
    (little-endian) in :green:`Buffers`, directly usable by
    :ref:`rampart.vector <rampart-vector:Rampart Vector Functions>`
    functions, the rampart-sql ``vecdist()`` function and the faiss
    `idx.addFp16()`_ / `idx.searchFp16()`_ functions.

    Usage:

    .. code-block:: javascript

        var ret = oemb.embedTextToFp16Buf(text[, isQuery]);

    Where:

    *  ``text`` is a :green:`String`, the text to be embedded.

    *  ``isQuery`` is an optional :green:`Boolean`.  If ``true``,
       the ``queryPrefix`` (if configured) is applied; if ``false``
       or omitted, the ``passagePrefix`` (if configured) is applied.

    If the tokenized text does not fit the model's token window, it
    is chunked; with the default ``split: "auto"`` the chunking is
    **structure-aware**: text is split on paragraph boundaries
    (falling back to token windows for oversized paragraphs), so
    each vector corresponds to a semantically meaningful span of the
    input, and the spans are reported in ``chunks``.
    rampart-llamacpp's `emb.embedTextToFp16Buf()`_ chunks the same
    way — the two modules share the chunker.

    Return Value:
        An :green:`Object` with the following properties:

        *  ``vecs`` - An :green:`Array` of :green:`Buffers`, one
           vector per chunk (``2 * dimension`` bytes each).

        *  ``avgVec`` - A :green:`Buffer`.  If only one chunk was
           produced, the same vector as ``vecs[0]``; otherwise the
           re-normalized average of the chunk vectors, suitable as a
           single whole-document vector.

        *  ``coherence`` - A :green:`Number` in ``[0, 1]``: the
           average pairwise cosine similarity of the chunk vectors
           (``1.0`` for a single-chunk document).  A low value means
           the document spans several topics and ``avgVec`` is a
           blurrier summary of it.

        *  ``chunks`` - An :green:`Array` of :green:`Objects`, one
           per vector:

           *  ``start``, ``end`` - :green:`Numbers`, the chunk's
              byte span in ``text``.

           *  ``tokens`` - A :green:`Number`, the chunk's token
              count.

           *  ``text`` - A :green:`String`, the chunk text itself.

           *  ``oversized`` - :green:`Boolean` ``true`` when this
              vector is one of several token windows over a single
              span that exceeded the model window (such sub-chunks
              share their span).  Not set otherwise.

        For empty input, the return value is ``{vecs: []}``.

oemb.embedTextToFp32Buf() / oemb.embedTextToNumbers()
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

    The same as `oemb.embedTextToFp16Buf()`_ except that each vector
    is packed as 32-bit floats (``4 * dimension`` bytes), or
    returned as an :green:`Array` of :green:`Numbers`, respectively.

    Usage:

    .. code-block:: javascript

        var ret = oemb.embedTextToFp32Buf(text[, isQuery]);
        var ret = oemb.embedTextToNumbers(text[, isQuery]);

oemb.embedTextsToNumbers()
^^^^^^^^^^^^^^^^^^^^^^^^^^

    Embed several short texts in one batched model run — the fast
    path for many small inputs (e.g. embedding a list of queries or
    titles).  Each text produces exactly **one** vector; text longer
    than the token window is truncated, not chunked.

    Usage:

    .. code-block:: javascript

        var ret = oemb.embedTextsToNumbers(texts[, isQuery]);

    Where ``texts`` is an :green:`Array` of :green:`Strings` and
    ``isQuery`` selects the prefix as in
    `oemb.embedTextToFp16Buf()`_\ .

    Return Value:
        An :green:`Array` (same order as ``texts``) of
        :green:`Objects`, each with a single property ``avgVec``:
        the text's vector as an :green:`Array` of :green:`Numbers`.

oemb.destroy()
^^^^^^^^^^^^^^

    Free the model session.  Using the handle after calling
    ``destroy()`` throws an error.

    Usage:

    .. code-block:: javascript

        oemb.destroy();

onnx.initRerank
~~~~~~~~~~~~~~~

    The ``initRerank`` function loads an ONNX cross-encoder
    reranking model (such as
    `bge-reranker-v2-m3 <https://huggingface.co/BAAI/bge-reranker-v2-m3>`_
    or
    `ms-marco-MiniLM-L6-v2 <https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2>`_\ )
    and returns a handle used to score how well documents answer a
    query.

    Usage:

    .. code-block:: javascript

        var onnx = require("rampart-onnx");

        var orr = onnx.initRerank(modelPath[, options]);

    Where:

    *  ``modelPath`` is a :green:`String`: a HuggingFace-layout
       model directory (recommended; the model, tokenizer, specials,
       token window and pair template are discovered) or a ``.onnx``
       file path.  For a file path the tokenizer is still discovered
       beside the model (the file's directory, and its parent when the
       file is in an ``onnx/`` subdirectory), so naming a specific
       ``.onnx`` variant works without ``options.tokenizer``; pass it
       explicitly only if discovery fails.

    *  ``options`` is an optional :green:`Object` accepting the
       session options of `onnx.initSession`_ and the tokenizer /
       special-token options of `onnx.initEmbed`_\ , plus:

       *  ``pairTemplate`` - A :green:`String`, ``"bert"``
          (``[CLS] query [SEP] document [SEP]`` with token types) or
          ``"roberta"`` (``[bos] query [eos eos] document [eos]``).
          Default: ``"bert"`` when the tokenizer is WordPiece, else
          ``"roberta"``.  Instruct-style rerankers (the Qwen3-Reranker
          family) are not supported here — use the rampart-llamacpp
          `initRerank`_ for those.

       *  ``sigmoid`` - A :green:`Boolean`.  If ``true`` (the
          default), scores are passed through a sigmoid and lie in
          ``(0, 1)``; if ``false``, raw model logits are returned
          (matching rampart-llamacpp's `rr.rerank()`_\ ).

    Return Value:
        An :green:`Object` (the reranker handle) with the functions
        `orr.rerank()`_ and ``destroy()``, plus ``session``.

    Note:
        The handle carries all of its state as object properties with
        native methods, so it survives being shared with other rampart
        threads — including a rampart-server ``preThreadFunc`` global
        propagating to worker threads, like a rampart-llamacpp handle.
        Handles from `onnx.initEmbed`_ and ``initSnacDecoder`` are
        thread-portable the same way.

orr.rerank()
^^^^^^^^^^^^

    Score one or more documents against a query.  All documents are
    scored in one batched model run.

    Usage:

    .. code-block:: javascript

        var score  = orr.rerank(query, document);
        var scored = orr.rerank(query, documents[, scoresOnly]);

    Where ``query`` is a :green:`String` and ``document`` /
    ``documents`` is a :green:`String` or an :green:`Array` of
    :green:`Strings`, as in the llamacpp `rr.rerank()`_\ .

    Return Value:
        *  Given a single :green:`String` document: a
           :green:`Number`, the relevance score.

        *  Given an :green:`Array` of documents: an :green:`Array`
           of :green:`Objects`, each ``{document: String, score:
           Number, index: Number}``, sorted best-first; ``index`` is
           the document's position in the input :green:`Array`.
           (Note this differs from the llamacpp reranker, which
           returns results in input order.)

        *  Given an :green:`Array` and ``scoresOnly`` = ``true``: an
           :green:`Array` of :green:`Numbers` in **input order**
           (llamacpp parity).

    Example:

    .. code-block:: javascript

        var onnx = require("rampart-onnx");

        var orr = onnx.initRerank("./ms-marco-MiniLM-L6-v2");

        var scored = orr.rerank("How tall is the Eiffel Tower?", [
            "The Eiffel Tower is 330 metres tall.",
            "Gustave Eiffel also designed bridges.",
            "Paris is the capital of France."
        ]);
        /* [ { document: "The Eiffel Tower is ...", score: 0.98, index: 0 },
             { document: "Paris is the capital ...", score: 0.03, index: 2 },
             ...  -- sorted best-first                                     ] */

        orr.destroy();

onnx.initSession
~~~~~~~~~~~~~~~~

    The ``initSession`` function loads any ``.onnx`` model and
    returns a low-level session handle: named input tensors go in,
    named output tensors come out.  This is the layer beneath
    `onnx.initEmbed`_ / `onnx.initRerank`_\ , exposed for models
    that are neither embedders nor rerankers (classifiers, taggers,
    audio and vision models, ...).

    Usage:

    .. code-block:: javascript

        var onnx = require("rampart-onnx");

        var sess = onnx.initSession(path[, options]);

    Where:

    *  ``path`` is a :green:`String`, the path of a ``.onnx`` model
       file.

    *  ``options`` is an optional :green:`Object` with the following
       properties:

       *  ``gpu`` - A :green:`Boolean`.  Whether to run the session on
          the GPU via the CUDA execution provider (see `CPU and GPU
          (runtime selection)`_\ ).  **Default: auto** — ``true`` when
          the module selected a GPU runtime (a GPU build with a usable
          device), otherwise ``false``.  Pass ``gpu: false`` to force
          CPU even on a GPU build.  A GPU session that cannot be
          created falls back to CPU with a one-line notice rather than
          throwing.  ``provider: "cuda"`` / ``"cpu"`` is accepted as an
          alternative spelling (``provider: "cpu"`` also forces CPU).

       *  ``device`` - A :green:`Number`, the CUDA device id (with
          ``gpu: true``).  Default: ``0``.

       *  ``intraOpThreads`` - A :green:`Number`, threads used
          *within* an operator.  Default: ``0`` = ONNX Runtime's own
          thread pool (sized to the machine's cores), so a single
          call uses the full CPU.  Set ``1`` for a session with no
          background threads — see the fork note below.

       *  ``interOpThreads`` - A :green:`Number`, threads used to
          run independent operators concurrently (only meaningful
          with ``executionMode: "parallel"``).  Default: ``1``.

       *  ``executionMode`` - A :green:`String`, ``"sequential"``
          (default) or ``"parallel"``.

       *  ``graphOpt`` - A :green:`String`, the graph optimization
          level: ``"disable"``, ``"basic"``, ``"extended"`` or
          ``"all"``.  Default: ONNX Runtime's default (``"all"``).

    Note:
        Fork safety costs no performance.  A session whose thread
        pool is broken by a ``fork()`` is transparently **rebuilt**
        from its model source on first use in the child process; a
        GPU session (whose device context cannot be rebuilt in a
        forked child) **throws** a descriptive error there instead.
        ``intraOpThreads: 1`` (with sequential execution) creates a
        session with **no background threads at all**, which a forked
        child can keep using without any rebuild.  Concurrency is
        also available *across* rampart threads: a session may be
        used from several threads at once (``run`` is thread-safe).

    Return Value:
        An :green:`Object` (the session handle) with the functions
        `sess.run()`_\ , `sess.inputs()`_\ , ``outputs()``,
        `sess.metadata()`_ and ``destroy()``.

    Example:

    .. code-block:: javascript

        var onnx = require("rampart-onnx");

        var sess = onnx.initSession("model.onnx");

        /* what does it want? */
        var ins  = sess.inputs();
        /* [ { name: "input_ids",      type: "int64", shape: [-1,-1] },
             { name: "attention_mask", type: "int64", shape: [-1,-1] } ] */

        var out = sess.run({
            input_ids:      { data: [101, 7592, 102], shape: [1, 3], type: "int64" },
            attention_mask: { data: [1, 1, 1],        shape: [1, 3], type: "int64" }
        });

        /* out.last_hidden_state.array is a Float32Array,
           out.last_hidden_state.shape e.g. [1, 3, 384] */

        sess.destroy();

sess.run()
^^^^^^^^^^

    Run the model once.

    Usage:

    .. code-block:: javascript

        var outputs = sess.run(feeds);

    Where ``feeds`` is an :green:`Object` mapping each input's name
    to a tensor :green:`Object`:

    *  ``data`` - A :green:`Buffer` (raw little-endian element
       bytes) or an :green:`Array` of :green:`Numbers` (converted to
       the given type).

    *  ``shape`` - An :green:`Array` of :green:`Numbers`, the tensor
       dimensions.  If omitted, the tensor is treated as 1-D.

    *  ``type`` - A :green:`String`, the element type: ``"float32"``,
       ``"float16"``, ``"double"``, ``"int64"``, ``"int32"``,
       ``"int16"``, ``"int8"``, ``"uint8"`` or ``"bool"``.

    Return Value:
        An :green:`Object` mapping each output's name to a tensor
        :green:`Object`:

        *  ``data`` - An :green:`ArrayBuffer` of the raw element
           bytes (so e.g. ``new Float32Array(t.data)`` reinterprets
           rather than copies).

        *  ``array`` - A ready-made typed-array view over ``data``
           matching the element type (``Float32Array``,
           ``Int32Array``, ...).  Omitted for ``int64`` outputs,
           which have no native typed array (use ``data``).

        *  ``shape`` - An :green:`Array` of :green:`Numbers`.

        *  ``type`` - A :green:`String`, the element type.

sess.inputs()
^^^^^^^^^^^^^

    Return the model's declared inputs (``sess.outputs()`` likewise
    returns its outputs): an :green:`Array` of :green:`Objects`,
    each ``{name: String, type: String, shape: Array}``.  Dynamic
    dimensions appear as ``-1``.

    Usage:

    .. code-block:: javascript

        var ins  = sess.inputs();
        var outs = sess.outputs();

sess.metadata()
^^^^^^^^^^^^^^^

    Return the model's metadata: an :green:`Object` with
    ``producerName``, ``graphName``, ``domain``, ``description``
    (:green:`Strings`, present when set in the model) and
    ``version`` (a :green:`Number`).

    Usage:

    .. code-block:: javascript

        var meta = sess.metadata();

sess.destroy()
^^^^^^^^^^^^^^

    Free the session.  Using the handle after calling ``destroy()``
    throws an error.  Sessions are also freed automatically when
    garbage collected.

    Usage:

    .. code-block:: javascript

        sess.destroy();

onnx.initSessionFromBuffer
~~~~~~~~~~~~~~~~~~~~~~~~~~

    The same as `onnx.initSession`_ except that the model is read
    from a :green:`Buffer` of model bytes rather than a file.

    Usage:

    .. code-block:: javascript

        var sess = onnx.initSessionFromBuffer(buffer[, options]);

onnx.modelInfo
~~~~~~~~~~~~~~

    Return a model's declared inputs and outputs without creating a
    full session.

    Usage:

    .. code-block:: javascript

        var onnx = require("rampart-onnx");

        var info = onnx.modelInfo(path);

    Where ``path`` is a :green:`String`, the path of a ``.onnx``
    model file.

    Return Value:
        An :green:`Object` with ``inputs`` and ``outputs``, each an
        :green:`Array` of ``{name, type, shape}`` :green:`Objects`
        as returned by `sess.inputs()`_\ .

onnx.wordPieceTokenizer
~~~~~~~~~~~~~~~~~~~~~~~

    Create a WordPiece (BERT-style) tokenizer from a ``vocab.txt``
    file.  `onnx.initEmbed`_ / `onnx.initRerank`_ create one of
    these automatically when the model directory contains a
    ``*vocab.txt``; the function is exposed for custom pipelines.

    Usage:

    .. code-block:: javascript

        var onnx = require("rampart-onnx");

        var tok = onnx.wordPieceTokenizer(vocabPath[, options]);

    Where:

    *  ``vocabPath`` is a :green:`String`, the path of the
       ``vocab.txt`` file.

    *  ``options`` is an optional :green:`Object` with the
       :green:`Boolean` properties ``lowercase``, ``stripAccents``
       and ``tokenizeChinese``, each defaulting to ``true``.

    Return Value:
        An :green:`Object` with the property ``vocabSize`` (a
        :green:`Number`) and the function ``encodeIds(text)``, which
        returns an :green:`Array` of :green:`Numbers` — the
        **content** token ids of ``text``, without special tokens
        (``[CLS]``/``[SEP]`` are added by the embed/rerank layers).

onnx.spTokenizer
~~~~~~~~~~~~~~~~

    Create a SentencePiece/BPE tokenizer from a HuggingFace
    ``tokenizer.json``.  As with `onnx.wordPieceTokenizer`_\ , this
    is created automatically for model directories that have a
    ``tokenizer.json``.

    Usage:

    .. code-block:: javascript

        var onnx = require("rampart-onnx");

        var tok = onnx.spTokenizer(modelDir);

    Where ``modelDir`` is a :green:`String`, the directory
    containing ``tokenizer.json``.

    Return Value:
        An :green:`Object` with the function ``encodeIds(text)``, as
        in `onnx.wordPieceTokenizer`_\ .

onnx.initSnacDecoder
~~~~~~~~~~~~~~~~~~~~

    **Experimental.**  Load a
    `SNAC <https://github.com/hubertsiuzdak/snac>`_ audio-codec
    decoder model and return a handle that turns SNAC codes (as
    produced by speech models such as Orpheus TTS) into 24 kHz audio
    samples.  The handle has the property ``sampleRate`` (``24000``)
    and the functions ``decode(codes)``, ``framesToCodes(frames)``,
    ``decodeFrames(frames)``, ``decodeOrpheus(tokens)`` and
    ``destroy()``; decoded audio is returned as a ``Float32Array``
    of samples.  The API may change.

onnx.onnxVersion
~~~~~~~~~~~~~~~~

    Return the ONNX Runtime version string (e.g. ``"1.27.0"``).

    Usage:

    .. code-block:: javascript

        var v = onnx.onnxVersion();

onnx.runtimeInfo
~~~~~~~~~~~~~~~~

    Return a :green:`String` describing which runtime the selection
    ladder picked (see `CPU and GPU (runtime selection)`_\ ) — e.g.
    ``"built-in CPU"``, or the CUDA runtime directory with the
    driver version and GPU compute capability.

    Usage:

    .. code-block:: javascript

        rampart.utils.printf("%s\n", onnx.runtimeInfo());
        /* "/usr/local/rampart/modules/onnx-cu12 (driver CUDA 12.2, sm 89)" */

onnx.getLog / onnx.clearLog
~~~~~~~~~~~~~~~~~~~~~~~~~~~

    ONNX Runtime warnings and non-fatal errors are captured in an
    internal buffer rather than printed to stderr.  ``getLog()``
    returns the captured log as a :green:`String`; ``clearLog()``
    empties it (``resetLog()`` is an alias, for rampart-llamacpp
    naming parity).

    Usage:

    .. code-block:: javascript

        var log = onnx.getLog();
        onnx.clearLog();

Converting a model to float16 or int8
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    ONNX embedding and reranking models are usually exported in
    float32.  For GPU inference a **float16** copy roughly halves the
    weight size and uses the GPU's tensor cores — usually the fastest
    ONNX option (the module auto-uses the GPU; see `CPU and GPU
    (runtime selection)`_\ ).  An **int8** (dynamically quantized) copy
    is smaller still but is CPU-oriented: ONNX Runtime's CUDA
    execution provider has sparse int8 kernel coverage, so int8 tends
    to fall back to the CPU (with CPU⇄GPU copies) and is usually
    *slower* on the GPU than fp16 — prefer it with ``gpu: false``.

    Conversion is a one-time, offline step using Python's ONNX tooling
    (not a runtime rampart operation): convert once and place the
    resulting ``.onnx`` beside the original, then load it like any
    other model.  Install the tooling into a throwaway virtualenv
    matching your ``python3``:

    .. code-block:: bash

        python3 -m venv /tmp/onnxconv
        /tmp/onnxconv/bin/pip install onnxruntime onnx sympy

    **float16** — use ONNX Runtime's transformer optimizer, which
    inserts/repairs the ``Cast`` nodes that a bare
    ``onnxconverter_common`` pass gets wrong.  ``opt_level=0`` applies
    no graph fusions (only the precision change, so outputs do not
    drift); ``keep_io_types`` leaves the int/float inputs and outputs
    unchanged; and ``use_external_data_format`` handles weights that
    exceed protobuf's 2 GB single-file limit:

    .. code-block:: python

        from onnxruntime.transformers.optimizer import optimize_model
        m = optimize_model("model.onnx", model_type="bert",
                           opt_level=0, use_gpu=False)
        m.convert_float_to_float16(keep_io_types=True)
        m.save_model_to_file("model_fp16.onnx", use_external_data_format=True)

    **int8** — weight-only dynamic quantization (no calibration data
    needed):

    .. code-block:: python

        from onnxruntime.quantization import quantize_dynamic, QuantType
        quantize_dynamic("model.onnx", "model_int8.onnx",
                         weight_type=QuantType.QInt8)

    Then load the result as usual, e.g.
    ``onnx.initRerank("<dir>/onnx/model_fp16.onnx", {tokenizer: ...})``.
    A ``.onnx`` saved with external data keeps its weights in a
    sidecar file (``model_fp16.onnx.data``); keep the two together.

The rampart-faiss module
------------------------

Loading the module is a simple matter of using the ``require()``
function:

.. code-block:: javascript

    var faiss = require("rampart-faiss");

Note that the rampart-sql module's built-in
:ref:`Vector Indexes <rampart-sql:Vector Indexes>` (the IVFPQ
backend of ``CREATE VECTOR INDEX``) are also FAISS indexes,
maintained automatically as table rows change.  Use rampart-faiss
directly when the vectors do not live in a SQL table, or when a
custom index type, metric or training regime is needed.

openFactory
~~~~~~~~~~~

    The ``openFactory`` function creates a new (empty) vector index
    from a FAISS
    `index factory <https://github.com/facebookresearch/faiss/wiki/The-index-factory>`_
    description string.  See also the FAISS
    `guidelines for choosing an index <https://github.com/facebookresearch/faiss/wiki/Guidelines-to-choose-an-index>`_\ .

    Usage:

    .. code-block:: javascript

        var faiss = require("rampart-faiss");

        var idx = faiss.openFactory(description, dimensions[, metricType]);

    Where:

    *  ``description`` is a :green:`String`, the factory description
       (e.g. ``"Flat"``, ``"IDMap2,Flat"``,
       ``"IDMap2,OPQ96,IVF262144,PQ48"``).  It is highly recommended
       to include ``IDMap`` or ``IDMap2`` so that arbitrary ids can
       be stored with each vector; otherwise ids are assigned
       sequentially starting at ``0``.

    *  ``dimensions`` is a positive :green:`Number`, the vector
       dimension (e.g. ``384`` for all-minilm-l6-v2 embeddings —
       see `modelInfo`_ to read it from the embedding model).

    *  ``metricType`` is an optional :green:`String`, the distance
       metric (case-insensitive):

       *  ``"innerProduct"`` or ``"ip"`` - inner (dot) product (the
          default).  Equivalent to cosine similarity when vectors
          are L2-normalized, as the `initEmbed`_ vectors are.

       *  ``"l2"`` - squared euclidean distance.

       *  ``"l1"``, ``"manhattan"`` or ``"cityBlock"`` - L1
          distance.

       *  ``"linf"`` or ``"infinity"`` - L-infinity distance.

       *  ``"lp"`` - Lp distance.

       *  ``"canberra"``, ``"brayCurtis"``, ``"jensenShannon"`` -
          additional metrics supported by FAISS.

    Return Value:
        An :green:`Object` (the index handle) with the property
        `idx.settings`_ and the functions `idx.addFp32()`_\ ,
        `idx.addFp16()`_\ , `idx.searchFp32()`_\ ,
        `idx.searchFp16()`_\ , `idx.save()`_ and (on CUDA builds)
        `idx.enableGpu()`_\ .  If the index type requires training,
        the handle additionally has the `idx.trainer()`_ function;
        ``idx.trainer`` is ``undefined`` for index types that need
        no training (such as ``Flat``).

    Example:

    .. code-block:: javascript

        var faiss = require("rampart-faiss");

        /* a small exact-search index storing our own doc ids */
        var idx = faiss.openFactory("IDMap2,Flat", 4);

        /* add fp32 vectors (Buffer of 4 floats = 16 bytes each) */
        idx.addFp32(101, new Float32Array([1,0,0,0]).buffer);
        idx.addFp32(102, new Float32Array([0,1,0,0]).buffer);

        /* search: top 2 results for a query vector */
        var res = idx.searchFp32(new Float32Array([0.9,0.1,0,0]).buffer, 2);
        /* res = [ { id: 101, distance: 0.9 },
                   { id: 102, distance: 0.1 } ]  */

        idx.save("myindex.faiss");

openIndexFromFile
~~~~~~~~~~~~~~~~~

    The ``openIndexFromFile`` function loads an index previously
    written with `idx.save()`_\ .

    Usage:

    .. code-block:: javascript

        var faiss = require("rampart-faiss");

        var idx = faiss.openIndexFromFile(filename[, readOnly]);

    Where:

    *  ``filename`` is a :green:`String`, the path of the saved
       index.

    *  ``readOnly`` is an optional :green:`Boolean`.  If ``true``,
       the index is opened read-only and memory-mapped, serving
       searches directly from disk rather than loading the entire
       index into RAM.  Default: ``false``.

    Return Value:
        An index handle, as returned by `openFactory`_\ .

    Example:

    .. code-block:: javascript

        var faiss = require("rampart-faiss");
        var llamacpp = require("rampart-llamacpp");

        var idx = faiss.openIndexFromFile("myindex.faiss", true);
        var emb = llamacpp.initEmbed("all-minilm-l6-v2_f16.gguf");

        var v = emb.embedTextToFp16Buf("my search query");
        var res = idx.searchFp16(v.avgVec, 10);

        res.forEach(function(r) {
            rampart.utils.printf("id=%s distance=%f\n", r.id, r.distance);
        });

idx.settings
~~~~~~~~~~~~

    A read-only :green:`Object` describing the open index:

    *  ``dimension`` - A :green:`Number`, the vector dimension.

    *  ``count`` - A :green:`Number`, the number of vectors
       currently in the index (updated by `idx.addFp32()`_ /
       `idx.addFp16()`_\ ).

    *  ``metricType`` - A :green:`String`, the distance metric (see
       `openFactory`_\ ).

    *  ``type`` - A :green:`String`, the detected index type (e.g.
       ``"Flat"``, ``"IVFFlat"``, ``"IVFPQ"``, ``"HNSWFlat"``,
       ``"LSH"``).

    *  ``map`` - A :green:`String`, ``"IDMap"`` or ``"IDMap2"`` if
       the index stores arbitrary ids.  Not set otherwise.

    *  ``PQm``, ``PQbits`` - :green:`Numbers`, product-quantization
       parameters.  Only set for PQ-based index types.

    *  ``onGpu``, ``gpuDevice`` - set after a successful
       `idx.enableGpu()`_ call.

idx.addFp32()
~~~~~~~~~~~~~

    Add one vector of 32-bit floats to the index.

    Usage:

    .. code-block:: javascript

        var id = idx.addFp32(id, buffer);

    Where:

    *  ``id`` is a :green:`Number` or :green:`String` (for ids
       larger than the float precision of a :green:`Number`), the
       64-bit id to associate with the vector.  Pass ``-1`` to have
       an id assigned sequentially (``0``, ``1``, ``2``, ...).
       Arbitrary (non-sequential) ids require an ``IDMap``/
       ``IDMap2`` index — see `openFactory`_\ .

    *  ``buffer`` is a :green:`Buffer` of ``4 * dimension`` bytes:
       the vector packed as little-endian 32-bit floats (e.g. from
       `emb.embedTextToFp32Buf()`_ or a ``Float32Array``'s
       ``buffer``).

    If the index requires training (see `idx.trainer()`_\ ) it must
    be trained before vectors can be added.

    Return Value:
        A :green:`Number`, the id under which the vector was stored
        (the passed ``id``, or the assigned sequential id when
        ``-1`` was passed).

idx.addFp16()
~~~~~~~~~~~~~

    The same as `idx.addFp32()`_ except that ``buffer`` is
    ``2 * dimension`` bytes: the vector packed as little-endian
    16-bit (half-precision) floats, e.g. from
    `emb.embedTextToFp16Buf()`_ or
    :ref:`rampart.vector <rampart-vector:Rampart Vector Functions>`
    conversion functions.  The vector is converted to 32-bit floats
    before insertion (FAISS indexes store fp32).

    Usage:

    .. code-block:: javascript

        var id = idx.addFp16(id, buffer);

idx.searchFp32()
~~~~~~~~~~~~~~~~

    Search the index for the nearest vectors to a query vector of
    32-bit floats.

    Usage:

    .. code-block:: javascript

        var results = idx.searchFp32(buffer[, nResults[, nProbe]]);

    Where:

    *  ``buffer`` is a :green:`Buffer` of ``4 * dimension`` bytes,
       the query vector (see `idx.addFp32()`_\ ).

    *  ``nResults`` is an optional positive :green:`Number`, the
       maximum number of results to return.  Default: ``10``.

    *  ``nProbe`` is an optional positive :green:`Number`.  For IVF
       index types, how many inverted-list cells to probe (more =
       better recall, slower search).  Ignored for non-IVF indexes.

    Return Value:
        An :green:`Array` of :green:`Objects`, best match first:

        *  ``id`` - A :green:`Number`, the id stored with the
           vector.

        *  ``distance`` - A :green:`Number`, the metric value (for
           the default ``innerProduct`` metric, larger is more
           similar; for ``l2``, smaller is more similar).

        Fewer than ``nResults`` entries are returned if the index
        holds fewer vectors.

idx.searchFp16()
~~~~~~~~~~~~~~~~

    The same as `idx.searchFp32()`_ except that ``buffer`` is the
    query vector packed as 16-bit floats (``2 * dimension`` bytes).

    Usage:

    .. code-block:: javascript

        var results = idx.searchFp16(buffer[, nResults[, nProbe]]);

idx.save()
~~~~~~~~~~

    Write the index to a file, which may later be loaded with
    `openIndexFromFile`_\ .  If the index has been moved to the GPU
    with `idx.enableGpu()`_\ , it is converted back to a CPU index
    for saving (the in-memory index stays on the GPU).

    Usage:

    .. code-block:: javascript

        idx.save(filename);

    Where ``filename`` is a :green:`String`, the path of the file
    to write.

idx.enableGpu()
~~~~~~~~~~~~~~~

    Move the index to a GPU.  Only available on CUDA builds of the
    module; on CPU builds the function does not exist (check with
    ``if (idx.enableGpu)``).  Note that not every FAISS index type
    is supported on the GPU.

    Usage:

    .. code-block:: javascript

        if (idx.enableGpu)
            idx.enableGpu(device);

    Where ``device`` is an optional :green:`Number`, the GPU device
    id.  Default: ``0``.

    Return Value:
        ``true`` upon success.  After the call,
        ``idx.settings.onGpu`` is ``true`` and
        ``idx.settings.gpuDevice`` is set.  An error is thrown on
        failure.

idx.trainer()
~~~~~~~~~~~~~

    Index types that partition or compress the vector space (IVF,
    PQ, OPQ, LSH and similar) must be trained on a representative
    sample of vectors before any can be added.  For such indexes the
    handle returned by `openFactory`_ includes a ``trainer``
    function; for index types that need no training (e.g. ``Flat``)
    ``idx.trainer`` is ``undefined``.

    The trainer accumulates training vectors in a file, so that
    millions of training vectors need not be held in memory, and so
    that an interrupted run can be resumed from the same file.

    Usage:

    .. code-block:: javascript

        if (idx.trainer) {
            var trainer = new idx.trainer(path);
            ...
        }

    Where ``path`` is an optional :green:`String`:

    *  A directory: a new training file named
       ``faisstrainingdata.<n>.<pid>`` is created there.  Default:
       ``"/tmp"``.

    *  An existing training file (from a previous run): its vectors
       are reloaded and ``trainer.settings.loadedRows`` is set to
       the number of vectors found.  Newly added vectors are
       appended.

    *  A non-existent path: it is created as a new (empty) training
       file.

    The training file is **not** deleted automatically; it may be
    reused by a later run, or removed with
    :ref:`rampart.utils.rmFile <rampart-utils:rmFile>` when no
    longer wanted.

    Return Value:
        An :green:`Object` (the trainer handle) with the read-only
        property ``trainFile`` (a :green:`String`, the path of the
        training data file) and the functions
        `trainer.addTrainingfp32()`_\ ,
        `trainer.addTrainingfp16()`_ and `trainer.train()`_\ .

    Example:

    .. code-block:: javascript

        var faiss = require("rampart-faiss");

        /* an IVF index over 384-dim vectors: requires training */
        var idx = faiss.openFactory("IDMap2,IVF4096,Flat", 384);

        if (idx.trainer) {
            var trainer = new idx.trainer("./tdata");

            /* feed a representative sample of vectors */
            sql.exec("select Vec from vecs", {maxRows: 1000000},
                function(row) {
                    trainer.addTrainingfp16(row.Vec);
                });

            trainer.train();   /* may take a while */
        }

        /* now vectors may be added */
        sql.exec("select Id, Vec from vecs", {maxRows: -1},
            function(row) {
                idx.addFp16(row.Id, row.Vec);
            });

        idx.save("vecs-ivf4096.faiss");

trainer.addTrainingfp32()
~~~~~~~~~~~~~~~~~~~~~~~~~

    Append one 32-bit float vector to the training file.

    Usage:

    .. code-block:: javascript

        trainer.addTrainingfp32(buffer);

    Where ``buffer`` is a :green:`Buffer` of ``4 * dimension``
    bytes (see `idx.addFp32()`_\ ).

trainer.addTrainingfp16()
~~~~~~~~~~~~~~~~~~~~~~~~~

    Append one 16-bit float vector to the training file.  The
    vector is converted to 32-bit floats before being written.

    Usage:

    .. code-block:: javascript

        trainer.addTrainingfp16(buffer);

    Where ``buffer`` is a :green:`Buffer` of ``2 * dimension``
    bytes (see `idx.addFp16()`_\ ).

trainer.train()
~~~~~~~~~~~~~~~

    Train the index from all the vectors accumulated in the
    training file (including vectors reloaded from a previous run).
    Depending on the index type and the number of training vectors,
    training can take from seconds to many hours.

    Usage:

    .. code-block:: javascript

        trainer.train();

    An error is thrown if no vectors have been added, or if the
    training file's size is not a multiple of the vector size.

The rampart-sentencepiece module
--------------------------------

Loading the module is a simple matter of using the ``require()``
function:

.. code-block:: javascript

    var sp = require("rampart-sentencepiece");

init
~~~~

    The ``init`` function loads a SentencePiece model file and
    returns a handle for encoding text into subword pieces.

    Usage:

    .. code-block:: javascript

        var sp = require("rampart-sentencepiece");

        var encoder = sp.init(path);

    Where ``path`` is a :green:`String`, the path to a SentencePiece
    model (e.g.
    `sentencepiece.bpe.model <https://huggingface.co/BAAI/bge-m3/blob/main/sentencepiece.bpe.model>`_
    from the bge-m3 repository).

    Return Value:
        An :green:`Object` (the encoder handle) with the function
        `encoder.encode()`_\ .

    Example:

    .. code-block:: javascript

        var sp = require("rampart-sentencepiece");

        var encoder = sp.init("./sentencepiece.bpe.model");

        var pieces = encoder.encode("hello there you goat");
        /* [ "▁hell", "o", "▁there", "▁you", "▁go", "at" ] */

        var text = sp.decode(pieces);
        /* "hello there you goat" */

encoder.encode()
~~~~~~~~~~~~~~~~

    Encode text into subword pieces using the loaded model.  In the
    pieces, the character ``▁`` (U+2581, "lower one eighth block")
    marks the start of a word.

    Usage:

    .. code-block:: javascript

        var pieces = encoder.encode(text[, asString]);

    Where:

    *  ``text`` is a :green:`String`, the text to encode.

    *  ``asString`` is an optional :green:`Boolean`.  If ``true``,
       the pieces are returned as a single space-separated
       :green:`String` instead of an :green:`Array`.  Default:
       ``false``.

    Return Value:
        An :green:`Array` of :green:`Strings` (one per piece), or a
        single space-separated :green:`String` if ``asString`` is
        ``true``.  Either form is accepted by `decode`_\ .

decode
~~~~~~

    Reassemble encoded pieces into text.  Decoding is purely
    textual (pieces are concatenated and the ``▁`` word-start
    markers become spaces), so no model handle is needed and the
    function lives on the module object itself.

    Usage:

    .. code-block:: javascript

        var sp = require("rampart-sentencepiece");

        var text = sp.decode(pieces);

    Where ``pieces`` is an :green:`Array` of :green:`Strings`, or a
    space-separated :green:`String` of pieces, as produced by
    `encoder.encode()`_\ .

    Return Value:
        A :green:`String`, the decoded text.

The rampart-models module
-------------------------

Loading the module is a simple matter of using the ``require()``
function:

.. code-block:: javascript

    var models = require("rampart-models");

The module downloads and locates GGUF and ONNX models by short name,
returning a local path that feeds `initEmbed`_\ , `initRerank`_\ ,
`initGen`_\ , `onnx.initEmbed`_ / `onnx.initRerank`_ and the
rampart-sql :ref:`llamaEmbed <sql-set:llamaEmbed>` /
:ref:`onnxEmbed <sql-set:onnxEmbed>` properties directly:

.. code-block:: javascript

    var models   = require("rampart-models");
    var onnx     = require("rampart-onnx");
    var llamacpp = require("rampart-llamacpp");

    var oemb = onnx.initEmbed( models.get("bge-m3") );          // onnx .onnx file
    var emb  = llamacpp.initEmbed( models.get("bge-m3:q8_0") ); // gguf FILE
    var gen  = llamacpp.initGen( models.get("qwen3-4b") );      // gen = gguf

Models live under ``~/.rampart/models/<category>/`` (categories:
``embed``, ``rerank``, ``gen``; plain URLs go to ``other``).  If the
model is already on disk its path is returned immediately with no
network access; otherwise it is downloaded from
`HuggingFace <https://huggingface.co/>`_ with resume, retries and a
single-line progress display.

A short name is resolved in this order:

1. Already on disk under ``~/.rampart/models/``.
2. The embedded catalog — ~75 curated models (embedding, reranking
   and text-generation), each pinned to a specific repository
   revision.  Embedding entries also record the model's vector
   dimension and its retrieval prompts, when it has them (see
   `Retrieval prompt sidecars`_ below).  ``models.list()`` (or
   ``--list`` on the command line) shows them.
3. A name containing ``/`` is used as an exact HuggingFace
   ``org/repo`` — no search.
4. A live HuggingFace search (exact-name match first, model-family
   organizations before converter organizations, then quant
   coverage).  Live resolutions are remembered in
   ``~/.rampart/models/.resolved.json`` so the same name resolves the
   same way next time.

models.get()
~~~~~~~~~~~~

    Resolve (and, if needed, download) a model; return its local path.

    Usage:

    .. code-block:: javascript

        var path = models.get(name[, options]);

    Where:

    *  ``name`` is a :green:`String`: a catalog short name
       (``"bge-m3"``), a short name with a quant suffix
       (``"bge-m3:q8_0"`` — implies GGUF), an exact HuggingFace
       ``"org/repo"``, or a full ``https://`` URL (downloaded as-is).

    *  ``options`` is an optional :green:`Object`:

       *  ``format`` - A :green:`String`, ``"onnx"`` or ``"gguf"``.
          Default: ``"onnx"`` when the model has an ONNX form and is
          an embedding/reranking model, else ``"gguf"``
          (text-generation models are GGUF-only).

       *  ``quant`` - A :green:`String`, the GGUF quantization (e.g.
          ``"Q4_K_M"``, ``"Q8_0"``, ``"F16"``); same meaning as the
          ``:quant`` name suffix.  When the exact quant isn't
          available, the closest available one is chosen.

       *  ``precision`` - A :green:`String`, the ONNX weight precision:
          ``"fp16"`` (the default — half precision, the GPU sweet
          spot), ``"fp32"`` (full precision, the reference), ``"int8"``
          or ``"q4"`` (quantized — smaller and often faster on CPU).
          Since model authors rarely publish every precision in the
          original repository, the closest converter mirror
          (``onnx-community/*``, ``Xenova/*``) is searched as well; if
          the requested precision isn't found anywhere it falls back to
          ``fp16`` then ``fp32``, printing a notice to stderr.  Ignored
          for GGUF (use ``quant`` there).

       *  ``category`` - A :green:`String`, the subdirectory under
          ``~/.rampart/models/`` (default: from the catalog, else
          ``"embed"``; URLs default to ``"other"``).

       *  ``dest`` - A :green:`String`, an exact destination file or
          directory, overriding the category layout.

       *  ``progress`` - ``false`` (silent), a
          :ref:`file handle <rampart-utils:fopen>` to write progress
          to, or a :green:`Function` called with progress info.
          Default: single-line progress on stdout.

       *  ``force`` - A :green:`Boolean`, re-download even if the
          model is already present.  Default: ``false``.

       *  ``token`` - A :green:`String`, a HuggingFace access token
          for gated repositories.  Default: the ``HF_TOKEN``
          environment variable.

       *  ``confirm`` - A :green:`Function`, called **only when a
          download is actually needed** (the model isn't already on
          disk), so the caller can prompt before a large fetch.  It
          receives an info :green:`Object`
          (``{name, format, dest, size, bytes, precision|quant,
          repo}``) and returns a :green:`Boolean`; a falsy return skips
          the download and `models.get()`_ returns ``null``.  Omit it
          for the default silent fetch.  The module never reads stdin
          itself — any prompt lives in this callback.

       *  ``revision`` - A :green:`String`, the git revision to fetch.
          Default: the catalog-pinned revision, else ``"main"``.

    Return Value:
        A :green:`String`: the local path — the ``.onnx`` *file* for
        ONNX models, a ``.gguf`` *file* for GGUF.  Throws on resolution
        or download failure.  Returns ``null`` when a ``confirm``
        callback declines a needed download.

    ``models.pull()`` is an alias of ``models.get()``.

    Note:
        For an ONNX model the whole usable directory is fetched — the
        ``.onnx`` file (plus its ``.onnx_data`` weights sidecar when
        present) alongside the tokenizer and configuration files
        (``tokenizer.json`` / ``vocab.txt``, ``config.json``,
        ``1_Pooling/`` etc.) — but the returned path is the ``.onnx``
        file itself.  `onnx.initEmbed`_ / `onnx.initRerank`_ accept
        that file directly and auto-discover the tokenizer and
        configuration from its directory, so it feeds them (and the
        :ref:`onnxEmbed <sql-set:onnxEmbed>` property) as-is.

models.ggufGet() / models.onnxGet()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Format-explicit variants of `models.get()`_ — the call site then
    reads as the engine it feeds:

    .. code-block:: javascript

        var emb  = llamacpp.initEmbed( models.ggufGet("bge-m3") );
        var oemb = onnx.initEmbed(     models.onnxGet("bge-m3") );

models.url()
~~~~~~~~~~~~

    Download a plain URL into the models directory (or ``dest``) with
    the same resume/retry/progress machinery; returns the file path.

    Usage:

    .. code-block:: javascript

        var path = models.url(theUrl[, options]);

models.resolve()
~~~~~~~~~~~~~~~~

    Resolve a name to its catalog-shaped entry — repository, pinned
    revision, available quants, license, category, and (for embedding
    models) vector dimension and retrieval prompts — **without
    downloading**.

    Usage:

    .. code-block:: javascript

        var entry = models.resolve(name[, options]);

models.list()
~~~~~~~~~~~~~

    Return the embedded catalog's short names grouped by category
    (an :green:`Object` of :green:`Arrays`), each annotated with its
    available formats:

    .. code-block:: javascript

        var l = models.list();
        /* { embed:  [ "all-minilm-l6-v2 [onnx+gguf]", "bge-m3 [onnx+gguf]", ... ],
             rerank: [ "ms-marco-minilm-l6-v2 [onnx+gguf]", ... ],
             gen:    [ "qwen3-4b [gguf]", ... ] }                                  */

    The module also exposes ``models.catalog`` (the raw catalog
    :green:`Object`) and ``models.modelsDir`` (the
    ``~/.rampart/models`` path).

Retrieval prompt sidecars
~~~~~~~~~~~~~~~~~~~~~~~~~

    Many embedding models are *asymmetric*: they expect a short prefix
    on queries, on documents, or on both (e.g.
    ``nomic-embed-text-v1.5``'s ``"search_query: "`` /
    ``"search_document: "``, or the e5 family's ``"query: "`` /
    ``"passage: "``).  Using such a model without its prompts costs
    retrieval quality.

    The catalog records each model's published prompts, and every
    download writes them into a small sidecar file next to the model:
    ``<file>.gguf.prompts.json`` beside a GGUF file, and
    ``<name>.prompts.json`` beside an ONNX model directory.  Fetching
    the path of an already-downloaded model refreshes the sidecar, so
    models downloaded before this feature gain one on their next
    ``models.get()``.

    The rampart-sql :ref:`llamaEmbed <sql-set:llamaEmbed>` and
    :ref:`onnxEmbed <sql-set:onnxEmbed>` settings read the sidecar
    automatically — ``likev`` queries, ``chunkembed()`` and
    ``embed(?, 'query'|'document')`` then apply the right prompt with
    no further configuration.  See :ref:`Retrieval prompts
    <sql-set:Retrieval prompts>` for how the prompts are applied and
    how to override or disable them.  Symmetric models (e.g.
    ``all-minilm-l6-v2``) have no prompts and embed text verbatim.

    The module-level engines embed exactly the text they are given:
    when calling `initEmbed`_ / `onnx.initEmbed`_ directly, prepending
    a model's prompts is the caller's responsibility.

Command line
~~~~~~~~~~~~

    The module doubles as a downloader script:

    .. code-block:: shell

        rampart rampart-models.js bge-m3                # onnx .onnx file (fp16)
        rampart rampart-models.js bge-m3 onnx fp32      # onnx, full precision
        rampart rampart-models.js bge-m3 onnx q4        # onnx, 4-bit quantized
        rampart rampart-models.js bge-m3 gguf Q8_0      # gguf file, chosen quant
        rampart rampart-models.js qwen3-4b:q4_k_m       # quant suffix
        rampart rampart-models.js --list                # show the catalog

    The third argument is the ONNX ``precision``
    (``fp16`` | ``fp32`` | ``int8`` | ``q4``, default ``fp16``) when the
    format is ``onnx``, or the GGUF ``quant`` otherwise.  The resolved
    local path is printed on success.  ``--list`` groups the catalog by
    category, colorizes on a color terminal (plain when piped), and marks
    already-downloaded models — e.g. ``[installed (onnx fp32, gguf
    Q4_K_M)]`` — showing the on-disk precision/quant of each.

    Environment: ``HF_TOKEN`` supplies the HuggingFace token for gated
    repositories; ``HF_ENDPOINT`` overrides the HuggingFace host (for
    mirrors).  Only HuggingFace's stable URL patterns are used
    (``api/models``, ``resolve/{revision}/``), never CDN URLs.

Putting It Together
-------------------

A compact end-to-end example: fetch a model, embed documents, index
them, and serve semantic search queries.  Runs as-is on a fresh
install — `models.get()`_ downloads the model on first use and
returns its local path immediately thereafter.

.. code-block:: javascript

    rampart.globalize(rampart.utils);

    var models   = require("rampart-models");
    var llamacpp = require("rampart-llamacpp");
    var faiss    = require("rampart-faiss");

    var mdl = models.ggufGet("all-minilm-l6-v2");

    var emb = llamacpp.initEmbed(mdl);
    var dim = llamacpp.modelInfo(mdl).embedDim;

    var docs = [
        "The Eiffel Tower is 330 metres tall.",
        "Gustave Eiffel also designed bridges.",
        "Semantic search finds meaning, not just words."
    ];

    /* build the index */
    var idx = faiss.openFactory("IDMap2,Flat", dim);
    docs.forEach(function(text, i) {
        var v = emb.embedTextToFp16Buf(text);
        idx.addFp16(i, v.avgVec);
    });

    /* search it */
    var q   = emb.embedTextToFp16Buf("How high is the Eiffel Tower?");
    var res = idx.searchFp16(q.avgVec, 2);

    res.forEach(function(r) {
        printf("%f  %s\n", r.distance, docs[r.id]);
    });

For a larger, trained index (tens of millions of vectors) see the
`idx.trainer()`_ example above; for improving the final ordering of
the top results, see `initRerank`_\ .
