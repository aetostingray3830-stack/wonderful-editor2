import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, Reorder } from "framer-motion";
import { marked } from "marked";
import DOMPurify from "dompurify";

/** @typedef {"ACT1"|"ACT2"|"ACT3"} Act */
/** @typedef {{ id:string; title:string; summary:string; tags:string[]; characters:string[]; color:string; duration:number; notes:string; act:Act }} Scene */
/** @typedef {{ id:string; title:string; body:string; open:boolean }} Memo */

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const STORAGE_KEY = "scenario-editor-v7";
const MEMO_KEY = "scenario-memos-v1";

const DEFAULT_SCENES = /** @type {Scene[]} */ [
  {
    id: uid(),
    title: "招待状",
    summary:
      "**館の主**からの手紙が届く。\n\n- 行くかどうか迷う\n- 兄に相談する",
    tags: ["導入"],
    characters: ["主人公", "兄"],
    color: "#eef2ff",
    duration: 5,
    notes: "> *電話のベル音* を入れる",
    act: "ACT1",
  },
  {
    id: uid(),
    title: "出立",
    summary: "準備を整え、駅へ向かう。\n\n`雨` の描写。",
    tags: ["道中"],
    characters: ["主人公"],
    color: "#fefce8",
    duration: 4,
    notes: "小道具：**傘**",
    act: "ACT1",
  },
  {
    id: uid(),
    title: "再会",
    summary:
      "古い友人に遭遇。互いの近況を語る。\n\n- 伏線：腕時計\n- トーン: *ほの暗い*",
    tags: ["ドラマ"],
    characters: ["主人公", "友人"],
    color: "#ecfeff",
    duration: 6,
    notes: "腕時計を**左**手首へ",
    act: "ACT2",
  },
  {
    id: uid(),
    title: "対立",
    summary: "真相に近づくにつれ衝突が激化。",
    tags: ["コンフリクト"],
    characters: ["主人公", "友人"],
    color: "#fee2e2",
    duration: 8,
    notes: "暗転で切る",
    act: "ACT2",
  },
  {
    id: uid(),
    title: "決着",
    summary: "犯人との対峙。選択の時。",
    tags: ["クライマックス"],
    characters: ["主人公", "犯人"],
    color: "#f5f3ff",
    duration: 10,
    notes: "音楽を強めに",
    act: "ACT3",
  },
];

const DEFAULT_MEMOS = /** @type {Memo[]} */ [
  {
    id: uid(),
    title: "制作TODO",
    body: "- BGM選定\n- ロケ地写真集め\n- 配役候補リスト",
    open: true,
  },
  {
    id: uid(),
    title: "世界観メモ",
    body: "> 海霧の街。\n\n- 年間降水量が多い\n- 灯台と貨物列車",
    open: false,
  },
];

const ColorSwatches = [
  "#eef2ff",
  "#ecfeff",
  "#f0fdf4",
  "#fefce8",
  "#fee2e2",
  "#f5f3ff",
  "#fff7ed",
  "#f4f4f5",
];
const Acts = /** @type {Act[]} */ ["ACT1", "ACT2", "ACT3"];

const IconGrip = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    aria-hidden
    fill="currentColor"
    {...props}
  >
    <circle cx="9" cy="7" r="1" />
    <circle cx="15" cy="7" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="9" cy="17" r="1" />
    <circle cx="15" cy="17" r="1" />
  </svg>
);
const IconTrash = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    aria-hidden
    fill="currentColor"
    {...props}
  >
    <path
      d="M3 6h18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0  1 2 2v2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0  0 0 2-2l1-14"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);
const IconPlus = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    aria-hidden
    fill="currentColor"
    {...props}
  >
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
const IconDownload = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    aria-hidden
    fill="currentColor"
    {...props}
  >
    <path
      d="M12 3v12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M8 11l4 4 4-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M4 21h16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
const IconUpload = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    aria-hidden
    fill="currentColor"
    {...props}
  >
    <path
      d="M12 21V9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M8 13l4-4 4 4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M4 3h16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
