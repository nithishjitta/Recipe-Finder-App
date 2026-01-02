import React, { useEffect, useState, useRef } from 'react'
import logo from '../assets/logo.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faHeart, faBell, faMoon, faSun} from '@fortawesome/free-solid-svg-icons';
import "./Header.css";

export default function Header({ search, setSearch }) {
    const inputRef = useRef(null);
    const [icon, setIcon] = useState(faMoon);
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.body.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
        }
        return false;
    });

    useEffect(() => {
        if (isDark) {
            document.body.classList.add('dark');
            setIcon(faSun);
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark');
            setIcon(faMoon);
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    function toggleMode() {
        setIsDark(prev => !prev);
    }
    return (
        <>
        <div className="header">
        <img src={logo} alt="Error" />
        <div className='ip'>
            <div className="search-wrapper" style={{marginRight: '30px'}}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder='Search recipes...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button type="button" className="search-btn" aria-label="Focus search" onClick={() => inputRef.current && inputRef.current.focus()}>
                  <FontAwesomeIcon icon={faSearch} className='icon'/>
                </button>
            </div>
            <p style={{cursor:'pointer'}}><FontAwesomeIcon icon={faHeart} style={{color:"red"}}/> Favourites</p>
            <div className="divider"></div>
            <FontAwesomeIcon icon={faBell} className='icon1' />
            <FontAwesomeIcon icon={icon} onClick = {toggleMode} className='icon1'/>
        </div>
        </div>
        </>
    )
}
