export interface User {
  _id: string;
  phone: string;
  name: string;
  role: 'user' | 'admin';
  isPhoneVerified: boolean;
  telegram: string;
  instagram: string;
  snapchat: string;
  messenger: string;
  preferredContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id: string;
  title: string;
  description: string;
  images: string[];
  durationMinutes: number;
  tags: string[];
  popularityScore: number;
  isTrending: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  _id: string;
  user: User | string;
  activity: Activity | string;
  desiredDate: string;
  status: 'New' | 'Contacted' | 'Confirmed' | 'Cancelled';
  adminNote: string;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistoryEntry {
  status: string;
  changedBy: string;
  note: string;
  createdAt: string;
}

export interface Favorite {
  _id: string;
  user: string;
  activity: Activity;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ActivitiesResponse {
  activities: Activity[];
  pagination: Pagination;
}

export interface BookingsResponse {
  bookings: Booking[];
  pagination: Pagination;
}

export interface FavoritesResponse {
  favorites: Activity[];
  ids: string[];
}
