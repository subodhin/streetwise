# AI Usage and Engineering Decisions

## 1. AI Tools Used

AI assistants were used to help with:
- Reviewing and debugging TypeScript code.
- Improving the rules-based triage fallback.
- Designing and refining test cases.
- Explaining Cloudflare Workers, Workers AI, and deployment errors.
- Reviewing API validation and triage behaviour.

Workers AI (`@cf/meta/llama-3.1-8b-instruct-fp8`) is used by the application to classify citizen reports by issue type, size, priority, confidence, and reason.

## 2. Problems Found and Improvements Made

### Problem 1: Incorrect issue-type matching
The fallback classifier initially failed to recognise several descriptions, including drainage problems, dumped objects, and road hazards.

**Improvement:** Expanded the keyword patterns to recognise additional descriptions and corrected the lighting pattern so the word "slightly" would not accidentally match "light".

### Problem 2: Inconsistent priority classification
The initial fallback rules assigned incorrect priorities to several reports, including urgent road hazards, broken glass, and street-light outages.

**Improvement:** Refined priority rules using the labelled evaluation dataset and reran the evaluator after each change.

### Problem 3: AI output and failure handling
AI output may be missing, malformed, invalid, or delayed.

**Improvement:** Added response validation and a timeout around the Workers AI request. The API falls back to the rules-based classifier when AI classification returns no valid result.

## 3. Evaluation

Evaluation dataset: `data/labelled-reports.json`

Number of labelled reports: 40

- Type accuracy: 40/40 (100%)
- Priority accuracy: 40/40 (100%)

These figures describe performance on the supplied labelled dataset only. They do not guarantee the same accuracy on unseen reports or in production.

The evaluation script is `scripts/evaluate-accuracy.ts`. The test suite was run with `npm test`, and all tests passed at the time of evaluation.

## 4. Work Implemented and Verified

I reviewed the fallback classifier and its integration with the triage endpoint, refined classification rules, ran the labelled-data evaluator, and added unit tests for fallback classification.

I also deployed the application to Cloudflare Workers and sent a request to the live `/api/triage` endpoint, which returned HTTP 200 with a valid model-generated classification.

## 5. Known Limitations

- The fallback classifier uses keyword-based rules and may misclassify descriptions it has not encountered.
- Evaluation on 40 reports is limited and may not represent real-world traffic.
- The live AI-failure fallback path still requires a dedicated runtime failure test.
- Additional staff, admin, settings, audit-log, and end-to-end behaviours should be verified against the assessment requirements before submission.