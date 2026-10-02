import { redirect } from "next/navigation";

/** Keep old edition bookmarks within the current personal-edition experience. */
export default function LegacyEditionPage() {
  redirect("/nuru/discover");
}
