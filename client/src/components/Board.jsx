import { useEffect, useRef, useState } from "react";
import StickyNote from "./StickyNote";

const Board = ({ notes, onUpdateNote, onDeleteNote, background = "cork" }) => {
  const boardRef = useRef(null);
  const [boardSize, setBoardSize] = useState({ width: 1200, height: 900 });

  useEffect(() => {
    const updateSize = () => {
      if (!boardRef.current) return;
      const { clientWidth, clientHeight } = boardRef.current;
      setBoardSize({
        width: clientWidth || 1200,
        height: clientHeight || 900,
      });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    if (boardRef.current) resizeObserver.observe(boardRef.current);
    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
      resizeObserver.disconnect();
    };
  }, []);

  const boardStyle =
    background === "image"
      ? {
          backgroundImage: "url(/backgrounds/board-aesthetic.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : {};

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div
        ref={boardRef}
        className={`relative h-full w-full overflow-auto p-6 ${
          background === "image" ? "" : "cork"
        }`}
        style={boardStyle}
      >
        {notes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-700">
            Tu muro está listo. Agrega tu primera nota.
          </div>
        )}

        {notes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            boardSize={boardSize}
            onUpdate={onUpdateNote}
            onDelete={onDeleteNote}
          />
        ))}
      </div>
    </div>
  );
};

export default Board;
