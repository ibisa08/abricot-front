import type { Metadata } from "next";
import { DashboardClient, type DashboardView } from "@/components/dashboard/DashboardClient";

export const metadata: Metadata = { title: "Tableau de bord — Abricot" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const initialView: DashboardView = view === "kanban" ? "kanban" : "liste";
  return <DashboardClient initialView={initialView} />;
}
