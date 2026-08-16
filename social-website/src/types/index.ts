export interface SignupData {
  firstName: string
  lastName: string
  username: string
  email: string
  confirmPassword: string
  password: string
  dateOfBirth: string
}

export interface LoginData {
  email: string
  password: string
}

export interface User {
  id: string
  displayName: string
  email: string
  avatarUrl: string
}

export interface AuthResponse {
  message: string
  token: string
  user: User
}

export interface ApiError {
  error: string
}

export interface AvatarOption {
  id: string
  color: string
  url: string
}

export interface Comment {
  id: string
  userId: string
  displayName: string
  avatarUrl: string
  content: string
  createdAt: string
  likesCount: number
  liked: boolean
}

export interface Post {
  id: string
  userId: string
  displayName: string
  avatarUrl: string
  content: string
  imageUrl?: string
  likesCount: number
  commentsCount: number
  createdAt: string
  liked: boolean
}

export interface PostCardProps {
  post: Post;
  index: number;
  onLike: (postId: string) => Promise<void>;
  onDelete: (postId: string) => void;
  currentUserId: string;
}

export interface SearchUser {
  id: string
  displayName: string
  username: string
  avatarUrl: string
  friendshipStatus: string
  friendshipDirection: string
}

export interface Notification {
  id: string
  type: string
  message: string
  fromAvatar: string
  isRead: boolean
  createdAt: string
  postId?: string
}

export interface Reply {
  id: string
  userId: string
  displayName: string
  username: string
  avatarUrl: string
  content: string
  createdAt: string
  likesCount: number
  liked: boolean
}