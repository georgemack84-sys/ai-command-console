import { createAdapterServer } from "./server.mjs";

const port = Number(process.env.PORT ?? 8787);
const allowedOrigins = (process.env.AXIOM_ADAPTER_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const server = createAdapterServer({ allowedOrigins });
server.listen(port, () => {
  console.log(`Axiom Time adapter listening on port ${port}.`);
});
