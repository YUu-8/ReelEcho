import { useEffect, useState } from "react";

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
async function resolveUserId(input) {
  const users = await request("/api/users");

  const found = users.find(
    (u) =>
      u.username === input ||
      u.email === input
  );

  if (!found) {
    throw new Error("User not found by username/email");
  }

  return found._id;
}


export default function FavouritesPage() {
  const [userId, setUserId] = useState(localStorage.getItem("userid") || "");
  const [lists, setLists] = useState([]);
  const [selected, setSelected] = useState(null);

  const [newListName, setNewListName] = useState("");
  const [visibility, setVisibility] = useState("private"); // public/private

  const [movieid, setMovieid] = useState("");
  const [showid, setShowid] = useState("");

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  function saveUserId() {
    localStorage.setItem("userid", userId);
    loadLists();
  }

  async function loadLists() {
  if (!userId) {
    setErrMsg("Please enter username or email.");
    setLists([]);
    setSelected(null);
    return;
  }

  setLoading(true);
  setErrMsg("");
  setSelected(null);

  try {
    const realUserId = await resolveUserId(userId);

    localStorage.setItem("userid", realUserId);

    const data = await request(`/api/favourites?userid=${encodeURIComponent(realUserId)}`);
    setLists(Array.isArray(data) ? data : []);

  } catch (e) {
    if (e.status === 404) {
      setLists([]);
      setErrMsg("");
    } else {
      setLists([]);
      setErrMsg(e.message || "Failed to load favourites");
    }
  } finally {
    setLoading(false);
  }
}


  async function openList(listId) {
    setErrMsg("");
    try {
      const data = await request(`/api/favourites/${listId}`);
      setSelected(data);
    } catch (e) {
      setErrMsg(e.message || "Failed to load list detail");
    }
  }

  async function createList() {
  if (!userId) return setErrMsg("Please enter username or email.");
  if (!newListName.trim()) return setErrMsg("list_name is required.");

  setErrMsg("");
  try {
    const realUserId = await resolveUserId(userId);

    await request("/api/favourites", {
      method: "POST",
      body: JSON.stringify({
        userid: realUserId,
        list_name: newListName.trim(),
        visibility,
      }),
    });

    setNewListName("");
    localStorage.setItem("userid", realUserId);
    await loadLists();

  } catch (e) {
    setErrMsg(e.message || "Failed to create list");
  }
}

  async function deleteList(listId) {
    setErrMsg("");
    try {
      await request(`/api/favourites/${listId}`, { method: "DELETE" });
      if ((selected?._id || selected?.id) === listId) setSelected(null);
      await loadLists();
    } catch (e) {
      setErrMsg(e.message || "Failed to delete list");
    }
  }

  async function addItem(listId) {
    if (!movieid.trim() && !showid.trim()) {
      setErrMsg("Provide movieid OR showid.");
      return;
    }

    setErrMsg("");
    try {
      await request(`/api/favourites/${listId}/items`, {
        method: "POST",
        body: JSON.stringify(movieid.trim() ? { movieid: movieid.trim() } : { showid: showid.trim() }),
      });

      setMovieid("");
      setShowid("");
      await openList(listId);
      await loadLists(); 
    } catch (e) {
      setErrMsg(e.message || "Failed to add item");
    }
  }

  async function removeItem(listId, item) {
    setErrMsg("");
    try {
      await request(`/api/favourites/${listId}/items`, {
        method: "DELETE",
        body: JSON.stringify(item.movieid ? { movieid: item.movieid } : { showid: item.showid }),
      });

      await openList(listId);
      await loadLists();
    } catch (e) {
      setErrMsg(e.message || "Failed to remove item");
    }
  }

  useEffect(() => {
    if (userId) loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 980, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 16 }}>Favourites</h1>

      {/* userid */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter userid (Mongo _id)"
          style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #333" }}
        />
        <button onClick={saveUserId}>Use userid</button>
        <button onClick={loadLists} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
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

        <button onClick={createList}>Create list</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* left: lists */}
        <div>
          <h2 style={{ marginBottom: 12 }}>Your Lists</h2>

          {lists.length === 0 && !loading ? (
            <div style={{ opacity: 0.8 }}>No lists yet.</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
              {lists.map((l) => {
                const id = l._id || l.id;
                const name = l.list_name || l.name || l.title || "Untitled list";
                const count = l.items?.length;

                return (
                  <li key={id} style={{ border: "1px solid #333", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700 }}>{name}</div>
                        {typeof count === "number" ? (
                          <div style={{ opacity: 0.8, marginTop: 4 }}>{count} items</div>
                        ) : null}
                        {l.visibility ? (
                          <div style={{ opacity: 0.8, marginTop: 4 }}>visibility: {l.visibility}</div>
                        ) : null}
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => openList(id)}>Open</button>
                        <button onClick={() => deleteList(id)}>Delete</button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* right: detail */}
        <div>
          <h2 style={{ marginBottom: 12 }}>List Detail</h2>

          {!selected ? (
            <div style={{ opacity: 0.8 }}>Select a list to view items.</div>
          ) : (
            <div style={{ border: "1px solid #333", borderRadius: 12, padding: 14 }}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>
                {selected.list_name || selected.name || selected.title || "List"}
              </div>
              {selected.visibility ? (
                <div style={{ opacity: 0.8, marginBottom: 10 }}>visibility: {selected.visibility}</div>
              ) : null}

              {/* add item */}
              <div style={{ display: "flex", gap: 10, marginTop: 12, marginBottom: 12 }}>
                <input
                  value={movieid}
                  onChange={(e) => {
                    setMovieid(e.target.value);
                    if (e.target.value) setShowid("");
                  }}
                  placeholder="movieid..."
                  style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #333" }}
                />
                <input
                  value={showid}
                  onChange={(e) => {
                    setShowid(e.target.value);
                    if (e.target.value) setMovieid("");
                  }}
                  placeholder="showid..."
                  style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #333" }}
                />
                <button onClick={() => addItem(selected._id || selected.id)}>Add</button>
              </div>

              {/* items */}
              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Items</div>

                {selected.items?.length ? (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                    {selected.items.map((it, idx) => {
                      const listId = selected._id || selected.id;
                      const key = it.movieid || it.showid || idx;
                      const label = it.movieid ? `movieid: ${it.movieid}` : `showid: ${it.showid}`;

                      return (
                        <li
                          key={key}
                          style={{
                            border: "1px solid #333",
                            borderRadius: 10,
                            padding: 10,
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                          }}
                        >
                          <span>{label}</span>
                          <button onClick={() => removeItem(listId, it)}>Remove</button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div style={{ opacity: 0.8 }}>No items in this list.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
