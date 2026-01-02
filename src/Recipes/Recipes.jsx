import React from "react";
import { useEffect, useState } from "react";
import "./Recipes.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faXmark} from "@fortawesome/free-solid-svg-icons";

export default function Recipes({ query, setSearch }) {
  const [meals, setMeals] = useState([]);
  const [fav, setFav] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);

  const searchMeal = async (q) => {
    try {
      const qstr = (q ?? "").trim();
      if (qstr === "") {
        // explicit empty query -> clear results (shows empty-state)
        setMeals([]);
        return;
      }
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(
          qstr
        )}`
      );
      const data = await res.json();
      setMeals(data.meals || []);
      console.log('search:', qstr, 'results:', (data.meals || []).length);
    } catch (err) {
      console.error('search failed', err);
      setMeals([]);
    }
  };

  // initial load: show a default set
  useEffect(() => {
    searchMeal('chicken');
  }, []);

  useEffect(() => {
    const qstr = (query ?? "").trim();
    if (qstr === "") {
      setMeals([]);
      return;
    }
    searchMeal(query);
  }, [query]);
  function handleFavourite(id) {
    setFav((prev) =>
      prev.includes(id) ? prev.filter((mealId) => mealId !== id) : [...prev, id]
    );
  }
  function toTitleCase(str) {
    if (!str) return "";
    const cleaned = String(str).replace(/[^a-zA-Z0-9\s-_]/g, "").trim().toLowerCase();
    return cleaned
      .split(/[\s-_]+/)
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
      .join(" ");
  }

  function normalizeQuantity(qty) {
    if (!qty) return "";
    // keep numbers/fractions as-is; title-case alphabetic parts (e.g., kg -> Kg, tbsp -> Tbsp)
    return String(qty)
      .trim()
      .replace(/[A-Za-z]+/g, (m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
  }

  function getIngredients(meal) {
    const list = [];
    for (let i = 1; i <= 20; i++) {
      const ingRaw = meal[`strIngredient${i}`];
      const qty = meal[`strMeasure${i}`];
      if (ingRaw && ingRaw.trim() !== "") {
        const ing = toTitleCase(ingRaw);
        const normalizedQty = normalizeQuantity(qty);
        list.push(`${normalizedQty ? normalizedQty + " " : ""}${ing}`.trim());
      }
    }
    return list;
  }

  return (
    <>
      <div>
        {query && query.trim() ? (
          <div className="search-heading" role="region" aria-label="Search results header">
            <div className="search-left">
              <h2>{meals.length > 0 ? `Results for "${toTitleCase(query)}"` : `No results for "${toTitleCase(query)}"`}</h2>
              {meals.length > 0 && <span className="result-count">{meals.length} result{meals.length > 1 ? 's' : ''}</span>}
            </div>
            <div className="search-actions">
              <button className="clear-search" onClick={() => { setSearch && setSearch(''); searchMeal(''); }} aria-label="Clear search">Clear</button>
            </div>
            <div className="visually-hidden" aria-live="polite">{meals.length > 0 ? `${meals.length} results for ${toTitleCase(query)}` : `No results for ${toTitleCase(query)}`}</div>
          </div>
        ) : null}
        <div className="box">
          {meals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-illustration">🍽️</div>
              <h3>No recipes found{query ? ` for "${query}"` : ''}.</h3>
              <p>Try different keywords or explore a popular category below.</p>
              <div className="suggestions">
                <button className="suggest" onClick={() => { setSearch && setSearch('chicken'); searchMeal('chicken'); }}>Chicken</button>
                <button className="suggest" onClick={() => { setSearch && setSearch('pasta'); searchMeal('pasta'); }}>Pasta</button>
                <button className="suggest" onClick={() => { setSearch && setSearch('vegan'); searchMeal('vegan'); }}>Vegan</button>
                <button className="suggest" onClick={() => { setSearch && setSearch('dessert'); searchMeal('dessert'); }}>Dessert</button>
                <button className="suggest" onClick={() => { setSearch && setSearch(''); searchMeal(''); }}>Clear</button>
              </div>
            </div>
          ) : (
            meals.map((meal) => (
              <div className="sub-box" key={meal.idMeal}>
                <img src={meal.strMealThumb} alt={meal.strMeal} />
                <p className="title" style={{ marginTop: "12px" }}>{meal.strMeal}</p>
                <p className="meta" style={{ fontSize: "small", marginTop:"6px" }}>
                  <b>Area : {meal.strArea}</b>
                </p>
                <div className="actions">
                  <button className="view" onClick={() => setSelectedMeal(meal)}>
                    View Recipe
                  </button>
                  <button
                    className="view fav"
                    onClick={() => handleFavourite(meal.idMeal)}
                    style={{
                      backgroundColor: fav.includes(meal.idMeal) ? "#e63946" : "var(--accent)",
                    }}
                  >
                    <FontAwesomeIcon icon={faHeart} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedMeal && (
  <div className="overlay">
    <div className="recipe-card">

      <div className="recipe-header">
        <img src={selectedMeal.strMealThumb} alt={selectedMeal.strMeal} />
        <div className="details">
          <h2>{selectedMeal.strMeal}</h2>

          <div className="meta">
            <span className="badge">{selectedMeal.strArea}</span>
            <span className="badge">{selectedMeal.strCategory}</span>
          </div>
        </div>
      </div>

      <div className="recipe-body">

        <div className="left">
          <h3>Ingredients</h3>
          <ul>
            {getIngredients(selectedMeal).map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="divide" />

        <div className="right">
          <h3>Instructions</h3>
          <p>{selectedMeal.strInstructions}</p>
        </div>

      </div>

      <button className="close-btn" onClick={() => setSelectedMeal(null)} aria-label="Close recipe">
        <FontAwesomeIcon icon={faXmark} />
      </button>

    </div>
  </div>
)}

    </>
  );
}
