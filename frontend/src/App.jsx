import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Header from './components/Header.jsx'
import UsersPage from './pages/UsersPage.jsx'
import FavouritesPage from './pages/FavouritesPage.jsx'
import PostsPage from './pages/PostsPage.jsx'
import ReviewsPage from './pages/ReviewsPage.jsx'
import MovieDetail from './pages/MovieDetail.jsx';

function App () {
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage(''))
  }, [])

  return (
    <BrowserRouter>
      <header className="topbar">
        <div className="topbar__inner">
          <div className="brand">ReelEcho</div>
          <nav className="menu">
            <Link to="/">Home</Link>
            <Link to="/users">Users</Link>
            <Link to="/favourites">Favourites</Link>
            <Link to="/posts">Posts</Link>
            <Link to="/reviews">Reviews</Link>
          </nav>
        </div>
      </header>

      <main className="page">
        <Routes>
          <Route path="/" element={<Header />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/favourites" element={<FavouritesPage />} />
          <Route path="/posts" element={<PostsPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
