import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Swagger Documentation & QA Training Center - AutoDealership Enterprise",
  description: "Interactive Swagger API documentation and QA tester training hub for AutoDealership Enterprise platform.",
};

export default function ApiDocsPage() {
  return (
    <div className="w-full h-screen overflow-hidden bg-slate-900">
      <iframe
        src="/api-docs.html"
        title="AutoDealership Enterprise Swagger UI"
        className="w-full h-full border-0"
      />
    </div>
  );
}
