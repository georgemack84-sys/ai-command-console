import { redirect } from "next/navigation";

/** The personal edition is Nuru's single customer-facing entry point. */
export default function NuruPage() {
  redirect("/nuru/discover");
}
