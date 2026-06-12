import { useState, useEffect, useMemo } from "react";
import { Search, MapPin, ExternalLink, Globe2, Library, Star, BookMarked } from "lucide-react";

const DATA_URL =
  "https://raw.githubusercontent.com/Go2Office/university-domains-list/master/world_universities_and_domains.json";

const ALL = "All countries";
const SHORTLIST_KEY = "shortlist";

const idFor = (u) => (u.domains && u.domains[0]) || u.name;

export default function UniversityDirectory() {
  const [all, setAll] = useState([]);
  const [countries, setCountries] = useState([]);
  const [country, setCountry] = useState(ALL);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shortlist, setShortlist] = useState({}); // id -> university object
  const [shortlistLoaded, setShortlistLoaded] = useState(false);
  const [view, setView] = useState("browse"); // "browse" | "shortlist"

  // Load shortlist from persistent storage
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await window.storage.get(SHORTLIST_KEY, false);
        if (active && result) {
          setShortlist(JSON.parse(result.value));
        }
      } catch {
        // no saved shortlist yet
      } finally {
        if (active) setShortlistLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const toggleSave = async (u) => {
    const id = idFor(u);
    const next = { ...shortlist };
    if (next[id]) {
      delete next[id];
    } else {
      next[id] = u;
    }
    setShortlist(next);
    try {
      await window.storage.set(SHORTLIST_KEY, JSON.stringify(next), false);
    } catch {
      // best-effort persistence
    }
  };

  useEffect(() => {
    let active = true;
    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error("Request failed");
        return r.json();
      })
      .then((data) => {
        if (!active) return;
        setAll(data);
        const uniq = Array.from(new Set(data.map((u) => u.country))).sort();
        setCountries(uniq);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError("Couldn't load the dataset. GitHub's raw content may be temporarily unreachable.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const shortlistArr = useMemo(() => Object.values(shortlist), [shortlist]);

  const source = view === "shortlist" ? shortlistArr : all;

  const byCountry = useMemo(() => {
    if (view === "shortlist" || country === ALL) return source;
    return source.filter((u) => u.country === country);
  }, [source, country, view]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return byCountry;
    return byCountry.filter((u) => u.name.toLowerCase().includes(q));
  }, [byCountry, query]);

  // Cap rendered cards for performance when browsing very large lists
  const display = view === "shortlist" ? filtered : filtered.slice(0, 300);

  return (
    <div
      style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        background: "#F7F4EC",
        color: "#1F2A24",
        minHeight: "100%",
        padding: "32px 24px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Space+Grotesk:wght@500;600;700&display=swap');
        .ud-mono { font-family: 'Space Grotesk', monospace; }
        .ud-card {
          border: 1px solid #D8D1BE;
          background: #FFFEFA;
          transition: border-color 0.15s ease, transform 0.15s ease;
        }
        .ud-card:hover {
          border-color: #6E8B6E;
          transform: translateY(-2px);
        }
        .ud-select, .ud-input {
          font-family: 'Space Grotesk', monospace;
          border: 1px solid #B9B2A0;
          background: #FFFEFA;
          color: #1F2A24;
          outline: none;
        }
        .ud-select:focus, .ud-input:focus {
          border-color: #6E8B6E;
          box-shadow: 0 0 0 3px rgba(110,139,110,0.15);
        }
        .ud-link {
          color: #4A6B4A;
          text-decoration: none;
          border-bottom: 1px solid #C9D6C9;
        }
        .ud-link:hover { border-color: #4A6B4A; }
        .ud-tab {
          font-family: 'Space Grotesk', monospace;
          font-size: 12px;
          letter-spacing: 0.1em;
          padding: 9px 16px;
          border: 1px solid #B9B2A0;
          background: #FFFEFA;
          color: #5C5347;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .ud-tab.active {
          background: #1F2A24;
          color: #F7F4EC;
          border-color: #1F2A24;
        }
        .ud-star {
          background: none;
          border: none;
          cursor: pointer;
          color: #C9C2AE;
          padding: 0;
          display: inline-flex;
          align-items: center;
        }
        .ud-star.saved { color: #C9A227; }
        .ud-star:hover { color: #C9A227; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: #D8D1BE; border-radius: 4px; }
      `}</style>

      {/* Header / masthead */}
      <header
        style={{
          maxWidth: 960,
          margin: "0 auto 28px",
          borderBottom: "2px solid #1F2A24",
          paddingBottom: 18,
        }}
      >
        <div className="ud-mono" style={{ fontSize: 12, letterSpacing: "0.2em", color: "#6E8B6E", marginBottom: 6 }}>
          OPEN DATA · UNIVERSITY-DOMAINS-LIST (GO2OFFICE / HIPO)
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
          <Library size={32} strokeWidth={1.5} />
          World University Catalog
        </h1>
        <p style={{ fontSize: 15, color: "#5C5347", marginTop: 8, maxWidth: 560 }}>
          Search ~10,000 institutions worldwide by name and country, loaded
          from a single open dataset of university names and domains.
        </p>
      </header>

      {/* View tabs */}
      <div style={{ maxWidth: 960, margin: "0 auto 16px", display: "flex", gap: 8 }}>
        <button
          className={`ud-tab ${view === "browse" ? "active" : ""}`}
          onClick={() => setView("browse")}
        >
          <Library size={14} /> BROWSE
        </button>
        <button
          className={`ud-tab ${view === "shortlist" ? "active" : ""}`}
          onClick={() => setView("shortlist")}
        >
          <BookMarked size={14} /> SHORTLIST ({shortlistArr.length})
        </button>
      </div>

      {/* Controls */}
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto 24px",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {view === "browse" && (
          <div style={{ position: "relative" }}>
            <Globe2
              size={16}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8A8270" }}
            />
            <select
              className="ud-select"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={{ padding: "10px 14px 10px 36px", fontSize: 14, minWidth: 220 }}
            >
              <option value={ALL}>{ALL}</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search
            size={16}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8A8270" }}
          />
          <input
            className="ud-input"
            type="text"
            placeholder="Filter by university name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ padding: "10px 14px 10px 36px", fontSize: 14, width: "100%" }}
          />
        </div>
      </div>

      {/* Status line */}
      <div
        className="ud-mono"
        style={{ maxWidth: 960, margin: "0 auto 14px", fontSize: 12, color: "#8A8270", letterSpacing: "0.05em" }}
      >
        {view === "shortlist"
          ? `${filtered.length.toLocaleString()} SAVED UNIVERSIT${filtered.length === 1 ? "Y" : "IES"}`
          : loading
          ? "LOADING DATASET (~10,000 ENTRIES)…"
          : error
          ? error.toUpperCase()
          : `${filtered.length.toLocaleString()} MATCH${filtered.length === 1 ? "" : "ES"}${
              filtered.length > display.length ? ` — SHOWING FIRST ${display.length}` : ""
            } — ${country.toUpperCase()}`}
      </div>

      {/* Results */}
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        {(view === "shortlist" || (!loading && !error)) &&
          display.map((u, i) => {
            const saved = !!shortlist[idFor(u)];
            return (
              <div key={`${idFor(u)}-${i}`} className="ud-card" style={{ padding: "16px 18px", borderRadius: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div className="ud-mono" style={{ fontSize: 11, color: "#A9A18E" }}>
                    {String(i + 1).padStart(3, "0")}
                  </div>
                  <button
                    className={`ud-star ${saved ? "saved" : ""}`}
                    onClick={() => toggleSave(u)}
                    title={saved ? "Remove from shortlist" : "Add to shortlist"}
                    aria-label={saved ? "Remove from shortlist" : "Add to shortlist"}
                  >
                    <Star size={16} fill={saved ? "#C9A227" : "none"} />
                  </button>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 8px", lineHeight: 1.3 }}>
                  {u.name}
                </h3>
                <div style={{ fontSize: 13, color: "#5C5347", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <MapPin size={13} />
                  {u["state-province"] ? `${u["state-province"]}, ` : ""}{u.country}
                </div>
                {u.web_pages && u.web_pages[0] && (
                  <a
                    className="ud-link"
                    href={u.web_pages[0]}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4 }}
                  >
                    Visit site <ExternalLink size={12} />
                  </a>
                )}
              </div>
            );
          })}
      </div>

      {view === "shortlist" && filtered.length === 0 && (
        <p style={{ textAlign: "center", color: "#8A8270", marginTop: 40 }}>
          Your shortlist is empty. Star a university while browsing to save it here.
        </p>
      )}
      {view === "browse" && !loading && !error && filtered.length === 0 && (
        <p style={{ textAlign: "center", color: "#8A8270", marginTop: 40 }}>
          No entries match "{query}" in {country}.
        </p>
      )}

      <footer
        className="ud-mono"
        style={{ maxWidth: 960, margin: "40px auto 0", fontSize: 11, color: "#A9A18E", textAlign: "center" }}
      >
        DATA: github.com/Go2Office/university-domains-list — DOMAIN/NAME RECORDS ONLY, NO RANKINGS OR PROGRAM DATA
      </footer>
    </div>
  );
}
