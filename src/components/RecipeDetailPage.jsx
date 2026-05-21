import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getAreaImg } from "./FilterBar.jsx";
import "./RecipeDetailPage.css";

const BASE = "https://www.themealdb.com/api/json/v1/1";
const LOCATION_ICON   = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4cd.png";

const CAT_IMG = {
  Beef:          "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f969.png",
  Chicken:       "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f357.png",
  Dessert:       "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f370.png",
  Goat:          "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f410.png",
  Lamb:          "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f356.png",
  Miscellaneous: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f372.png",
  Pasta:         "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f35d.png",
  Pork:          "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f953.png",
  Seafood:       "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f41f.png",
  Side:          "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f957.png",
  Starter:       "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f372.png",
  Vegan:         "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f331.png",
  Vegetarian:    "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f96c.png",
  Breakfast:     "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f373.png",
};
const FALLBACK_CAT = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f37d.png";

async function lookupMeal(id) {
  const r = await fetch(`${BASE}/lookup.php?i=${encodeURIComponent(id)}`);
  const d = await r.json();
  return d.meals?.[0] || null;
}

function toTC(str) {
  if (!str) return "";
  return String(str).trim().toLowerCase().split(/[^a-z0-9]+/i)
    .map(w => w ? w[0].toUpperCase() + w.slice(1) : "").join(" ");
}

function getIngredients(meal) {
  const list = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const qty = meal[`strMeasure${i}`];
    if (ing?.trim()) list.push({ ing: toTC(ing), qty: qty?.trim() || "" });
  }
  return list;
}

export default function RecipeDetailPage({ favIds, toggleFav, isDark }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [meal, setMeal] = useState(location.state?.meal || null);
  const [loading, setLoading] = useState(!meal);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!meal) {
      setLoading(true);
      lookupMeal(id)
        .then(result => {
          if (result) { setMeal(result); setError(""); }
          else setError("Recipe not found.");
        })
        .catch(() => setError("Failed to load recipe."))
        .finally(() => setLoading(false));
    }
  }, [id, meal]);

  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, [id]);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/", { replace: true });
  };

  if (loading) return (
    <div className="detail-page">
      <button className="detail-back" onClick={handleBack}>← Back</button>
      <p style={{ color: "var(--ink3)", marginTop: 20 }}>Loading recipe…</p>
    </div>
  );

  if (!meal) return (
    <div className="detail-page">
      <button className="detail-back" onClick={handleBack}>← Back</button>
      <p style={{ color: "var(--ink3)", marginTop: 20 }}>{error || "Recipe not found."}</p>
    </div>
  );

  const ingredients = getIngredients(meal);
  const isFav = favIds.includes(meal.idMeal);
  const catImg = CAT_IMG[meal.strCategory] || FALLBACK_CAT;
  const areaImg = getAreaImg(meal.strArea);

  return (
    <div className="detail-page">
      <button className="detail-back" onClick={handleBack}>← Back</button>

      {/* Hero image */}
      <div className="detail-hero">
        <img src={meal.strMealThumb} alt={meal.strMeal} />
        <div className="detail-hero-grad" />
        <div className="detail-hero-title">
          <h2>{meal.strMeal}</h2>
        </div>
      </div>

      {/* Meta (glass badges) placed below the hero image */}
      <div className="detail-hero-meta">
        <div className="detail-badges">
          {meal.strCategory && (
            <span className="detail-badge">
              <img src={catImg} alt={meal.strCategory} onError={e => e.target.style.display="none"} />
              {meal.strCategory}
            </span>
          )}
          {meal.strArea && (
            <span className="detail-badge">
              <img src={LOCATION_ICON} alt={meal.strArea} onError={e => e.target.style.display="none"} />
              {meal.strArea}
            </span>
          )}
          <span className="detail-badge">
            <img src={FALLBACK_CAT} alt="" onError={e => e.target.style.display="none"} />
            {ingredients.length} ingredients
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="detail-body">
        <div className="detail-col">
          <p className="detail-col-title">
            <img src={FALLBACK_CAT} alt="" onError={e => e.target.style.display="none"} />
            Ingredients
          </p>
          <ul className="detail-ing-list">
            {ingredients.map((item, i) => (
              <li className="detail-ing-item" key={i}>
                <span className="detail-ing-bullet" />
                <span>
                  {item.qty && <span className="detail-ing-qty">{item.qty}</span>}
                  {item.ing}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="detail-col">
          <p className="detail-col-title">
            <img src="https://cdn-icons-png.flaticon.com/512/2784/2784459.png" alt="" onError={e => e.target.style.display="none"} />
            Instructions
          </p>
          <p className="detail-instr-text">{meal.strInstructions}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="detail-footer">
        <button className={`detail-btn-fav ${isFav ? "on" : "off"}`} onClick={() => toggleFav(meal.idMeal)}>
          <span style={{ fontSize: "18px" }}>{isFav ? "❤️" : "🤍"}</span>
          {isFav ? "Saved to Favourites" : "Save to Favourites"}
        </button>
        {meal.strYoutube && (
          <button className="detail-btn-yt" onClick={() => window.open(meal.strYoutube, "_blank")}>
            <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" alt="YouTube" onError={e => e.target.style.display="none"} />
            Watch Recipe
          </button>
        )}
      </div>
    </div>
  );
}