import type { Metadata } from "next";
import { ProjectDetailClient } from "@/components/projects/ProjectDetailClient";

export const metadata: Metadata = { title: "Projet — Abricot" };

export default async function ProjetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetailClient id={id} />;
}
