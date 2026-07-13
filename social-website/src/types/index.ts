export interface SignupData {
  firstName: string
  lastName: string
  username: string
  email: string
  confirmEmail: string
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