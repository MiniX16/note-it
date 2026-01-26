import { useCallback, useEffect, useMemo, useState } from "react";
import AuthForm from "./components/AuthForm";
import Board from "./components/Board";
import {
  createNote,
  deleteNote,
  fetchNotes,
  login,
  register,
  setAuthToken,
  updateNote,
} from "./services/api";

const errorMessage = (err) =>
  err?.response?.data?.message || err?.message || "Algo salió mal";

const randomColor = () => {
  const palette = ["yellow", "pink", "blue", "green"];
  return palette[Math.floor(Math.random() * palette.length)];
};

function App() {
  const [mode, setMode] = useState("login");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [userMenu, setUserMenu] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [font, setFont] = useState(localStorage.getItem("font") || "manrope");
  const [background, setBackground] = useState(
    localStorage.getItem("background") || "cork"
  );

  useEffect(() => {
    const value =
      font === "hand"
        ? '"Handlee", "Manrope", sans-serif'
        : '"Manrope", "Segoe UI", sans-serif';
    document.documentElement.style.setProperty("--note-font", value);
    localStorage.setItem("font", font);
  }, [font]);

  useEffect(() => {
    localStorage.setItem("background", background);
  }, [background]);

  const avatarStyle = useMemo(() => {
    if (!user?.email) {
      return { bg: "#475569", fg: "#fff", label: "??" };
    }
    const email = user.email.toLowerCase();
    let hash = 0;
    for (let i = 0; i < email.length; i += 1) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    const bg = `hsl(${hue}, 70%, 55%)`;
    return { bg, fg: "#fff", label: email[0].toUpperCase() };
  }, [user]);

  const handleLogout = useCallback(() => {
    setToken("");
    setUser(null);
    setNotes([]);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
  }, []);

  const loadNotes = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchNotes();
      setNotes(data);
    } catch (err) {
      setNotice(errorMessage(err));
      if (err?.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [handleLogout, token]);

  useEffect(() => {
    if (!token) return;
    setAuthToken(token);
    loadNotes();
  }, [token, loadNotes]);

  const persistAuth = useCallback((data) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setAuthToken(data.token);
  }, []);

  const handleAuthSubmit = async (credentials) => {
    setNotice("");
    if (mode === "register" && credentials.password !== credentials.confirm) {
      setNotice("Las contraseñas deben coincidir");
      return;
    }
    setLoading(true);
    try {
      const payload =
        mode === "register"
          ? { email: credentials.email, password: credentials.password }
          : credentials;
      const data = mode === "login" ? await login(payload) : await register(payload);
      persistAuth(data);
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    setNotice("");
    const defaults = {
      content: "Nueva nota",
      color: randomColor(),
      posX: Math.min(85, Math.random() * 70 + 10),
      posY: Math.min(85, Math.random() * 60 + 10),
    };

    try {
      const created = await createNote(defaults);
      setNotes((prev) => [...prev, created]);
    } catch (err) {
      setNotice(errorMessage(err));
    }
  };

  const handleUpdateNote = async (id, updates) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, ...updates } : note))
    );

    try {
      await updateNote(id, updates);
    } catch (err) {
      setNotice(errorMessage(err));
      loadNotes();
    }
  };

  const handleDeleteNote = async (id) => {
    const snapshot = notes;
    setNotes((prev) => prev.filter((note) => note.id !== id));
    try {
      await deleteNote(id);
    } catch (err) {
      setNotice(errorMessage(err));
      setNotes(snapshot);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f4ec] via-[#f5efe5] to-[#f2e9df] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {notice && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
              {notice}
            </div>
          )}
          <AuthForm
            mode={mode}
            onModeChange={setMode}
            onSubmit={handleAuthSubmit}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f4ec] via-[#f5efe5] to-[#f2e9df] text-slate-900">
      {notice && (
        <div className="fixed left-1/2 top-4 z-50 w-[320px] -translate-x-1/2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-lg">
          {notice}
        </div>
      )}

      <button
        onClick={() => setUserMenu((prev) => !prev)}
        className="fixed left-4 top-4 z-40 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold shadow-lg ring-2 ring-white/40 transition hover:scale-105"
        title={`Cuenta de ${user.email}`}
        style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.fg }}
      >
        {avatarStyle.label}
      </button>

      {userMenu && (
        <div className="fixed left-4 top-20 z-50 w-44 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-xl">
          <p className="px-2 pb-2 text-xs font-semibold text-slate-500">
            {user.email}
          </p>
          <button
            onClick={() => {
              setSettingsOpen(true);
              setUserMenu(false);
            }}
            className="w-full rounded-lg px-2 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-amber-50"
          >
            Ajustes
          </button>
          <button
            onClick={handleLogout}
            className="mt-1 w-full rounded-lg px-2 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Cerrar sesión
          </button>
        </div>
      )}

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-amber-700">
                  Ajustes
                </p>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Personaliza tu mural
                </h3>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600 hover:bg-slate-200"
                aria-label="Cerrar ajustes"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-6">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Fondo del mural
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setBackground("cork")}
                    className={`rounded-2xl border p-2 text-left shadow-sm transition hover:-translate-y-0.5 ${
                      background === "cork"
                        ? "border-amber-400 ring-2 ring-amber-200"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="h-20 w-full rounded-xl cork border border-white shadow-inner" />
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      Papel corcho
                    </p>
                  </button>

                  <button
                    onClick={() => setBackground("image")}
                    className={`rounded-2xl border p-2 text-left shadow-sm transition hover:-translate-y-0.5 ${
                      background === "image"
                        ? "border-amber-400 ring-2 ring-amber-200"
                        : "border-slate-200"
                    }`}
                  >
                    <div
                      className="h-20 w-full rounded-xl border border-white shadow-inner"
                      style={{
                        backgroundImage: "url(/backgrounds/board-aesthetic.jpg)",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      Fotografía
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">Fuente</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setFont("manrope")}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ${font === "manrope" ? "bg-amber-100 text-amber-800 ring-2 ring-amber-200" : "bg-slate-100 text-slate-700"}`}
                  >
                    Limpia
                  </button>
                  <button
                    onClick={() => setFont("hand")}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ${font === "hand" ? "bg-amber-100 text-amber-800 ring-2 ring-amber-200" : "bg-slate-100 text-slate-700"}`}
                  >
                    Manuscrita
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Board
        notes={notes}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
        background={background}
      />

      <button
        onClick={handleCreateNote}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-3xl font-bold text-white shadow-2xl transition hover:scale-110 hover:shadow-xl"
        title="Crear nota"
      >
        +
      </button>
    </div>
  );
}

export default App;
