import { useCallback, useEffect, useState } from "react";
import {
  ChevronRight,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  XCircle,
  FolderOpen,
  Package,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { deleteSkill, fetchSkills } from "@/lib/api";
import type { SkillInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ─── Skill Delete Confirm Dialog ─────────────────────────── */

function SkillDeleteConfirm({
  open,
  skillName,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  skillName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  return (
    <AlertDialog open={open} onOpenChange={(o) => (!o ? onCancel() : undefined)}>
      <AlertDialogContent
        className={cn(
          "w-[min(calc(100vw-2rem),22.75rem)] gap-0 rounded-[22px] p-5 text-center",
          "border border-border bg-background shadow-[0_22px_70px_rgba(0,0,0,0.22)]",
          "dark:border-white/14 dark:bg-[#2b2b2b] dark:shadow-[0_26px_90px_rgba(0,0,0,0.44)]",
          "sm:rounded-[22px] data-[state=open]:zoom-in-95",
        )}
      >
        <AlertDialogHeader className="items-center space-y-0 text-center">
          {/* icon */}
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-muted">
            <Sparkles className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={2} aria-hidden />
          </div>

          <AlertDialogTitle className="text-center text-[14px] font-medium leading-5 text-foreground">
            {t("skills.deleteDialogTitle", { name: skillName })}
          </AlertDialogTitle>

          <AlertDialogDescription className="mt-2 max-w-[17rem] text-center text-[12px] leading-4 text-muted-foreground">
            {t("skills.deleteDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-5 grid grid-cols-2 gap-2.5 space-x-0">
          <AlertDialogCancel
            onClick={onCancel}
            className="mt-0 h-10 rounded-[11px] border-0 bg-muted px-4 text-[14px] font-medium text-foreground shadow-none hover:bg-muted/80"
          >
            {t("skills.deleteCancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="h-10 rounded-[11px] bg-foreground px-4 text-[14px] font-medium text-background shadow-none hover:bg-foreground/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            {t("skills.deleteConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ─── Skills View ──────────────────────────────────────────── */

interface SkillsViewProps {
  onBack: () => void;
  token: string;
}

export function SkillsView({ onBack, token }: SkillsViewProps) {
  const { t } = useTranslation();
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SkillInfo | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSkills(token);
      setSkills(data.skills);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSkill(token, deleteTarget.name);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
      setDeleteTarget(null);
    }
  };

  const builtinSkills = skills.filter((s) => s.source === "builtin");
  const workspaceSkills = skills.filter((s) => s.source === "workspace");

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ChevronRight className="h-4 w-4 rotate-180" />
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-foreground/80" />
          <h1 className="text-sm font-semibold">{t("skills.title")}</h1>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {loading && skills.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            {t("skills.loading")}
          </div>
        ) : (
          <div className="space-y-6">
            {workspaceSkills.length > 0 && (
              <SkillGroup
                title={t("skills.workspace")}
                icon={<FolderOpen className="h-3.5 w-3.5" />}
                skills={workspaceSkills}
                onDelete={setDeleteTarget}
              />
            )}
            <SkillGroup
              title={t("skills.builtin")}
              icon={<Package className="h-3.5 w-3.5" />}
              skills={builtinSkills}
              onDelete={setDeleteTarget}
            />
            {skills.length === 0 && !error && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {t("skills.empty")}
              </div>
            )}
          </div>
        )}
      </div>

      <SkillDeleteConfirm
        open={deleteTarget !== null}
        skillName={deleteTarget?.name ?? ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

/* ─── Skill Group ──────────────────────────────────────────── */

function SkillGroup({
  title,
  icon,
  skills,
  onDelete,
}: {
  title: string;
  icon: React.ReactNode;
  skills: SkillInfo[];
  onDelete: (skill: SkillInfo) => void;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70 uppercase tracking-wide">
        {icon}
        {title}
        <span className="ml-1 text-[10px] font-normal text-muted-foreground/40">
          ({skills.length})
        </span>
      </div>
      <div className="space-y-1.5">
        {skills.map((skill) => (
          <SkillCard key={skill.name} skill={skill} onDelete={onDelete} />
        ))}
      </div>
    </section>
  );
}

/* ─── Skill Card ───────────────────────────────────────────── */

function SkillCard({
  skill,
  onDelete,
}: {
  skill: SkillInfo;
  onDelete: (skill: SkillInfo) => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors",
        skill.available
          ? "border-border/50 bg-background"
          : "border-amber-500/20 bg-amber-500/[0.03]",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold",
          skill.available
            ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
            : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        )}
      >
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[12.5px] font-medium leading-tight">
            {skill.name}
          </span>
          {skill.available ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-amber-500" />
          )}
        </div>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/70">
          {skill.description || "—"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide",
            skill.source === "workspace"
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
              : "bg-muted/60 text-muted-foreground/50",
          )}
        >
          {skill.source === "workspace" ? t("skills.workspaceBadge") : t("skills.builtinBadge")}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 hover:!bg-destructive/10 hover:!text-destructive"
          onClick={() => onDelete(skill)}
          aria-label={t("skills.deleteAria", { name: skill.name })}
          title={t("skills.deleteTitle")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
