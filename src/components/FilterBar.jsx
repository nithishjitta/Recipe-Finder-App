import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import "./FilterBar.css";

const BASE = "https://www.themealdb.com/api/json/v1/1";

export const SORT_OPTIONS = [
  { value: "default", label: "Recommended"       },
  { value: "az",      label: "Name A → Z"        },
  { value: "za",      label: "Name Z → A"        },
  { value: "area",    label: "By Region"          },
  { value: "ingDesc", label: "Most Ingredients"  },
  { value: "ingAsc",  label: "Fewest Ingredients" },
];

export function getAreaImg() { return ""; }

const AREA_LABEL_MAP = {
  American:   "American",  British:    "British",   Canadian:   "Canadian",
  Chinese:    "Chinese",   Croatian:   "Croatian",  Dutch:      "Dutch",
  Egyptian:   "Egyptian",  Filipino:   "Filipino",  French:     "French",
  Greek:      "Greek",     Indian:     "India",     Irish:      "Irish",
  Italian:    "Italy",     Jamaican:   "Jamaica",   Japanese:   "Japan",
  Kenyan:     "Kenya",     Malaysian:  "Malaysia",  Mexican:    "Mexico",
  Moroccan:   "Morocco",   Polish:     "Polish",    Portuguese: "Portugal",
  Russian:    "Russia",    Spanish:    "Spain",     Thai:       "Thailand",
  Tunisian:   "Tunisia",   Turkish:    "Turkey",    Ukrainian:  "Ukraine",
  Uruguayan:  "Uruguay",   Vietnamese: "Vietnam",   Unknown:    "Unknown",
};

export function areaLabel(apiValue) {
  return AREA_LABEL_MAP[apiValue] || apiValue;
}

function DropdownPanel({ triggerRef, open, onClose, children, alignRight }) {
  const panelRef = useRef(null);
  const [style, setStyle] = useState({ visibility: "hidden" });

  /* Compute position right after the panel mounts / viewport changes */
  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    const panel   = panelRef.current;
    if (!trigger || !panel) return;

    const tr          = trigger.getBoundingClientRect();
    const mobile      = window.innerWidth <= 680;
    const panelH      = Math.min(panel.scrollHeight, mobile ? window.innerHeight * 0.5 : 360);
    const spaceBelow  = window.innerHeight - tr.bottom - 8;
    const spaceAbove  = tr.top - 8;
    const goUp        = spaceBelow < panelH && spaceAbove > spaceBelow;

    const next = {
      position: "fixed",
      zIndex: 99999,
      visibility: "visible",
    };

    /* Vertical */
    if (goUp) {
      next.bottom = window.innerHeight - tr.top + 6;
      next.top    = "auto";
      next.maxHeight = Math.min(spaceAbove, mobile ? window.innerHeight * 0.5 : 360);
    } else {
      next.top       = tr.bottom + 6;
      next.bottom    = "auto";
      next.maxHeight = Math.min(spaceBelow, mobile ? window.innerHeight * 0.5 : 360);
    }

    /* Horizontal */
    if (mobile) {
      /* Full width with 12 px margins each side */
      next.left  = 12;
      next.right = 12;
      next.width = "auto";
    } else if (alignRight) {
      next.right = window.innerWidth - tr.right;
      next.left  = "auto";
      next.width = 260;
    } else {
      next.left  = tr.left;
      next.right = "auto";
      next.width = Math.max(tr.width, 230);
    }

    setStyle(next);
  }, [alignRight, triggerRef]);

  /* Reposition as soon as panel mounts */
  useEffect(() => {
    if (!open) return;
    /* Use rAF so the panel has rendered and has a real height */
    const id = requestAnimationFrame(reposition);
    return () => cancelAnimationFrame(id);
  }, [open, reposition]);

  /* Reposition on resize */
  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", reposition);
    return () => window.removeEventListener("resize", reposition);
  }, [open, reposition]);

  /* Close on outside mousedown */
  useEffect(() => {
    if (!open) return;
    const fn = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        panelRef.current   && !panelRef.current.contains(e.target)
      ) onClose();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open, onClose, triggerRef]);

  /* Close on scroll OUTSIDE panel */
  useEffect(() => {
    if (!open) return;
    const fn = (e) => {
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      onClose();
    };
    window.addEventListener("scroll", fn, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", fn, { capture: true });
  }, [open, onClose]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div ref={panelRef} className="dd-panel" style={style}>
      {children}
    </div>,
    document.body
  );
}

/* ─────────────────────────────────────────────────────
   Dropdown trigger + panel
───────────────────────────────────────────────────── */
function Dropdown({ triggerLabel, options, value, onChange, searchable, alignRight = false }) {
  const [open, setOpen] = useState(false);
  const [q, setQ]       = useState("");
  const triggerRef      = useRef(null);

  const closePanel = useCallback(() => { setOpen(false); setQ(""); }, []);

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
        onClick={() => open ? closePanel() : setOpen(true)}
      >
        <span className="dd-trigger-label">
          {hasVal ? (sel?.label ?? sel?.value) : triggerLabel}
        </span>
        {hasVal && <span className="dd-active-pip" />}
        <span className="dd-arrow">▼</span>
      </button>

      <DropdownPanel
        triggerRef={triggerRef}
        open={open}
        onClose={closePanel}
        alignRight={alignRight}
      >
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
          <p style={{ padding: "10px 12px", fontSize: "0.82rem", color: "var(--ink3)" }}>
            No results
          </p>
        )}
      </DropdownPanel>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   FilterBar
───────────────────────────────────────────────────── */
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
          ...sorted.map(m => ({ value: m.strArea, label: areaLabel(m.strArea) })),
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