const IconDuplicate = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    aria-hidden
    fill="currentColor"
    {...props}
  >
    <rect
      x="9"
      y="9"
      width="10"
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <rect
      x="5"
      y="5"
      width="10"
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);
const IconTimeline = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    aria-hidden
    fill="currentColor"
    {...props}
  >
    <path
      d="M4 12h16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="7" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="17" cy="12" r="2" />
  </svg>
);
const IconKanban = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    aria-hidden
    fill="currentColor"
    {...props}
  >
    <rect x="3" y="4" width="6" height="16" rx="2" />
    <rect x="10" y="4" width="4" height="16" rx="2" />
    <rect x="15" y="4" width="6" height="16" rx="2" />
  </svg>
);
const IconList = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    aria-hidden
    fill="currentColor"
    {...props}
  >
    <path
      d="M4 7h16M4 12h16M4 17h16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
const IconChevron = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    aria-hidden
    fill="currentColor"
    {...props}
  >
    <path
      d="M6 9l6 6 6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

function MarkdownView({ text, bg }) {
  const html = useMemo(() => {
    try {
      return DOMPurify.sanitize(marked.parse(text || ""));
    } catch {
      return "";
    }
  }, [text]);
  return (
    <div
      className="prose prose-sm max-w-none break-words rounded-md p-3 sm:p-4"
      style={{ background: bg }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function SceneCard({
  scene,
  onChange,
  onDelete,
  onDuplicate,
  draggableProps = {},
}) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const refTitle = useRef(null);
  useEffect(() => {
    if (editing && refTitle.current) {
      refTitle.current.focus();
      refTitle.current.select?.();
    }
  }, [editing]);
  const update = (patch) => onChange({ ...scene, ...patch });

  return (
    <motion.div
      layout
      className="group rounded-2xl border shadow-sm bg-white/80 backdrop-blur p-4 sm:p-5"
      style={{
        borderColor: "#e5e7eb",
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
      }}
      {...draggableProps}
    >
      {/* Title Row */}
      <div className="flex items-start gap-2">
        <div className="pt-1 text-gray-400">
          <IconGrip />
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={refTitle}
              className="w-full rounded-md border px-3 py-2 text-lg font-semibold focus:outline-none focus:ring"
              value={scene.title}
              onChange={(e) => update({ title: e.target.value })}
            />
          ) : (
            <button
              className="flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-gray-50"
              onClick={() => setOpen(!open)}
              title={open ? "折りたたむ" : "展開"}
            >
              <span className="truncate text-lg font-semibold">
                {scene.title || "無題のシーン"}
              </span>
              <span
                className={`ml-auto shrink-0 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              >
                <IconChevron />
              </span>
            </button>
          )}
          {/* Toolbar: act & actions */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select
              className="rounded-md border px-2 py-1 text-sm"
              value={scene.act}
              onChange={(e) =>
                update({ act: /** @type {Act} */ e.target.value })
              }
            >
              {Acts.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <div className="ml-auto flex items-center gap-2">
              <button
                title="複製"
                onClick={onDuplicate}
                className="shrink-0 rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100"
              >
                <IconDuplicate />
              </button>
              <button
                title={editing ? "保存" : "編集"}
                onClick={() => setEditing(!editing)}
                className="shrink-0 rounded-md px-2 py-1 text-gray-700 hover:bg-gray-100"
              >
                {editing ? "保存" : "編集"}
              </button>
              <button
                title="削除"
                onClick={onDelete}
                className="shrink-0 rounded-md px-2 py-1 text-red-500 hover:bg-red-50"
              >
                <IconTrash />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible */}
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : "0", opacity: open ? 1 : 0 }}
        className="overflow-hidden"
      >
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            {ColorSwatches.map((c) => (
              <button
                key={c}
                title="色ラベル"
                onClick={() => update({ color: c })}
                className="h-4 w-4 rounded-full border"
                style={{
                  background: c,
                  borderColor: "#e5e7eb",
                  outline: scene.color === c ? "2px solid #111827" : "none",
                }}
              />
            ))}
          </div>
          <input
            type="number"
            min={0}
            className="ml-auto w-24 rounded-md border px-2 py-1 text-sm"
            value={scene.duration}
            onChange={(e) => update({ duration: Number(e.target.value) || 0 })}
          />
          <span className="text-xs text-gray-500">分</span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            {editing ? (
              <textarea
                className="w-full rounded-md border p-3 font-mono"
                rows={4}
                placeholder="シーンの概要（**太字**、*斜体*、- 箇条書き などMarkdown可）"
                value={scene.summary}
                onChange={(e) => update({ summary: e.target.value })}
                style={{ background: scene.color }}
              />
            ) : (
              <MarkdownView text={scene.summary} bg={scene.color} />
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              タグ（カンマ区切り）
            </label>
            <input
              className="w-full rounded-md border p-3"
              value={scene.tags.join(", ")}
              onChange={(e) => update({ tags: splitCSV(e.target.value) })}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {scene.tags.filter(Boolean).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              登場人物（カンマ区切り）
            </label>
            <input
              className="w-full rounded-md border p-3"
              value={scene.characters.join(", ")}
              onChange={(e) => update({ characters: splitCSV(e.target.value) })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              メモ（Markdown可）
            </label>
            <textarea
              className="w-full rounded-md border p-3 font-mono"
              rows={3}
              value={scene.notes}
              onChange={(e) => update({ notes: e.target.value })}
            />
            <div className="mt-2 text-xs text-gray-500">プレビュー:</div>
            <MarkdownView text={scene.notes} bg="#0000" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function splitCSV(v) {
  return v
    .split(/,|、/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const Btn = ({
  icon,
  children,
  onClick,
  as = "button",
  inputProps = {},
  className = "",
}) => {
  if (as === "label") {
    return (
      <label
        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm shadow-sm hover:bg-gray-50 ${className}`}
      >
        {icon}
        {children}
        <input type="file" className="hidden" {...inputProps} />
      </label>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm shadow-sm hover:bg-gray-50 ${className}`}
    >
      {icon}
      {children}
    </button>
  );
};

/* ========== Sidebar: Simple List of Scenes ========== */
function SidebarList({ scenes, onPick, onClear, selectedId }) {
  return (
    <aside className="sticky top-[88px] hidden h-[calc(100vh-140px)] overflow-auto rounded-xl border bg-white/70 p-2 lg:block">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wide text-gray-600">
          シーン一覧
        </h3>
        <button
          onClick={onClear}
          className="text-xs text-gray-500 hover:underline"
        >
          クリア
        </button>
      </div>
      <ul className="space-y-1.5">
        {scenes.map((s, i) => (
          <li key={s.id}>
            <button
              onClick={() => onPick(s)}
              className={`w-full rounded-lg border px-2 py-1 text-left text-sm hover:bg-gray-50 ${
                selectedId === s.id ? "border-gray-900 bg-gray-50" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-2 w-2 rounded-full"
                  style={{ background: s.color }}
                />
                <span className="truncate">
                  {i + 1}. {s.title || "無題"}
                </span>
              </div>
              <div className="mt-0.5 flex items-center justify-between text-[11px] text-gray-500">
                <span>{s.act || "ACT1"}</span>
                <span className="tabular-nums">{s.duration || 0}分</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* ========== Memo Board (right) ========== */
function MemoCard({ memo, onChange, onDelete }) {
  const [open, setOpen] = useState(memo.open);
  useEffect(() => {
    onChange({ ...memo, open }); /* persist open state */
  }, [open]);
  return (
    <motion.div layout className="rounded-2xl border bg-white/80 p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-gray-50"
          onClick={() => setOpen(!open)}
        >
          <span className="truncate font-semibold">
            {memo.title || "無題メモ"}
          </span>
          <span
            className={`ml-auto transition-transform ${
              open ? "rotate-180" : ""
            }`}
          >
            <IconChevron />
          </span>
        </button>
        <button
          onClick={onDelete}
          className="rounded-md px-2 py-1 text-red-500 hover:bg-red-50"
        >
          <IconTrash />
        </button>
      </div>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : "0", opacity: open ? 1 : 0 }}
        className="overflow-hidden"
      >
        <textarea
          className="mt-2 w-full rounded-md border p-2 text-sm font-mono"
          rows={4}
          value={memo.body}
          onChange={(e) => onChange({ ...memo, body: e.target.value })}
          placeholder="メモを書いてください（Markdown可）"
        />
        <div className="mt-2 text-[11px] text-gray-500">プレビュー</div>
        <div className="prose prose-sm max-w-none rounded-md border bg-white p-2">
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(marked.parse(memo.body || "")),
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function MemoBoard() {
  const [memos, setMemos] = useState(() => {
    try {
      const raw = localStorage.getItem(MEMO_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_MEMOS;
  });
  useEffect(() => {
    try {
      localStorage.setItem(MEMO_KEY, JSON.stringify(memos));
    } catch {}
  }, [memos]);
  const add = () =>
    setMemos((prev) => [
      { id: uid(), title: "新規メモ", body: "", open: true },
      ...prev,
    ]);
  const change = (m) =>
    setMemos((prev) => prev.map((x) => (x.id === m.id ? m : x)));
  const del = (id) => setMemos((prev) => prev.filter((x) => x.id !== id));

  return (
    <aside className="sticky top-[88px] hidden h-[calc(100vh-140px)] overflow-auto rounded-xl border bg-white/50 p-2 lg:block">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wide text-gray-600">
          メモ
        </h3>
        <button
          onClick={add}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
        >
          <IconPlus />
          追加
        </button>
      </div>
      <Reorder.Group
        axis="y"
        values={memos}
        onReorder={setMemos}
        className="space-y-2"
      >
        {memos.map((m) => (
          <Reorder.Item key={m.id} value={m}>
            <MemoCard memo={m} onChange={change} onDelete={() => del(m.id)} />
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </aside>
  );
}

export default function App() {
  const [scenes, setScenes] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_SCENES;
  });
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [view, setView] = useState(
    /** @type {"KANBAN"|"LIST"|"TIMELINE"} */ "KANBAN"
  );
  const [pickedId, setPickedId] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
    } catch {}
  }, [scenes]);

  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const filterFn = (s /** @type {Scene} */) => {
    const hay = `${s.title} ${s.summary} ${s.tags.join(
      " "
    )} ${s.characters.join(" ")}`.toLowerCase();
    const okQ = words.every((w) => hay.includes(w));
    const okTag = tag
      ? s.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
      : true;
    const okPicked = pickedId ? s.id === pickedId : true;
    return okQ && okTag && okPicked;
  };

  const totalMinutes = useMemo(
    () => scenes.reduce((a, b) => a + (Number(b.duration) || 0), 0),
    [scenes]
  );
  const allTags = useMemo(
    () => Array.from(new Set(scenes.flatMap((s) => s.tags))).filter(Boolean),
    [scenes]
  );

  const addScene = () =>
    setScenes((prev) => [
      {
        id: uid(),
        title: "新しいシーン",
        summary: "",
        tags: [],
        characters: [],
        color: ColorSwatches[0],
        duration: 3,
        notes: "",
        act: "ACT1",
      },
      ...prev,
    ]);
  const replaceScene = (s) =>
    setScenes((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  const deleteScene = (id) =>
    setScenes((prev) => prev.filter((s) => s.id !== id));
  const duplicateScene = (id) =>
    setScenes((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      if (i < 0) return prev;
      const copy = { ...prev[i], id: uid(), title: prev[i].title + " コピー" };
      const out = [...prev];
      out.splice(i + 1, 0, copy);
      return out;
    });

  const exportJSON = () => {
    const payload = { version: 7, updatedAt: new Date().toISOString(), scenes };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scenario-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onImport = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        setScenes(upgradeArray(data));
        return;
      }
      if (data && Array.isArray(data.scenes)) {
        setScenes(upgradeArray(data.scenes));
        return;
      }
      alert("不正なJSON形式でした");
    } catch (e) {
      alert("読み込みに失敗しました");
    }
  };
  function upgradeArray(arr) {
    return arr.map((s) => ({ act: s.act || "ACT1", ...s }));
  }
  const clearAll = () => {
    if (confirm("全シーンを削除しますか？")) setScenes([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w=[1760px] flex-wrap items-center gap-3 px-4 py-5 sm:px-6 sm:py-7">
          <h1 className="text-2xl font-bold tracking-tight">
            シナリオエディター（カンバン＋タイムライン＋Markdown｜サイドバー＆メモ）
          </h1>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Btn onClick={addScene} icon={<IconPlus />}>
              シーン追加
            </Btn>
            <Btn onClick={exportJSON} icon={<IconDownload />}>
              エクスポート
            </Btn>
            <Btn
              as="label"
              icon={<IconUpload />}
              inputProps={{ onChange: (e) => onImport(e.target.files?.[0]) }}
            >
              インポート
            </Btn>
            <Btn onClick={clearAll} className="border-red-300 text-red-600">
              全削除
            </Btn>
          </div>
          <div className="basis-full" />
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              placeholder="検索：タイトル、概要、タグ、登場人物…"
              className="w-full flex-1 rounded-xl border px-3 py-2 shadow-sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="rounded-xl border px-3 py-2 shadow-sm"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            >
              <option value="">タグで絞り込み</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div className="flex gap-2 sm:ml-auto">
              <button
                onClick={() => setView("KANBAN")}
                className={`rounded-xl border px-3 py-2 shadow-sm ${
                  view === "KANBAN" ? "bg-gray-50" : ""
                }`}
              >
                カンバン
              </button>
              <button
                onClick={() => setView("LIST")}
                className={`rounded-xl border px-3 py-2 shadow-sm ${
                  view === "LIST" ? "bg-gray-50" : ""
                }`}
              >
                リスト
              </button>
              <button
                onClick={() => setView("TIMELINE")}
                className={`rounded-xl border px-3 py-2 shadow-sm ${
                  view === "TIMELINE" ? "bg-gray-50" : ""
                }`}
              >
                タイムライン
              </button>
            </div>
            <div className="text-sm text-gray-500 sm:ml-auto">
              合計 {scenes.length} シーン / 想定 {totalMinutes} 分
            </div>
          </div>
        </div>
      </header>

      {/* 3-column layout */}
      <main className="mx-auto max-w-[1760px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-4 lg:grid-cols-[220px,minmax(0,1fr),280px] xl:grid-cols-[240px,minmax(0,1fr),300px] 2xl:grid-cols-[260px,minmax(0,1fr),320px]">
          <SidebarList
            scenes={scenes}
            selectedId={pickedId}
            onPick={(s) => {
              setPickedId(s.id);
              setQ("");
            }}
            onClear={() => setPickedId("")}
          />

          <section>
            {view === "KANBAN" && (
              <Kanban
                scenes={scenes.filter(filterFn)}
                onChangeScene={replaceScene}
                onDelete={deleteScene}
                onDuplicate={duplicateScene}
                moveWithinAct={(act, from, to) => {
                  setScenes((prev) => {
                    const col = prev.filter((s) => s.act === act);
                    const [item] = col.splice(from, 1);
                    col.splice(to, 0, item);
                    const rebuilt = [];
                    const byId = new Map(col.map((s) => [s.id, s]));
                    for (const s of prev) {
                      if (s.act !== act) {
                        rebuilt.push(s);
                      } else {
                        const next = byId.get(s.id);
                        if (next) {
                          rebuilt.push(next);
                          byId.delete(s.id);
                        }
                      }
                    }
                    return rebuilt;
                  });
                }}
              />
            )}
            {view === "LIST" && (
              <div className="grid gap-4">
                {scenes.filter(filterFn).map((scene) => (
                  <SceneCard
                    key={scene.id}
                    scene={scene}
                    onChange={replaceScene}
                    onDelete={() => deleteScene(scene.id)}
                    onDuplicate={() => duplicateScene(scene.id)}
                  />
                ))}
              </div>
            )}
            {view === "TIMELINE" && (
              <TimelineView scenes={scenes.filter(filterFn)} />
            )}
          </section>

          <MemoBoard />
        </div>
      </main>

      <footer className="mx-auto max-w-[1760px] px-6 py-8 text-center text-xs text-gray-500">
        左：シーン一覧　中央：エディター　右：メモ（ドラッグ並べ替え・折りたたみ可）。
      </footer>
    </div>
  );
}

function Kanban({
  scenes,
  onChangeScene,
  onDelete,
  onDuplicate,
  moveWithinAct,
}) {
  const cols = useMemo(
    () =>
      Acts.map((a) => ({ act: a, items: scenes.filter((s) => s.act === a) })),
    [scenes]
  );
  const onDragStart = (e, sceneId) => {
    e.dataTransfer.setData("text/plain", sceneId);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDropToCol = (e, act) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    onChangeSceneById(id, { act });
  };
  const onDragOver = (e) => {
    e.preventDefault();
  };
  const onChangeSceneById = (id, patch) => {
    onChangeScene((prev) => ({
      ...prev,
      ...patch,
      id: prev.id === id ? id : prev.id,
    }));
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {cols.map(({ act, items }) => (
        <section
          key={act}
          className="flex min-h-[50vh] flex-col rounded-2xl border bg-white/60 p-4"
        >
          <header className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-wide text-gray-700">
              {act}
            </h2>
            <span className="text-xs text-gray-500">
              {items.length} 件 /{" "}
              {items.reduce((a, b) => a + (b.duration || 0), 0)} 分
            </span>
          </header>
          <div
            className="flex-1 space-y-4 rounded-xl border-2 border-dashed p-3"
            onDragOver={onDragOver}
            onDrop={(e) => onDropToCol(e, act)}
          >
            {items.map((scene, idx) => (
              <div
                key={scene.id}
                draggable
                onDragStart={(e) => onDragStart(e, scene.id)}
                className="cursor-move"
              >
                <SceneCard
                  scene={scene}
                  onChange={onChangeScene}
                  onDelete={() => onDelete(scene.id)}
                  onDuplicate={() => onDuplicate(scene.id)}
                />
                <div className="mt-3 mb-1.5 flex justify-end gap-2">
                  <button
                    className="rounded-md border px-2 py-1 text-xs"
                    onClick={() =>
                      moveWithinAct(act, idx, Math.max(0, idx - 1))
                    }
                  >
                    ← 上へ
                  </button>
                  <button
                    className="rounded-md border px-2 py-1 text-xs"
                    onClick={() =>
                      moveWithinAct(
                        act,
                        idx,
                        Math.min(items.length - 1, idx + 1)
                      )
                    }
                  >
                    下へ →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TimelineView({ scenes }) {
  const total = scenes.reduce((a, b) => a + (Number(b.duration) || 0), 0);
  const ordered = useMemo(
    () => Acts.flatMap((a) => scenes.filter((s) => s.act === a)),
    [scenes]
  );
  let acc = 0;
  const bars = ordered.map((s) => {
    const start = acc;
    const dur = Number(s.duration) || 0;
    acc += dur;
    const end = acc;
    return {
      id: s.id,
      title: s.title,
      act: s.act,
      start,
      end,
      dur,
      color: s.color,
    };
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white/70 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">タイムライン</h3>
          <div className="text-sm text-gray-600">合計 {total} 分</div>
        </div>
        <div className="relative h-24 w-full overflow-hidden rounded-xl border bg-white">
          <div className="absolute inset-0">
            {[...Array(Math.max(1, Math.ceil(total / 5)))].map((_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full w-px bg-gray-200"
                style={{ left: `${((i * 5) / Math.max(1, total)) * 100}%` }}
              />
            ))}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-400">
              <span>0</span>
              <span>{Math.ceil(total / 2)}分</span>
              <span>{total}分</span>
            </div>
          </div>
          <div className="absolute inset-0 flex">
            {bars.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-center border-r text-xs"
                style={{
                  width: `${(b.dur / Math.max(1, total)) * 100}%`,
                  background: b.color,
                }}
                title={`${b.title} (${b.dur}分)`}
              >
                <span className="truncate px-2">{b.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 text-sm">
        {bars.map((b) => (
          <div
            key={b.id}
            className="flex items-center justify-between rounded-lg border bg-white/70 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: b.color }}
              >
                {b.act}
              </span>
              <span className="font-medium">{b.title}</span>
            </div>
            <div className="tabular-nums text-gray-600">
              {b.start}–{b.end} 分（{b.dur}）
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
