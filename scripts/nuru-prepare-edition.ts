import "dotenv/config";
import { prepareTomorrowEdition } from "@/src/server/services/nuru-edition-service";

void prepareTomorrowEdition()
  .then((result) => {
    console.log(result.message);
    console.log(`Candidate date: ${result.candidate.editionAt.toISOString().slice(0, 10)} · ${result.candidate.discoveryIds.length} discoveries · status: ${result.candidate.status}`);
    process.exit(result.reviewRequired ? 2 : 0);
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
