import { notFound } from "next/navigation";

import { TimelineCaseDetail } from "@/app/workbench/timeline-prototype/page";
import { timelineDemoCases } from "@/lib/timeline-demo-cases";

export const dynamicParams = false;

export function generateStaticParams() {
  return timelineDemoCases.map((item) => ({ caseId: item.id }));
}

export default async function CaseLifecyclePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  if (!timelineDemoCases.some((item) => item.id === caseId)) notFound();
  return <TimelineCaseDetail initialCaseId={caseId} showScenarioSwitcher={false} />;
}
