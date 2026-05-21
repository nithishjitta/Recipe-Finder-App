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

async function batchLookup(filterMeals, limit = 24) {
  const slice   = filterMeals.slice(0, limit);
  const results = await Promise.all(slice.map(m => lookupMeal(m.idMeal)));
  return results.filter(Boolean);
}

async function fetchByCategory(cat) {
  const r = await fetch(`${BASE}/filter.php?c=${encodeURIComponent(cat)}`);
  const d = await r.json();
  return d.meals || [];
}

/* Area filter — the API uses the EXACT strArea string from list.php?a=list
   e.g. "Indian", "Italian", "Chinese" — pass it directly, no mapping needed */
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
  for (const arr of results) {
    for (const m of arr) {
      if (!seen.has(m.idMeal)) { seen.add(m.idMeal); merged.push(m); }
    }
  }
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
  if (sort === "area")    return [...meals].sort((a, b) => (a.strArea || "").localeCompare(b.strArea || ""));
  if (sort === "ingDesc") return [...meals].sort((a, b) => getIngCount(b) - getIngCount(a));
  if (sort === "ingAsc")  return [...meals].sort((a, b) => getIngCount(a) - getIngCount(b));
  return meals;
}

function loadFavs() {
  try { return JSON.parse(localStorage.getItem("rg-favs") || "[]"); } catch { return []; }
}

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

  const debounceRef = useRef(null);
  const abortRef    = useRef(null);

  /* Dark mode */
  useEffect(() => {
    if (isDark) { document.body.classList.add("dark");    localStorage.setItem("rg-theme", "dark");  }
    else        { document.body.classList.remove("dark"); localStorage.setItem("rg-theme", "light"); }
  }, [isDark]);

  /* Persist favs */
  useEffect(() => {
    try { localStorage.setItem("rg-favs", JSON.stringify(favIds)); } catch {}
  }, [favIds]);

  /* ── Core fetch — chooses right API strategy based on active filters ── */
  const fetchData = useCallback(async (q, cat, ar) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    try {
      let result    = [];
      const hasQ    = q.trim() !== "";
      const hasCat  = cat !== "All";
      const hasArea = ar  !== "All";

      if (!hasQ && !hasCat && !hasArea) {
        /* Default home view */
        result = await loadDefaults();

      } else if (!hasQ && !hasCat && hasArea) {
        /* Area only — filter.php?a=Indian returns slim list, batch lookup for full details */
        const slim = await fetchByArea(ar);
        result = await batchLookup(slim, 24);

      } else if (!hasQ && hasCat && !hasArea) {
        /* Category only */
        const slim = await fetchByCategory(cat);
        result = await batchLookup(slim, 24);

      } else if (!hasQ && hasCat && hasArea) {
        /* Category + Area — fetch category slim list, batch lookup, then filter by area client-side
           (The API strArea on full meal matches the same string from list.php?a=list) */
        const slim = await fetchByCategory(cat);
        const full = await batchLookup(slim, 60);
        result = full.filter(m => m.strArea === ar);

      } else if (hasQ && !hasCat && !hasArea) {
        /* Text search only */
        result = await searchByName(q.trim());

      } else if (hasQ && hasCat && !hasArea) {
        /* Search + Category */
        const [catSlim, searchFull] = await Promise.all([
          fetchByCategory(cat),
          searchByName(q.trim()),
        ]);
        const catIds = new Set(catSlim.map(m => m.idMeal));
        result = searchFull.filter(m => catIds.has(m.idMeal));
        if (result.length === 0) result = await batchLookup(catSlim, 24);

      } else if (hasQ && !hasCat && hasArea) {
        /* Search + Area */
        const [areaSlim, searchFull] = await Promise.all([
          fetchByArea(ar),
          searchByName(q.trim()),
        ]);
        const areaIds = new Set(areaSlim.map(m => m.idMeal));
        result = searchFull.filter(m => areaIds.has(m.idMeal));
        if (result.length === 0) result = await batchLookup(areaSlim, 24);

      } else {
        /* Search + Category + Area */
        const [catSlim, areaSlim, searchFull] = await Promise.all([
          fetchByCategory(cat),
          fetchByArea(ar),
          searchByName(q.trim()),
        ]);
        const catIds  = new Set(catSlim.map(m => m.idMeal));
        const areaIds = new Set(areaSlim.map(m => m.idMeal));
        result = searchFull.filter(m => catIds.has(m.idMeal) && areaIds.has(m.idMeal));
        if (result.length === 0) {
          const catFull = await batchLookup(catSlim, 60);
          result = catFull.filter(m => areaIds.has(m.idMeal));
        }
      }

      if (!ctrl.signal.aborted) setMeals(result);
    } catch (e) {
      if (e.name !== "AbortError") setMeals([]);
    } finally {
      if (!abortRef.current?.signal.aborted) setLoading(false);
    }
  }, []);

  /* Initial load */
  useEffect(() => { fetchData("", "All", "All"); }, []);

  /* Debounced fetch on filter changes */
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchData(search, category, area);
    }, 380);
    return () => clearTimeout(debounceRef.current);
  }, [search, category, area]);

  const quickSearch = (term) => {
    setSearch(term);
    setCategory("All");
    setArea("All");
    setShowFavs(false);
    fetchData(term, "All", "All");
  };

  const handleCategoryChange = (value) => {
    setSearch("");
    setShowFavs(false);
    setCategory(value);
  };

  const handleAreaChange = (value) => {
    setSearch("");
    setShowFavs(false);
    setArea(value);
  };

  const toggleFav = (id) => {
    setFavIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const navigate = useNavigate();
  const location = useLocation();
  const isSavedRoute = location.pathname === "/saved";

  useEffect(() => {
    if (isSavedRoute) { setSearch(""); setShowFavs(true); }
  }, [isSavedRoute]);

  const handleView = (meal) => {
    navigate(`/recipe/${meal.idMeal}`, { state: { meal } });
  };

  const activeFavs = isSavedRoute || showFavs;
  let displayed    = activeFavs ? meals.filter(m => favIds.includes(m.idMeal)) : meals;
  displayed        = applySort(displayed, sort);
  const hasFilters = category !== "All" || area !== "All" || sort !== "default";

  /* ── Shared layout blocks ── */
  const FavBanner = () => (
    <div className="fav-banner">
      <div className="fav-banner-inner">
        <div>
          <p className="fav-banner-title">Saved Recipes</p>
          <p className="fav-banner-sub">{favIds.length} recipe{favIds.length !== 1 ? "s" : ""} in your collection</p>
        </div>
        {favIds.length > 0 && (
          <button className="fav-banner-clear" onClick={() => setFavIds([])}>
            Clear all
          </button>
        )}
      </div>
    </div>
  );

  const MainGrid = () => (
    <main className="page-body">
      {(search || activeFavs || hasFilters) && (
        <div className="section-header">
          <span className="section-title">
            {activeFavs    ? "Saved Recipes"
             : search      ? `"${search}"`
             : area !== "All" ? `${areaLabel(area)} Cuisine`
             : category !== "All" ? category
             : "Recipes"}
          </span>
          <span className="section-sub">{displayed.length} result{displayed.length !== 1 ? "s" : ""}</span>
          {hasFilters && !activeFavs && (
            <button className="section-reset" onClick={() => { setCategory("All"); setArea("All"); setSort("default"); }}>
              ✕ Reset filters
            </button>
          )}
        </div>
      )}
      <RecipeGrid
        meals={displayed}
        loading={loading}
        favIds={favIds}
        isDark={isDark}
        onToggleFav={toggleFav}
        onView={handleView}
        query={search}
        onQuickSearch={quickSearch}
        categories={categories}
      />
    </main>
  );

  return (
    <>
      {loading && <div className="loading-bar" />}

      <Header
        search={search}       setSearch={setSearch}
        favCount={favIds.length}
        showFavs={showFavs}   setShowFavs={setShowFavs}
        isDark={isDark}       setIsDark={setIsDark}
      />

      <Routes>
        <Route
          path="/"
          element={
            <>
              {!activeFavs && !search && <Hero onQuickSearch={quickSearch} />}
              {activeFavs && <FavBanner />}
              <FilterBar
                category={category}     setCategory={handleCategoryChange}
                area={area}             setArea={handleAreaChange}
                sort={sort}             setSort={setSort}
                categories={categories} setCategories={setCategories}
                areas={areas}           setAreas={setAreas}
                resultCount={displayed.length}
                loading={loading}
              />
              <MainGrid />
            </>
          }
        />

        <Route
          path="/saved"
          element={
            <>
              {activeFavs && <FavBanner />}
              <FilterBar
                category={category}     setCategory={handleCategoryChange}
                area={area}             setArea={handleAreaChange}
                sort={sort}             setSort={setSort}
                categories={categories} setCategories={setCategories}
                areas={areas}           setAreas={setAreas}
                resultCount={displayed.length}
                loading={loading}
              />
              <MainGrid />
            </>
          }
        />

        <Route
          path="/recipe/:id"
          element={
            <main className="page-body">
              <RecipeDetailPage
                favIds={favIds}
                toggleFav={toggleFav}
                isDark={isDark}
              />
            </main>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}