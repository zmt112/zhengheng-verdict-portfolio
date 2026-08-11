import { Suspense } from "react";
import { RuntimeCaseLoader } from "../runtime-case-loader";

export default function LocalAuditPage() { return <Suspense fallback={null}><RuntimeCaseLoader view="audit" /></Suspense>; }
