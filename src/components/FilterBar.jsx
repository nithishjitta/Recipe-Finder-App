import { useState, useRef, useEffect } from "react";
import "./FilterBar.css";

const BASE = "https://www.themealdb.com/api/json/v1/1";

/* Curated cuisine-accurate Unsplash images keyed by exact API area name */
// const AREA_IMAGES = {
//   American,
//   British,
//   Canadian,
//   Chinese,
//   Croatian,
//   Dutch,
//   Egyptian,
//   Filipino,
//   French,
//   Greek,
//   India,
//   Irish,
//   Italian,
//   Jamaican,
//   Japanese,
//   Kenyan,
//   Malaysian,
//   Mexican,
//   Moroccan,
//   Polish,
//   Portuguese,
//   Russian,
//   Spanish,
//   Thai,
//   Tunisian,
//   Turkish,
//   Vietnames,
//   Unknown,
// };
// const FALLBACK = "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=56&q=75";

export const SORT_OPTIONS = [
  { value: "default", label: "Recommended" },
  { value: "az",      label: "Name A → Z"  },
  { value: "za",      label: "Name Z → A"  },
  { value: "area",    label: "By Region"   },
  { value: "ingDesc", label: "Most Ingredients"   },
  { value: "ingAsc",  label: "Fewest Ingredients" },
];

const AREA_IMAGES = {};
const FALLBACK = "";

export function getAreaImg() {
  return "";
}
/* helper exported so RecipeGrid / RecipeDetailPage can get area image */
// export function getAreaImg(area) { return AREA_IMAGES[area] || FALLBACK; }

/* ── Reusable Dropdown ── */
function Dropdown({ triggerLabel, options, value, onChange, searchable, className = "" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ]       = useState("");
  const ref             = useRef(null);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const filtered = searchable && q
    ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()))
    : options;

  const sel    = options.find(o => o.value === value);
  const hasVal = value !== "All" && value !== "default";

  return (
    <div className={`dd-wrap ${className}`} ref={ref}>
      <button
        className={`dd-trigger${open ? " open" : ""}${hasVal ? " has-val" : ""}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="dd-trigger-label">
          {hasVal ? (sel?.label || sel?.value) : triggerLabel}
        </span>
        {hasVal && <span className="dd-active-pip" />}
        <span className="dd-arrow">▼</span>
      </button>

      {open && (
        <div className="dd-panel">
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
              onClick={() => { onChange(opt.value); setOpen(false); setQ(""); }}
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
  /* Fetch categories (real API thumbnails) + areas (exact API strings) once */
  useEffect(() => {
    fetch(`${BASE}/categories.php`)
      .then(r => r.json())
      .then(d => {
        if (!d.categories) return;
        setCategories([
          { value: "All", label: "All Categories"},
          ...d.categories.map(c => ({
            value: c.strCategory,
            label: c.strCategory,
          })),
        ]);
      })
      .catch(() => {});

    /* list.php?a=list returns the EXACT strArea strings used by filter.php?a=X */
    fetch(`${BASE}/list.php?a=list`)
      .then(r => r.json())
      .then(d => {
        if (!d.meals) return;
        setAreas([
          { value: "All", label: "All Regions" },
          ...d.meals.map(m => ({
            value: m.strArea,
            label: m.strArea,
          })),
        ]);
      })
      .catch(() => {});
  }, []);

  const catOptions  = categories?.length ? categories : [{ value: "All", label: "All Categories" }];
  const areaOptions = areas?.length      ? areas      : [{ value: "All", label: "All Regions"   }];
  const hasFilters  = category !== "All" || area !== "All" || sort !== "default";

  return (
    <div className="filters-bar" style={{ position: "relative" }}>
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
          className="dd-sort"
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