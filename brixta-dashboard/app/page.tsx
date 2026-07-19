// app/page.tsx

import { redirect } from "next/navigation";
import { auth0, auth0Enabled } from "@/lib/auth0";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (auth0Enabled && auth0 && !(await auth0.getSession())) {
    redirect("/login");
  }
  redirect("/dashboard");
}
