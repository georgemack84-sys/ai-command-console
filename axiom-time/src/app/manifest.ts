import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Axiom Time",
    short_name: "Axiom Time",
    description: "Deterministic time with governed intelligence.",
    start_url: "/",
    display: "standalone",
    background_color: "#07121f",
    theme_color: "#07121f",
  };
}
