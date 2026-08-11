import { Suspense } from "react";
import { RuntimeCaseLoader } from "../runtime-case-loader";

export default function LocalRulesPage() { return <Suspense fallback={null}><RuntimeCaseLoader view="rules" /></Suspense>; }
