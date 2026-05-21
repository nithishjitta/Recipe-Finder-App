import "./Hero.css";

const QUICK_TAGS = [
  { label: "Pasta",   img: "https://images.emojiterra.com/google/android-12l/512px/1f35d.png" },
  { label: "Chicken", img: "https://cdn-icons-png.flaticon.com/512/1046/1046751.png" },
  { label: "Vegan",   img: "https://cdn-icons-png.flaticon.com/512/2153/2153788.png" },
  { label: "Seafood", img: "https://cdn-icons-png.flaticon.com/512/2718/2718224.png" },
  { label: "Dessert", img: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f370.png" },
  { label: "Indian",  img: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f35b.png" },
];

// const STATS = [
//   { img: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=72&q=80", val: "300+", label: "Recipes" },
//   { img: "https://images.unsplash.com/photo-1526470498-9ae73c665de8?w=72&q=80", val: "28",   label: "Cuisines" },
//   { img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=72&q=80", val: "15",  label: "Categories" },
//   { img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=72&q=80", val: "Free", label: "Always" },
// ];

const FEATURED = [
  { label: "Butter Chicken", img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80" },
  { label: "Pasta Carbonara", img: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=300&q=80" },
  { label: "Sushi Platter",   img: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=300&q=80" },
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
            <button className="hero-btn-primary" onClick={() => onQuickSearch("chicken")}>
              Browse Recipes
            </button>
            <button className="hero-btn-secondary" onClick={() => onQuickSearch("dessert")}>
              See Desserts →
            </button>
          </div>

          <p className="hero-tags-label">Popular right now</p>
          <div className="hero-tags">
            {QUICK_TAGS.map(t => (
              <button key={t.label} className="hero-tag" onClick={() => onQuickSearch(t.label)}>
                <img src={t.img} alt={t.label} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-card-stack">
            {FEATURED.map(f => (
              <div key={f.label} className="hero-mini-card" onClick={() => onQuickSearch(f.label.split(" ")[0])}>
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