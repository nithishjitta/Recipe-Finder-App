import { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import Header           from "./components/Header.jsx";
import Hero             from "./components/Hero.jsx";
import FilterBar, { areaLabel } from "./components/FilterBar.jsx";
import RecipeGrid       from "./components/RecipeGrid.jsx";
import RecipeDetailPage from "./components/RecipeDetailPage.jsx";
import "./App.css";

const BASE = "https://www.themealdb.com/api/json/v1/1";

/* ── API helpers ── */
async function lookupMeal(id) {
  const r = await fetch(`${BASE}/lookup.php?i=${id}`);
  const d = await r.json();
  return d.meals?.[0] || null;
}
async function batchLookup(list, limit = 24) {
  const results = await Promise.all(list.slice(0, limit).map(m => lookupMeal(m.idMeal)));
  return results.filter(Boolean);
}
async function fetchByCategory(cat) {
  const r = await fetch(`${BASE}/filter.php?c=${encodeURIComponent(cat)}`);
  const d = await r.json();
  return d.meals || [];
}
async function fetchByArea(area) {
  const r = await fetch(`${BASE}/filter.php?a=${encodeURIComponent(area)}`);
  const d = await r.json();
  return d.meals || [];
}
async function searchByName(q) {
  const r = await fetch(`${BASE}/search.php?s=${encodeURIComponent(q)}`);
  const d = await r.json();
  return d.meals || [];
}

const DEFAULT_QUERIES = ["chicken", "pasta", "beef", "seafood", "dessert", "lamb", "pork", "vegetarian"];
async function loadDefaults() {
  const results = await Promise.all(DEFAULT_QUERIES.map(q => searchByName(q)));
  const seen = new Set();
  const merged = [];
  for (const arr of results)
    for (const m of arr)
      if (!seen.has(m.idMeal)) { seen.add(m.idMeal); merged.push(m); }
  return merged;
}

function getIngCount(meal) {
  let c = 0;
  for (let i = 1; i <= 20; i++) if (meal[`strIngredient${i}`]?.trim()) c++;
  return c;
}
function applySort(meals, sort) {
  if (sort === "az")      return [...meals].sort((a, b) => a.strMeal.localeCompare(b.strMeal));
  if (sort === "za")      return [...meals].sort((a, b) => b.strMeal.localeCompare(a.strMeal));
  if (sort === "area")    return [...meals].sort((a, b) => (a.strArea||"").localeCompare(b.strArea||""));
  if (sort === "ingDesc") return [...meals].sort((a, b) => getIngCount(b) - getIngCount(a));
  if (sort === "ingAsc")  return [...meals].sort((a, b) => getIngCount(a) - getIngCount(b));
  return meals;
}
function loadFavs() {
  try { return JSON.parse(localStorage.getItem("rg-favs") || "[]"); } catch { return []; }
}

const KNOWN_CATEGORIES = new Set([
  "Beef","Breakfast","Chicken","Dessert","Goat","Lamb","Miscellaneous",
  "Pasta","Pork","Seafood","Side","Starter","Vegan","Vegetarian",
]);
const KNOWN_AREAS = new Set([
  "American","British","Canadian","Chinese","Croatian","Dutch","Egyptian",
  "Filipino","French","Greek","Indian","Irish","Italian","Jamaican","Japanese",
  "Kenyan","Malaysian","Mexican","Moroccan","Polish","Portuguese","Russian",
  "Spanish","Thai","Tunisian","Turkish","Ukrainian","Uruguayan","Vietnamese",
]);

/* ── Subcomponents defined OUTSIDE App so they never remount on re-render ── */
function FavBanner({ favIds, onClear }) {
  return (
    <div className="fav-banner">
      <div className="fav-banner-inner">
        <div>
          <p className="fav-banner-title">Saved Recipes</p>
          <p className="fav-banner-sub">{favIds.length} recipe{favIds.length !== 1 ? "s" : ""} in your collection</p>
        </div>
        {favIds.length > 0 && (
          <button className="fav-banner-clear" onClick={onClear}>Clear all</button>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ activeFavs, search, area, category, count, hasFilters, onReset }) {
  const title = activeFavs        ? "Saved Recipes"
              : search            ? `"${search}"`
              : area !== "All"    ? `${areaLabel(area)} Cuisine`
              : category !== "All"? category
              : "Recipes";
  return (
    <div className="section-header">
      <span className="section-title">{title}</span>
      <span className="section-sub">{count} result{count !== 1 ? "s" : ""}</span>
      {hasFilters && !activeFavs && (
        <button className="section-reset" onClick={onReset}>✕ Reset filters</button>
      )}
    </div>
  );
}

/* ── App ── */
export default function App() {
  const [meals,      setMeals]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [search,     setSearch]     = useState("");
  const [category,   setCategory]   = useState("All");
  const [area,       setArea]       = useState("All");
  const [sort,       setSort]       = useState("default");
  const [categories, setCategories] = useState([]);
  const [areas,      setAreas]      = useState([]);
  const [favIds,     setFavIds]     = useState(loadFavs);
  const [showFavs,   setShowFavs]   = useState(false);
  const [isDark,     setIsDark]     = useState(
    () => document.body.classList.contains("dark") || localStorage.getItem("rg-theme") === "dark"
  );

  const abortRef    = useRef(null);
  const debounceRef = useRef(null);
  /* Always-current values — avoids stale closures without re-creating callbacks */
  const live = useRef({ search: "", category: "All", area: "All" });
  live.current = { search, category, area };

  /* Dark mode */
  useEffect(() => {
    document.body.classList.toggle("dark", isDark);
    localStorage.setItem("rg-theme", isDark ? "dark" : "light");
  }, [isDark]);

  /* Persist favs */
  useEffect(() => {
    try { localStorage.setItem("rg-favs", JSON.stringify(favIds)); } catch {}
  }, [favIds]);

  /* ── Core fetch — explicit args only, never reads state ── */
  const fetchData = useCallback(async (q, cat, ar) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    try {
      let result = [];
      const hasQ  = q.trim() !== "";
      const hasCat = cat !== "All";
      const hasAr  = ar  !== "All";

      if (!hasQ && !hasCat && !hasAr) {
        result = await loadDefaults();
      } else if (!hasQ && !hasCat && hasAr) {
        result = await batchLookup(await fetchByArea(ar), 24);
      } else if (!hasQ && hasCat && !hasAr) {
        result = await batchLookup(await fetchByCategory(cat), 24);
      } else if (!hasQ && hasCat && hasAr) {
        const full = await batchLookup(await fetchByCategory(cat), 60);
        result = full.filter(m => m.strArea === ar);
      } else if (hasQ && !hasCat && !hasAr) {
        result = await searchByName(q.trim());
      } else if (hasQ && hasCat && !hasAr) {
        const [slim, found] = await Promise.all([fetchByCategory(cat), searchByName(q.trim())]);
        const ids = new Set(slim.map(m => m.idMeal));
        result = found.filter(m => ids.has(m.idMeal));
        if (!result.length) result = await batchLookup(slim, 24);
      } else if (hasQ && !hasCat && hasAr) {
        const [slim, found] = await Promise.all([fetchByArea(ar), searchByName(q.trim())]);
        const ids = new Set(slim.map(m => m.idMeal));
        result = found.filter(m => ids.has(m.idMeal));
        if (!result.length) result = await batchLookup(slim, 24);
      } else {
        const [cSlim, aSlim, found] = await Promise.all([fetchByCategory(cat), fetchByArea(ar), searchByName(q.trim())]);
        const cIds = new Set(cSlim.map(m => m.idMeal));
        const aIds = new Set(aSlim.map(m => m.idMeal));
        result = found.filter(m => cIds.has(m.idMeal) && aIds.has(m.idMeal));
        if (!result.length) result = (await batchLookup(cSlim, 60)).filter(m => aIds.has(m.idMeal));
      }

      if (!ctrl.signal.aborted) setMeals(result);
    } catch (e) {
      if (e.name !== "AbortError") setMeals([]);
    } finally {
      if (!abortRef.current?.signal.aborted) setLoading(false);
    }
  }, []);

  /* Initial load — runs once */
  useEffect(() => { fetchData("", "All", "All"); }, []);

  /* Debounced search — skips the very first mount (initialised flag) */
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchData(search, live.current.category, live.current.area);
    }, 380);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  /* ── Filter handlers ── */
  const handleCategoryChange = useCallback((value) => {
    setSearch("");
    setShowFavs(false);
    setCategory(value);
    fetchData("", value, live.current.area);
  }, [fetchData]);

  const handleAreaChange = useCallback((value) => {
    setSearch("");
    setShowFavs(false);
    setArea(value);
    fetchData("", live.current.category, value);
  }, [fetchData]);

  const handleSortChange = useCallback((value) => { setSort(value); }, []);

  const handleReset = useCallback(() => {
    setCategory("All");
    setArea("All");
    setSort("default");
    fetchData(live.current.search, "All", "All");
  }, [fetchData]);

  /* quickSearch — routes to category / area / text correctly */
  const quickSearch = useCallback((term) => {
    setShowFavs(false);
    const t = term.charAt(0).toUpperCase() + term.slice(1).toLowerCase();

    if (KNOWN_CATEGORIES.has(t)) {
      setSearch(""); setArea("All"); setSort("default");
      setCategory(t);
      fetchData("", t, "All");
    } else if (KNOWN_AREAS.has(t)) {
      setSearch(""); setCategory("All"); setSort("default");
      setArea(t);
      fetchData("", "All", t);
    } else {
      /* plain text — set search but DON'T call fetchData; the debounce effect handles it */
      setCategory("All"); setArea("All"); setSort("default");
      setSearch(term);
      /* cancel any pending debounce and fire immediately */
      clearTimeout(debounceRef.current);
      fetchData(term, "All", "All");
    }
  }, [fetchData]);

  const toggleFav = useCallback((id) => {
    setFavIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const navigate     = useNavigate();
  const location     = useLocation();
  const isSavedRoute = location.pathname === "/saved";

  useEffect(() => {
    if (isSavedRoute) { setSearch(""); setShowFavs(true); }
  }, [isSavedRoute]);

  const handleView = useCallback((meal) => {
    navigate(`/recipe/${meal.idMeal}`, { state: { meal } });
  }, [navigate]);

  const activeFavs = isSavedRoute || showFavs;
  const displayed  = applySort(
    activeFavs ? meals.filter(m => favIds.includes(m.idMeal)) : meals,
    sort
  );
  const hasFilters = category !== "All" || area !== "All" || sort !== "default";
  const showHero   = !activeFavs && !search && category === "All" && area === "All";

  /* Shared props objects — stable references avoid unnecessary re-renders */
  const filterBarProps = {
    category, setCategory: handleCategoryChange,
    area,     setArea:     handleAreaChange,
    sort,     setSort:     handleSortChange,
    categories, setCategories,
    areas,      setAreas,
    resultCount: displayed.length,
    loading,
  };

  const gridProps = {
    meals: displayed, loading,
    favIds, isDark,
    onToggleFav: toggleFav,
    onView: handleView,
    query: search,
    onQuickSearch: quickSearch,
    categories,
  };

  return (
    <>
      {loading && <div className="loading-bar" />}

      <Header
        search={search}     setSearch={setSearch}
        favCount={favIds.length}
        showFavs={showFavs} setShowFavs={setShowFavs}
        isDark={isDark}     setIsDark={setIsDark}
      />

      <Routes>
        <Route path="/" element={
          <>
            {showHero && <Hero onQuickSearch={quickSearch} />}
            {activeFavs && <FavBanner favIds={favIds} onClear={() => setFavIds([])} />}
            <FilterBar {...filterBarProps} />
            <main className="page-body">
              {(search || activeFavs || hasFilters) && (
                <SectionHeader
                  activeFavs={activeFavs} search={search}
                  area={area} category={category}
                  count={displayed.length} hasFilters={hasFilters}
                  onReset={handleReset}
                />
              )}
              <RecipeGrid {...gridProps} />
            </main>
          </>
        } />

        <Route path="/saved" element={
          <>
            {activeFavs && <FavBanner favIds={favIds} onClear={() => setFavIds([])} />}
            <FilterBar {...filterBarProps} />
            <main className="page-body">
              {(search || activeFavs || hasFilters) && (
                <SectionHeader
                  activeFavs={activeFavs} search={search}
                  area={area} category={category}
                  count={displayed.length} hasFilters={hasFilters}
                  onReset={handleReset}
                />
              )}
              <RecipeGrid {...gridProps} />
            </main>
          </>
        } />

        <Route path="/recipe/:id" element={
          <main className="page-body">
            <RecipeDetailPage favIds={favIds} toggleFav={toggleFav} isDark={isDark} />
          </main>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}