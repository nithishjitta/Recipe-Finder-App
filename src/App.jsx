import { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import Header          from "./components/Header.jsx";
import Hero            from "./components/Hero.jsx";
import FilterBar       from "./components/FilterBar.jsx";
import RecipeGrid      from "./components/RecipeGrid.jsx";
import RecipeDetailPage from "./components/RecipeDetailPage.jsx";
import "./App.css";

const BASE = "https://www.themealdb.com/api/json/v1/1";

// Fetch full meal details by id
async function lookupMeal(id) {
  const r = await fetch(`${BASE}/lookup.php?i=${id}`);
  const d = await r.json();
  return d.meals?.[0] || null;
}

// Batch-lookup up to `limit` meals from a filter result list
async function batchLookup(filterMeals, limit = 24) {
  const slice = filterMeals.slice(0, limit);
  const results = await Promise.all(slice.map(m => lookupMeal(m.idMeal)));
  return results.filter(Boolean);
}

// Fetch by category using filter.php
async function fetchByCategory(cat) {
  const r = await fetch(`${BASE}/filter.php?c=${encodeURIComponent(cat)}`);
  const d = await r.json();
  return d.meals || [];
}

// Fetch by area using filter.php
async function fetchByArea(area) {
  const r = await fetch(`${BASE}/filter.php?a=${encodeURIComponent(area)}`);
  const d = await r.json();
  return d.meals || [];
}

// Search by name
async function searchByName(q) {
  const r = await fetch(`${BASE}/search.php?s=${encodeURIComponent(q)}`);
  const d = await r.json();
  return d.meals || [];
}

// Default load: fetch several popular categories and merge
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
  const [meals,        setMeals]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [category,     setCategory]     = useState("All");
  const [area,         setArea]         = useState("All");
  const [sort,         setSort]         = useState("default");
  const [categories,   setCategories]   = useState([]);
  const [areas,        setAreas]        = useState([]);
  const [favIds,     setFavIds]     = useState(loadFavs);
  const [showFavs,   setShowFavs]   = useState(false);
  const [isDark,     setIsDark]     = useState(
    () => document.body.classList.contains("dark") || localStorage.getItem("rg-theme") === "dark"
  );

  const debounceRef  = useRef(null);
  const abortRef     = useRef(null);

  // Dark mode
  useEffect(() => {
    if (isDark) { document.body.classList.add("dark"); localStorage.setItem("rg-theme", "dark"); }
    else { document.body.classList.remove("dark"); localStorage.setItem("rg-theme", "light"); }
  }, [isDark]);

  // Persist favs
  useEffect(() => {
    try { localStorage.setItem("rg-favs", JSON.stringify(favIds)); } catch {}
  }, [favIds]);

  /**
   * Core data fetcher — called whenever search, category, or area changes.
   * Uses the correct API endpoint based on active filters.
   */
  const fetchData = useCallback(async (q, cat, ar) => {
    // Cancel previous request
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    try {
      let result = [];
      const hasSearch = q.trim() !== "";
      const hasCat    = cat !== "All";
      const hasArea   = ar  !== "All";

      if (!hasSearch && !hasCat && !hasArea) {
        // Default: load everything
        result = await loadDefaults();

      } else if (hasSearch && !hasCat && !hasArea) {
        // Pure text search
        result = await searchByName(q.trim());

      } else if (!hasSearch && hasCat && !hasArea) {
        // Category filter only → use filter API, then lookup full details
        const slim = await fetchByCategory(cat);
        result = await batchLookup(slim, 24);

      } else if (!hasSearch && !hasCat && hasArea) {
        // Area filter only → use filter API, then lookup full details
        const slim = await fetchByArea(ar);
        result = await batchLookup(slim, 24);

      } else if (!hasSearch && hasCat && hasArea) {
        // Both category + area → filter by category via API, then client-side filter by area
        const slim = await fetchByCategory(cat);
        const full = await batchLookup(slim, 48);
        result = full.filter(m => m.strArea === ar);

      } else if (hasSearch && hasCat && !hasArea) {
        // Search + category: fetch category results AND search results, intersect by id
        const [catSlim, searchFull] = await Promise.all([
          fetchByCategory(cat),
          searchByName(q.trim()),
        ]);
        const catIds = new Set(catSlim.map(m => m.idMeal));
        result = searchFull.filter(m => catIds.has(m.idMeal));
        // If no intersection, just show category results with full details
        if (result.length === 0) result = await batchLookup(catSlim, 24);

      } else if (hasSearch && !hasCat && hasArea) {
        // Search + area: fetch area results AND search results, intersect
        const [areaSlim, searchFull] = await Promise.all([
          fetchByArea(ar),
          searchByName(q.trim()),
        ]);
        const areaIds = new Set(areaSlim.map(m => m.idMeal));
        result = searchFull.filter(m => areaIds.has(m.idMeal));
        if (result.length === 0) result = await batchLookup(areaSlim, 24);

      } else {
        // Search + category + area
        const [catSlim, areaSlim, searchFull] = await Promise.all([
          fetchByCategory(cat),
          fetchByArea(ar),
          searchByName(q.trim()),
        ]);
        const catIds  = new Set(catSlim.map(m => m.idMeal));
        const areaIds = new Set(areaSlim.map(m => m.idMeal));
        result = searchFull.filter(m => catIds.has(m.idMeal) && areaIds.has(m.idMeal));
        if (result.length === 0) {
          // fallback: intersect category + area without search text
          const catFull = await batchLookup(catSlim, 48);
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

  // Initial load
  useEffect(() => { fetchData("", "All", "All"); }, []);

  // Debounce search changes
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
    if (isSavedRoute) {
      setSearch("");
      setShowFavs(true);
    }
  }, [isSavedRoute]);

  const handleView = (meal) => {
    navigate(`/recipe/${meal.idMeal}`, { state: { meal } });
  };

  const activeFavs = isSavedRoute || showFavs;
  let displayed = activeFavs ? meals.filter(m => favIds.includes(m.idMeal)) : meals;
  displayed = applySort(displayed, sort);

  const hasFilters = category !== "All" || area !== "All" || sort !== "default";

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

              {activeFavs && (
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
              )}

              <FilterBar
                category={category}   setCategory={handleCategoryChange}
                area={area}           setArea={handleAreaChange}
                sort={sort}           setSort={setSort}
                categories={categories} setCategories={setCategories}
                areas={areas}         setAreas={setAreas}
                resultCount={displayed.length}
                loading={loading}
              />

              <main className="page-body">
                {(search || showFavs || hasFilters) && (
                  <div className="section-header">
                    <span className="section-title">
                      {showFavs ? "Saved Recipes" : search ? `"${search}"` : category !== "All" ? category : area !== "All" ? area : "Recipes"}
                    </span>
                    <span className="section-sub">{displayed.length} result{displayed.length !== 1 ? "s" : ""}</span>
                    {hasFilters && !showFavs && (
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
            </>
          }
        />
        <Route
          path="/saved"
          element={
            <>
              {!activeFavs && !search && <Hero onQuickSearch={quickSearch} />}

              {activeFavs && (
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
              )}

              <FilterBar
                category={category}   setCategory={handleCategoryChange}
                area={area}           setArea={handleAreaChange}
                sort={sort}           setSort={setSort}
                categories={categories} setCategories={setCategories}
                areas={areas}         setAreas={setAreas}
                resultCount={displayed.length}
                loading={loading}
              />

              <main className="page-body">
                {(search || activeFavs || hasFilters) && (
                  <div className="section-header">
                    <span className="section-title">
                      {activeFavs ? "Saved Recipes" : search ? `"${search}"` : category !== "All" ? category : area !== "All" ? area : "Recipes"}
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