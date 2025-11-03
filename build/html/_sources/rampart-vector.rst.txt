Rampart Vector Functions
========================

Preface
-------

License
~~~~~~~

The rampart.vector functions are built into the rampart executable
and as such are covered under the same MIT license.

Acknowledgement
~~~~~~~~~~~~~~~

The ``rampart.vector.distance()`` function uses
`SimSIMD <https://github.com/ashvardanian/SimSIMD>`_ 
(`Apache license <https://github.com/ashvardanian/SimSIMD/blob/main/LICENSE>`_\ )
to dispatch to the fastest available distance calculation function.  The authors 
of Rampart express their appreciation for this capable library.

What does it do?
~~~~~~~~~~~~~~~~

The rampart.vector functions provides utility functions to pack, convert and
compare vectors from within JavaScript.

Vectors in General
------------------

Why use Vectors?
~~~~~~~~~~~~~~~~

Vectors have become fundamental to modern information retrieval and artificial intelligence applications, 
particularly in the realm of semantic search and similarity matching. Unlike traditional keyword-based 
search methods that rely on exact text matches, vector representations capture the semantic meaning 
of content by encoding it into high-dimensional numerical arrays. This approach enables systems to 
understand context, identify conceptually similar items, and provide more intelligent search results 
even when exact terms don't match.

The power of vector similarity lies in its ability to measure relationships between different pieces 
of information in a meaningful way. When text, images, audio, or other data types are converted into 
vectors using machine learning models (embeddings), items with similar meanings or characteristics 
naturally cluster together in vector space. This makes it possible to find documents that discuss 
the same topic using different terminology, recommend products based on conceptual similarity rather 
than just tags, or even perform cross-modal searches like finding images that match a text description.

Vector operations are particularly valuable in applications such as recommendation systems, content 
classification, duplicate detection, and retrieval-augmented generation (RAG) systems. By efficiently 
computing distances between vectors, applications can quickly identify the most relevant information 
from large datasets, enabling responsive user experiences even when searching through millions of items. 
The rampart.vector functions provide the essential tools needed to work with these vector representations, 
offering both high-performance computations and flexible format conversions to suit various storage and 
processing requirements.


Vector Datatypes in Rampart
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Rampart supports a variety of vector formats and functions
to convert between them:

* ``Numbers``: a :green:`Array` of :green:`Numbers` - Useful for
  manipulating values in JavaScript. This is the standard JavaScript array 
  format where each element is a full-precision 64-bit floating point number. 
  While this format offers maximum flexibility for mathematical operations and 
  is easiest to work with in JavaScript code, it consumes the most memory and 
  may not be optimal for storage or large-scale vector operations.

* ``f64``: a :green:`Buffer` - Holds a ``double *`` c array.  Equivalent
  to ``Numbers`` in precision, but suitable for efficient storage in a database.
  Each element is stored as a 64-bit (8-byte) double-precision floating point value, 
  providing the highest accuracy for vector operations. This format is ideal when 
  precision is critical and storage space is not a primary concern. It maintains 
  full numerical precision during conversions and calculations.
  
* ``f32``: a :green:`Buffer` - Holds a ``float *`` c array. Each element is 
  stored as a 32-bit (4-byte) single-precision floating point value. This format 
  reduces storage requirements by 50% compared to ``f64`` while maintaining 
  sufficient precision for most machine learning and similarity search applications. 
  It is widely used in neural networks and embedding models, offering an excellent 
  balance between memory efficiency and numerical accuracy.

* ``f16``: a :green:`Buffer` - Holds a ``uint16_t *`` c array. Each element is 
  stored as a 16-bit (2-byte) half-precision floating point value following the 
  IEEE 754 standard. This format reduces storage by 75% compared to ``f64``, 
  making it suitable for applications where memory is limited or when working 
  with very large vector databases. While precision is reduced, ``f16`` is often 
  sufficient for similarity calculations and is increasingly supported by modern 
  hardware accelerators.

