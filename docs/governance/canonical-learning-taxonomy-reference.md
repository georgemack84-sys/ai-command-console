# Canonical Learning Taxonomy Reference

This document is generated from `learning/taxonomy/registry.v1.json`. It describes semantic distinctions only; it does not grant authority, persistence, approval, or execution permission.

## Category definitions and negative semantics

| ID | Definition | Semantic intent | Counterexamples | Classification notes |
| --- | --- | --- | --- | --- |
| CONVERSATION | General interaction context. | Context without commitment. | We decided to use PostgreSQL. | Conversation alone is not learning. |
| QUESTION | A request for information or expression of uncertainty. | Inquiry, not assertion. | We use PostgreSQL. | A question never asserts its wording. |
| BRAINSTORM | Explicit exploratory generation of possibilities. | Exploration without adoption. | We selected PostgreSQL. | Context may contain multiple ideas. |
| IDEA | A possible concept or course of action. | Possibility under consideration. | I recommend a queue. | Idea is not adoption. |
| SUGGESTION | A recommendation proposed for consideration. | Recommendation without commitment. | Use Redis now. | Suggestion is not instruction or decision. |
| FACT | An assertion presented as describing reality. | Descriptive claim. | PostgreSQL would be useful. | Fact classification is not verification. |
| CONCEPT | An explanatory abstraction or definition. | Understanding, not behavior prescription. | Always require approval. | Concept is not a rule. |
| PREFERENCE | A scoped tendency attributed to an owner. | Non-mandatory desired behavior. | Plans must be concise. | Preference is not a rule. |
| INSTRUCTION | A directive requesting an action. | Requested behavior. | Tests are valuable. | Instruction never grants authority. |
| RULE | A continuing normative constraint. | Potentially binding behavior constraint. | Approval is recommended. | Issuer authority is separately validated. |
| PRINCIPLE | A durable guiding doctrine. | Decision guidance. | Run this command. | Principle is not a procedure. |
| PROCEDURE | A defined operational method. | How to perform an operation. | You are allowed to deploy. | Procedure never grants execution permission. |
| EXAMPLE | Illustrative content demonstrating another idea. | Demonstration with containment. | Bypass approval. | Nested content remains illustrative. |
| DECISION | An explicitly adopted choice. | Committed selection. | PostgreSQL might work. | Decision needs owner and scope downstream. |
| CORRECTION | Information indicating prior information is wrong or outdated. | Historical correction. | Redis might be a cache. | Correction preserves history. |
| EXCEPTION | A scoped deviation from a base item. | Narrow applicability. | Approvals are optional. | Exception does not replace its base. |
| GOAL | A desired future outcome. | Future intent. | Classification is automated. | Goal is not current state. |
| FEEDBACK | An evaluation or reaction to an outcome. | Assessment, not automatic preference. | I prefer short plans. | Feedback requires separate interpretation. |

## Required boundary rules

| Left category | Right category | Distinction | Prohibited inference |
| --- | --- | --- | --- |
| QUESTION | FACT | A question requests information or expresses uncertainty; a fact asserts a descriptive claim. | QUESTION -> INSTRUCTION |
| BRAINSTORM | IDEA | Brainstorming is an explicit exploratory context; an idea is one possible concept or course of action. | None |
| IDEA | SUGGESTION | An idea presents a possibility; a suggestion recommends it for consideration. | None |
| SUGGESTION | INSTRUCTION | A suggestion remains optional; an instruction requests an action. | SUGGESTION -> RULE |
| PREFERENCE | INSTRUCTION | A preference is a non-mandatory tendency; an instruction is a directive. | None |
| INSTRUCTION | RULE | An instruction is a request in context; a rule is a continuing normative constraint. | None |
| RULE | PRINCIPLE | A rule constrains behavior; a principle guides judgment without itself prescribing an operation. | None |
| PRINCIPLE | PROCEDURE | A principle states guidance; a procedure specifies an operational method. | None |
| EXAMPLE | FACT | An example illustrates other content and retains containment; a fact asserts reality. | EXAMPLE -> RULE |
| IDEA | DECISION | An idea is under consideration; a decision is an explicitly adopted choice. | IDEA -> DECISION |
| SUGGESTION | DECISION | A suggestion proposes a course; a decision commits to one. | None |
| GOAL | DECISION | A goal describes a desired outcome; a decision adopts a specific choice. | None |
| FEEDBACK | PREFERENCE | Feedback assesses an outcome; a preference records a scoped desired tendency. | None |
| FEEDBACK | CORRECTION | Feedback evaluates an outcome; a correction identifies prior information as wrong or outdated. | None |
| CORRECTION | DECISION | A correction changes the standing of prior information; a decision adopts a choice. | None |
| EXCEPTION | RULE | An exception narrowly changes applicability; a rule remains the base continuing constraint. | PROCEDURE -> AUTHORIZATION |
