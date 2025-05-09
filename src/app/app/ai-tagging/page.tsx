
import type { Metadata } from "next";
import { TaggingForm } from "./components/tagging-form";

export const metadata: Metadata = {
  title: "AI Activity Tagging",
  description: "Automatically tag volunteer activities using AI.",
};

export default function AiTaggingPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <TaggingForm />
    </div>
  );
}
