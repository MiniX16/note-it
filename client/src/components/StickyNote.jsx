import { useEffect, useMemo, useRef, useState } from "react";
import Draggable from "react-draggable";

const colorThemes = {
  yellow: {
    "--note-paper": "#f6de73",
    "--note-paper-soft": "#fcf2ad",
    "--note-paper-deep": "#d8a93f",
    "--note-border": "rgba(204, 153, 42, 0.48)",
    "--note-ink": "#5f4b18",
    "--note-shadow": "rgba(112, 80, 17, 0.24)",
  },
  pink: {
    "--note-paper": "#f4bfd1",
    "--note-paper-soft": "#fde2eb",
    "--note-paper-deep": "#de8ea8",
    "--note-border": "rgba(190, 96, 134, 0.34)",
    "--note-ink": "#5e3143",
    "--note-shadow": "rgba(122, 59, 82, 0.22)",
  },
  blue: {
    "--note-paper": "#bfe1f6",
    "--note-paper-soft": "#e4f3fd",
    "--note-paper-deep": "#78b7e1",
    "--note-border": "rgba(74, 133, 173, 0.32)",
    "--note-ink": "#29485d",
    "--note-shadow": "rgba(48, 89, 118, 0.22)",
  },
  green: {
    "--note-paper": "#d5ed9a",
    "--note-paper-soft": "#eef9c8",
    "--note-paper-deep": "#94bb4e",
    "--note-border": "rgba(113, 146, 44, 0.34)",
    "--note-ink": "#405223",
    "--note-shadow": "rgba(76, 102, 24, 0.22)",
  },
};

const sizeOptions = [
  { key: "compact", label: "Pequeño", width: 220, height: 160 },
  { key: "standard", label: "Medio", width: 256, height: 180 },
  { key: "roomy", label: "Grande", width: 320, height: 220 },
];

const fontOptions = [
  { key: "small", label: "Letra pequeña", size: 14 },
  { key: "medium", label: "Letra media", size: 16 },
  { key: "large", label: "Letra grande", size: 18 },
  { key: "xl", label: "Letra XL", size: 20 },
];

const defaultSizing = { width: 256, height: 180, fontSize: 16 };

