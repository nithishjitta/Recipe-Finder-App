import React from 'react'
import img from '../assets/img1.png';
import './Main.css';

export default function Main() {
  return (
    <>
        <div className='main-container'>
            <div className='sub-container'>
                <img src={img} alt="Error" />
                <p className='area1'>Find the Perfect Recipe for Your Next Meal!</p>
                <p className='area2'>Popular : Pasta | Chicken | Vegan | Dessert </p>
                <button className='browse'>Browse Recipes</button>
            </div>
        </div>
    </>
  )
}
