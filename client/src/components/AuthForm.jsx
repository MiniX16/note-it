import { useState } from "react";

const modes = {
  login: {
    title: "Inicia sesión",
    cta: "Entrar",
    switchLabel: "¿No tienes cuenta?",
    switchCta: "Regístrate",
  },
  register: {
    title: "Crea tu cuenta",
    cta: "Crear cuenta",
    switchLabel: "¿Ya tienes cuenta?",
    switchCta: "Inicia sesión",
  },
};

const AuthForm = ({ mode, onModeChange, onSubmit, loading }) => {
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    onSubmit(form);
  };

  const copy = modes[mode];

  return (
    <div className="rounded-3xl border border-amber-100 bg-white/80 p-8 shadow-lg backdrop-blur">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase text-amber-700">
          Acceso
        </p>
        <h2 className="text-2xl font-extrabold text-slate-900">{copy.title}</h2>
        <p className="text-sm text-slate-600">
          Guarda tus notas en tu propio mural privado.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
        autoComplete="on"
      >
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          Correo
          <input
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            className="w-full rounded-xl border border-amber-100 bg-white px-4 py-3 text-base font-normal text-slate-900 shadow-inner outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200"
            placeholder="tucorreo@ejemplo.com"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          Contraseña
          <input
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
            className="w-full rounded-xl border border-amber-100 bg-white px-4 py-3 text-base font-normal text-slate-900 shadow-inner outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200"
            placeholder="********"
            required
            minLength={6}
          />
        </label>

        {mode === "register" && (
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
            Repite contraseña
            <input
              type="password"
              value={form.confirm}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, confirm: e.target.value }))
              }
              className="w-full rounded-xl border border-amber-100 bg-white px-4 py-3 text-base font-normal text-slate-900 shadow-inner outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200"
              placeholder="********"
              required
              minLength={6}
            />
          </label>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Procesando..." : copy.cta}
        </button>
      </form>

      <div className="mt-4 text-sm text-slate-600">
        {copy.switchLabel}{" "}
        <button
          type="button"
          onClick={() => onModeChange(mode === "login" ? "register" : "login")}
          className="font-semibold text-amber-700 underline-offset-4 hover:underline"
        >
          {copy.switchCta}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
