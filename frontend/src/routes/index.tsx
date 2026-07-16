import { createFileRoute } from "@tanstack/react-router";
import ResuRankApp from "@/components/resurank/ResuRankApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResuRank AI — AI Resume Screener & Career Copilot" },
      {
        name: "description",
        content:
          "Score your resume against ATS engines, target specific job roles, and map your ideal career paths with AI-powered insights.",
      },
      { property: "og:title", content: "ResuRank AI — AI Resume Screener & Career Copilot" },
      {
        property: "og:description",
        content:
          "Instant ATS scoring, role-specific gap analysis, and career fit mapping — all in one sleek copilot.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResuRankApp,
});
