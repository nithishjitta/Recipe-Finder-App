import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Header.css";

export default function Header({ search, setSearch, favCount, showFavs, setShowFavs, isDark, setIsDark }) {
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className={`header${scrolled ? " scrolled" : ""}`}>
      <div className="header-inner">
        <a className="logo" href="/">
          <div className="logo-mark">
            <img
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&q=80"
              alt="Recipe Genie"
            />
          </div>
          <div className="logo-wordmark">
            <span className="logo-name">Recipe<span>Genie</span></span>
            <span className="logo-tagline">World Kitchen</span>
          </div>
        </a>

        <div className="header-search">
          <svg className="search-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search dishes, ingredients…"
            value={search}
            onChange={e => { setSearch(e.target.value); setShowFavs(false); }}
          />
          {search && (
            <button className="search-clear" onClick={() => { setSearch(""); inputRef.current?.focus(); }}>✕</button>
          )}
        </div>

        <div className="header-actions">
          <button
            className={`hdr-btn${showFavs ? " active" : ""}`}
            onClick={() => {
              if (location.pathname === "/saved") {
                setShowFavs(false);
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate("/", { replace: true });
                }
                return;
              }
              setSearch("");
              setShowFavs(true);
              navigate("/saved");
            }}
          >
            <span style={{ fontSize: "18px" }}>❤️</span>
            <span className="hdr-btn-label">Saved</span>
            {favCount > 0 && <span className="hdr-badge">{favCount}</span>}
          </button>
          <button className="hdr-icon-btn" onClick={() => setIsDark(d => !d)} title={isDark ? "Light mode" : "Dark mode"}>
            {isDark
              ? <img src="https://cdn-icons-png.flaticon.com/512/869/869869.png" alt="Light mode" style={{width:20,height:20,borderRadius:4,objectFit:'cover'}} />
              : <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' style={{ display: 'block' }}><path d='M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z'/></svg>
            }
          </button>
        </div>
      </div>
    </header>
  );
}