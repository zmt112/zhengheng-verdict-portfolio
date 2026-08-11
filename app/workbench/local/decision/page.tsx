import { Suspense } from "react";
import { RuntimeCaseLoader } from "../runtime-case-loader";

export default function LocalDecisionPage() { return <Suspense fallback={null}><RuntimeCaseLoader view="decision" /></Suspense>; }
