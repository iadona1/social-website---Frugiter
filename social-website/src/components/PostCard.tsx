import "../styles/postCard.css";
import { useState } from "react";
import type { Comment } from "../types/index";
import type { PostCardProps } from "../types/index";

export default function PostCard({
  post,
  index,
  currentUserId,
  onLike,
  onDelete,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOffset = index % 2 === 1;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
  };

  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:3001/api/posts/${post.id}/comments`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        if (res.ok) setComments(data.comments);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments((prev) => !prev);
  };

  const handlePostComment = async () => {
    if (!comment.trim()) return;
    setPostingComment(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3001/api/posts/${post.id}/comments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: comment }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        setComments((prev) => [...prev, data.comment]);
        setComment("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("Delete this post?")) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/api/posts/${post.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        onDelete(post.id);
      } else {
        const data = await res.json();
        console.error("Delete failed:", data.error);
        setDeleting(false);
      }
    } catch (err) {
      console.error("Delete error:", err);
      setDeleting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3001/api/posts/${post.id}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3001/api/posts/${post.id}/comments/${commentId}/like`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  liked: data.liked,
                  likesCount: data.liked ? c.likesCount + 1 : c.likesCount - 1,
                }
              : c,
          ),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className={`post-card ${isOffset ? "post-card-offset" : ""} ${deleting ? "post-card-deleting" : ""}`}
    >
      <div className="post-card-shine" />

      <div className="post-header">
        <img
          src={post.avatarUrl || "/assets/Frugiter-Icon-blue.jpg"}
          alt={post.displayName}
          className="post-avatar"
        />
        <div className="post-header-info">
          <div className="post-display-name">{post.displayName}</div>
          <div className="post-time">{timeAgo(post.createdAt)}</div>
        </div>
        {post.userId === currentUserId && (
          <button
            className="post-delete-btn"
            onClick={handleDeletePost}
            title="Delete post"
          >
            🗑️
          </button>
        )}
      </div>

      {post.content && <div className="post-content">{post.content}</div>}
      {post.imageUrl && (
        <div className="post-image-wrapper">
          <img
            src={
              post.imageUrl.startsWith("http")
                ? post.imageUrl
                : `http://localhost:3001${post.imageUrl}`
            }
            alt="post"
            className="post-image"
          />
        </div>
      )}

      <div className="post-actions">
        <button
          className={`post-action-btn ${post.liked ? "liked" : ""}`}
          onClick={() => onLike(post.id)}
        >
          <span className="post-action-icon">💙</span>
          <span>{post.likesCount}</span>
        </button>

        <button className="post-action-btn" onClick={handleToggleComments}>
          <span className="post-action-icon">💬</span>
          <span>{post.commentsCount}</span>
        </button>

        <button className="post-action-btn">
          <span className="post-action-icon">🔗</span>
          <span>Share</span>
        </button>
      </div>

      {showComments && (
        <div className="post-comments">
          <div className="post-comment-input-row">
            <input
              className="post-comment-input"
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
            />
            <button
              className="post-comment-btn"
              onClick={handlePostComment}
              disabled={postingComment}
            >
              {postingComment ? "..." : "→"}
            </button>
          </div>

          {loadingComments ? (
            <div className="comments-loading">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="comments-empty">No comments yet!</div>
          ) : (
            <div className="comments-list">
              {comments.map((c) => (
                <div key={c.id} className="comment-item">
                  <img
                    src={c.avatarUrl || "/assets/Frugiter-Icon-blue.jpg"}
                    alt={c.displayName}
                    className="comment-avatar"
                  />
                  <div className="comment-bubble">
                    <div className="comment-name">{c.displayName}</div>
                    <div className="comment-text">{c.content}</div>
                    <div className="comment-actions">
                      <button
                        className={`comment-action-btn ${c.liked ? "liked" : ""}`}
                        onClick={() => handleLikeComment(c.id)}
                      >
                        💙 {c.likesCount > 0 ? c.likesCount : ""}
                      </button>
                      {c.userId === currentUserId && (
                        <button
                          className="comment-action-btn comment-delete-btn"
                          onClick={() => handleDeleteComment(c.id)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
