# Repository engineering and file standards

- Status: canonical repository policy
- Applies to: all text content in this repository
- Established by: Proprium Phase 1, Week 1, Day 5, GP-37

## Purpose

This document is the single source of truth for repository-wide engineering and text-file standards. Repository policy, rather than a contributor's operating system, editor, IDE, or Git installation, determines the canonical representation of committed text.

These standards make formatting deterministic, reduce subjective review feedback, and provide the policy contract for formatters, linters, validators, repository commands, and CI. Mechanically verifiable rules should be automated wherever practical. Until that enforcement exists, contributors and reviewers remain responsible for following this policy.

## Scope

The policy applies across the repository, regardless of project ownership, including:

- frontend and backend source code;
- infrastructure and deployment definitions;
- automation and developer scripts;
- documentation;
- configuration and environment templates;
- CI workflows; and
- committed generated files unless an approved exception says otherwise.

Binary files are outside the text-representation rules. Language- or tool-specific conventions may refine indentation or other syntax-level formatting, but they must not silently contradict this repository-wide policy.

## Canonical policy

| Concern | Repository standard |
| --- | --- |
| Text encoding | UTF-8 |
| UTF-8 byte order mark (BOM) | Prohibited by default |
| Line ending | LF |
| Final newline | Required |
| Trailing whitespace | Prohibited by default |
| Default indentation style | Spaces |
| Language-specific indentation | Explicit, deterministic, and mechanically enforceable |
| Tabs | Prohibited unless a language, format, or tool requires them |
| CRLF | Allowed only by an approved, narrowly scoped exception |

Formatting must converge on the same result for developers, editors, operating systems, CI runners, and automation agents. Rules that depend on local defaults are not repository standards.

## Encoding and BOMs

All repository text files must be valid UTF-8. UTF-8 without a BOM is the default and canonical representation.

A BOM is permitted only when a named tool demonstrably cannot consume UTF-8 without it. Such a case requires an approved exception identifying the affected file pattern, the tool, the technical limitation, and the condition under which the exception can be removed.

## Line endings and Windows development

LF is canonical for every ordinary text file, including files edited or executed on Windows. A contributor's Git or editor settings must not cause committed content to oscillate between LF and CRLF.

Windows is a supported development environment, but Windows support does not change the repository representation. A Windows-specific script may use CRLF only if a named tool or runtime actually requires it and the exception is approved and encoded for the narrowest practical file pattern. A `.cmd` or `.bat` extension alone is not justification.

## Final newline

Every non-empty text file must end with LF. The last content line is followed by one newline character; accidental blank lines or whitespace at end of file must be removed. Intentional blank lines that are meaningful content are not treated as accidental end-of-file whitespace.

## Trailing whitespace and Markdown

Spaces and tabs at the end of a line are prohibited by default in source, configuration, scripts, data, and documentation.

Markdown follows the same rule. Trailing spaces may be preserved only when they intentionally produce required rendered output and an alternative Markdown construct would not express that output adequately. The exception must be local and explainable; Markdown's general support for hard breaks is not, by itself, a reason to allow trailing whitespace throughout a file.

## Indentation and tabs

Indentation rules are language-specific, deterministic, and mechanically enforceable. Repository configuration should define an explicit indentation width for each relevant language or file class rather than inheriting editor defaults.

Spaces are the default indentation style. Tabs are prohibited for indentation unless a language, file format, or required tool makes them technically necessary. Alignment preferences and local editor behavior do not justify an exception.

## Generated files

Generation does not automatically exempt a committed file from these standards. Before approving an exception for generated output, document:

- whether the file is committed and whether people edit it;
- the generator and version or configuration that owns it;
- why normalization would invalidate the output or create unavoidable churn;
- whether validation should inspect or exclude it; and
- the condition for removing the exception, where practical.

Prefer configuring the generator to emit compliant output. Noncompliant generated output may be excepted only when that is not practical and the technical cost is documented.

## Exception governance

Exceptions require a concrete technical need and must be explicit, narrow, documented, and mechanically encoded when enforcement is introduced. An exception record belongs in this document so policy remains authoritative in one place.

Each exception must state:

| Required field | Meaning |
| --- | --- |
| Rule | The policy being overridden |
| Scope | The exact file or narrow file pattern affected |
| Reason | The technical reason the canonical rule is insufficient |
| Dependency | The tool, runtime, format, or generator that requires the exception |
| Enforcement | How repository configuration and validation will preserve the narrow behavior |
| Removal condition | What would make the exception unnecessary, where practical |

Editor preference, operating-system convention, local Git configuration, convenience, or a file being generated or documented are not sufficient reasons.

### Approved exceptions

No encoding, BOM, line-ending, trailing-whitespace, indentation, tab, or generated-file exceptions are approved as of GP-37.

## Baseline repository audit

GP-37 audited the Git index so local artifacts, ignored output, and unrelated uncommitted work could not distort the committed baseline. The audit inspected 6,664 tracked files: 6,663 UTF-8 text files and one file classified as binary because it contains NUL bytes.

| Check | GP-37 baseline | After remediation |
| --- | ---: | ---: |
| Invalid UTF-8 text files | 0 | 0 |
| UTF-8 BOMs | 0 | 0 |
| Files containing CRLF | 0 | 0 |
| Files containing bare CR | 0 | 0 |
| Non-empty text files missing a final newline | 51 | 0 |
| Text files containing trailing whitespace | 1 | 0 |
| Text files containing tab characters | 0 | 0 |

The trailing-whitespace finding was in `docs/audit/phase-3.3A-runtime-audit.md`. The missing-final-newline findings were concentrated in legacy JavaScript, JSON state/configuration, SVG, and text files. GP-37 initially recorded these findings without creating a repository-wide normalization diff; a subsequent, separately scoped remediation normalized only the 52 identified files.

The policy audit found no existing `.editorconfig` or `.gitattributes` and no competing canonical engineering-standards document. Existing repository documentation does not define conflicting encoding, line-ending, whitespace, indentation, generated-file, or exception rules.

The Windows environment used for the audit has a system-level `core.autocrlf=true`. Consequently, many compliant LF blobs appear as CRLF in the local working tree. This is an environment-dependent behavior, not an approved repository exception, and demonstrates the need for repository-owned attributes in GP-38. No local or global Git settings were changed by GP-37.

## Mechanical enforcement contract

GP-38 and later enforcement must encode this policy without making new policy decisions:

```text
charset                    = utf-8
default BOM                = prohibited
end_of_line                = lf
insert_final_newline       = true
trim_trailing_whitespace   = true
default indentation        = spaces
language overrides         = explicit
CRLF exceptions            = explicit only
```

The intended enforcement chain is:

```text
this canonical policy
    -> .editorconfig and .gitattributes
    -> language and tool configuration
    -> repository validation commands
    -> CI enforcement
```

GP-37 does not add or change `.editorconfig`, `.gitattributes`, `.gitignore`, formatter or linter configuration, analyzers, architecture tests, validation scripts, repository commands, or CI workflows. Those enforcement mechanisms belong to GP-38 and later plans.
