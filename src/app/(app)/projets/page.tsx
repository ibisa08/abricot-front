import type { Metadata } from "next";
import { ProjectsClient } from "@/components/projects/ProjectsClient";

export const metadata: Metadata = { title: "Projets — Abricot" };

export default function ProjetsPage() {
  return <ProjectsClient />;
}
