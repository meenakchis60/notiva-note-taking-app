/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";
import Login from "./Login";

const API_URL = import.meta.env.VITE_API_URL || "import.meta.env.VITE_API_URL";
const emptyNote = {
  title: "",
  content: "",
  subject: "",
  notebook: "",
  folder_path: "",
  tags: "",
  checklist: [],
  attachments: [],
  reminder_at: "",
  is_pinned: false,
  is_starred: false,
  background_color: "#fff8dc",
};

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("access")}` };
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(localStorage.getItem("access")));
  const [notes, setNotes] = useState([]);
  const [filters, setFilters] = useState({ search: "", subject: "", notebook: "", tag: "", starred: false });
  const [metadata, setMetadata] = useState({ subjects: [], notebooks: [], folders: [], tags: [] });
  const [form, setForm] = useState(emptyNote);
  const [editingId, setEditingId] = useState(null);
  const [activeView, setActiveView] = useState("notes");
  const [preferences, setPreferences] = useState({
    theme: "light",
    font_size: 16,
    autosave_interval: 30,
    notifications_enabled: true,
  });
  const [message, setMessage] = useState("");

  const refreshAccessToken = async () => {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) throw new Error("Please sign in again.");

    const response = await axios.post(`${API_URL}/token/refresh/`, { refresh });
    localStorage.setItem("access", response.data.access);
    return response.data.access;
  };

  const requestWithAuth = async (requestFactory) => {
    try {
      return await requestFactory(authHeaders());
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          const newAccess = await refreshAccessToken();
          return requestFactory({ Authorization: `Bearer ${newAccess}` });
        } catch (refreshError) {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          setIsLoggedIn(false);
          throw refreshError;
        }
      }
      throw error;
    }
  };

  const handleApiError = (error, fallbackMessage) => {
    const apiMessage = error.response?.data?.message || error.response?.data?.detail;
    setMessage(apiMessage || fallbackMessage);
  };

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (activeView === "trash") params.set("trash", "true");
    if (filters.search) params.set("search", filters.search);
    if (filters.subject) params.set("subject", filters.subject);
    if (filters.notebook) params.set("notebook", filters.notebook);
    if (filters.tag) params.set("tag", filters.tag);
    if (filters.starred) params.set("starred", "true");
    return params.toString();
  }, [activeView, filters]);

  const loadNotes = async () => {
    if (!localStorage.getItem("access")) return;
    try {
      const response = await requestWithAuth((headers) =>
        axios.get(`${API_URL}/notes/${queryString ? `?${queryString}` : ""}`, { headers }),
      );
      setNotes(response.data);
    } catch (error) {
      handleApiError(error, "Could not load notes. Please sign in again.");
    }
  };

  const loadMetadata = async () => {
    try {
      const response = await requestWithAuth((headers) => axios.get(`${API_URL}/filter/`, { headers }));
      setMetadata(response.data);
    } catch (error) {
      handleApiError(error, "Could not load filters.");
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await requestWithAuth((headers) => axios.get(`${API_URL}/preferences/`, { headers }));
      setPreferences(response.data);
    } catch (error) {
      handleApiError(error, "Could not load preferences.");
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadNotes();
      loadMetadata();
      loadPreferences();
    }
  }, [isLoggedIn, queryString]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveNote = async () => {
    if (!form.title.trim()) {
      setMessage("Please enter a note title.");
      return;
    }

    const payload = {
      ...form,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .join(", "),
    };

    try {
      if (editingId) {
        await requestWithAuth((headers) => axios.put(`${API_URL}/notes/${editingId}/`, payload, { headers }));
        setMessage("Note updated.");
      } else {
        await requestWithAuth((headers) => axios.post(`${API_URL}/notes/`, payload, { headers }));
        setMessage("Note created.");
      }

      setForm(emptyNote);
      setEditingId(null);
      await loadNotes();
      await loadMetadata();
    } catch (error) {
      handleApiError(error, "Could not save note. Please check the backend server and try again.");
    }
  };

  const editNote = (note) => {
    setActiveView("notes");
    setEditingId(note.id);
    setForm({
      title: note.title,
      content: note.content,
      subject: note.subject,
      notebook: note.notebook,
      folder_path: note.folder_path,
      tags: note.tags,
      checklist: note.checklist || [],
      attachments: note.attachments || [],
      reminder_at: note.reminder_at ? note.reminder_at.slice(0, 16) : "",
      is_pinned: note.is_pinned,
      is_starred: note.is_starred,
      background_color: note.background_color || "#fff8dc",
    });
  };

  const patchNote = async (note, changes) => {
    try {
      await requestWithAuth((headers) => axios.put(`${API_URL}/notes/${note.id}/`, { ...note, ...changes }, { headers }));
      await loadNotes();
      await loadMetadata();
    } catch (error) {
      handleApiError(error, "Could not update note.");
    }
  };

  const moveToTrash = async (id) => {
    try {
      await requestWithAuth((headers) => axios.delete(`${API_URL}/notes/${id}/`, { headers }));
      setMessage("Note moved to trash.");
      await loadNotes();
    } catch (error) {
      handleApiError(error, "Could not move note to trash.");
    }
  };

  const restoreNote = async (id) => {
    try {
      await requestWithAuth((headers) => axios.post(`${API_URL}/notes/${id}/restore/`, {}, { headers }));
      setMessage("Note restored.");
      await loadNotes();
    } catch (error) {
      handleApiError(error, "Could not restore note.");
    }
  };

  const deleteForever = async (id) => {
    try {
      await requestWithAuth((headers) => axios.delete(`${API_URL}/notes/${id}/permanent-delete/`, { headers }));
      setMessage("Note deleted permanently.");
      await loadNotes();
    } catch (error) {
      handleApiError(error, "Could not delete note permanently.");
    }
  };

  const addChecklistItem = () => {
    updateForm("checklist", [...form.checklist, { text: "", done: false }]);
  };

  const updateChecklistItem = (index, changes) => {
    const nextItems = form.checklist.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...changes } : item,
    );
    updateForm("checklist", nextItems);
  };

  const addAttachment = () => {
    updateForm("attachments", [...form.attachments, { name: "", url: "" }]);
  };

  const updateAttachment = (index, changes) => {
    const nextAttachments = form.attachments.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...changes } : item,
    );
    updateForm("attachments", nextAttachments);
  };

  const exportNote = (note) => {
    const lines = [
      note.title,
      "",
      note.content,
      "",
      `Subject: ${note.subject || "Unassigned"}`,
      `Notebook: ${note.notebook || "General"}`,
      `Folder: ${note.folder_path || "Root"}`,
      `Tags: ${note.tags || "None"}`,
      `Reminder: ${note.reminder_at || "None"}`,
    ];
    const file = new Blob([lines.join("\n")], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = `${note.title || "note"}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const savePreferences = async (changes) => {
    const nextPrefs = { ...preferences, ...changes };
    setPreferences(nextPrefs);
    try {
      await requestWithAuth((headers) => axios.put(`${API_URL}/preferences/`, nextPrefs, { headers }));
    } catch (error) {
      handleApiError(error, "Could not save preferences.");
    }
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <main className={`app-shell ${preferences.theme}`} style={{ fontSize: `${preferences.font_size}px` }}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">N</div>
          <div>
            <h1>Notiva</h1>
            <span>Smart notes workspace</span>
          </div>
        </div>
        <nav>
          <button className={activeView === "notes" ? "active" : ""} onClick={() => setActiveView("notes")}>Dashboard</button>
          <button className={activeView === "trash" ? "active" : ""} onClick={() => setActiveView("trash")}>Trash</button>
          <button className={activeView === "settings" ? "active" : ""} onClick={() => setActiveView("settings")}>Settings</button>
        </nav>
        <div className="folder-tree">
          <strong>Folders</strong>
          <span>All Notes</span>
          {metadata.folders.map((folder) => (
            <button key={folder} onClick={() => setFilters((current) => ({ ...current, notebook: "", subject: "", search: folder }))}>
              {folder.split("/").join(" / ")}
            </button>
          ))}
        </div>
        <button className="ghost" onClick={logout}>Sign Out</button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h2>{activeView === "trash" ? "Trash" : activeView === "settings" ? "Settings & Preferences" : "Dashboard"}</h2>
            {activeView === "notes" && <p className="page-subtitle">Capture, organize, and revise your study notes in one place.</p>}
          </div>
          <input
            type="search"
            placeholder="Search title, content, or tags"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
        </header>

        {message && <div className="notice">{message}</div>}

        {activeView === "settings" ? (
          <section className="settings-panel">
            <label>
              Theme
              <select value={preferences.theme} onChange={(event) => savePreferences({ theme: event.target.value })}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label>
              Font size
              <input type="range" min="14" max="20" value={preferences.font_size} onChange={(event) => savePreferences({ font_size: Number(event.target.value) })} />
            </label>
            <label>
              Auto-save interval
              <input type="number" min="10" value={preferences.autosave_interval} onChange={(event) => savePreferences({ autosave_interval: Number(event.target.value) })} />
            </label>
            <label className="toggle-row">
              <input type="checkbox" checked={preferences.notifications_enabled} onChange={(event) => savePreferences({ notifications_enabled: event.target.checked })} />
              Enable reminder notifications
            </label>
          </section>
        ) : (
          <div className="main-grid">
            {activeView === "notes" && (
              <section className="editor-panel">
                <div className="editor-heading">
                  <h3>{editingId ? "Edit Note" : "Create Note"}</h3>
                  <button className="ghost" onClick={() => { setForm(emptyNote); setEditingId(null); }}>Clear</button>
                </div>
                <input placeholder="Note title" value={form.title} onChange={(event) => updateForm("title", event.target.value)} />
                <textarea placeholder="Write lecture notes, headings, lists, and revision points here" value={form.content} onChange={(event) => updateForm("content", event.target.value)} />
                <div className="form-grid">
                  <input placeholder="Subject" value={form.subject} onChange={(event) => updateForm("subject", event.target.value)} />
                  <input placeholder="Notebook" value={form.notebook} onChange={(event) => updateForm("notebook", event.target.value)} />
                  <input placeholder="Folder path e.g. Science/Physics/Unit 1" value={form.folder_path} onChange={(event) => updateForm("folder_path", event.target.value)} />
                  <input placeholder="Tags separated by commas" value={form.tags} onChange={(event) => updateForm("tags", event.target.value)} />
                  <input type="datetime-local" value={form.reminder_at} onChange={(event) => updateForm("reminder_at", event.target.value)} />
                  <input type="color" value={form.background_color} onChange={(event) => updateForm("background_color", event.target.value)} />
                </div>
                <div className="toolbar">
                  <button onClick={() => updateForm("is_pinned", !form.is_pinned)}>{form.is_pinned ? "Unpin" : "Pin"}</button>
                  <button onClick={() => updateForm("is_starred", !form.is_starred)}>{form.is_starred ? "Unstar" : "Star"}</button>
                  <button onClick={addChecklistItem}>Add Checklist</button>
                  <button onClick={addAttachment}>Add Attachment</button>
                </div>
                {form.checklist.map((item, index) => (
                  <div className="check-row" key={`check-${index}`}>
                    <input type="checkbox" checked={item.done} onChange={(event) => updateChecklistItem(index, { done: event.target.checked })} />
                    <input placeholder="Checklist item" value={item.text} onChange={(event) => updateChecklistItem(index, { text: event.target.value })} />
                  </div>
                ))}
                {form.attachments.map((item, index) => (
                  <div className="attachment-row" key={`attachment-${index}`}>
                    <input placeholder="File name" value={item.name} onChange={(event) => updateAttachment(index, { name: event.target.value })} />
                    <input placeholder="File URL or path" value={item.url} onChange={(event) => updateAttachment(index, { url: event.target.value })} />
                  </div>
                ))}
                <button className="primary" onClick={saveNote}>{editingId ? "Save Changes" : "Save Note"}</button>
              </section>
            )}

            <section className="notes-panel">
              <div className="filters">
                <select value={filters.subject} onChange={(event) => setFilters((current) => ({ ...current, subject: event.target.value }))}>
                  <option value="">All subjects</option>
                  {metadata.subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                </select>
                <select value={filters.notebook} onChange={(event) => setFilters((current) => ({ ...current, notebook: event.target.value }))}>
                  <option value="">All notebooks</option>
                  {metadata.notebooks.map((notebook) => <option key={notebook} value={notebook}>{notebook}</option>)}
                </select>
                <select value={filters.tag} onChange={(event) => setFilters((current) => ({ ...current, tag: event.target.value }))}>
                  <option value="">All tags</option>
                  {metadata.tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
                </select>
                <label className="toggle-row">
                  <input type="checkbox" checked={filters.starred} onChange={(event) => setFilters((current) => ({ ...current, starred: event.target.checked }))} />
                  Starred
                </label>
              </div>

              <div className="note-list">
                {notes.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">N</div>
                    <h3>No notes found</h3>
                    <p>Create your first note or adjust the filters to bring notes back into view.</p>
                  </div>
                )}
                {notes.map((note) => (
                  <article className="note-card" key={note.id} style={{ backgroundColor: note.background_color }}>
                    <div className="note-card-head">
                      <div>
                        <h3>{note.title}</h3>
                        <p>{note.subject || "Unassigned"} / {note.notebook || "General"}</p>
                      </div>
                      <div className="badges">
                        {note.is_pinned && <span>Pinned</span>}
                        {note.is_starred && <span>Starred</span>}
                      </div>
                    </div>
                    <p className="note-content">{note.content}</p>
                    {note.tag_list.length > 0 && <p className="tag-line">{note.tag_list.map((tag) => `#${tag}`).join(" ")}</p>}
                    {note.reminder_at && <p className="meta-line">Reminder: {new Date(note.reminder_at).toLocaleString()}</p>}
                    {note.checklist?.length > 0 && (
                      <ul className="checklist-preview">
                        {note.checklist.map((item, index) => <li key={index}>{item.done ? "[x]" : "[ ]"} {item.text}</li>)}
                      </ul>
                    )}
                    {note.attachments?.length > 0 && <p className="meta-line">Attachments: {note.attachments.filter((item) => item.name).length}</p>}
                    <div className="card-actions">
                      {activeView === "trash" ? (
                        <>
                          <button onClick={() => restoreNote(note.id)}>Restore</button>
                          <button className="danger" onClick={() => deleteForever(note.id)}>Delete Forever</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => editNote(note)}>Edit</button>
                          <button onClick={() => patchNote(note, { is_pinned: !note.is_pinned })}>{note.is_pinned ? "Unpin" : "Pin"}</button>
                          <button onClick={() => patchNote(note, { is_starred: !note.is_starred })}>{note.is_starred ? "Unstar" : "Star"}</button>
                          <button onClick={() => exportNote(note)}>Export</button>
                          <button onClick={() => navigator.clipboard.writeText(`${API_URL}${note.share_url}`)}>Copy Share Link</button>
                          <button className="danger" onClick={() => moveToTrash(note.id)}>Trash</button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