* ``bf16``: a :green:`Buffer` - Holds a ``uint16_t *`` c array. Each element is 
  stored as a 16-bit (2-byte) Brain Floating Point value. Unlike ``f16``, ``bf16`` 
  maintains the same exponent range as ``f32`` but with reduced mantissa precision. 
  This format was developed by Google Brain and is particularly well-suited for 
  machine learning applications, as it preserves the dynamic range of ``f32`` while 
  using half the storage. It's especially effective for gradient calculations and 
  model training workflows.

* ``u8``: a :green:`Buffer` - Holds a ``uint8_t *`` c array. Each element is 
  stored as an 8-bit (1-byte) unsigned integer with values ranging from 0 to 255. 
  This format achieves an 87.5% reduction in storage compared to ``f64``, making it 
  ideal for very large-scale vector databases where storage and memory bandwidth are 
  critical constraints. Vectors must be quantized (scaled and rounded) to fit in this 
  range, but for many similarity search applications, the trade-off between precision 
  and efficiency is worthwhile.

* ``i8``: a :green:`Buffer` - Holds a ``int8_t *`` c array. Each element is 
  stored as an 8-bit (1-byte) signed integer with values ranging from -128 to 127. 
  Like ``u8``, this format provides maximum storage efficiency but with support 
  for negative values. It's commonly used for quantized neural network weights 
  and embeddings where the distribution is centered around zero, allowing for 
  efficient computation while maintaining acceptable accuracy for similarity 
  comparisons.


Vector Distance Primer
~~~~~~~~~~~~~~~~~~~~~~

Understanding vector distances is essential for working with vector embeddings and 
similarity search. Different distance metrics serve different purposes and can 
significantly impact the results of your application. The following sections describe 
the most common distance measures used in vector operations.

Dot Product / Inner Product
^^^^^^^^^^^^^^^^^^^^^^^^^^^

The dot product (also called inner product) is one of the most fundamental vector 
operations. It multiplies corresponding elements of two vectors and sums the results, 
producing a scalar value. Mathematically, for vectors **a** and **b**, the dot product 
is: **a** · **b** = a₁b₁ + a₂b₂ + ... + aₙbₙ.

The dot product measures both the magnitude and directional alignment of vectors. 
Higher positive values indicate vectors that point in similar directions and have 
large magnitudes, while negative values indicate opposing directions. Unlike distance 
metrics, the dot product is a similarity measure rather than a distance, meaning larger 
values indicate greater similarity. It's computationally efficient and commonly used in 
machine learning applications, particularly with normalized vectors.

In practical applications, the dot product is often used with normalized embeddings 
where it becomes equivalent to cosine similarity. It's particularly effective for 
recommendation systems and information retrieval where you want to measure the 
alignment between query and document vectors. Many neural networks also use dot 
product attention mechanisms to determine the relevance between different parts 
of their input.

Cosine Similarity
^^^^^^^^^^^^^^^^^

Cosine similarity measures the cosine of the angle between two vectors, focusing 
purely on their direction rather than magnitude. It ranges from -1 (opposite directions) 
to 1 (same direction), with 0 indicating orthogonality (perpendicularity). The formula 
is: cos(θ) = (**a** · **b**) / (||**a**|| × ||**b**||), where ||**a**|| represents 
the magnitude (length) of vector **a**.

This metric is particularly valuable when vector magnitude doesn't carry meaningful 
information, and you only care about orientation. In text analysis and natural language 
processing, for example, document vectors might have different lengths simply due to 
document size, but their semantic content is better captured by direction. Cosine 
similarity effectively normalizes for these magnitude differences, making it ideal 
for comparing embeddings generated by language models.

An important optimization technique used with cosine similarity is L2 normalization 
(also called unit normalization). L2 normalization scales a vector so its magnitude 
becomes exactly 1 by dividing each component by the vector's length: **a**' = **a** / ||**a**||. 
When both vectors are L2 normalized, computing cosine similarity simplifies to just 
the dot product, since the denominator (||**a**|| × ||**b**||) equals 1. This makes 
the calculation significantly faster while producing identical results. Many embedding 
models output pre-normalized vectors specifically to enable this optimization.

