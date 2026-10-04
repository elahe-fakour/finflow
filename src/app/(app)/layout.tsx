import { AppShell } from "@/components/layout/app-shell";
import { requireCurrentUser } from "@/lib/auth/current-user";
import type { ReactNode } from "react";

type ApplicationLayoutProps = {
  children: ReactNode;
};

export default async function ApplicationLayout({ children }: ApplicationLayoutProps) {
  const user = await requireCurrentUser();

  return <AppShell user={user}>{children}</AppShell>;
}
