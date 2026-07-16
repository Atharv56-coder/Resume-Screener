import { useState, useCallback, useEffect, type ReactNode } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  Target,
  Compass,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Download,
  ArrowRight,
  Award,
  Zap,
  BookOpen,
  Lightbulb,
  Layout,
  ShieldAlert,
  TrendingUp,
  Loader2,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* ---------------- Dark Mode Hook ---------------- */
function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("resurank-dark");
    if (stored !== null) {
      setDark(stored === "true");
    } else {
      setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("resurank-dark", String(dark));
  }, [dark]);

  return { dark, toggleDark: () => setDark((d) => !d) };
}

type View = "ats" | "role" | "career";

const API_BASE = "http://localhost:8000";

/* ---- API types (matching backend camelCase responses) ---- */

interface AtsMetric {
  l: string;
  v: number;
  tone: string;
}
interface AtsImprovement {
  category: string;
  color: string;
  before: string;
  after: string;
  why: string;
}
interface AtsData {
  score: number;
  breakdown: AtsMetric[];
  strengths: string[];
  improvements: AtsImprovement[];
  filename: string;
  wordCount: number;
  pageCount: number;
}

interface RoleMatchData {
  role: string;
  score: number;
  matched: string[];
  missing: string[];
  certs: string[];
  projects: string[];
  templateGuidelines: { s: string; d: string }[];
}

interface CareerArchetype {
  title: string;
  description: string;
  skills: string[];
}
interface PerfectFit {
  title: string;
  difficulty: string;
  reasons: string[];
}
interface PivotableRole {
  title: string;
  difficulty: string;
  bridge: string[];
}
interface NotAFit {
  title: string;
  difficulty: string;
  barriers: string[];
}
interface CareerData {
  archetype: CareerArchetype;
  perfectFits: PerfectFit[];
  pivotableRoles: PivotableRole[];
  notAFit: NotAFit[];
}

/* ---------------- Layout ---------------- */

