import { useEffect, useMemo, useState } from "react";

/* ---------------------- helpers ---------------------- */
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

async function resolveUserId(input) {
  const users = await request("/api/users");
  const found = users.find((u) => u.username === input || u.email === input);
  if (!found) throw new Error("User not found by username/email");
  return found._id;
}

/* ---------------------- page ---------------------- */
export default function FavouritesPage() {
  // user
  const [userInput, setUserInput] = useState(localStorage.getItem("userid_input") || "");
  const [userId, setUserId] = useState(localStorage.getItem("userid") || "");

  // lists
  const [lists, setLists] = useState([]);
  const [selected, setSelected] = useState(null);

  // create list
  const [newListName, setNewListName] = useState("");
  const [visibility, setVisibility] = useState("private");

  // tvmaze search
  const [showQuery, setShowQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [previewOpen, setPreviewOpen] = useState({}); // { [showid]: boolean }

  // show detail cache (for selected items)
  const [showCache, setShowCache] = useState({}); // { [showid]: show }

  // sorting
  const [sortMode, setSortMode] = useState("added-newest");

  // ui
  const [loadingLists, setLoadingLists] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const selectedId = useMemo(() => (selected?._id || selected?.id || null), [selected]);

  /* ---------------------- user actions ---------------------- */
  async function confirmUser() {
    setErrMsg("");
    try {
      if (!userInput.trim()) throw new Error("Please enter username or email.");
      const realUserId = await resolveUserId(userInput.trim());

      setUserId(realUserId);
      localStorage.setItem("userid", realUserId);
      localStorage.setItem("userid_input", userInput.trim());

      await loadLists(realUserId);
    } catch (e) {
      setUserId("");
      setLists([]);
      setSelected(null);
      setErrMsg(e.message || "Failed to confirm user");
    }
  }

  /* ---------------------- lists ---------------------- */
  async function loadLists(uid = userId) {
    if (!uid) return;
    setLoadingLists(true);
    setErrMsg("");
    try {
      const data = await request(`/api/favourites?userid=${encodeURIComponent(uid)}`);
      setLists(Array.isArray(data) ? data : []);
      setSelected(null);
    } catch (e) {
      if (e.status === 404) {
        setLists([]);
        setSelected(null);
      } else {
        setLists([]);
        setSelected(null);
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
      setSortMode("added-newest");
    } catch (e) {
      setSelected(null);
      setErrMsg(e.message || "Failed to load list detail");
    }
  }

  async function createList() {
    setErrMsg("");
    try {
      if (!userId) throw new Error("Please confirm user first.");
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
      await loadLists(userId);
    } catch (e) {
      setErrMsg(e.message || "Failed to create list");
    }
  }

  async function deleteList(listId) {
    setErrMsg("");
    try {
      await request(`/api/favourites/${listId}`, { method: "DELETE" });
      if (selectedId === listId) setSelected(null);
      await loadLists(userId);
    } catch (e) {
      setErrMsg(e.message || "Failed to delete list");
    }
  }

  /* ---------------------- tvmaze search ---------------------- */
  async function searchShows() {
    setSearchErr("");
    setSearching(true);
    try {
      const q = showQuery.trim();
      if (!q) {
        setSearchResults([]);
        setSearchErr("Type a name to search.");
        return;
      }
      const data = await request(`/api/shows?query=${encodeURIComponent(q)}`);
      const arr = Array.isArray(data) ? data : [];
      setSearchResults(arr);
      if (arr.length === 0) setSearchErr("No results.");
    } catch (e) {
      setSearchResults([]);
      setSearchErr(e.message || "Search failed");
    } finally {
      setSearching(false);
    }
  }

  function onSearchKeyDown(e) {
    if (e.key === "Enter") searchShows();
  }

  function togglePreview(id) {
    setPreviewOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  /* ---------------------- favourites items ---------------------- */
  async function addShowId(showId) {
    setErrMsg("");
    try {
      if (!selectedId) throw new Error("Open a list first.");
      await request(`/api/favourites/${selectedId}/items`, {
        method: "POST",
        body: JSON.stringify({ showid: String(showId) }),
      });

      // refresh selected list + list counts
      await openList(selectedId);
      await loadLists(userId);
    } catch (e) {
      setErrMsg(e.message || "Failed to add show");
    }
  }

  async function removeShowId(item) {
    setErrMsg("");
    try {
      if (!selectedId) return;
      await request(`/api/favourites/${selectedId}/items`, {
        method: "DELETE",
        body: JSON.stringify({ showid: item.showid }),
      });

      await openList(selectedId);
      await loadLists(userId);
    } catch (e) {
      setErrMsg(e.message || "Failed to remove show");
    }
  }

  /* ---------------------- cache show details for items ---------------------- */
  useEffect(() => {
    if (!selected?.items?.length) return;

    const ids = selected.items
      .map((it) => (it.showid != null ? String(it.showid) : null))
      .filter(Boolean);

    const missing = ids.filter((id) => !showCache[id]);
    if (missing.length === 0) return;

    (async () => {
      try {
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

        if (Object.keys(next).length > 0) {
          setShowCache((prev) => ({ ...prev, ...next }));
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  /* ---------------------- sorted items (optimization #2) ---------------------- */
  const sortedItems = useMemo(() => {
    const items = Array.isArray(selected?.items) ? [...selected.items] : [];
    if (items.length === 0) return items;


    if (sortMode === "added-newest") return items.reverse();
    if (sortMode === "added-oldest") return items;

    const getName = (it) => {
      const sid = it?.showid != null ? String(it.showid) : "";
      return (showCache[sid]?.name || "").toLowerCase();
    };

    if (sortMode === "name-asc") {
      return items.sort((a, b) => getName(a).localeCompare(getName(b)));
    }
    if (sortMode === "name-desc") {
      return items.sort((a, b) => getName(b).localeCompare(getName(a)));
    }

    return items;
  }, [selected, showCache, sortMode]);

  /* ---------------------- initial load ---------------------- */
  useEffect(() => {
    if (userId) loadLists(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------- styles ---------------------- */
  const cardStyle = (active) => ({
    border: "1px solid #333",
    borderRadius: 14,
    padding: 14,
    cursor: "pointer",
    background: active ? "rgba(0, 160, 255, 0.10)" : "rgba(255, 255, 255, 0.03)",
    boxShadow: active ? "0 0 0 1px rgba(0,160,255,0.35) inset" : "none",
    transition: "transform 0.08s ease, background 0.15s ease",
  });

  return (
    <div style={{ maxWidth: 1200, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 16 }}>Favourites (TVMaze)</h1>

      {/* user confirm */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <input
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter username or email"
          style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #333" }}
        />
        <button onClick={confirmUser}>Confirm</button>
        <button onClick={() => loadLists(userId)} disabled={loadingLists || !userId}>
          {loadingLists ? "Loading..." : "Refresh"}
        </button>
      </div>

      {errMsg ? <div style={{ color: "crimson", marginBottom: 16 }}>Error: {errMsg}</div> : null}

      {/* create list */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <input
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="New list name..."
          style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #333" }}
        />

        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #333" }}
        >
          <option value="private">private</option>
          <option value="public">public</option>
        </select>

        <button onClick={createList} disabled={!userId}>
          Create
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        {/* left lists (optimization #3) */}
        <div>
          <h2 style={{ marginBottom: 12 }}>Your Lists</h2>

          {lists.length === 0 && !loadingLists ? (
            <div style={{ opacity: 0.8 }}>No lists yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {lists.map((l) => {
                const id = l._id || l.id;
                const active = selectedId === id;
                const name = l.list_name || l.name || l.title || "Untitled list";
                const count = l.items?.length ?? 0;

                return (
                  <div
                    key={id}
                    style={cardStyle(active)}
                    onClick={() => openList(id)}
                    onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.995)"}
                    onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {name}
                        </div>
                        <div style={{ opacity: 0.85, marginTop: 6 }}>
                          {count} items • {l.visibility || "private"}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "start" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openList(id);
                          }}
                        >
                          Open
                        </button>
                        <button
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

        {/* right detail */}
        <div>
          <h2 style={{ marginBottom: 12 }}>List Detail</h2>

          {!selected ? (
            <div style={{ opacity: 0.8 }}>Select a list to view items.</div>
          ) : (
            <div style={{ border: "1px solid #333", borderRadius: 14, padding: 14 }}>
              <div style={{ fontWeight: 950, marginBottom: 6 }}>
                {selected.list_name || selected.name || selected.title || "List"}
              </div>
              {selected.visibility ? (
                <div style={{ opacity: 0.85, marginBottom: 10 }}>visibility: {selected.visibility}</div>
              ) : null}

              {/* search + add (optimization #1) */}
              <div style={{ marginTop: 10, marginBottom: 14, border: "1px solid #333", borderRadius: 14, padding: 12 }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Search shows by name</div>

                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    value={showQuery}
                    onChange={(e) => setShowQuery(e.target.value)}
                    onKeyDown={onSearchKeyDown}
                    placeholder="Type a show name (press Enter)"
                    style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #333" }}
                  />
                  <button onClick={searchShows} disabled={searching || !showQuery.trim()}>
                    {searching ? "Searching..." : "Search"}
                  </button>
                </div>

                {searchErr ? <div style={{ color: "crimson", marginTop: 8 }}>Search: {searchErr}</div> : null}

                {searchResults.length > 0 ? (
                  <ul style={{ listStyle: "none", padding: 0, marginTop: 12, display: "grid", gap: 10 }}>
                    {searchResults.slice(0, 10).map((s) => {
                      const full = stripHtml(s.summary);
                      const isOpen = !!previewOpen[s.id];
                      const short = full.slice(0, 160);

                      return (
                        <li
                          key={s.id}
                          style={{
                            border: "1px solid #333",
                            borderRadius: 12,
                            padding: 10,
                            display: "flex",
                            gap: 12,
                            alignItems: "center",
                          }}
                        >
                          <img
                            src={s.image || "https://via.placeholder.com/70x105?text=No+Img"}
                            alt=""
                            style={{ width: 70, height: 105, objectFit: "cover", borderRadius: 10 }}
                          />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 950 }}>
                              {s.name}{" "}
                              <span style={{ opacity: 0.8, fontWeight: 700 }}>
                                {s.premiered ? `(${String(s.premiered).slice(0, 4)})` : ""}
                              </span>
                            </div>

                            <div style={{ opacity: 0.85, fontSize: 12, marginTop: 4 }}>
                              {typeof s.rating === "number" ? `⭐ ${s.rating}  ` : ""}
                              {Array.isArray(s.genres) && s.genres.length ? `• ${s.genres.slice(0, 3).join(", ")}` : ""}
                            </div>

                            {full ? (
                              <div style={{ opacity: 0.9, fontSize: 12, marginTop: 6, lineHeight: 1.35 }}>
                                {isOpen ? full : short + (full.length > 160 ? "..." : "")}
                                {full.length > 160 ? (
                                  <>
                                    {" "}
                                    <button
                                      onClick={() => togglePreview(s.id)}
                                      style={{ marginLeft: 6, fontSize: 12 }}
                                    >
                                      {isOpen ? "Hide" : "Preview"}
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            ) : null}
                          </div>

                          <button onClick={() => addShowId(s.id)}>Add</button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>

              {/* items + sort (optimization #2) */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 900 }}>Items</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ opacity: 0.85 }}>Sort:</span>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value)}
                    style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #333" }}
                  >
                    <option value="added-newest">Added (newest)</option>
                    <option value="added-oldest">Added (oldest)</option>
                    <option value="name-asc">Name (A → Z)</option>
                    <option value="name-desc">Name (Z → A)</option>
                  </select>
                </div>
              </div>

              {selected.items?.length ? (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                  {sortedItems.map((it, idx) => {
                    const sid = it.showid != null ? String(it.showid) : null;
                    const show = sid ? showCache[sid] : null;

                    const title = show?.name || (sid ? `Not Found (showid: ${sid})` : `Unknown item ${idx}`);
                    const summary = stripHtml(show?.summary);
                    const year = show?.premiered ? String(show.premiered).slice(0, 4) : "";
                    const rating = typeof show?.rating === "number" ? show.rating : null;

                    return (
                      <li key={sid || idx} style={{ border: "1px solid #333", borderRadius: 12, padding: 10 }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <img
                            src={show?.image || "https://via.placeholder.com/70x105?text=No+Img"}
                            alt=""
                            style={{ width: 70, height: 105, objectFit: "cover", borderRadius: 10 }}
                          />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 950 }}>{title}</div>
                            <div style={{ opacity: 0.85, fontSize: 12, marginTop: 4 }}>
                              {year ? `Year: ${year}  ` : ""}
                              {rating != null ? `⭐ ${rating}` : ""}
                            </div>

                            {summary ? (
                              <div style={{ opacity: 0.9, fontSize: 12, marginTop: 6, lineHeight: 1.35 }}>
                                {summary.slice(0, 180)}
                                {summary.length > 180 ? "..." : ""}
                              </div>
                            ) : null}
                          </div>

                          <button onClick={() => removeShowId(it)}>Remove</button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div style={{ opacity: 0.8 }}>No items in this list.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
