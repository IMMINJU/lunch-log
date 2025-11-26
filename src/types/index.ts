export type Category =
  | "한식"
  | "중식"
  | "일식"
  | "양식"
  | "분식"
  | "기타";

export type PriceRange = "LOW" | "MID" | "HIGH";

export type SortOption = "latest" | "rating" | "name";

export interface User {
  id: string;
  name: string;
  readonly?: boolean;
}

export interface NaverSearchItem {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
}

export interface NaverSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverSearchItem[];
}

export interface RestaurantWithVisits {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  isFavorite: boolean;
  createdAt: Date;
  visits: VisitWithoutImage[];
  averageRating: number | null;
  visitCount: number;
}

export interface VisitWithoutImage {
  id: string;
  restaurantId: string;
  userId: string | null;
  menu: string;
  rating: string | null;
  price: string | null;
  comment: string | null;
  visitedAt: string;
  createdAt: Date;
  hasImage?: boolean;
}

export interface VisitWithImage extends VisitWithoutImage {
  image: Buffer | null;
}