Cosine similarity is widely used in semantic search, document clustering, and 
recommendation systems. It's especially effective with word embeddings and sentence 
embeddings where the magnitude of the vector may vary but the direction encodes the 
semantic meaning. Many vector databases default to cosine similarity because of its 
robustness to scale variations and its intuitive interpretation as directional alignment.

Euclidean Distance
^^^^^^^^^^^^^^^^^^

Euclidean distance, also known as L2 distance, measures the straight-line distance 
between two points in vector space. It's the most intuitive distance metric, 
corresponding to how we naturally think about distance in the physical world. The 
formula is: d(**a**, **b**) = √[(a₁-b₁)² + (a₂-b₂)² + ... + (aₙ-bₙ)²].

Unlike cosine similarity, Euclidean distance considers both the direction and magnitude 
of vectors. This makes it sensitive to the scale of features, which can be both an 
advantage and a disadvantage depending on your application. When vector magnitudes 
carry important information (such as in image feature vectors or certain types of 
numerical data), Euclidean distance preserves that information in the similarity 
calculation.

Euclidean distance is commonly used in k-nearest neighbors algorithms, clustering 
applications like k-means, and anomaly detection. In the context of embeddings, it's 
particularly useful when the model has been trained to produce vectors where both 
magnitude and direction are meaningful. For many pre-trained embedding models, however, 
cosine similarity or normalized dot product may be more appropriate as the models often 
normalize their outputs or are trained with that metric in mind.

L2 Normalization
^^^^^^^^^^^^^^^^

L2 normalization (also called unit normalization or vector normalization) is the process 
of scaling a vector so that its length (magnitude) becomes exactly 1, while preserving 
its direction. The operation divides each component of the vector by the vector's L2 norm 
(Euclidean length): **a**' = **a** / ||**a**||, where ||**a**|| = √(a₁² + a₂² + ... + aₙ²). 
The resulting unit vector points in the same direction as the original but has a magnitude 
of 1, making it lie on the surface of a unit hypersphere in n-dimensional space.

L2 normalization is crucial for many machine learning and vector similarity applications 
because it removes magnitude as a factor in comparisons, focusing purely on directional 
relationships. When vectors are normalized, differences in scale—whether due to varying 
document lengths, feature magnitudes, or model outputs—no longer affect similarity 
measurements. This property makes normalized vectors particularly valuable for comparing 
embeddings where only the semantic direction matters, not the absolute values.

The technique offers significant computational benefits when used with cosine similarity. 
Since cosine similarity divides the dot product by the product of both vectors' magnitudes, 
normalizing both vectors beforehand (making their magnitudes equal to 1) reduces the 
calculation to a simple dot product. This optimization can speed up similarity searches 
by 50% or more, which is why many embedding models and vector databases work exclusively 
with normalized vectors. Additionally, normalized vectors enable the use of efficient 
maximum inner product search (MIPS) algorithms that can quickly find the most similar 
vectors in large datasets.


Vector Conversion Functions
---------------------------

rampart.vector.numbersToF64
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Convert an :green:`Array` of :green:`Numbers` to a :green:`Buffer` holding a
``double *`` array.

Usage:

.. code-block:: javascript

   rampart.vector.NumbersToF64(myarr);

Where ``myarray`` is an :green:`Array` of :green:`Numbers`.

Return Value:
   A :green:`Buffer` holding a ``double *`` array.

rampart.vector.numbersToF32
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Convert an :green:`Array` of :green:`Numbers` to a :green:`Buffer` holding a
``float *`` array.

Usage:

.. code-block:: javascript

   rampart.vector.numbersToF32(myarr);

Where ``myarr`` is an :green:`Array` of :green:`Numbers`.

Return Value:
   A :green:`Buffer` holding a ``float *`` array.

rampart.vector.numbersToF16
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Convert an :green:`Array` of :green:`Numbers` to a :green:`Buffer` holding a
``uint16_t *`` array (IEEE 754 half-precision floating point).

Usage:

