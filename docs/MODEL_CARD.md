# Model card: ScopeProof local service classifier v1

## Purpose

Suggest one of five service categories for a clause in a short English client brief. Help the user organize a scope and surface uncertainty before they make decisions. It does not estimate effort, select a fair price, negotiate terms, verify delivery or authorize payment.

## Data provenance and method

The repository includes 80 original synthetic training sentences, 16 per class, and 20 held-out synthetic sentences, four per class. They were authored with AI assistance for this prototype. No client messages, scraped profiles or private customer records were used.

The training pipeline lowercases text, extracts word unigrams with two or more word characters, applies TF-IDF with L2 normalization, and fits multiclass logistic regression. Parameters: C=8, max_iter=1200, random_state=42. Classes: automation, branding, commerce, social and website. The fitted vocabulary, IDF values, coefficients and intercepts are exported as JSON. JavaScript performs inference without Python at runtime.

## Evaluation

`ml/evaluation.json` contains the full per-example predictions and confusion matrix. The 20-example held-out synthetic set was classified correctly in the recorded build. This is a narrow sanity check: examples are small, same-domain and authored through the same process as training data. It is not an independent benchmark, a customer trial, calibrated reliability, or evidence of generalization to messy real briefs. Do not describe this result as “100% accurate AI.”

## Interpretation and safeguards

The displayed score is a rounded softmax model output. It has not been calibrated. “Evidence” lists positive weighted features for the predicted category; it is not a complete explanation or a causal account.

Clauses below 48% score, unknown-vocabulary clauses and negated clauses are left unselected. Heuristics flag urgent, unlimited and guarantee wording. Those heuristics are separate from the learned classifier. All proposed descriptions preserve the original clause and can be edited before the scope is saved. A category matching the original scope only triggers a review prompt; it never proves that extra work is included.

## Known limitations

The model has no general reasoning, translation, reliable sarcasm handling, sophisticated negation interpretation or semantic contract comparison. A familiar word can dominate a sentence with a different intent. Combined services may require manual splitting. Confidence can be misleading on unfamiliar inputs. Only the first 16 detected clauses are returned; long briefs require manual review. The UI accepts at most 6,000 characters.

No external AI provider receives the text. Inference executes on the application server, which means the hosting operator still receives input on a hosted deployment. Selected scope descriptions are persisted. This is not a promise of end-to-end encryption or zero retention.

## Next evaluation

Collect consented, de-identified examples across the intended service categories, including spelling errors, Telugu-English mixtures, exclusions, implicit quantities and same-category scope changes. Keep a genuinely independent evaluation set. Measure category precision/recall and abstention performance before changing the review threshold. Review product harms such as a confidently omitted deliverable, not just category accuracy.
