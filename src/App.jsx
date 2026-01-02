import { useState } from 'react'
import Header from './Header/Header.jsx'
import Main from './Main/Main.jsx'
import Recipes from './Recipes/Recipes.jsx'
import './App.css'


function App() {
  const [search, setSearch] = useState('');

  return (
    <>
       <Header search={search} setSearch={setSearch} />
       <Main />
       <Recipes query={search} setSearch={setSearch} />
    </>
  )
}

export default App