.. code-block:: javascript

   rampart.vector.numbersToF16(myarr);

Where ``myarr`` is an :green:`Array` of :green:`Numbers`.

Return Value:
   A :green:`Buffer` holding a ``uint16_t *`` array.

rampart.vector.numbersToBf16
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Convert an :green:`Array` of :green:`Numbers` to a :green:`Buffer` holding a
``uint16_t *`` array (Brain Floating Point 16).

Usage:

.. code-block:: javascript

   rampart.vector.numbersToBf16(myarr);

Where ``myarr`` is an :green:`Array` of :green:`Numbers`.

Return Value:
   A :green:`Buffer` holding a ``uint16_t *`` array.

rampart.vector.numbersToI8
~~~~~~~~~~~~~~~~~~~~~~~~~~

Convert an :green:`Array` of :green:`Numbers` to a :green:`Buffer` holding an ``int8_t *`` array.

Usage:

.. code-block:: javascript

   var res = rampart.vector.numbersToI8(myarr [, scale [, zeroPoint]]);

Where:

* ``myarr`` is a an :green:`Array` of :green:`Numbers`.
* ``scale`` is an optional positive :green:`Number` (default: auto calculate)
* ``zeroPoint`` is an optional :green:`Number` (``-128`` - ``127``). Default is ``0``.

Return Value:
  A :green:`Buffer` holding an ``int8_t *`` array.


rampart.vector.numbersToU8
~~~~~~~~~~~~~~~~~~~~~~~~~~

Convert an :green:`Array` of :green:`Numbers` to a :green:`Buffer` holding a ``uint8_t *`` array.

Usage:

.. code-block:: javascript

   var res = rampart.vector.numbersToU8(myarr [, scale [, zeroPoint]]);

Where:

* ``myarr`` is a an :green:`Array` of :green:`Numbers`.
* ``scale`` is an optional positive :green:`Number` (default: auto calculate)
* ``zeroPoint`` is an optional positive :green:`Number` (``0`` - ``255``). Default is ``0``.



rampart.vector.f64ToNumbers
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``double *`` array to an :green:`Array` of :green:`Numbers`.

Usage:

.. code-block:: javascript

   var res = rampart.vector.NumbersToF64(mybuff);

Where ``mybuff`` is a :green:`Buffer` holding a ``double *`` array.

Return Value:
   An :green:`Array` of :green:`Numbers`.


rampart.vector.f32ToNumbers
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``float *`` array to an :green:`Array` of :green:`Numbers`.

Usage:

.. code-block:: javascript

   var res = rampart.vector.f32ToNumbers(mybuff);

Where ``mybuff`` is a :green:`Buffer` holding a ``float *`` array.

Return Value:
   An :green:`Array` of :green:`Numbers`.


rampart.vector.f16ToNumbers
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``uint16_t *`` array (IEEE 754 half-precision floating point) to an :green:`Array` of :green:`Numbers`.

Usage:

.. code-block:: javascript

   var res = rampart.vector.f16ToNumbers(mybuff);

Where ``mybuff`` is a :green:`Buffer` holding a ``uint16_t *`` array.

Return Value:
   An :green:`Array` of :green:`Numbers`.


rampart.vector.bf16ToNumbers
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``uint16_t *`` array (Brain Floating Point 16) to an :green:`Array` of :green:`Numbers`.

Usage:

.. code-block:: javascript

   var res = rampart.vector.bf16ToNumbers(mybuff);

Where ``mybuff`` is a :green:`Buffer` holding a ``uint16_t *`` array.

Return Value:
   An :green:`Array` of :green:`Numbers`.


rampart.vector.u8ToNumbers
~~~~~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``uint8_t *`` array to an :green:`Array` of :green:`Numbers`.

Usage:

.. code-block:: javascript

   var res = rampart.vector.u8ToNumbers(mybuff [, scale [, zeroPoint]]);

Where:

* ``mybuff`` is a :green:`Buffer` holding a ``uint8_t *`` array.
* ``scale`` is an optional positive :green:`Number` (default ``1.0/255``)
* ``zeroPoint`` is an optional :green:`Number` (default is ``0``).

