import "../styles/home.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User, Post } from "../types/index";
import WindowsTitleBar from "../components/WindowsTitleBar";
import PostComposer from "../components/PostComposer";
import PostCard from "../components/PostCard";
import FriendsList from "../components/FriendsList";
import NotificationDropdown from "../components/NotificationDropDown";
import SearchBar from "../components/SearchBar";

type SortMode = 'fresh' | 'hot' | 'top'

export default function Home() {
  const navigate = useNavigate();
  const [user] = useState<User>(() =>
    JSON.parse(localStorage.getItem("user") || "{}"),
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [sort, setSort] = useState<SortMode>('fresh');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/api/posts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setPosts(data.posts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSortedPosts = () => {
    const p = [...posts]
    if (sort === 'hot') return p.sort((a, b) => (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount))
    if (sort === 'top') return p.sort((a, b) => b.likesCount - a.likesCount)
    return p // fresh = default (by date from server)
  }

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleLike = async (postId: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:3001/api/posts/${postId}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, liked: !p.liked, likesCount: p.liked ? p.likesCount - 1 : p.likesCount + 1 }
            : p,
        ),
      );
    }
  };

  return (
    <div className="home-page">
      <WindowsTitleBar title="AeroSocial — Home" />
      <div className="home-bg" />

      {showComposer && (
        <PostComposer
          user={user}
          onPostCreated={handlePostCreated}
          onClose={() => setShowComposer(false)}
        />
      )}

      <nav className="home-navbar">
        <div
          className="navbar-logo"
          onClick={fetchPosts}
          style={{ cursor: "pointer" }}
          title="Refresh feed"
        >
          Aero<span>Social</span>
        </div>

        <SearchBar />
        <div className="navbar-spacer" />

        <div className="navbar-right">
          <NotificationDropdown />
          <div
            className="navbar-user"
            onClick={() => navigate("/profile")}
            style={{ cursor: "pointer" }}
            title="View profile"
          >
            <img
              src={user.avatarUrl || "/assets/Frugiter-Icon-blue.jpg"}
              alt="avatar"
              className="nav-avatar"
            />
            <span className="nav-username">{user.displayName || "User"}</span>
          </div>
        </div>
      </nav>

      <div className="home-layout">
        <main className="feed-column">

          {/* Forum toolbar */}
          <div className="forum-toolbar">
            <div className="forum-sort-bar">
              <button
                className={`sort-btn ${sort === 'fresh' ? 'active' : ''}`}
                onClick={() => setSort('fresh')}
              >
                ✨ Fresh
              </button>
              <button
                className={`sort-btn ${sort === 'hot' ? 'active' : ''}`}
                onClick={() => setSort('hot')}
              >
                🔥 Hot
              </button>
              <button
                className={`sort-btn ${sort === 'top' ? 'active' : ''}`}
                onClick={() => setSort('top')}
              >
                ⭐ Top
              </button>
            </div>
            <button
              className="new-post-btn"
              onClick={() => setShowComposer(true)}
            >
              ✏️ New Post
            </button>
          </div>

          {loading ? (
            <div className="feed-loading">
              <div className="feed-loading-spinner" />
              <span>Loading feed...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="feed-empty">
              <div className="feed-empty-icon">🌊</div>
              <div className="feed-empty-title">Nothing here yet!</div>
              <div className="feed-empty-sub">Be the first to post something.</div>
            </div>
          ) : (
            <div className="feed-posts">
              {getSortedPosts().map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={index}
                  currentUserId={user.id}
                  onLike={handleLike}
                  onDelete={handlePostDeleted}
                />
              ))}
            </div>
          )}
        </main>

        <FriendsList />
      </div>
    </div>
  );
}