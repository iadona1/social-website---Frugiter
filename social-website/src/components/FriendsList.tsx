import "../styles/friendList.css";
import { useState, useEffect } from "react";
import type { User } from "../types/index";

interface Friend {
  id: string;
  displayName: string;
  avatarUrl: string;
  username: string;
}

interface FriendsListProps {
  currentUser?: User;
}

export default function FriendsList({}: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3001/api/friends", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setFriends(data.friends);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, []);
  return (
    <aside className="friends-panel">
      <div className="friends-panel-shine" />
      <div className="friends-title">👥 Friends</div>

      {loading ? (
        <div className="friends-loading">Loading...</div>
      ) : friends.length === 0 ? (
        <div className="friends-empty">
          <div className="friends-empty-icon">🌊</div>
          <div>No friends yet!</div>
          <div style={{ fontSize: "11px", marginTop: "4px", opacity: 0.7 }}>
            Search for people to add
          </div>
        </div>
      ) : (
        <div className="friends-list">
          {friends.map((friend) => (
            <div key={friend.id} className="friend-item">
              <div className="friend-avatar-wrapper">
                <img
                  src={friend.avatarUrl || "/assets/Frugiter-Icon-blue.jpg"}
                  alt={friend.displayName}
                  className="friend-avatar"
                />
                <div className="friend-online-dot" />
              </div>
              <div className="friend-info">
                <div className="friend-name">{friend.displayName}</div>
                <div className="friend-username">@{friend.username}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="friends-search">
        <input
          className="friends-search-input"
          placeholder="🔍 Find friends..."
        />
      </div>
    </aside>
  );
}