Return Value:
   An :green:`Array` of :green:`Numbers`.


rampart.vector.i8ToNumbers
~~~~~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding an ``int8_t *`` array to an :green:`Array` of :green:`Numbers`.

Usage:

.. code-block:: javascript

   var res = rampart.vector.i8ToNumbers(mybuff [, scale [, zeroPoint]]);

Where:

* ``mybuff`` is a :green:`Buffer` holding a ``int8_t *`` array.
* ``scale`` is an optional positive :green:`Number` (default ``1.0/127.0``)
* ``zeroPoint`` is an optional :green:`Number` (default is ``0``).

Return Value:
   An :green:`Array` of :green:`Numbers`.



rampart.vector.f64ToF32
~~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``double *`` array to a :green:`Buffer` holding a ``float *`` array.

Usage:

.. code-block:: javascript

   var res = rampart.vector.f64ToF32(mybuff);

Where ``mybuff`` is a :green:`Buffer` holding a ``double *`` array.

Return Value:
   A :green:`Buffer` holding a ``float *`` array.


rampart.vector.f64ToF16
~~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``double *`` array to a :green:`Buffer` holding a ``uint16_t *`` array (IEEE 754 half-precision floating point).

Usage:

.. code-block:: javascript

   var res = rampart.vector.f64ToF16(mybuff);

Where ``mybuff`` is a :green:`Buffer` holding a ``double *`` array.

Return Value:
   A :green:`Buffer` holding a ``uint16_t *`` array.


rampart.vector.f64ToBf16
~~~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``double *`` array to a :green:`Buffer` holding a ``uint16_t *`` array (Brain Floating Point 16).

Usage:

.. code-block:: javascript

   var res = rampart.vector.f64ToBf16(mybuff);

Where ``mybuff`` is a :green:`Buffer` holding a ``double *`` array.

Return Value:
   A :green:`Buffer` holding a ``uint16_t *`` array.


rampart.vector.f64ToI8
~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``double *`` array to a :green:`Buffer` holding an ``int8_t *`` array.

Usage:

.. code-block:: javascript

   var res = rampart.vector.f64ToI8(mybuff [, scale [, zeroPoint]]);

Where:

* ``mybuff`` is a :green:`Buffer` holding a ``double *`` array.
* ``scale`` is an optional positive :green:`Number` (default: auto calculate)
* ``zeroPoint`` is an optional :green:`Number` (``-128`` - ``127``). Default is ``0``.

Return Value:
   A :green:`Buffer` holding an ``int8_t *`` array.


rampart.vector.f64ToU8
~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``double *`` array to a :green:`Buffer` holding a ``uint8_t *`` array.

Usage:

.. code-block:: javascript

   var res = rampart.vector.f64ToU8(mybuff [, scale [, zeroPoint]]);

Where:

* ``mybuff`` is a :green:`Buffer` holding a ``double *`` array.
* ``scale`` is an optional positive :green:`Number` (default: auto calculate)
* ``zeroPoint`` is an optional positive :green:`Number` (``0`` - ``255``). Default is ``0``.

Return Value:
   A :green:`Buffer` holding a ``uint8_t *`` array.


rampart.vector.f32ToF64
~~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``float *`` array to a :green:`Buffer` holding a ``double *`` array.

Usage:

.. code-block:: javascript

   var res = rampart.vector.f32ToF64(mybuff);

Where ``mybuff`` is a :green:`Buffer` holding a ``float *`` array.

Return Value:
   A :green:`Buffer` holding a ``double *`` array.


rampart.vector.f16ToF64
~~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``uint16_t *`` array (IEEE 754 half-precision floating point) to a :green:`Buffer` holding a ``double *`` array.

Usage:

.. code-block:: javascript

   var res = rampart.vector.f16ToF64(mybuff);

Where ``mybuff`` is a :green:`Buffer` holding a ``uint16_t *`` array.

Return Value:
   A :green:`Buffer` holding a ``double *`` array.


