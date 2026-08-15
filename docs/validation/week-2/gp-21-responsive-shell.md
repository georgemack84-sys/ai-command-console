# GP-21 Responsive Shell Qualification

Qualification requires the shell policy and negative fixtures, TypeScript, lint,
dependency-cruiser, unit coverage, Storybook browser checks, production frontend
build, Storybook build, authenticated runtime browser certification, and the
repository validation gate.

The controlled fixtures prove that validation fails for a feature-layer import,
missing current-page semantics, missing Escape behavior, raw shell color, and a
breakpoint divergent from GP-19. Browser coverage verifies the 1024px transition,
320px overflow, desktop collapse, modal focus/scroll behavior, skip navigation,
themes, reduced motion, and Axe serious/critical results.

Final command outcomes are recorded in the GP-21 commit handoff after all gates
complete. The implementation is classified `FOUNDATION_COMPATIBLE`.
