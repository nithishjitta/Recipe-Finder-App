import { useState, useRef, useEffect, useCallback } from "react";
import "./FilterBar.css";

const BASE = "https://www.themealdb.com/api/json/v1/1";

export const SORT_OPTIONS = [
  { value: "default", label: "Recommended" },
  { value: "az",      label: "Name A → Z"  },
  { value: "za",      label: "Name Z → A"  },
  { value: "area",    label: "By Region"   },
  { value: "ingDesc", label: "Most Ingredients"   },
  { value: "ingAsc",  label: "Fewest Ingredients" },
];

export function getAreaImg() { return ""; }

/* ── Map API area strings → clean country names ── */
const AREA_LABEL_MAP = {
  American:   "American",
  British:    "British",
  Canadian:   "Canadian",
  Chinese:    "Chinese",
  Croatian:   "Croatian",
  Dutch:      "Dutch",
  Egyptian:   "Egyptian",
  Filipino:   "Filipino",
  French:     "French",
  Greek:      "Greek",
  Indian:     "India",
  Irish:      "Irish",
  Italian:    "Italy",
  Jamaican:   "Jamaica",
  Japanese:   "Japan",
  Kenyan:     "Kenya",
  Malaysian:  "Malaysia",
  Mexican:    "Mexico",
  Moroccan:   "Morocco",
  Polish:     "Polish",
  Portuguese: "Portugal",
  Russian:    "Russia",
  Spanish:    "Spain",
  Thai:       "Thailand",
  Tunisian:   "Tunisia",
  Turkish:    "Turkey",
  Ukrainian:  "Ukraine",
  Uruguayan:  "Uruguay",
  Vietnamese: "Vietnam",
  Unknown:    "Unknown",
};

/* Returns display label for an area API value */
export function areaLabel(apiValue) {
  return AREA_LABEL_MAP[apiValue] || apiValue;
}

/* ── Dropdown — closes on outside scroll only, stays open for inner scroll ── */
function Dropdown({ triggerLabel, options, value, onChange, searchable, alignRight = false }) {
  const [open, setOpen]             = useState(false);
  const [q, setQ]                   = useState("");
  const [panelStyle, setPanelStyle] = useState({});
  const triggerRef                  = useRef(null);
  const panelRef                    = useRef(null);

  const calcStyle = useCallback(() => {
    if (!triggerRef.current) return {};
    const rect       = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp     = spaceBelow < 360 && spaceAbove > spaceBelow;

    const style = { position: "fixed", zIndex: 99999, minWidth: 220, maxWidth: 280 };

    if (openUp) { style.bottom = window.innerHeight - rect.top + 8; style.top = "auto"; }
    else        { style.top = rect.bottom + 8; style.bottom = "auto"; }

    if (alignRight) { style.right = window.innerWidth - rect.right; style.left = "auto"; }
    else            { style.left = rect.left; style.right = "auto"; }

    return style;
  }, [alignRight]);

  const openPanel  = () => { setPanelStyle(calcStyle()); setOpen(true); };
  const closePanel = useCallback(() => { setOpen(false); setQ(""); }, []);

  /* Close on outside mousedown */
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        panelRef.current   && !panelRef.current.contains(e.target)
      ) closePanel();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, closePanel]);

  /* Close on scroll OUTSIDE the panel — ignore scroll events that originate inside panel */
  useEffect(() => {
    if (!open) return;
    const onScroll = (e) => {
      /* If the scroll event target is inside the panel, do nothing */
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      closePanel();
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", onScroll, { capture: true });
  }, [open, closePanel]);

  /* Close on resize / Escape */
  useEffect(() => {
    if (!open) return;
    const onResize = () => closePanel();
    const onKey    = (e) => { if (e.key === "Escape") closePanel(); };
    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, closePanel]);

  const filtered = searchable && q
    ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()))
    : options;

  const sel    = options.find(o => o.value === value);
  const hasVal = value !== "All" && value !== "default";

  return (
    <div className={`dd-wrap${open ? " open" : ""}`}>
      <button
        ref={triggerRef}
        className={`dd-trigger${open ? " open" : ""}${hasVal ? " has-val" : ""}`}
        onClick={() => open ? closePanel() : openPanel()}
      >
        <span className="dd-trigger-label">
          {hasVal ? (sel?.label || sel?.value) : triggerLabel}
        </span>
        {hasVal && <span className="dd-active-pip" />}
        <span className="dd-arrow">▼</span>
      </button>

      {open && (
        <div ref={panelRef} className="dd-panel" style={panelStyle}>
          {searchable && (
            <div className="dd-search-box">
              <input
                autoFocus
                placeholder={`Search ${triggerLabel.toLowerCase()}…`}
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
          )}
          {filtered.map(opt => (
            <button
              key={opt.value}
              className={`dd-option${opt.value === value ? " sel" : ""}`}
              onClick={() => { onChange(opt.value); closePanel(); }}
            >
              <span>{opt.label}</span>
              {opt.value === value && <span className="dd-option-check">✓</span>}
            </button>
          ))}
          {filtered.length === 0 && (
            <p style={{ padding: "10px 12px", fontSize: "0.8rem", color: "var(--ink3)" }}>
              No results
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── FilterBar ── */
export default function FilterBar({
  category, setCategory,
  area,     setArea,
  sort,     setSort,
  resultCount, loading,
  categories, setCategories,
  areas,    setAreas,
}) {
  useEffect(() => {
    fetch(`${BASE}/categories.php`)
      .then(r => r.json())
      .then(d => {
        if (!d.categories) return;
        setCategories([
          { value: "All", label: "All Categories" },
          ...d.categories.map(c => ({ value: c.strCategory, label: c.strCategory })),
        ]);
      })
      .catch(() => {});

    fetch(`${BASE}/list.php?a=list`)
      .then(r => r.json())
      .then(d => {
        if (!d.meals) return;
        const sorted = [...d.meals].sort((a, b) => a.strArea.localeCompare(b.strArea));
        setAreas([
          { value: "All", label: "All Regions" },
          /* value = exact API string (used for filtering), label = clean display name */
          ...sorted.map(m => ({
            value: m.strArea,
            label: areaLabel(m.strArea),
          })),
        ]);
      })
      .catch(() => {});
  }, []);

  const catOptions  = categories?.length ? categories : [{ value: "All", label: "All Categories" }];
  const areaOptions = areas?.length      ? areas      : [{ value: "All", label: "All Regions"   }];
  const hasFilters  = category !== "All" || area !== "All" || sort !== "default";

  return (
    <div className="filters-bar">
      {loading && <div className="filter-loading" />}
      <div className="filters-inner">

        <Dropdown
          triggerLabel="Category"
          options={catOptions}
          value={category}
          onChange={setCategory}
        />

        <div className="filter-sep" />

        <Dropdown
          triggerLabel="Region"
          options={areaOptions}
          value={area}
          onChange={setArea}
          searchable
        />

        <div className="filter-sep" />

        <Dropdown
          triggerLabel="Sort by"
          options={SORT_OPTIONS}
          value={sort}
          onChange={setSort}
          alignRight
        />

        {hasFilters && (
          <button
            className="filter-reset"
            onClick={() => { setCategory("All"); setArea("All"); setSort("default"); }}
          >
            ✕ Reset
          </button>
        )}

        <div className="results-pill">
          <b>{resultCount}</b>&nbsp;recipe{resultCount !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}