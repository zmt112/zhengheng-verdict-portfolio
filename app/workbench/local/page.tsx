import { Suspense } from "react";
import { RuntimeCaseLoader } from "./runtime-case-loader";

export default function LocalCasePage() { return <Suspense fallback={null}><RuntimeCaseLoader view="overview" /></Suspense>; }
