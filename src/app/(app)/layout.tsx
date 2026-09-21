import { AppShell } from "@/components/layout/app-shell";
import type { ReactNode } from "react";

type ApplicationLayoutProps = {
  children: ReactNode;
};

export default function ApplicationLayout({ children }: ApplicationLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
