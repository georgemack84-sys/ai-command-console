# Learning Taxonomy User Guide

You can speak naturally. The system uses these labels only to understand what kind of information you are sharing; it does not automatically remember, approve, authorize, or execute anything you say.

## Useful phrasing

| If you say… | It is usually understood as… | Important boundary |
| --- | --- | --- |
| “I’m considering using a queue.” | `IDEA` | Considering is not adopting. |
| “I recommend a queue.” | `SUGGESTION` | A recommendation is not a decision. |
| “Please use a queue for this task.” | `INSTRUCTION` | A request does not grant execution permission. |
| “We decided to use PostgreSQL.” | `DECISION` | Scope and owner still need separate resolution. |
| “Remember that I prefer concise plans.” | `PREFERENCE` with explicit learning intent | Learning intent does not make it a rule. |
| “Correction: we switched to PostgreSQL.” | `CORRECTION` | The earlier information remains historically traceable. |
| “Except during incident response…” | `EXCEPTION` | An exception narrows a base rule; it does not delete it. |
| “For example: ‘Delete the records.’” | `EXAMPLE` | The nested directive remains illustrative. |

## When the system asks a question

It asks only when the distinction materially affects later learning, such as whether something is a correction or an exception, or what scope a decision or preference should apply to. Routine conversational ambiguity is handled conservatively without interruption.

## What classification does not decide

Classification does not decide whether content is true, durable, authorized, globally applicable, approved, or executable. Those are separate review and governance steps.
