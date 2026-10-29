# AI Usage and Engineering Decisions

## 1. AI Tools Used

### ChatGPT
Used during development to explain TypeScript errors, review code, debug issues, refine test cases, and troubleshoot Cloudflare deployment. Suggestions were checked against the code, tests, and live application before being accepted.

### Cloudflare Workers AI
Integrated into the application using `@cf/meta/llama-3.1-8b-instruct-fp8` to classify citizen reports at runtime.

### Rules-Based Classifier
Implemented as a deterministic fallback when the AI classifier returns no usable result or throws an error. Its accuracy was evaluated separately from Workers AI.

## 2. Problems Found and Improvements Made

### Problem 1: Incorrect issue-type matching

Early fallback rules did not recognise some descriptions of drainage problems, dumped objects, and road hazards.

**Improvement:** Expanded keyword patterns using the labelled dataset and corrected the lighting pattern to avoid matching the word "slightly" as "light".

### Problem 2: Inconsistent priority classification

Early fallback rules did not consistently assign the expected priorities to some urgent road hazards, broken glass, and street-light outages.

**Improvement:** Refined the priority rules against the labelled reports and reran the evaluator after the changes. The final evaluation reported no type or priority mismatches in the 40 supplied reports.

### Problem 3: AI failure handling

The AI service can return no usable classification or fail while processing a request.

**Improvement:** Added a reusable fallback helper that uses the rules-based classifier when the AI classifier returns `null` or throws an error. Added unit tests for both failure cases and the successful AI case.

## 3. Evaluation

Dataset: `data/labelled-reports.json`

- Reports evaluated: 40
- Rules-based type accuracy: 40/40 (100%)
- Rules-based priority accuracy: 40/40 (100%)
- Classification failures: 0

The evaluator calls `classifyWithRules()` directly. These figures measure the rules-based classifier against the supplied dataset; they are not measurements of Workers AI model accuracy and do not guarantee performance on unseen reports.

The evaluator is `scripts/evaluate-accuracy.ts`. The automated test suite passed all 25 tests in the latest run, and `npx tsc --noEmit` completed without errors.

## 4. Runtime Verification

- Deployed the application to Cloudflare Workers.
- Verified that `GET /api/health` returned HTTP 200.
- Sent a request to the live `POST /api/triage` endpoint. It returned a valid model-generated classification with `triaged_by: "model"` and the expected approval route for a priority-5 report.
- Verified the fallback helper's `null` and exception behaviour through unit tests.

The live AI-outage fallback path has not been directly simulated against the deployed Worker.

## 5. Limitations Identified Through Code Review

These are potential weaknesses identified in the implementation, not misclassifications observed in the 40-report evaluation.

1. **Keyword coverage:** The fallback may classify unfamiliar wording as `not_relevant` when no supported pattern matches.
2. **Overlapping issue categories:** The first matching category wins. A report mentioning both flooding and road damage may be classified as flooding because that rule is evaluated first.
3. **Fixed fallback confidence:** The fallback uses a fixed confidence of `0.65` for supported categories rather than calibrating confidence to the ambiguity of each report.

The 40-report dataset is limited and may not represent real-world reports. Further testing should include unseen examples, ambiguous descriptions, and a controlled AI-failure test.

## 6. Engineering Decisions

A separate fallback helper keeps AI failure handling reusable and testable. The routing rules remain separate from the model so that priority thresholds and approval decisions are enforced by application logic rather than trusted to the model alone.

The rules-based fallback was implemented explicitly so report triage can continue when Workers AI is unavailable or returns an unusable result.

## 7. Work Implemented Directly

I implemented and refined the application logic for classification fallback, triage routing, and report handling. I also ran the test suite, evaluated the rules-based classifier against the labelled dataset, and verified the deployed API.

I kept routing decisions in application code rather than relying entirely on AI-generated output. This ensures that priority thresholds and human-review requirements are enforced consistently, even when AI output is uncertain or unavailable.


## 8. Local Environment Compatibility

Local Wrangler execution encountered a compatibility issue on the Ubuntu development environment. The installed `workerd` binary required GLIBC versions 2.32–2.35, which were unavailable on the system.

**Impact:** Running local D1 migrations with `--local` failed with a `write EPIPE` error followed by GLIBC compatibility errors.

**How it was handled:** I checked the remote D1 migration status using `npx wrangler d1 migrations list streetwise-db --remote`. Wrangler reported that there were no migrations to apply. I also verified the deployed health endpoint and tested the live triage API separately.

**Limitation:** Local execution using this `workerd` binary was not verified successfully on this Ubuntu environment. The compatibility issue was not fixed as part of this task; the deployed application was tested independently.
