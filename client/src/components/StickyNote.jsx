import { useEffect, useMemo, useRef, useState } from "react";
import Draggable from "react-draggable";

const colorStyles = {
  yellow: "bg-amber-200 border-amber-300",
  pink: "bg-pink-200 border-pink-300",
  blue: "bg-sky-200 border-sky-300",
  green: "bg-lime-200 border-lime-300",
};

const clamp = (value, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

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
  }, [position.x, position.y]);

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
          className={`absolute w-64 cursor-move rounded-lg border p-3 shadow-[0_10px_22px_rgba(0,0,0,0.25)] hover:-rotate-1 hover:shadow-[0_14px_26px_rgba(0,0,0,0.32)] ${
            colorStyles[note.color] || colorStyles.yellow
          }`}
          style={{ zIndex: z }}
          onContextMenu={handleContextMenu}
        >
          <div
            className="mt-1 min-h-[140px] whitespace-pre-wrap text-base leading-relaxed note-handwriting text-slate-800"
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
                className="note-editing w-full resize-none rounded-lg border border-amber-300 bg-white/70 p-2 text-sm outline-none ring-2 ring-amber-200"
                placeholder="Escribe tus ideas aquí..."
                rows={6}
              />
            ) : (
              draft || (
                <span className="text-sm text-slate-600">
                  Doble clic para editar
                </span>
              )
            )}
          </div>

          <div className="mt-3 flex items-center justify-end text-[11px] text-slate-600">
            <span>
              {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Draggable>

      {menu.open && (
        <div
          className="note-menu fixed z-50 w-40 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl"
          style={{ top: menu.y, left: menu.x }}
        >
          <p className="px-2 pb-1 text-xs font-semibold text-slate-500">
            Color
          </p>
          <div className="flex gap-2 px-2 pb-2">
            {Object.keys(colorStyles).map((key) => (
              <button
                key={key}
                onClick={() => {
                  onUpdate(note.id, { color: key });
                  setMenu((prev) => ({ ...prev, open: false }));
                }}
                className={`h-6 w-6 rounded-full border border-white shadow ${
                  colorStyles[key].split(" ")[0]
                } ${note.color === key ? "ring-2 ring-amber-600" : ""}`}
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
