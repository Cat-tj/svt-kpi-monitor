"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CalendarDays,
  X,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { RoleGuard } from "@/components/ui/role-guard";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewMode = "week" | "month";
type ScheduleStatus = "upcoming" | "in_progress" | "overdue";

interface Task {
  id: string;
  name: string;
  departmentId: string | null;
  departmentName: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  start: Date;
  due: Date;
  startKey: string;
  dueKey: string;
  status: ScheduleStatus;
}

const LABELS = {
  en: {
    calendar: "Calendar", subtitle: "Project & task schedule", week: "Week", month: "Month", today: "Today",
    loading: "Loading tasks...", empty: "No tasks scheduled for the period shown.", failed: "Failed to load calendar data.", retry: "Retry",
    details: "Task Details", project: "Project", person: "Person", department: "Department",
    allProjects: "All projects", allPeople: "All people", allDepartments: "All departments", unassigned: "Unassigned",
    status: "Status", start: "Start", due: "Deadline", duration: "Duration", days: "days",
    noStatus: "No status selected.", more: (n: number) => `+${n} more`,
    months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
    weekdays: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    statusLabel: { upcoming: "Upcoming", in_progress: "In progress", overdue: "Overdue" } as Record<ScheduleStatus, string>,
  },
  id: {
    calendar: "Kalender", subtitle: "Jadwal proyek & tugas", week: "Minggu", month: "Bulan", today: "Hari Ini",
    loading: "Memuat tugas...", empty: "Tidak ada tugas terjadwal.", failed: "Gagal memuat data.", retry: "Coba Lagi",
    details: "Detail Tugas", project: "Proyek", person: "Orang", department: "Departemen",
    allProjects: "Semua proyek", allPeople: "Semua orang", allDepartments: "Semua departemen", unassigned: "Tanpa PJ",
    status: "Status", start: "Mulai", due: "Tenggat", duration: "Durasi", days: "hari",
    noStatus: "Tidak ada status dipilih.", more: (n: number) => `+${n} lainnya`,
    months: ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"],
    weekdays: ["Sen","Sel","Rab","Kam","Jum","Sab","Min"],
    statusLabel: { upcoming: "Akan datang", in_progress: "Berjalan", overdue: "Terlambat" } as Record<ScheduleStatus, string>,
  },
};

const STATUS_STYLE: Record<ScheduleStatus, { bar: string; chip: string }> = {
  upcoming: { bar: "bg-brand-500", chip: "bg-brand-50 text-brand-700 border-brand-200" },
  in_progress: { bar: "bg-amber-500", chip: "bg-amber-50 text-amber-700 border-amber-200" },
  overdue: { bar: "bg-red-500", chip: "bg-red-50 text-red-700 border-red-200" },
};

const ALL_STATUSES: ScheduleStatus[] = ["upcoming", "in_progress", "overdue"];
const MAX_MONTH = 3;
const MAX_WEEK = 6;
const UNASSIGNED = "__unassigned__";

function toKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function parseKey(key: string) { const [y,m,d] = key.split("-").map(Number); return new Date(y,(m||1)-1,d||1); }
function isSameDay(a: Date, b: Date) { return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(); }
function addDays(d: Date, n: number) { return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n); }
function addMonths(d: Date, n: number) { const f=new Date(d.getFullYear(),d.getMonth()+n,1); const dim=new Date(f.getFullYear(),f.getMonth()+1,0).getDate(); return new Date(f.getFullYear(),f.getMonth(),Math.min(d.getDate(),dim)); }
function startOfWeekMonday(d: Date) { return addDays(new Date(d.getFullYear(),d.getMonth(),d.getDate()),-((d.getDay()+6)%7)); }
function monthGrid(f: Date) { const first=new Date(f.getFullYear(),f.getMonth(),1); const gs=startOfWeekMonday(first); const lo=Math.round((first.getTime()-gs.getTime())/86400000); const wks=Math.ceil((lo+new Date(f.getFullYear(),f.getMonth()+1,0).getDate())/7); return Array.from({length:wks*7},(_,i)=>addDays(gs,i)); }
function weekGrid(f: Date) { const s=startOfWeekMonday(f); return Array.from({length:7},(_,i)=>addDays(s,i)); }
function deriveStatus(start: Date, due: Date, today: Date): ScheduleStatus { const t=new Date(today.getFullYear(),today.getMonth(),today.getDate()); if(due<t) return "overdue"; if(start>t) return "upcoming"; return "in_progress"; }

