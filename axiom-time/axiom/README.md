# Axiom OS adoption

This folder is the governance entry point for Axiom Time.

`contract-outline.md` is the reviewed, plain-language source for the Axiom OS
contract. It reflects the app's existing local-first behavior and explicit
command-confirmation boundary. Review it before expanding a capability,
connecting a service, or allowing an agent to act on behalf of a user.

## Generate the executable contract

The Axiom OS CLI is not bundled with this repository. After installing the CLI,
run the following from this project directory:

```powershell
axiom init --template local-private-app --agent codex
axiom define --guided
```

Keep the generated outline aligned with `contract-outline.md`, then use the
reviewed outline to create or update `app.ax`. Do not hand-author generated
artifacts until the installed CLI validates the contract.

## Verify policy before implementation changes

```powershell
axiom validate app.ax
axiom doctor
axiom simulate-examples
axiom generate app.ax --target typescript --out generated
axiom verify app.ax --target typescript --out generated --write
```

Treat a failed validation, simulation, or verification as a release blocker for
any change that expands access, introduces an external effect, or weakens an
approval boundary.