rampart.vector.bf16ToF64
~~~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``uint16_t *`` array (Brain Floating Point 16) to a :green:`Buffer` holding a ``double *`` array.

Usage:

.. code-block:: javascript

   var res = rampart.vector.bf16ToF64(mybuff);

Where ``mybuff`` is a :green:`Buffer` holding a ``uint16_t *`` array.

Return Value:
   A :green:`Buffer` holding a ``double *`` array.


rampart.vector.i8ToF64
~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding an ``int8_t *`` array to a :green:`Buffer` holding a ``double *`` array.

Usage:

.. code-block:: javascript

   var res = rampart.vector.i8ToF64(mybuff [, scale [, zeroPoint]]);

Where:

* ``mybuff`` is a :green:`Buffer` holding an ``int8_t *`` array.
* ``scale`` is an optional positive :green:`Number` (default ``1.0/127.0``)
* ``zeroPoint`` is an optional :green:`Number` (default is ``0``).

Return Value:
   A :green:`Buffer` holding a ``double *`` array.


rampart.vector.u8ToF64
~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``uint8_t *`` array to a :green:`Buffer` holding a ``double *`` array.

Usage:

.. code-block:: javascript

   var res = rampart.vector.u8ToF64(mybuff [, scale [, zeroPoint]]);

Where:

* ``mybuff`` is a :green:`Buffer` holding a ``uint8_t *`` array.
* ``scale`` is an optional positive :green:`Number` (default ``1.0/255``)
* ``zeroPoint`` is an optional :green:`Number` (default is ``0``).

Return Value:
   A :green:`Buffer` holding a ``double *`` array.


rampart.vector.f32ToF16
~~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``float *`` array to a :green:`Buffer` holding a ``uint16_t *`` array (IEEE 754 half-precision floating point).

Usage:

.. code-block:: javascript

   var res = rampart.vector.f32ToF16(mybuff);

Where ``mybuff`` is a :green:`Buffer` holding a ``float *`` array.

Return Value:
   A :green:`Buffer` holding a ``uint16_t *`` array.


rampart.vector.f32ToBf16
~~~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``float *`` array to a :green:`Buffer` holding a ``uint16_t *`` array (Brain Floating Point 16).

Usage:

.. code-block:: javascript

   var res = rampart.vector.f32ToBf16(mybuff);

Where ``mybuff`` is a :green:`Buffer` holding a ``float *`` array.

Return Value:
   A :green:`Buffer` holding a ``uint16_t *`` array.


rampart.vector.f32ToI8
~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``float *`` array to a :green:`Buffer` holding an ``int8_t *`` array.

Usage:

.. code-block:: javascript

   var res = rampart.vector.f32ToI8(mybuff [, scale [, zeroPoint]]);

Where:

* ``mybuff`` is a :green:`Buffer` holding a ``float *`` array.
* ``scale`` is an optional positive :green:`Number` (default: auto calculate)
* ``zeroPoint`` is an optional :green:`Number` (``-128`` - ``127``). Default is ``0``.

Return Value:
   A :green:`Buffer` holding an ``int8_t *`` array.


rampart.vector.f32ToU8
~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``float *`` array to a :green:`Buffer` holding a ``uint8_t *`` array.

Usage:

.. code-block:: javascript

   var res = rampart.vector.f32ToU8(mybuff [, scale [, zeroPoint]]);

Where:

* ``mybuff`` is a :green:`Buffer` holding a ``float *`` array.
* ``scale`` is an optional positive :green:`Number` (default: auto calculate)
* ``zeroPoint`` is an optional positive :green:`Number` (``0`` - ``255``). Default is ``0``.

Return Value:
   A :green:`Buffer` holding a ``uint8_t *`` array.



rampart.vector.f16ToF32
~~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``uint16_t *`` array (IEEE 754 half-precision floating point) to a :green:`Buffer` holding a ``float *`` array.

Usage:

.. code-block:: javascript

   var res = rampart.vector.f16ToF32(mybuff);

Where ``mybuff`` is a :green:`Buffer` holding a ``uint16_t *`` array.

