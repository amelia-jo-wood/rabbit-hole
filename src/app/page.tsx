import { Suspense } from "react";
import HomeWizard from "@/components/HomeWizard";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeWizard />
    </Suspense>
  );
}