const clamp = (value, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

const noteVariants = [
  { key: "pin", paddingTop: 22 },
  { key: "flat", paddingTop: 10 },
  { key: "tape-top", paddingTop: 22 },
  { key: "tape-angle", paddingTop: 18 },
];

const rotationSteps = [-3.2, -2.4, -1.8, -1.1, -0.6, 0.7, 1.3, 1.9, 2.6, 3.1];

const hashString = (value) => {
  const text = String(value ?? "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getNotePresentation = (noteId, createdAt) => {
  const seed = hashString(`${noteId}-${createdAt ?? ""}`);
  const variant = noteVariants[seed % noteVariants.length];
  const rotation = rotationSteps[(seed >> 3) % rotationSteps.length];
  return { seed, variant, rotation };
};

const renderDecorations = (variantKey) => {
  switch (variantKey) {
    case "pin":
      return <span aria-hidden="true" className="note-pin note-pin--left" />;
    case "tape-top":
      return <span aria-hidden="true" className="note-tape note-tape--top" />;
    case "tape-angle":
      return <span aria-hidden="true" className="note-tape note-tape--angled" />;
    default:
      return null;
  }
};

let pickAudio;
const playPickSound = () => {
  try {
    if (!pickAudio) {
      pickAudio = new Audio("/sounds/note-pick.mp3");
      pickAudio.preload = "auto";
      pickAudio.volume = 0.65;
    }
    pickAudio.currentTime = 0;
    pickAudio.play();
  } catch {
    /* ignore audio errors */
  }
};

let zIndexCounter = 1;

const StickyNote = ({ note, boardSize, onUpdate, onDelete }) => {
  const nodeRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content || "");
  const [menu, setMenu] = useState({ open: false, x: 0, y: 0 });
  const [localPos, setLocalPos] = useState({ x: 0, y: 0 });
  const [z, setZ] = useState(1);
  const noteWidth = note.width || defaultSizing.width;
  const noteHeight = note.height || defaultSizing.height;
  const noteFontSize = note.fontSize || defaultSizing.fontSize;
  const presentation = useMemo(
    () => getNotePresentation(note.id, note.createdAt),
    [note.id, note.createdAt]
  );
  const noteTheme = colorThemes[note.color] || colorThemes.yellow;
  const contentMinHeight = Math.max(
    noteHeight - presentation.variant.paddingTop - 48,
    96
  );

  useEffect(() => {
    setDraft(note.content || "");
  }, [note.content]);

  const position = useMemo(
    () => ({
      x: ((note.posX ?? 0) / 100) * (boardSize.width || 1200),
      y: ((note.posY ?? 0) / 100) * (boardSize.height || 900),
    }),
    [note.posX, note.posY, boardSize.height, boardSize.width]
  );

  useEffect(() => {
    setLocalPos(position);
  }, [position]);

  useEffect(() => {
    const closeMenu = () => setMenu((prev) => ({ ...prev, open: false }));
    if (menu.open) {
      window.addEventListener("click", closeMenu);
    }
    return () => {
      window.removeEventListener("click", closeMenu);
    };
  }, [menu.open]);

  const handleDrag = (_e, data) => {
    setLocalPos({ x: data.x, y: data.y });
  };

  const handleStart = () => {
    setMenu({ open: false, x: 0, y: 0 });
    setZ(++zIndexCounter);
    playPickSound();
  };

  const handleStop = (_e, data) => {
    const percentX = clamp((data.x / (boardSize.width || 1)) * 100);
    const percentY = clamp((data.y / (boardSize.height || 1)) * 100);
    onUpdate(note.id, { posX: percentX, posY: percentY });
  };

  const handleSaveContent = () => {
    setEditing(false);
    if (draft !== note.content) {
      onUpdate(note.id, { content: draft });
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ open: true, x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <Draggable
        nodeRef={nodeRef}
        bounds="parent"
        position={localPos}
        onDrag={handleDrag}
        onStart={handleStart}
        onStop={handleStop}
        cancel=".note-editing, textarea, button, .note-menu"
        disabled={menu.open}
      >
        <div
          ref={nodeRef}
          className="absolute cursor-move"
          style={{
            zIndex: z,
            width: `${noteWidth}px`,
          }}
        >
          <div
            className={`note-paper note-paper--${presentation.variant.key}`}
            style={{
              ...noteTheme,
              minHeight: `${noteHeight}px`,
              transform: `rotate(${presentation.rotation}deg)`,
            }}
            onContextMenu={handleContextMenu}
          >
            {renderDecorations(presentation.variant.key)}
            <div
              className="relative z-[1] px-4 pb-3"
              style={{ paddingTop: `${presentation.variant.paddingTop}px` }}
            >
              <div
                className="mt-1 whitespace-pre-wrap leading-relaxed note-handwriting"
                style={{
                  color: "var(--note-ink)",
                  fontSize: noteFontSize,
                  minHeight: `${contentMinHeight}px`,
                }}
                onDoubleClick={() => setEditing(true)}
              >
                {editing ? (
                  <textarea
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={handleSaveContent}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        handleSaveContent();
                      }
                    }}
                    className="note-editing w-full resize-none rounded-2xl border border-white/70 bg-white/45 p-2 outline-none ring-2 ring-white/40"
                    style={{ color: "var(--note-ink)", fontSize: noteFontSize }}
                    placeholder="Escribe tus ideas aquí..."
                    rows={6}
                  />
                ) : (
                  draft || (
                    <span
                      className="opacity-70"
                      style={{ color: "var(--note-ink)", fontSize: noteFontSize - 1 }}
                    >
                      Doble clic para editar
                    </span>
                  )
                )}
              </div>

              <div
                className="mt-3 flex items-center justify-end text-[11px] opacity-75"
                style={{ color: "var(--note-ink)" }}
              >
                <span>
                  {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Draggable>

      {menu.open && (
        <div
          className="note-menu fixed z-50 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl"
          style={{ top: menu.y, left: menu.x }}
        >
          <p className="px-2 pb-1 text-xs font-semibold text-slate-500">
            Tamaño de nota
          </p>
          <div className="grid grid-cols-2 gap-2 px-2 pb-2">
            {sizeOptions.map((option) => {
              const isActive =
                Math.abs(noteWidth - option.width) < 2 &&
                Math.abs(noteHeight - option.height) < 2;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    onUpdate(note.id, {
                      width: option.width,
                      height: option.height,
                    });
                    setMenu((prev) => ({ ...prev, open: false }));
                  }}
                  className={`rounded-lg border px-2 py-2 text-left text-xs font-semibold transition ${
                    isActive
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="block text-sm">{option.label}</span>
                  <span className="text-[11px] text-slate-500">
                    {option.width}px · {option.height}px
                  </span>
                </button>
              );
            })}
          </div>

          <p className="px-2 pb-1 text-xs font-semibold text-slate-500">
            Tamaño de letra
          </p>
          <div className="flex flex-wrap gap-2 px-2 pb-2">
            {fontOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  onUpdate(note.id, { fontSize: option.size });
                  setMenu((prev) => ({ ...prev, open: false }));
                }}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  Math.abs(noteFontSize - option.size) < 0.5
                    ? "bg-amber-100 text-amber-800 ring-2 ring-amber-200"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <p className="px-2 pb-1 text-xs font-semibold text-slate-500">
            Color
          </p>
          <div className="flex gap-2 px-2 pb-2">
            {Object.keys(colorThemes).map((key) => (
              <button
                key={key}
                onClick={() => {
                  onUpdate(note.id, { color: key });
                  setMenu((prev) => ({ ...prev, open: false }));
                }}
                className={`h-6 w-6 rounded-full border border-white shadow ${
                  note.color === key ? "ring-2 ring-amber-600" : ""
                }`}
                style={{ backgroundColor: colorThemes[key]["--note-paper"] }}
                aria-label={`Cambiar a color ${key}`}
                type="button"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              onDelete(note.id);
              setMenu((prev) => ({ ...prev, open: false }));
            }}
            className="mt-1 w-full rounded-lg px-2 py-1 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Eliminar nota
          </button>
        </div>
      )}
    </>
  );
};

export default StickyNote;