Return Value:
   A :green:`Buffer` holding a ``float *`` array.


rampart.vector.bf16ToF32
~~~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``uint16_t *`` array (Brain Floating Point 16) to a :green:`Buffer` holding a ``float *`` array.

Usage:

.. code-block:: javascript

   var res = rampart.vector.bf16ToF32(mybuff);

Where ``mybuff`` is a :green:`Buffer` holding a ``uint16_t *`` array.

Return Value:
   A :green:`Buffer` holding a ``float *`` array.


rampart.vector.u8ToF32
~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``uint8_t *`` array to a :green:`Buffer` holding a ``float *`` array.

Usage:

.. code-block:: javascript

   var res = rampart.vector.u8ToF32(mybuff [, scale [, zeroPoint]]);

Where:

* ``mybuff`` is a :green:`Buffer` holding a ``uint8_t *`` array.
* ``scale`` is an optional positive :green:`Number` (default ``1.0/255``)
* ``zeroPoint`` is an optional :green:`Number` (default is ``0``).

Return Value:
   A :green:`Buffer` holding a ``float *`` array.


rampart.vector.i8ToF32
~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding an ``int8_t *`` array to a :green:`Buffer` holding a ``float *`` array.

Usage:

.. code-block:: javascript

   var res = rampart.vector.i8ToF32(mybuff [, scale [, zeroPoint]]);

Where:

* ``mybuff`` is a :green:`Buffer` holding an ``int8_t *`` array.
* ``scale`` is an optional positive :green:`Number` (default ``1.0/127.0``)
* ``zeroPoint`` is an optional :green:`Number` (default is ``0``).

Return Value:
   A :green:`Buffer` holding a ``float *`` array.


rampart.vector.f16ToI8
~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``uint16_t *`` array (IEEE 754 half-precision floating point) to a :green:`Buffer` holding an ``int8_t *`` array.

Usage:

.. code-block:: javascript

   var res = rampart.vector.f16ToI8(mybuff [, scale [, zeroPoint]]);

Where:

* ``mybuff`` is a :green:`Buffer` holding a ``uint16_t *`` array.
* ``scale`` is an optional positive :green:`Number` (default: auto calculate)
* ``zeroPoint`` is an optional :green:`Number` (``-128`` - ``127``). Default is ``0``.

Return Value:
   A :green:`Buffer` holding an ``int8_t *`` array.


rampart.vector.f16ToU8
~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``uint16_t *`` array (IEEE 754 half-precision floating point) to a :green:`Buffer` holding a ``uint8_t *`` array.

Usage:

.. code-block:: javascript

   var res = rampart.vector.f16ToU8(mybuff [, scale [, zeroPoint]]);

Where:

* ``mybuff`` is a :green:`Buffer` holding a ``uint16_t *`` array.
* ``scale`` is an optional positive :green:`Number` (default: auto calculate)
* ``zeroPoint`` is an optional positive :green:`Number` (``0`` - ``255``). Default is ``0``.

Return Value:
   A :green:`Buffer` holding a ``uint8_t *`` array.



rampart.vector.i8ToF16
~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding an ``int8_t *`` array to a :green:`Buffer` holding a ``uint16_t *`` array (IEEE 754 half-precision floating point).

Usage:

.. code-block:: javascript

   var res = rampart.vector.i8ToF16(mybuff [, scale [, zeroPoint]]);

Where:

* ``mybuff`` is a :green:`Buffer` holding an ``int8_t *`` array.
* ``scale`` is an optional positive :green:`Number` (default ``1.0/127.0``)
* ``zeroPoint`` is an optional :green:`Number` (default is ``0``).

Return Value:
   A :green:`Buffer` holding a ``uint16_t *`` array.


rampart.vector.u8ToF16
~~~~~~~~~~~~~~~~~~~~~~

Convert a :green:`Buffer` holding a ``uint8_t *`` array to a :green:`Buffer` holding a ``uint16_t *`` array (IEEE 754 half-precision floating point).

Usage:

