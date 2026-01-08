import { useEffect, useMemo, useState } from "react";

async function request(path, options) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      (typeof data === "string" ? data : "") ||
      `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

function stripHtml(html) {
  return String(html || "").replace(/<[^>]*>/g, "").trim();
}

export default function FavouritesPage() {
  // user
  const [selectedUserId, setSelectedUserId] = useState(localStorage.getItem("userid") || "");
  const [userId, setUserId] = useState(localStorage.getItem("userid") || "");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // lists
  const [lists, setLists] = useState([]);
  const [selected, setSelected] = useState(null);

  // create list
  const [newListName, setNewListName] = useState("");
  const [visibility, setVisibility] = useState("private");

  // manual search add
  const [showQuery, setShowQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // recommended (default search)
  const RECOMMENDED_QUERIES = useMemo(() => ["friends", "office", "breaking", "game", "girls", "sherlock"], []);
  const [recommended, setRecommended] = useState([]);
  const [loadingRec, setLoadingRec] = useState(false);

  // cache show details for selected items
  const [showCache, setShowCache] = useState({});

  // ui
  const [loadingLists, setLoadingLists] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const selectedId = useMemo(() => (selected?._id || selected?.id || null), [selected]);

  /* ---------- data: users ---------- */
  useEffect(() => {
    (async () => {
      setUsersLoading(true);
      try {
        const data = await request("/api/users");
        setUsers(Array.isArray(data) ? data : []);
        const savedId = localStorage.getItem("userid");
        const initialId = (savedId && data.find((u) => u._id === savedId)?._id) || data[0]?._id || "";
        if (!selectedUserId && initialId) setSelectedUserId(initialId);
        if (!userId && initialId) setUserId(initialId);
      } catch (e) {
        setErrMsg(e.message || "Failed to load users");
      } finally {
        setUsersLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- styles ---------- */
  const pageStyle = {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 700px at 30% -10%, rgba(56,189,248,0.25), transparent 55%), linear-gradient(180deg, #081225 0%, #040810 100%)",
    color: "rgba(255,255,255,0.92)",
    padding: "28px 0",
  };
  const containerStyle = { maxWidth: 1280, margin: "0 auto", padding: "0 18px" };

  const panelStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 14,
    backdropFilter: "blur(10px)",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
  };

  const buttonStyle = {
    padding: "10px 16px",
    borderRadius: 999,
    border: "1px solid rgba(56,189,248,0.35)",
    background: "rgba(56,189,248,0.18)",
    color: "rgba(255,255,255,0.95)",
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const buttonGhostStyle = {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.9)",
    fontWeight: 750,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const buttonDangerStyle = {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,99,132,0.35)",
    background: "rgba(255,99,132,0.12)",
    color: "rgba(255,220,230,0.95)",
    fontWeight: 850,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const listCardStyle = (active) => ({
    background: active ? "rgba(56,189,248,0.10)" : "rgba(255,255,255,0.04)",
    border: active ? "1px solid rgba(56,189,248,0.35)" : "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 14,
    cursor: "pointer",
  });

  const rowStyle = {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 12,
    background: "rgba(255,255,255,0.04)",
    display: "flex",
    gap: 12,
    alignItems: "center",
  };

  const posterStyle = {
    width: 60,
    height: 90,
    borderRadius: 12,
    objectFit: "cover",
    background: "rgba(255,255,255,0.06)",
    flexShrink: 0,
  };

  const recCardStyle = {
    minWidth: 200,
    maxWidth: 200,
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    padding: 12,
    display: "flex",
    gap: 12,
    alignItems: "center",
  };

  /* ---------- actions ---------- */
  async function confirmUser() {
    setErrMsg("");
    try {
      if (!selectedUserId) throw new Error("Please select a user.");

      setUserId(selectedUserId);
      localStorage.setItem("userid", selectedUserId);

      await loadLists(selectedUserId, { keepSelected: false });
    } catch (e) {
      setErrMsg(e.message || "Failed to confirm user");
      setUserId("");
      setLists([]);
      setSelected(null);
    }
  }

  async function loadLists(uid = userId, opts = { keepSelected: true }) {
    if (!uid) return;
    setLoadingLists(true);
    setErrMsg("");
    try {
      const data = await request(`/api/favourites?userid=${encodeURIComponent(uid)}`);
      setLists(Array.isArray(data) ? data : []);
      if (!opts.keepSelected) setSelected(null);
    } catch (e) {
      if (e.status === 404) {
        setLists([]);
        if (!opts.keepSelected) setSelected(null);
      } else {
        setErrMsg(e.message || "Failed to load favourites");
      }
    } finally {
      setLoadingLists(false);
    }
  }

  async function openList(listId) {
    setErrMsg("");
    try {
      const data = await request(`/api/favourites/${listId}`);
      setSelected(data);
    } catch (e) {
      setErrMsg(e.message || "Failed to load list");
    }
  }

  async function createList() {
    setErrMsg("");
    try {
      if (!userId) throw new Error("Confirm user first.");
      if (!newListName.trim()) throw new Error("List name is required.");

      await request("/api/favourites", {
        method: "POST",
        body: JSON.stringify({
          userid: userId,
          list_name: newListName.trim(),
          visibility,
        }),
      });

      setNewListName("");
      await loadLists(userId, { keepSelected: true });
    } catch (e) {
      setErrMsg(e.message || "Failed to create list");
    }
  }

  async function deleteList(listId) {
    setErrMsg("");
    try {
      await request(`/api/favourites/${listId}`, { method: "DELETE" });
      if (selectedId === listId) setSelected(null);
      await loadLists(userId, { keepSelected: true });
    } catch (e) {
      setErrMsg(e.message || "Failed to delete list");
    }
  }

  async function addShowToSelected(showid) {
    setErrMsg("");
    try {
      if (!selectedId) throw new Error("Open a list first.");
      await request(`/api/favourites/${selectedId}/items`, {
        method: "POST",
        body: JSON.stringify({ showid: String(showid) }),
      });

      await openList(selectedId);
      await loadLists(userId, { keepSelected: true });
    } catch (e) {
      setErrMsg(e.message || "Failed to add show");
    }
  }

  async function removeShowFromSelected(showid) {
    setErrMsg("");
    try {
      if (!selectedId) return;
      await request(`/api/favourites/${selectedId}/items`, {
        method: "DELETE",
        body: JSON.stringify({ showid: String(showid) }),
      });

      await openList(selectedId);
      await loadLists(userId, { keepSelected: true });
    } catch (e) {
      setErrMsg(e.message || "Failed to remove show");
    }
  }

  async function searchShows() {
    setSearchErr("");
    setSearching(true);
    try {
      const q = showQuery.trim();
      if (!q) {
        setSearchResults([]);
        setSearchErr("Type a show name.");
        return;
      }
      const data = await request(`/api/shows?query=${encodeURIComponent(q)}`);
      setSearchResults(Array.isArray(data) ? data : []);
      if (!data?.length) setSearchErr("No results.");
    } catch (e) {
      setSearchErr(e.message || "Search failed");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function onSearchKeyDown(e) {
    if (e.key === "Enter") searchShows();
  }

  /* ---------- default recommended search ---------- */
  useEffect(() => {
    (async () => {
      setLoadingRec(true);
      try {
        const batches = await Promise.all(
          RECOMMENDED_QUERIES.map((q) =>
            request(`/api/shows?query=${encodeURIComponent(q)}`).catch(() => [])
          )
        );

        const flat = batches.flatMap((arr) => (Array.isArray(arr) ? arr.slice(0, 2) : []));
        const map = new Map();
        for (const s of flat) {
          if (s?.id != null && !map.has(String(s.id))) map.set(String(s.id), s);
        }
        setRecommended(Array.from(map.values()).slice(0, 12));
      } finally {
        setLoadingRec(false);
      }
    })();
  }, [RECOMMENDED_QUERIES]);

  /* ---------- cache items detail ---------- */
  useEffect(() => {
    if (!selected?.items?.length) return;

    const ids = selected.items
      .map((it) => (it.showid != null ? String(it.showid) : null))
      .filter(Boolean);

    const missing = ids.filter((id) => !showCache[id]);
    if (missing.length === 0) return;

    (async () => {
      const results = await Promise.all(
        missing.map((id) =>
          fetch(`/api/shows/${encodeURIComponent(id)}`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      );
      const next = {};
      results.forEach((s, i) => {
        if (s) next[missing[i]] = s;
      });
      if (Object.keys(next).length) setShowCache((prev) => ({ ...prev, ...next }));
    })();
  }, [selected, showCache]);

  /* ---------- initial load ---------- */
  useEffect(() => {
    if (userId) loadLists(userId, { keepSelected: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page">
      <div className="users-page panel">
        <h2 style={{ textAlign: "center", marginBottom: "20px", letterSpacing: "-0.01em" }}>Favourites</h2>

        {/* user row */}
        <div style={{ ...panelStyle, marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: '#9ca3af' }}>User</label>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <select
              value={selectedUserId}
              onChange={(e) => {
                const newUserId = e.target.value;
                setSelectedUserId(newUserId);
                setUserId(newUserId);
                localStorage.setItem("userid", newUserId);
                if (newUserId) {
                  loadLists(newUserId, { keepSelected: false });
                }
              }}
              style={inputStyle}
            >
              {users.length === 0 && <option value="">Loading users...</option>}
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.username} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {errMsg ? (
            <div style={{ marginTop: 10, color: "rgba(255,120,140,0.95)", fontWeight: 700 }}>{errMsg}</div>
          ) : null}
        </div>

        {/* create list row */}
        <div style={{ ...panelStyle, marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: '#9ca3af' }}>New list</label>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="New list name..."
              style={inputStyle}
            />
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)} style={{ ...inputStyle, flex: "0 0 180px" }}>
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
            <button style={buttonStyle} onClick={createList} disabled={!userId}>
              Create
            </button>
          </div>
        </div>

        {/* Recommended row  */}
        <div style={{ ...panelStyle, marginBottom: 16 }}>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>Recommended</div>
          <div style={{ color: "rgba(255,255,255,0.70)", fontSize: 12, marginBottom: 12 }}>
            Default recommendations from TVMaze search. Add to the opened list.
          </div>

          {!selectedId ? (
            <div style={{ color: "rgba(255,255,255,0.65)", marginBottom: 10 }}>
              Open a list first to add items.
            </div>
          ) : null}

          {loadingRec ? (
            <div style={{ color: "rgba(255,255,255,0.65)" }}>Loading recommendations…</div>
          ) : (
            <div style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
                {recommended.map((s) => (
                  <div key={s.id} style={recCardStyle}>
                    <img src={s.image || "https://via.placeholder.com/60x90?text=No+Img"} alt="" style={posterStyle} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.name}
                      </div>
                      <div style={{ opacity: 0.78, fontSize: 12, marginTop: 4 }}>
                        {s.premiered ? `(${String(s.premiered).slice(0, 4)}) ` : ""}
                        {typeof s.rating === "number" ? `⭐ ${s.rating}` : ""}
                      </div>
                      <button
                        style={{
                          ...buttonStyle,
                          marginTop: 10,
                          width: "100%",
                          opacity: selectedId ? 1 : 0.5,
                          cursor: selectedId ? "pointer" : "not-allowed",
                        }}
                        disabled={!selectedId}
                        onClick={() => addShowToSelected(s.id)}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 6, color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
          </div>
        </div>

        {/* 2 columns: Lists + Detail */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.7fr", gap: 16 }}>
          {/* Lists */}
          <div style={panelStyle}>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 12 }}>Your Lists</div>

            {lists.length === 0 ? (
              <div style={{ color: "rgba(255,255,255,0.65)" }}>No lists yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {lists.map((l) => {
                  const id = l._id || l.id;
                  const active = selectedId === id;
                  const name = l.list_name || "Untitled list";
                  const count = l.items?.length ?? 0;

                  return (
                    <div key={id} style={listCardStyle(active)} onClick={() => openList(id)}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 950, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {name}
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", opacity: 0.85, fontSize: 12 }}>
                            <span>{count} items</span>
                            <span>• {(l.visibility || "private").charAt(0).toUpperCase() + (l.visibility || "private").slice(1)}</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            style={buttonGhostStyle}
                            onClick={(e) => {
                              e.stopPropagation();
                              openList(id);
                            }}
                          >
                            Open
                          </button>
                          <button
                            style={buttonDangerStyle}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteList(id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail */}
          <div style={panelStyle}>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 12 }}>List Detail</div>

            {!selected ? (
              <div style={{ color: "rgba(255,255,255,0.65)" }}>Select a list to view items.</div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 950 }}>{selected.list_name}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>visibility: {selected.visibility.charAt(0).toUpperCase() + selected.visibility.slice(1)}</div>
                </div>

                {/* search add */}
                <div style={{ marginTop: 12, ...panelStyle, boxShadow: "none" }}>
                  <div style={{ fontWeight: 900, marginBottom: 10 }}>Search & Add</div>

                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <input
                      value={showQuery}
                      onChange={(e) => setShowQuery(e.target.value)}
                      onKeyDown={onSearchKeyDown}
                      placeholder="Search show name (press Enter)"
                      style={inputStyle}
                    />
                    <button style={buttonStyle} onClick={searchShows} disabled={searching || !showQuery.trim()}>
                      {searching ? "Searching..." : "Search"}
                    </button>
                  </div>

                  {searchErr ? (
                    <div style={{ marginTop: 10, color: "rgba(255,120,140,0.95)", fontWeight: 700 }}>{searchErr}</div>
                  ) : null}

                  {searchResults.length > 0 ? (
                    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                      {searchResults.slice(0, 8).map((s) => {
                        const summary = stripHtml(s.summary);
                        return (
                          <div key={s.id} style={rowStyle}>
                            <img src={s.image || "https://via.placeholder.com/60x90?text=No+Img"} alt="" style={posterStyle} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 950, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {s.name}{" "}
                                <span style={{ opacity: 0.75, fontWeight: 800 }}>
                                  {s.premiered ? `(${String(s.premiered).slice(0, 4)})` : ""}
                                </span>
                              </div>
                              <div style={{ opacity: 0.8, fontSize: 12, marginTop: 4 }}>
                                {typeof s.rating === "number" ? `⭐ ${s.rating}  ` : ""}
                                {Array.isArray(s.genres) && s.genres.length ? `• ${s.genres.slice(0, 3).join(", ")}` : ""}
                              </div>
                              {summary ? (
                                <div style={{ opacity: 0.9, fontSize: 12, marginTop: 6, lineHeight: 1.35 }}>
                                  {summary.slice(0, 140)}
                                  {summary.length > 140 ? "..." : ""}
                                </div>
                              ) : null}
                            </div>
                            <button style={buttonStyle} onClick={() => addShowToSelected(s.id)}>
                              Add
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                {/* items */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 950, marginBottom: 10 }}>Items</div>

                  {selected.items?.length ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      {selected.items.map((it, idx) => {
                        const sid = it.showid != null ? String(it.showid) : null;
                        const show = sid ? showCache[sid] : null;

                        return (
                          <div key={sid || idx} style={rowStyle}>
                            <img src={show?.image || "https://via.placeholder.com/60x90?text=No+Img"} alt="" style={posterStyle} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 950 }}>
                                {show?.name || (sid ? `Not Found (showid: ${sid})` : "Unknown")}
                              </div>
                              <div style={{ opacity: 0.8, fontSize: 12, marginTop: 4 }}>
                                {show?.premiered ? `(${String(show.premiered).slice(0, 4)}) ` : ""}
                                {typeof show?.rating === "number" ? `⭐ ${show.rating}` : ""}
                              </div>
                              {show?.summary ? (
                                <div style={{ opacity: 0.9, fontSize: 12, marginTop: 6, lineHeight: 1.35 }}>
                                  {stripHtml(show.summary).slice(0, 140)}
                                  {stripHtml(show.summary).length > 140 ? "..." : ""}
                                </div>
                              ) : null}
                            </div>

                            <button style={buttonDangerStyle} onClick={() => removeShowFromSelected(sid)}>
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ color: "rgba(255,255,255,0.65)" }}>No items in this list.</div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
