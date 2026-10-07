# Qualification candidates

`npm run qualify:change-set -- NURU-CS-####` compares current working-tree paths with the declared change-set boundary and ownership map. It reports contamination without modifying Git state. A candidate is ready only when no paths are unexpected or unknown and no required command remains declared.
