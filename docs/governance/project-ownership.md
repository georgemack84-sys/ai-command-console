# Project ownership metadata

`config/project-ownership.json` is the repository-level map for classifying paths before they are staged, committed, or qualified. It is intentionally separate from GitHub `CODEOWNERS`: the map describes the system boundary, not review assignment.

The classifier returns one of `NURU`, `PROPRIUM_API`, `PROPRIUM_WEB`, `SHARED_PLATFORM`, `GENERATED`, `TEMPORARY`, or `UNKNOWN`. `UNKNOWN` is a deliberate result that requires review; it must not be silently treated as shared platform.

Run `npm run validate:project-ownership` to validate the contract. Run `npm run project:ownership-status` to classify current Git changes without modifying them.

When a new project gains a durable path boundary, add its owner ID and patterns with representative tests. Generated and temporary locations remain outside source ownership and should not be committed as implementation work.