export function AppShell({
  children,
  view,
  setView,
}: {
  children: ReactNode;
  view: View;
  setView: (v: View) => void;
}) {
  const { dark, toggleDark } = useDarkMode();

  const nav: { id: View; label: string; icon: typeof Target; hint: string }[] = [
    {
      id: "ats",
      label: "ATS Dashboard",
      icon: Sparkles,
      hint: "Standalone resume scoring & rewrites",
    },
    { id: "role", label: "Role Matcher", icon: Target, hint: "Target a job & find your gaps" },
    {
      id: "career",
      label: "Career Explorer",
      icon: Compass,
      hint: "Perfect fits vs. pivots vs. barriers",
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
          <div className="px-5 py-6 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center shadow-[var(--shadow-glow)] overflow-hidden shrink-0">
              <img src="/logo.png" alt="ResuRank AI" className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold tracking-tight text-[15px] truncate">ResuRank AI</div>
              <div className="text-[11px] text-sidebar-foreground/60">Career Copilot</div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleDark}
                  className="ml-auto h-7 w-7 flex items-center justify-center rounded-md hover:bg-sidebar-accent/60 transition text-sidebar-foreground/60 hover:text-sidebar-foreground shrink-0"
                  aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{dark ? "Light mode" : "Dark mode"}</TooltipContent>
            </Tooltip>
          </div>
          <nav className="px-3 mt-2 space-y-1 flex-1">
            {nav.map((n) => {
              const Icon = n.icon;
              const active = view === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setView(n.id)}
                  className={cn(
                    "group w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_var(--sidebar-border)]"
                      : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 mt-0.5 shrink-0",
                      active ? "text-accent" : "text-sidebar-foreground/60",
                    )}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{n.label}</div>
                    <div className="text-[11px] text-sidebar-foreground/50 leading-tight mt-0.5">
                      {n.hint}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
          <div className="p-4 m-3 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Zap className="h-3.5 w-3.5 text-warning" />
              Pro Tip
            </div>
            <p className="text-[11px] text-sidebar-foreground/70 mt-1.5 leading-relaxed">
              Re-run analysis after each rewrite — scores update in real-time.
            </p>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top mobile nav */}
          <header className="md:hidden sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
            <div className="flex items-center gap-2 px-4 py-3">
              <div className="h-7 w-7 rounded-md overflow-hidden shrink-0">
                <img src="/logo.png" alt="ResuRank AI" className="h-full w-full object-cover" />
              </div>
              <span className="font-semibold text-sm flex-1">ResuRank AI</span>
              <button
                onClick={toggleDark}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition text-muted-foreground"
                aria-label={dark ? "Light mode" : "Dark mode"}
              >
                {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="flex px-2 pb-2 gap-1">
              {nav.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setView(n.id)}
                  className={cn(
                    "flex-1 text-xs px-2 py-1.5 rounded-md transition",
                    view === n.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 md:py-12">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

/* ---------------- Shared: Dropzone + Score Ring ---------------- */

interface DropzoneProps {
  compact?: boolean;
  onFileReady?: (file: File) => void;
  externalLoading?: boolean;
  externalFilename?: string;
  externalDone?: boolean;
  externalWordCount?: number;
  externalPageCount?: number;
}

export function Dropzone({
  compact = false,
  onFileReady,
  externalLoading,
  externalFilename,
  externalDone,
  externalWordCount,
  externalPageCount,
}: DropzoneProps) {
  const [internalState, setInternalState] = useState<"idle" | "loading" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [filename, setFilename] = useState("");

  // If external state is provided, use it
  const state = externalLoading ? "loading" : externalDone ? "done" : internalState;
  const displayFilename = externalFilename || filename;
  const wordCount = externalWordCount ?? 0;
  const pageCount = externalPageCount ?? 1;

  const onFile = (f: File | null | undefined) => {
    if (!f) return;
    setFilename(f.name);

    if (onFileReady) {
      // Let parent handle the loading state
      onFileReady(f);
    } else {
      // Standalone animation (fallback)
      setInternalState("loading");
      setProgress(0);
      let p = 0;
      const iv = setInterval(() => {
        p += 8 + Math.random() * 12;
        setProgress(Math.min(100, p));
        if (p >= 100) {
          clearInterval(iv);
          setTimeout(() => setInternalState("done"), 400);
        }
      }, 180);
    }
  };

  return (
    <Card
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onFile(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "relative overflow-hidden border-2 border-dashed transition-all",
        state === "idle" && "border-border hover:border-accent hover:bg-accent/[0.03]",
        state === "loading" && "border-accent bg-accent/[0.04]",
        state === "done" && "border-success/40 bg-success-soft/40",
        compact ? "p-5" : "p-8",
      )}
    >
      {state === "loading" ? (
        <div className="flex flex-col items-center text-center gap-3">
          <div className="h-11 w-11 rounded-full bg-accent/10 flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-accent animate-spin" />
          </div>
          <div>
            <div className="text-sm font-medium">AI Parsing & Analyzing…</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Extracting entities, scoring keywords, and benchmarking layout
            </div>
          </div>
          <div className="w-full max-w-sm">
            <Progress value={undefined} className="h-1.5" />
            <div className="text-[11px] text-muted-foreground mt-1.5 text-right tabular-nums">
              Analyzing…
            </div>
          </div>
        </div>
      ) : state === "done" ? (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-success/15 text-success flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{displayFilename}</div>
              <div className="text-xs text-success flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="h-3 w-3" /> Parsed successfully · {pageCount} page
                {pageCount > 1 ? "s" : ""} · {wordCount} words
              </div>
            </div>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <Button variant="outline" size="sm" asChild>
              <span>Re-upload</span>
            </Button>
          </label>
        </div>
      ) : (
        <label className="flex flex-col items-center text-center gap-3 cursor-pointer">
          <input
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
            <Upload className="h-5 w-5 text-accent" />
          </div>
          <div>
            <div className="text-sm font-medium">Drop your resume here</div>
            <div className="text-xs text-muted-foreground mt-0.5">PDF or DOCX · up to 10 MB</div>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <span>Or click to browse</span>
          </Button>
        </label>
      )}
    </Card>
  );
}

export function ScoreRing({
  score,
  size = 180,
  label = "ATS Score",
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;

  const tone =
    score >= 75
      ? { color: "var(--success)", text: "text-success", chip: "bg-success-soft text-success" }
      : score >= 50
        ? {
            color: "var(--warning)",
            text: "text-warning",
            chip: "bg-warning-soft text-warning-foreground",
          }
        : { color: "var(--danger)", text: "text-danger", chip: "bg-danger-soft text-danger" };

  const rating = score >= 75 ? "Strong" : score >= 50 ? "Needs work" : "At risk";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            stroke="var(--muted)"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            stroke={tone.color}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.2,.7,.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={cn("text-4xl font-semibold tabular-nums tracking-tight", tone.text)}>
            {score}
          </div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">
            / 100
          </div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-sm font-medium">{label}</div>
        <span
          className={cn(
            "inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium",
            tone.chip,
          )}
        >
          <TrendingUp className="h-3 w-3" /> {rating}
        </span>
      </div>
    </div>
  );
}

/* ---------------- View 1: ATS Dashboard ---------------- */

function ImprovementCard({ item }: { item: AtsImprovement }) {
  const [open, setOpen] = useState(false);
  const badgeTone: Record<string, string> = {
    info: "bg-info-soft text-info",
    accent: "bg-accent/15 text-accent",
    warning: "bg-warning-soft text-warning-foreground",
    success: "bg-success-soft text-success",
  };
  return (
    <Card className="p-4 md:p-5 hover:shadow-[var(--shadow-elegant)] transition-shadow">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium",
            badgeTone[item.color],
          )}
        >
          {item.category}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-[11px] text-muted-foreground">High impact</span>
          </TooltipTrigger>
          <TooltipContent>Estimated +4 ATS points if applied</TooltipContent>
        </Tooltip>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-danger/20 bg-danger-soft/40 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-danger/80 mb-1.5">
            Your Original
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed line-through decoration-danger/40">
            {item.before}
          </p>
        </div>
        <div className="rounded-lg border border-success/25 bg-success-soft/60 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-success mb-1.5 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> AI Suggested
          </div>
          <p className="text-sm text-foreground leading-relaxed font-medium">{item.after}</p>
        </div>
      </div>
      <button
        onClick={() => setOpen(!open)}
        className="mt-3 w-full flex items-center justify-between px-3 py-2 rounded-md bg-muted/60 hover:bg-muted transition text-xs font-medium"
      >
        <span className="flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-warning" /> Why this boosts ATS rank
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="mt-2 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed border-l-2 border-warning/60 bg-warning-soft/30 rounded-r-md">
          {item.why}
        </div>
      )}
    </Card>
  );
}

export function AtsDashboard({
  file,
  atsData,
  setAtsData,
  onFileReady,
}: {
  file: File | null;
  atsData: AtsData | null;
  setAtsData: (data: AtsData | null) => void;
  onFileReady: (file: File) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (f: File) => {
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", f);
        const res = await fetch(`${API_BASE}/api/analyze-resume`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(errBody.detail || `Server error ${res.status}`);
        }
        const data: AtsData = await res.json();
        setAtsData(data);
      } catch (e) {
        const err = e as Error;
        setError(err.message || "Failed to analyze resume");
      } finally {
        setLoading(false);
      }
    },
    [setAtsData],
  );

  useEffect(() => {
    if (file && !atsData && !loading && !error) {
      handleFile(file);
    }
  }, [file, atsData, loading, error, handleFile]);

  const handleFileReady = (f: File) => {
    onFileReady(f);
    handleFile(f);
  };

  return (
    <div className="space-y-8">
      <header>
        <div className="text-xs font-medium text-accent uppercase tracking-wider">
          ATS Dashboard
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
          Resume scoring & AI improvements
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
          Upload your resume and get an instant ATS compatibility score with actionable,
          line-by-line rewrites.
        </p>
      </header>

      <Dropzone
        onFileReady={handleFileReady}
        externalLoading={loading}
        externalDone={!!atsData}
        externalFilename={file?.name || atsData?.filename}
        externalWordCount={atsData?.wordCount}
        externalPageCount={atsData?.pageCount}
      />

      {error && (
        <Card className="p-4 border-danger/40 bg-danger-soft/40">
          <div className="flex items-center gap-2 text-sm text-danger font-medium">
            <XCircle className="h-4 w-4" /> {error}
          </div>
        </Card>
      )}

      {atsData && (
        <>
          <div className="grid md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-center bg-card border rounded-2xl p-6 md:p-8 shadow-[var(--shadow-elegant)]">
            <ScoreRing score={atsData.score} />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">
                {atsData.score >= 75
                  ? "Your resume is strong — minor tweaks can push it to the top."
                  : atsData.score >= 50
                    ? "Your resume is competitive — with room to sharpen."
                    : "Your resume needs significant improvements to pass ATS filters."}
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {atsData.score >= 75
                  ? "You're clearing most keyword filters. Apply the suggestions below to stay in the top decile."
                  : atsData.score >= 50
                    ? "You're clearing most keyword filters. Focus on the quantification & formatting fixes below to push into the top decile."
                    : "Focus on the improvements below to get past automated resume screens."}
              </p>
              <div className="grid grid-cols-3 gap-3 mt-5">
                {atsData.breakdown.map((m) => (
                  <div key={m.l} className="rounded-lg border p-3">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {m.l}
                    </div>
                    <div className="text-lg font-semibold tabular-nums mt-0.5">{m.v}</div>
                    <Progress value={m.v} className="h-1 mt-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-success" /> Strengths
            </h2>
            <div className="mt-3 grid md:grid-cols-2 gap-2.5">
              {atsData.strengths.map((s) => (
                <div
                  key={s}
                  className="flex items-start gap-2.5 rounded-lg bg-success-soft/50 border border-success/20 px-3 py-2.5"
                >
                  <span className="mt-0.5 h-5 w-5 rounded-full bg-success/20 text-success flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3 w-3" />
                  </span>
                  <p className="text-sm text-foreground/90 leading-snug">{s}</p>
                </div>
              ))}
            </div>
          </section>

          {atsData.improvements.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" /> Dynamic Improvements
                </h2>
                <span className="text-xs text-muted-foreground">
                  {atsData.improvements.length} suggestions
                </span>
              </div>
              <div className="mt-3 space-y-3">
                {atsData.improvements.map((it, i) => (
                  <ImprovementCard key={i} item={it} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- View 2: Role Matcher ---------------- */

export function RoleMatcher({
  file,
  roleData,
  setRoleData,
  role,
  setRole,
  onFileReady,
}: {
  file: File | null;
  roleData: RoleMatchData | null;
  setRoleData: (data: RoleMatchData | null) => void;
  role: string;
  setRole: (role: string) => void;
  onFileReady: (file: File) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (f: File) => {
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", f);
        formData.append("role", role);
        const res = await fetch(`${API_BASE}/api/match-role`, { method: "POST", body: formData });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(errBody.detail || `Server error ${res.status}`);
        }
        const data: RoleMatchData = await res.json();
        setRoleData(data);
      } catch (e) {
        const err = e as Error;
        setError(err.message || "Failed to match role");
      } finally {
        setLoading(false);
      }
    },
    [role, setRoleData],
  );

  // Automatically fetch if we have a file but no roleData yet
  useEffect(() => {
    if (file && !roleData && !loading && !error) {
      handleFile(file);
    }
  }, [file, roleData, loading, error, handleFile]);

  // Re-analyze when role changes if we have a file
  const handleRoleSubmit = useCallback(async () => {
    if (file) {
      await handleFile(file);
    }
  }, [file, handleFile]);

  const handleFileReady = (f: File) => {
    onFileReady(f);
    handleFile(f);
  };

  const matched = roleData?.matched ?? [];
  const missing = roleData?.missing ?? [];

  return (
    <div className="space-y-8">
      <header>
        <div className="text-xs font-medium text-accent uppercase tracking-wider">Role Matcher</div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
          Target a job. Close the gap.
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
          Enter a target role and we'll benchmark your resume against real hiring signals for that
          title.
        </p>
      </header>

      <Card className="p-5 md:p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Target Role
            </label>
            <div className="relative mt-1.5">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRoleSubmit();
                }}
                placeholder="e.g. Senior Frontend Engineer"
                className="pl-9 h-10"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Your Resume
            </label>
            <div className="mt-1.5">
              <Dropzone
                compact
                onFileReady={handleFileReady}
                externalLoading={loading}
                externalDone={!!roleData}
                externalFilename={file ? file.name : undefined}
                externalWordCount={undefined}
                externalPageCount={undefined}
              />
            </div>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="p-4 border-danger/40 bg-danger-soft/40">
          <div className="flex items-center gap-2 text-sm text-danger font-medium">
            <XCircle className="h-4 w-4" /> {error}
          </div>
        </Card>
      )}

      {roleData && (
        <>
          <div className="grid md:grid-cols-[auto_1fr] gap-8 items-center bg-card border rounded-2xl p-6 md:p-8">
            <ScoreRing score={roleData.score} label="Role Match" />
            <div className="grid md:grid-cols-2 gap-5 min-w-0">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="h-6 w-6 rounded-full bg-success/15 text-success flex items-center justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  Matched Skills
                  <Badge variant="secondary" className="ml-1 text-[10px] h-5">
                    {matched.length}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {matched.map((s) => (
                    <span
                      key={s}
                      className="group inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full bg-success-soft border border-success/25 text-success text-xs font-medium hover:bg-success/15 transition"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="h-6 w-6 rounded-full bg-danger/15 text-danger flex items-center justify-center">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </span>
                  Missing Critical Skills
                  <Badge variant="secondary" className="ml-1 text-[10px] h-5">
                    {missing.length}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {missing.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full bg-danger-soft border border-danger/25 text-danger text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Card className="p-6 md:p-7 border-accent/25 bg-gradient-to-br from-accent/[0.04] to-transparent">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                <ArrowRight className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-semibold">Bridge the Gap</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">
              Concrete moves to get you interview-ready for a{" "}
              <span className="font-medium text-foreground">{roleData.role}</span> role.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-5">
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                  <BookOpen className="h-4 w-4 text-info" /> Recommended Certifications
                </div>
                <ul className="space-y-2">
                  {roleData.certs.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm text-foreground/90">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-info shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                  <Lightbulb className="h-4 w-4 text-warning" /> Tailored Project Ideas
                </div>
                <ul className="space-y-2">
                  {roleData.projects.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-foreground/90">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Layout className="h-4 w-4" /> Template Guidelines
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Ideal layout for {roleData.role}</SheetTitle>
                  <SheetDescription>
                    Industry-standard structure ranked in the top 10% of ATS scans for this role.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4 px-4 pb-6">
                  {roleData.templateGuidelines.map((b, i) => (
                    <div key={b.s} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <span className="h-5 w-5 rounded-full bg-accent/15 text-accent text-[11px] flex items-center justify-center font-semibold">
                          {i + 1}
                        </span>
                        {b.s}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{b.d}</p>
                    </div>
                  ))}
                  <Button className="w-full mt-2">
                    <Download className="h-4 w-4" /> Download template (.docx)
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- View 3: Career Explorer ---------------- */

function CareerCard({
  title,
  difficulty,
  items,
  tone,
  icon: Icon,
  itemLabel,
}: {
  title: string;
  difficulty: string;
  items: string[];
  tone: "success" | "warning" | "danger";
  icon: typeof CheckCircle2;
  itemLabel: string;
}) {
  const toneMap = {
    success: {
      border: "border-success/30",
      bg: "bg-success-soft/40",
      chip: "bg-success/15 text-success",
      dot: "bg-success",
      accent: "text-success",
    },
    warning: {
      border: "border-warning/40",
      bg: "bg-warning-soft/40",
      chip: "bg-warning/20 text-warning-foreground",
      dot: "bg-warning",
      accent: "text-warning-foreground",
    },
    danger: {
      border: "border-muted-foreground/25",
      bg: "bg-muted/40",
      chip: "bg-danger/15 text-danger",
      dot: "bg-muted-foreground/60",
      accent: "text-danger",
    },
  }[tone];

  return (
    <Card
      className={cn(
        "p-5 border-2 transition-transform hover:-translate-y-0.5",
        toneMap.border,
        toneMap.bg,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {itemLabel}
          </div>
          <h3 className="text-base font-semibold mt-0.5 truncate">{title}</h3>
        </div>
        <div
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
            toneMap.chip,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium",
            toneMap.chip,
          )}
        >
          Transition: {difficulty}
        </span>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((it) => (
          <li
            key={it}
            className="flex items-start gap-2 text-xs text-foreground/85 leading-relaxed"
          >
            <span className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", toneMap.dot)} />
            {it}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function CareerExplorer({
  file,
  careerData,
  setCareerData,
  onFileReady,
}: {
  file: File | null;
  careerData: CareerData | null;
  setCareerData: (data: CareerData | null) => void;
  onFileReady: (file: File) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (f: File) => {
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", f);
        const res = await fetch(`${API_BASE}/api/explore-career`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(errBody.detail || `Server error ${res.status}`);
        }
        const data: CareerData = await res.json();
        setCareerData(data);
      } catch (e) {
        const err = e as Error;
        setError(err.message || "Failed to explore career");
      } finally {
        setLoading(false);
      }
    },
    [setCareerData],
  );

  // Automatically fetch if we have a file but no careerData yet
  useEffect(() => {
    if (file && !careerData && !loading && !error) {
      handleFile(file);
    }
  }, [file, careerData, loading, error, handleFile]);

  const handleFileReady = (f: File) => {
    onFileReady(f);
    handleFile(f);
  };

  return (
    <div className="space-y-8">
      <header>
        <div className="text-xs font-medium text-accent uppercase tracking-wider">
          Career Explorer
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
          Where your profile actually wins
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
          Upload your resume and we'll map your perfect fits, pivotable roles, and structural
          barriers — based on your skills, trajectory, and market signals.
        </p>
      </header>

      <Dropzone
        onFileReady={handleFileReady}
        externalLoading={loading}
        externalDone={!!careerData}
        externalFilename={file ? file.name : undefined}
      />

      {error && (
        <Card className="p-4 border-danger/40 bg-danger-soft/40">
          <div className="flex items-center gap-2 text-sm text-danger font-medium">
            <XCircle className="h-4 w-4" /> {error}
          </div>
        </Card>
      )}

      {careerData && (
        <>
          <Card className="p-6 md:p-7 relative overflow-hidden bg-[image:var(--gradient-hero)] text-white border-0">
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.4), transparent 50%)",
              }}
            />
            <div className="relative">
              <div className="text-[11px] uppercase tracking-wider opacity-80">Your Archetype</div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
                {careerData.archetype.title}
              </h2>
              <p className="text-sm opacity-90 mt-2 max-w-2xl leading-relaxed">
                {careerData.archetype.description}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {careerData.archetype.skills.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] px-2 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-success" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-success">
                Perfect Fits
              </h2>
              <span className="text-xs text-muted-foreground">— Apply aggressively</span>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {careerData.perfectFits.map((c) => (
                <CareerCard
                  key={c.title}
                  title={c.title}
                  difficulty={c.difficulty}
                  items={c.reasons}
                  tone="success"
                  icon={CheckCircle2}
                  itemLabel="Green Flag"
                />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-warning" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-warning-foreground">
                Pivotable Roles
              </h2>
              <span className="text-xs text-muted-foreground">
                — Bridgeable with focused upskilling
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {careerData.pivotableRoles.map((c) => (
                <CareerCard
                  key={c.title}
                  title={c.title}
                  difficulty={c.difficulty}
                  items={c.bridge}
                  tone="warning"
                  icon={AlertTriangle}
                  itemLabel="Amber Flag · Bridge required"
                />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                High Barriers — Not a Fit Right Now
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {careerData.notAFit.map((c) => (
                <CareerCard
                  key={c.title}
                  title={c.title}
                  difficulty={c.difficulty}
                  items={c.barriers}
                  tone="danger"
                  icon={ShieldAlert}
                  itemLabel="Structural Barrier"
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* ---------------- Root ---------------- */

export default function ResuRankApp() {
  const [view, setView] = useState<View>("ats");
  const [file, setFile] = useState<File | null>(null);
  const [atsData, setAtsData] = useState<AtsData | null>(null);
  const [roleData, setRoleData] = useState<RoleMatchData | null>(null);
  const [careerData, setCareerData] = useState<CareerData | null>(null);
  const [role, setRole] = useState("Frontend Engineer");

  const handleFileReady = useCallback((newFile: File) => {
    setFile(newFile);
    setAtsData(null);
    setRoleData(null);
    setCareerData(null);
  }, []);

  return (
    <AppShell view={view} setView={setView}>
      {view === "ats" && (
        <AtsDashboard
          file={file}
          atsData={atsData}
          setAtsData={setAtsData}
          onFileReady={handleFileReady}
        />
      )}
      {view === "role" && (
        <RoleMatcher
          file={file}
          roleData={roleData}
          setRoleData={setRoleData}
          role={role}
          setRole={setRole}
          onFileReady={handleFileReady}
        />
      )}
      {view === "career" && (
        <CareerExplorer
          file={file}
          careerData={careerData}
          setCareerData={setCareerData}
          onFileReady={handleFileReady}
        />
      )}
    </AppShell>
  );
}