.. code-block:: javascript

   var res = rampart.vector.u8ToF16(mybuff [, scale [, zeroPoint]]);

Where:

* ``mybuff`` is a :green:`Buffer` holding a ``uint8_t *`` array.
* ``scale`` is an optional positive :green:`Number` (default ``1.0/255``)
* ``zeroPoint`` is an optional :green:`Number` (default is ``0``).

Return Value:
   A :green:`Buffer` holding a ``uint16_t *`` array.

rampart.vector.l2NormalizeNumbers
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Perform an in-place L2 normalization on an :green:`Array` of :green:`Numbers`, scaling the vector to unit length.

Usage:

.. code-block:: javascript

   var res = rampart.vector.l2NormalizeNumbers(myarr);

Where ``myarr`` is an :green:`Array` of :green:`Numbers`.

Return Value:
   An :green:`Array` of :green:`Numbers` with normalized values.

Note:
   All L2 normalization functions are in-place, tranforming the input vector and returning it.

rampart.vector.l2NormalizeF64
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Perform an in-place L2 normalization on a :green:`Buffer` holding a ``double *`` array, scaling the vector to unit length.

Usage:

.. code-block:: javascript

   var res = rampart.vector.l2NormalizeF64(mybuff);

Where ``mybuff`` is a :green:`Buffer` holding a ``double *`` array.

Return Value:
   A :green:`Buffer` holding a ``double *`` array with normalized values.

Note:
   All L2 normalization functions are in-place, tranforming the input vector and returning it.

rampart.vector.l2NormalizeF32
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Perform an in-place L2 normalization on a :green:`Buffer` holding a ``float *`` array, scaling the vector to unit length.

Usage:

.. code-block:: javascript

   var res = rampart.vector.l2NormalizeF32(mybuff);

Where ``mybuff`` is a :green:`Buffer` holding a ``float *`` array.

Return Value:
   A :green:`Buffer` holding a ``float *`` array with normalized values.

Note:
   All L2 normalization functions are in-place, tranforming the input vector and returning it.

rampart.vector.l2NormalizeF16
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Perform an in-place L2 normalization on a :green:`Buffer` holding a ``uint16_t *`` array (IEEE 754 half-precision floating point), scaling the vector to unit length.

Usage:

.. code-block:: javascript

   var res = rampart.vector.l2NormalizeF16(mybuff);

Where ``mybuff`` is a :green:`Buffer` holding a ``uint16_t *`` array.

Return Value:
   A :green:`Buffer` holding a ``uint16_t *`` array with normalized values.

Note:
   All L2 normalization functions are in-place, tranforming the input vector and returning it.

Vector Distance Function
------------------------

The ``rampart.vector.distance()`` function measures the distance or score by comparing two vectors.

.. code-block:: javascript

   var dist = rampart.vector.distance(myvec, myvec2, metric, vecType);

Where:

* ``myvec`` is one of the supported vector types above.
* ``myvec2`` is a vector matching ``myvec`` in type and dimensions (number of elements/Numbers in the array).
* ``metric`` is a :green:`String`, one of ``dot``, ``cosine`` or ``euclidean``. Default is ``dot``.
* ``vecType`` s a :green:`String`, one of ``numbers``, ``f64``, ``f32``, ``f16``, ``bf16``, ``i8`` or ``u8``
  specifying the type of ``myvec`` and ``myvec2``.   Default is ``f16``.

Return Value:
   * For ``euclidean`` and ``cosine`` a measure of the distance between the two vectors (with 0 being the closest).
   * For ``dot`` the cosine similarity between two vectors (with 1.0 being exact match and -1.0 being the opposite).

Note:
  * ``dot`` assumes L2 Normalized vectors are given to it and returns similarity score of ``-1.0`` to ``1.0``.
  * ``cosine`` takes vectors, normalizes them and computes a distance of ``0` to ``2.0``.
  * ``1 - cosineScore == dotDistance`` if the vectors are L2 Normalized.  However, the ``dot`` calculation is simpler and faster for
     vectors thar are already L2 Normalized.
