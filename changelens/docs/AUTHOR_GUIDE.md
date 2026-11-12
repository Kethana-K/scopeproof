# Know your project before presenting

**What is actually learned?** The service-category classifier. TF-IDF turns recognized words into weighted numbers. Logistic regression learned weights from 80 synthetic examples. It computes scores for website, branding, social, automation and commerce. No LLM or paid API is used.

**What is retrieval?** We compare the request's word vector with each original clause, and also compare normalized word overlap. This locates wording to inspect. It does not prove that two sentences have the same meaning.

**What are rules?** Explicit code looks for count changes, exclusions, open-ended wording and urgent timing. Rules are not machine learning. They can miss complicated language.

**Why does human review matter?** Similarity cannot settle what a client intended. The reviewer selects the result and writes a reason; the tool does not silently accept, charge for or send anything.

**Is the hash a legal signature?** No. SHA-256 detects whether the exact exported string changed. It does not verify who reviewed it, client acceptance, or protection against an administrator changing a file.

**What did you build now?** The two-document browser workflow, related-clause evidence, count comparison, human decision gate, invalidation of stale drafts, reply template, export and tests. The classifier came from the earlier ScopeProof project; disclose that.

**What do the test results mean?** The 19 tests check specified program behavior. They are not 19 customers, an independent model benchmark or evidence of reduced disputes.

**One Telugu explanation:** Client కొత్తగా అడిగిన పనిని original scopeతో పోల్చి చూపించే tool ఇది. AI సంబంధిత service, పాత clauseను వెతకడంలో సహాయపడుతుంది. Extra workనా, includedనా, clarification కావాలా అన్నది మనమే నిర్ణయిస్తాం. ఆ నిర్ణయాల నుంచి clientకి పంపగల draft వస్తుంది; tool తనంతట తాను పంపదు.
