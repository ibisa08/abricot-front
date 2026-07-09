import type { Metadata } from "next";
import { AccountForm } from "@/components/account/AccountForm";

export const metadata: Metadata = { title: "Mon compte — Abricot" };

export default function ComptePage() {
  return (
    <section className="mx-auto w-full max-w-3xl">
      <AccountForm />
    </section>
  );
}
