import { Suspense } from "react";
import { RuntimeCaseLoader } from "../runtime-case-loader";

export default function LocalCounterfactualPage() { return <Suspense fallback={null}><RuntimeCaseLoader view="counterfactual" /></Suspense>; }
