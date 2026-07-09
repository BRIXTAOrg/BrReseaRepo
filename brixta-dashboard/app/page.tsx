// app/page.tsx

import { redirect } from "next/navigation";

export default function Home() {
  // Instantly push users from localhost:3000 to localhost:3000/dashboard
  redirect("/dashboard");
}