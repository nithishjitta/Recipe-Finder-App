import "./Hero.css";

const QUICK_TAGS = [
  { label: "Pasta",    searchTerm: "Pasta",    img: "https://images.emojiterra.com/google/android-12l/512px/1f35d.png" },
  { label: "Chicken",  searchTerm: "Chicken",  img: "https://cdn-icons-png.flaticon.com/512/1046/1046751.png" },
  { label: "Vegan",    searchTerm: "Vegan",    img: "https://cdn-icons-png.flaticon.com/512/2153/2153788.png" },
  { label: "Seafood",  searchTerm: "Seafood",  img: "https://cdn-icons-png.flaticon.com/512/2718/2718224.png" },
  { label: "Dessert",  searchTerm: "Dessert",  img: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f370.png" },
  { label: "Indian",   searchTerm: "Indian",   img: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f35b.png" },
];

const FEATURED = [
  { label: "Butter Chicken", searchTerm: "Chicken",  img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80" },
  { label: "Pasta Carbonara", searchTerm: "Pasta",   img: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=300&q=80" },
  { label: "Sushi Platter",   searchTerm: "Japanese", img: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=300&q=80" },
];

export default function Hero({ onQuickSearch }) {
  return (
    <section className="hero">
      <div className="hero-bg" />
      <div className="hero-overlay" />
      <div className="hero-overlay-bottom" />
      <div className="hero-noise" />

      <div className="hero-content">
        <div className="hero-left">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            Discover World Flavours
          </div>

          <h1 className="hero-title">
            Your Personal<br /><em>Recipe Genie</em>
          </h1>

          <p className="hero-sub">
            Thousands of hand-curated recipes from 28 cuisines. Find your next favourite meal in seconds.
          </p>

          <div className="hero-ctas">
            <button className="hero-btn-primary" onClick={() => onQuickSearch("Chicken")}>
              Browse Recipes
            </button>
            {/* "Dessert" is a known category — quickSearch will use category filter */}
            <button className="hero-btn-secondary" onClick={() => onQuickSearch("Dessert")}>
              See Desserts →
            </button>
          </div>

          <p className="hero-tags-label">Popular right now</p>
          <div className="hero-tags">
            {QUICK_TAGS.map(t => (
              <button key={t.label} className="hero-tag" onClick={() => onQuickSearch(t.searchTerm)}>
                <img src={t.img} alt={t.label} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-card-stack">
            {FEATURED.map(f => (
              <div key={f.label} className="hero-mini-card" onClick={() => onQuickSearch(f.searchTerm)}>
                <img src={f.img} alt={f.label} />
                <div className="hero-mini-card-overlay" />
                <span className="hero-mini-card-label">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}