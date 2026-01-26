import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const register = async (payload) => {
  const { data } = await api.post("/auth/register", payload);
  return data;
};

export const login = async (payload) => {
  const { data } = await api.post("/auth/login", payload);
  return data;
};

export const fetchNotes = async () => {
  const { data } = await api.get("/notes");
  return data;
};

export const createNote = async (payload) => {
  const { data } = await api.post("/notes", payload);
  return data;
};

export const updateNote = async (id, payload) => {
  const { data } = await api.put(`/notes/${id}`, payload);
  return data;
};

export const deleteNote = async (id) => {
  await api.delete(`/notes/${id}`);
};

export default api;