function CalendarView() {
  const { locale } = useI18n();
  const L = LABELS[locale === "id" ? "id" : "en"];

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [userPickedView, setUserPickedView] = useState(false);
  const [focusedDate, setFocusedDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Record<ScheduleStatus, boolean>>({ upcoming: true, in_progress: true, overdue: true });
  const [projectFilter, setProjectFilter] = useState("all");
  const [personFilter, setPersonFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [selected, setSelected] = useState<Task | null>(null);
  const [dayModal, setDayModal] = useState<{ date: Date; items: Task[] } | null>(null);

  useEffect(() => { if (!userPickedView) setViewMode(window.innerWidth < 768 ? "week" : "month"); }, [userPickedView]);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    const { data, error: err } = await apiGet<any[]>("/api/data/kpis");
    if (err || !data) { setError(true); setLoading(false); return; }
    const today = new Date();
    const mapped: Task[] = [];
    for (const row of data) {
      if (!row.start_date || !row.due_date) continue;
      const start = parseKey(row.start_date); const due = parseKey(row.due_date);
      if (isNaN(start.getTime()) || isNaN(due.getTime())) continue;
      mapped.push({ id: row.id, name: row.name, departmentId: row.department?.id ?? null, departmentName: row.department?.name ?? null, assigneeId: row.assigned_to ?? null, assigneeName: row.assignee?.full_name ?? null, start, due, startKey: toKey(start), dueKey: toKey(due), status: deriveStatus(start, due, today) });
    }
    setTasks(mapped); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const projectOptions = useMemo(() => tasks.map(t => ({ id: t.id, name: t.name })).sort((a,b) => a.name.localeCompare(b.name)), [tasks]);
  const personOptions = useMemo(() => { const m = new Map<string,string>(); let u=false; tasks.forEach(t => { if(t.assigneeId) m.set(t.assigneeId, t.assigneeName||t.assigneeId); else u=true; }); const a = Array.from(m.entries()).map(([id,name])=>({id,name})).sort((a,b)=>a.name.localeCompare(b.name)); if(u) a.push({id:UNASSIGNED,name:L.unassigned}); return a; }, [tasks, L.unassigned]);
  const deptOptions = useMemo(() => { const m = new Map<string,string>(); tasks.forEach(t => { if(t.departmentId) m.set(t.departmentId, t.departmentName||t.departmentId); }); return Array.from(m.entries()).map(([id,name])=>({id,name})).sort((a,b)=>a.name.localeCompare(b.name)); }, [tasks]);

  const filtered = useMemo(() => tasks.filter(t => {
    if (!statusFilter[t.status]) return false;
    if (projectFilter !== "all" && t.id !== projectFilter) return false;
    if (personFilter !== "all") { if (personFilter === UNASSIGNED) { if (t.assigneeId) return false; } else if (t.assigneeId !== personFilter) return false; }
    if (deptFilter !== "all" && t.departmentId !== deptFilter) return false;
    return true;
  }), [tasks, statusFilter, projectFilter, personFilter, deptFilter]);

  const cells = useMemo(() => viewMode === "month" ? monthGrid(focusedDate) : weekGrid(focusedDate), [viewMode, focusedDate]);
  const rangeStart = cells[0]; const rangeEnd = cells[cells.length - 1];

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of filtered) {
      if (t.due < rangeStart || t.start > rangeEnd) continue;
      const from = t.start < rangeStart ? rangeStart : t.start;
      const to = t.due > rangeEnd ? rangeEnd : t.due;
      for (let d = from; d <= to; d = addDays(d, 1)) { const key = toKey(d); const arr = map.get(key) ?? []; arr.push(t); map.set(key, arr); }
    }
    for (const arr of Array.from(map.values())) arr.sort((a,b) => a.startKey.localeCompare(b.startKey) || a.name.localeCompare(b.name));
    return map;
  }, [filtered, rangeStart, rangeEnd]);

  const noStatusSelected = !statusFilter.upcoming && !statusFilter.in_progress && !statusFilter.overdue;
  const today = new Date();
  const periodLabel = viewMode === "month" ? `${L.months[focusedDate.getMonth()]} ${focusedDate.getFullYear()}` : `${toKey(cells[0])} → ${toKey(cells[cells.length-1])}`;
  const maxVisible = viewMode === "month" ? MAX_MONTH : MAX_WEEK;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50"><CalendarDays className="h-5 w-5 text-brand-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">{L.calendar}</h1><p className="text-sm text-gray-500">{L.subtitle} · {periodLabel}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 p-0.5">
            {(["week","month"] as ViewMode[]).map(m => <button key={m} onClick={() => { setUserPickedView(true); setViewMode(m); }} className={cn("min-h-[44px] rounded-md px-3 text-sm font-medium sm:min-h-0 sm:py-1.5", viewMode===m?"bg-brand-50 text-brand-700":"text-gray-500 hover:bg-gray-50")}>{m==="week"?L.week:L.month}</button>)}
          </div>
          <button onClick={() => setFocusedDate(d => viewMode==="month"?addMonths(d,-1):addDays(d,-7))} className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 sm:h-9 sm:w-9"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => setFocusedDate(new Date())} className="min-h-[44px] rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:min-h-0 sm:py-2">{L.today}</button>
          <button onClick={() => setFocusedDate(d => viewMode==="month"?addMonths(d,1):addDays(d,7))} className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 sm:h-9 sm:w-9"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {ALL_STATUSES.map(s => <button key={s} onClick={() => setStatusFilter(f => ({...f,[s]:!f[s]}))} className={cn("flex min-h-[44px] items-center gap-1.5 rounded-full border px-3 text-xs font-medium sm:min-h-0 sm:py-1.5", statusFilter[s]?STATUS_STYLE[s].chip:"border-gray-200 bg-gray-50 text-gray-400")}><span className={cn("h-2 w-2 rounded-full", statusFilter[s]?STATUS_STYLE[s].bar:"bg-gray-300")} />{L.statusLabel[s]}</button>)}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <FilterSelect label={L.project} value={projectFilter} onChange={setProjectFilter} allLabel={L.allProjects} options={projectOptions} />
          <FilterSelect label={L.person} value={personFilter} onChange={setPersonFilter} allLabel={L.allPeople} options={personOptions} />
          <FilterSelect label={L.department} value={deptFilter} onChange={setDeptFilter} allLabel={L.allDepartments} options={deptOptions} />
        </div>
      </div>

      {error && <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"><span className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5" />{L.failed}</span><button onClick={load} className="rounded-md bg-red-600 px-2.5 py-1 font-medium text-white hover:bg-red-700">{L.retry}</button></div>}

      {loading && tasks.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-gray-400"><Loader2 className="h-7 w-7 animate-spin text-brand-500" /><p className="text-sm">{L.loading}</p></div>
      ) : noStatusSelected ? (
        <div className="flex h-64 items-center justify-center text-sm text-gray-500">{L.noStatus}</div>
      ) : (
        <div className="relative">
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-t-xl border border-border bg-border text-center">
            {L.weekdays.map(w => <div key={w} className="bg-surface-tertiary py-2 text-[11px] font-semibold uppercase text-gray-500">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-b-xl border-x border-b border-border bg-border">
            {cells.map(cell => {
              const key = toKey(cell); const items = byDay.get(key) ?? [];
              const inMonth = viewMode==="week" || cell.getMonth()===focusedDate.getMonth();
              const isToday = isSameDay(cell, today); const visible = items.slice(0, maxVisible); const overflow = items.length - visible.length;
              return (
                <div key={key} className={cn("flex flex-col bg-surface p-1.5", viewMode==="week"?"min-h-[60vh]":"min-h-[104px]", !inMonth&&"bg-surface-secondary")}>
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium mb-1", isToday?"bg-brand-600 text-white":inMonth?"text-gray-700":"text-gray-300")}>{cell.getDate()}</span>
                  <div className="flex-1 space-y-1">
                    {visible.map(t => { const isStart=key===t.startKey; const isEnd=key===t.dueKey; return (
                      <button key={t.id} onClick={() => setSelected(t)} title={t.name} className={cn("flex w-full items-center gap-1 border-y px-1.5 py-1 text-left text-[11px] leading-tight hover:opacity-80", STATUS_STYLE[t.status].chip, isStart?"rounded-l-md border-l":"-ml-px", isEnd?"rounded-r-md border-r":"-mr-px")}>
                        {(isStart || cell.getDay()===1) ? <span className="truncate">{t.name.length>60?t.name.slice(0,60)+"…":t.name}</span> : <span className="opacity-0">·</span>}
                      </button>); })}
                    {overflow > 0 && <button onClick={() => setDayModal({date:cell,items})} className="w-full rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-brand-600 hover:bg-brand-50">{L.more(overflow)}</button>}
                  </div>
                </div>
              );
            })}
          </div>
          {!loading && !error && filtered.length === 0 && <div className="mt-4 flex items-center justify-center rounded-xl border border-dashed border-border bg-surface-secondary py-8 text-sm text-gray-500">{L.empty}</div>}
        </div>
      )}

      {selected && <Modal title={L.details} onClose={() => setSelected(null)}><div className="space-y-3 text-sm"><Field label={L.project} value={selected.name} /><div className="flex items-center justify-between"><span className="text-gray-500">{L.status}</span><span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium",STATUS_STYLE[selected.status].chip)}>{L.statusLabel[selected.status]}</span></div><Field label={L.start} value={selected.startKey} /><Field label={L.due} value={selected.dueKey} /><Field label={L.duration} value={`${Math.round((selected.due.getTime()-selected.start.getTime())/86400000)+1} ${L.days}`} /><Field label={L.person} value={selected.assigneeName||L.unassigned} muted={!selected.assigneeName} /><Field label={L.department} value={selected.departmentName||"—"} muted={!selected.departmentName} /></div></Modal>}
      {dayModal && <Modal title={`${dayModal.date.getDate()} ${L.months[dayModal.date.getMonth()]} ${dayModal.date.getFullYear()}`} onClose={() => setDayModal(null)}><div className="space-y-1.5">{dayModal.items.map(t => <button key={t.id} onClick={() => {setSelected(t);setDayModal(null);}} className={cn("flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm hover:opacity-80",STATUS_STYLE[t.status].chip)}><span className={cn("h-2 w-2 shrink-0 rounded-full",STATUS_STYLE[t.status].bar)} /><span className="flex-1 truncate">{t.name}</span><span className="text-[10px] uppercase">{L.statusLabel[t.status]}</span></button>)}</div></Modal>}
    </div>
  );
}

function FilterSelect({ label, value, onChange, allLabel, options }: { label: string; value: string; onChange: (v: string) => void; allLabel: string; options: { id: string; name: string }[] }) {
  return <label className="flex flex-col gap-1"><span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</span><select value={value} onChange={e => onChange(e.target.value)} className="min-h-[44px] rounded-lg border border-gray-200 bg-surface px-3 text-sm text-gray-700 outline-none focus:border-brand-300 sm:min-h-0 sm:py-2"><option value="all">{allLabel}</option>{options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>;
}
function Field({ label, value, muted }: { label: string; value: string; muted?: boolean }) { return <div className="flex items-start justify-between gap-4"><span className="text-gray-500">{label}</span><span className={cn("text-right font-medium", muted?"italic text-gray-400":"text-gray-800")}>{value}</span></div>; }
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/30" onClick={onClose} /><div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-modal"><div className="mb-4 flex items-center justify-between"><h3 className="text-base font-semibold text-gray-900">{title}</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button></div>{children}</div></div>; }

export default function CalendarPage() {
  return <RoleGuard allowed={["admin","manager","staff"]}><CalendarView /></RoleGuard>;
}
