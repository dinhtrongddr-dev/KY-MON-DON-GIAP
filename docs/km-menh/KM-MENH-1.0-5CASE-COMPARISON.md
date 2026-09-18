# KM-MENH-1.0 — Five-case ChatGPT vs App AI comparison

Date: 2026-09-18  
Branch: `develop`  
Global-precedence fix: `f3143f9330a7a62db2f9b8726673ed579ff44b97`

## Purpose

Compare the same deterministic natal charts interpreted directly under the frozen KM-MENH-1.0 specification versus the app AI writer. This measures interpretation fidelity rather than calendar/chart-construction differences.

The percentages below are rubric-based semantic fidelity scores, not statistical probabilities.

## Fixed cases

| Case | Provenance | Birth | Pillars |
|---|---|---|---|
| Z17 | DIRECT_ZHANG | 1953-12-12 08:00 | 癸巳 / 甲子 / 丁酉 / 甲辰 |
| Z18 | DIRECT_ZHANG | 1970-01-03 22:00 | 己酉 / 丙子 / 癸未 / 癸亥 |
| LWF05 | TRANSMISSION_ZHANG_LINE_LWF | 1964-08-19 19:40 | 甲辰 / 壬申 / 庚子 / 丙戌 |
| LWF06 | TRANSMISSION_ZHANG_LINE_LWF | 1950-10-04 ~05:00 | 庚寅 / 乙酉 / 壬申 / 癸卯 |
| LWF08 | TRANSMISSION_ZHANG_LINE_LWF | 1986-08-04 22:00 | 丙寅 / 乙未 / 庚辰 / 丁亥 |

Common runtime settings:
- timezone UTC+7;
- annual overlay 2026 / 丙午;
- age used for the frozen 15-year luck cycle;
- no optional sex metadata;
- AI route: GPT-5.6 Sol via 9router, xhigh.

## Pre-fix finding

The deterministic engine already produced the correct global evidence:
- Z17: GLOBAL_FU_YIN
- Z18: GLOBAL_FU_YIN
- LWF05: GLOBAL_FAN_YIN
- LWF06: GLOBAL_FU_YIN
- LWF08: GLOBAL_FU_YIN

But the writer context filtered evidence to claim-referenced IDs, so the global evidence was dropped before AI generation. As a result, local domain interpretations were strong while Zhang-style global precedence was missing.

Pre-fix combined semantic/method fidelity was approximately **81%**. Local-domain semantic overlap alone was approximately **92%**.

## Fix

The runtime now creates a deterministic `GLOBAL_STRUCTURE` claim when source-backed global hard evidence exists.

The writer contract now:
1. serializes GLOBAL_HARD_STRUCTURE evidence and affected domains;
2. requires overview to name FuYin/FanYin explicitly;
3. requires precedence/cap wording before favorable local signals;
4. requires a non-veto caveat;
5. requires `GLOBAL_STRUCTURE` claim trace on every non-empty affected natal domain section;
6. rejects the reading and invokes repair/fallback if any of these constraints are omitted.

Regression coverage includes Z18 FuYin and LWF05 FanYin.

## Post-fix live app results

All final successful comparison runs were performed through the real `/api/menh/read` preview endpoint.

| Case | Final route | Successful runtime | Global precedence | Method fidelity | Semantic interpretation similarity |
|---|---|---:|---|---:|---:|
| Z17 | GPT-5.6 Sol / xhigh | 51 s | FuYin present + cap | 98% | 94% |
| Z18 | GPT-5.6 Sol / xhigh | 62 s | FuYin present + cap | 99% | 96% |
| LWF05 | GPT-5.6 Sol / xhigh | 55 s | FanYin present + cap | 97% | 92% |
| LWF06 | GPT-5.6 Sol / xhigh | 59 s | FuYin present + cap | 98% | 95% |
| LWF08 | GPT-5.6 Sol / xhigh | 63 s | FuYin present + cap | 98% | 95% |

Averages:
- method / rule fidelity: **98.0%**
- semantic interpretation similarity: **94.4%**
- combined practical fidelity: approximately **96%**
- mean successful runtime: **58.0 s**

Literal wording similarity is intentionally lower than semantic similarity because the writer is allowed to express the same verified claims in different Vietnamese prose.

## Case notes

### Z17
The app now correctly places FuYin before the otherwise favorable career/wealth signals, keeps the Li-9 Fire pressure against the self, preserves the Geng/Kun mother-side corroborator, keeps the multi-resolver marriage bundle, and retains the away-from-origin wealth-development tendency.

### Z18
This is the critical regression case. Before the fix, the app emphasized Tian Xin + Kai Men + Zhi Fu and missed the source lesson. After the fix, the overview explicitly states FuYin is the highest-priority background and can cap those favorable local signals without becoming an automatic bad-fate veto.

### LWF05
The app now explicitly states FanYin as the global reversal/adjustment background before career and wealth support. One initial live attempt had a transient provider/fallback-chain failure; the immediate rerun succeeded with Sol/xhigh.

### LWF06
The app preserves the clean marriage architecture: Liu He + Yi/Geng + Ren/Ding, alongside Sheng wealth support and away-from-origin development. One initial live attempt had a transient provider/fallback-chain failure; the rerun succeeded with Sol/xhigh.

### LWF08
The app preserves the Tian-pan annual locator (Bing at Qian-6 for the tested annual layer), career support from Kai/Qian, wealth pressure from Sheng/Gen against the Water self, and now also keeps FuYin as the global cap.

## Operational note

The first comparison pass showed occasional transient upstream/fallback-chain failures on LWF05 and LWF06. Both succeeded on immediate rerun without code or input changes. This is an availability/latency issue, not a deterministic-rule mismatch.

## Release gates after the fix

```text
Node tests:      267 / 267 PASS
Python tests:    PASS
verify-release:  PASS
protected core:  unchanged
legacy baseline: 480 boards unchanged
```
