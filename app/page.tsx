import { redirect } from "next/navigation";
import { auth } from "@/auth";

// The proxy handles the root redirect for most requests.
// This server component handles any edge case where the proxy is bypassed.
export default async function RootPage() {
  const session = await auth();
  redirect(session ? "/calendar" : "/onboarding");
}
