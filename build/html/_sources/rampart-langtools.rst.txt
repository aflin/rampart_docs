The rampart-langtools modules
=============================

Preface
-------

Acknowledgment
~~~~~~~~~~~~~~

The rampart-langtools package provides three modules built on
best-in-class machine-learning libraries:

*  The rampart-llamacpp module is built on
   `llama.cpp <https://github.com/ggml-org/llama.cpp>`_, the C/C++
   LLM inference engine created by Georgi Gerganov and contributors.

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
`MIT License <https://github.com/ggml-org/llama.cpp/blob/master/LICENSE>`_\ .
The FAISS library is licensed under the
`MIT License <https://github.com/facebookresearch/faiss/blob/main/LICENSE>`_\ .
The SentencePiece library is licensed under the
`Apache 2.0 License <https://github.com/google/sentencepiece/blob/master/LICENSE>`_\ .

The rampart-langtools modules are released under the MIT license.

What do they do?
~~~~~~~~~~~~~~~~

Together the three modules provide the building blocks for semantic
search and local LLM inference inside Rampart:

*  **rampart-llamacpp** runs GGUF models directly inside the rampart
   process: text embedding (`initEmbed`_\ ), reranking
   (`initRerank`_\ ) and text generation (`initGen`_\ ).

*  **rampart-faiss** builds, trains, saves and searches vector
   indexes, from small exact-search indexes to compressed indexes
   holding hundreds of millions of vectors.

*  **rampart-sentencepiece** tokenizes text into subword pieces
   (and back) using a SentencePiece model.

A typical pipeline embeds documents with rampart-llamacpp, stores
the vectors in a rampart-faiss index (and/or a rampart-sql table),
searches that index with an embedded query vector, and optionally
reranks the results with a reranking model.

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

        /* v = { vecs: [vec1, vec2, ...], avgVec: avgOfVecs }
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
    functions, the :ref:`rampart-sql <rampart-sql:The rampart-sql module>`
    ``vecdist()`` function and the faiss `idx.addFp16()`_ /
    `idx.searchFp16()`_ functions.

    Usage:

    .. code-block:: javascript

        var ret = emb.embedTextToFp16Buf(text);

    Where ``text`` is a :green:`String` (or a :green:`Buffer`
    containing text) to be embedded.

    If the tokenized text does not fit the model's context window,
    it is split into overlapping chunks (one eighth of a window of
    overlap) and one vector is produced per chunk.  Each vector is
    L2-normalized.

    Return Value:
        An :green:`Object` with the following properties:

        *  ``vecs`` - An :green:`Array` of :green:`Buffers`, one
           vector per chunk (``2 * embedDim`` bytes each).

        *  ``avgVec`` - A :green:`Buffer`.  If only one chunk was
           produced, the same vector as ``vecs[0]``.  Otherwise the
           re-normalized average of all the chunk vectors, suitable
           as a single whole-document vector.

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

Putting It Together
-------------------

A compact end-to-end example: embed documents, index them, and
serve semantic search queries.

.. code-block:: javascript

    rampart.globalize(rampart.utils);

    var llamacpp = require("rampart-llamacpp");
    var faiss    = require("rampart-faiss");

    var emb = llamacpp.initEmbed("all-minilm-l6-v2_f16.gguf");
    var dim = llamacpp.modelInfo("all-minilm-l6-v2_f16.gguf").embedDim;

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
