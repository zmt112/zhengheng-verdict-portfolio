import { CaseDecision } from "@/app/workbench/case-components";
import { demoCases } from "@/lib/cases";

export const dynamicParams = false;
export function generateStaticParams() { return demoCases.map((item) => ({ caseId: item.id })); }

export default async function DecisionPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const caseData = demoCases.find((item) => item.id === caseId) ?? demoCases[0];
  return <CaseDecision caseData={caseData} />;
}
