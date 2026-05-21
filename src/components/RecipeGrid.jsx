import "./RecipeCard.css";
import { getAreaImg } from "./FilterBar.jsx";

/* Ingredient icon — single valid CDN URL (light = dark, colour differs via filter) */
const INGREDIENT_ICON = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f37d.png  ";
const LOCATION_ICON   = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4cd.png";

/* Category image map (Twemoji — stable CDN) */
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

const SUGG = [
  { label: "Pasta",   img: "https://images.emojiterra.com/google/android-12l/512px/1f35d.png" },
  { label: "Chicken", img: "https://cdn-icons-png.flaticon.com/512/1046/1046751.png" },
  { label: "Indian",  img: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f35b.png" },
];

function getIngCount(meal) {
  let c = 0;
  for (let i = 1; i <= 20; i++) if (meal[`strIngredient${i}`]?.trim()) c++;
  return c;
}
function getCatImg(cat) { return CAT_IMG[cat] || FALLBACK_CAT; }

/* ── Single Card ── */
export function RecipeCard({ meal, isFav, onToggleFav, onView }) {
  const areaImg = getAreaImg(meal.strArea);

  return (
    <article className="recipe-card" onClick={() => onView(meal)}>
      <div className="card-img-wrap">
        <img src={meal.strMealThumb} alt={meal.strMeal} loading="lazy" />
        <div className="card-img-scrim" />

        {/* Category badge bottom-left */}
        {meal.strCategory && (
          <span className="card-cat-badge">
            <img src={getCatImg(meal.strCategory)} alt={meal.strCategory} onError={e => e.target.style.display="none"} />
            {meal.strCategory}
          </span>
        )}

        
      </div>

      <div className="card-body">
        <p className="card-title">{meal.strMeal}</p>
        <div className="card-meta-row">
          <span className="card-meta-item">
            <img src={INGREDIENT_ICON} alt="" onError={e => e.target.style.display="none"} />
            {getIngCount(meal)} ingredients
          </span>
          {meal.strArea && meal.strArea !== "Unknown" && (
            <span className="card-meta-item">
              <img src={LOCATION_ICON} alt="" onError={e => e.target.style.display="none"} />
              {meal.strArea}
            </span>
          )}
        </div>
        <div className="card-footer">
          <button className="btn-view" onClick={e => { e.stopPropagation(); onView(meal); }}>
            View Recipe
          </button>
          <button
            className={`btn-fav-card ${isFav ? "on" : ""}`}
            onClick={e => { e.stopPropagation(); onToggleFav(meal.idMeal); }}
          >
            <span>{isFav ? "❤️" : "🤍"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

/* ── Skeleton ── */
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skel skel-img" />
      <div className="skel-body">
        <div className="skel" style={{ height: 17, width: "80%" }} />
        <div className="skel" style={{ height: 13, width: "55%" }} />
        <div className="skel" style={{ height: 36, marginTop: 6 }} />
      </div>
    </div>
  );
}

/* ── Grid ── */
export default function RecipeGrid({ meals, loading, favIds, isDark, onToggleFav, onView, query, onQuickSearch }) {
  if (loading) {
    return (
      <div className="recipe-grid">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div className="recipe-grid">
        <div className="empty-state">
          <div className="empty-img-row">
            {SUGG.slice(0,3).map(s => (
              <img key={s.label} className="empty-img" src={s.img} alt={s.label} />
            ))}
          </div>
          <h3 className="empty-title">
            {query ? `No results for "${query}"` : "What shall we cook?"}
          </h3>
          <p className="empty-sub">
            {query
              ? "Try a different keyword or clear your filters."
              : "Search for any dish, or try a popular pick below."}
          </p>
          <div className="empty-suggestions">
            {SUGG.map(s => (
              <button key={s.label} className="empty-sugg-btn" onClick={() => onQuickSearch(s.label)}>
                <img src={s.img} alt={s.label} /> {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recipe-grid">
      {meals.map(meal => (
        <RecipeCard
          key={meal.idMeal}
          meal={meal}
          isFav={favIds.includes(meal.idMeal)}
          onToggleFav={onToggleFav}
          onView={onView}
        />
      ))}
    </div>
  );
}