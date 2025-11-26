"use server";

import { db } from "@/db";
import { restaurants, visits } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { Category, SortOption, RestaurantWithVisits, VisitWithoutImage } from "@/types";

export async function getRestaurants(
  category?: Category | null,
  sort: SortOption = "latest"
): Promise<RestaurantWithVisits[]> {
  const result = await db.query.restaurants.findMany({
    with: {
      visits: {
        columns: {
          id: true,
          restaurantId: true,
          userId: true,
          menu: true,
          rating: true,
          price: true,
          comment: true,
          visitedAt: true,
          createdAt: true,
          image: true,
        },
        orderBy: [desc(visits.visitedAt)],
      },
    },
    where: category ? eq(restaurants.category, category) : undefined,
    orderBy:
      sort === "latest"
        ? [desc(restaurants.createdAt)]
        : sort === "name"
        ? [asc(restaurants.name)]
        : undefined,
  });

  // 방문 기록이 있는 가게만 필터링
  const withVisits = result.filter((r) => r.visits.length > 0);

  const mapped = withVisits.map((r) => {
    const ratings = r.visits
      .filter((v) => v.rating !== null)
      .map((v) => parseFloat(v.rating!));
    const averageRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;

    return {
      ...r,
      visits: r.visits.map((v) => ({
        id: v.id,
        restaurantId: v.restaurantId,
        userId: v.userId,
        menu: v.menu,
        rating: v.rating,
        price: v.price,
        comment: v.comment,
        visitedAt: v.visitedAt,
        createdAt: v.createdAt,
        hasImage: v.image !== null,
      })) as VisitWithoutImage[],
      averageRating,
      visitCount: r.visits.length,
    };
  });

  if (sort === "rating") {
    return mapped.sort((a, b) => {
      if (a.averageRating === null && b.averageRating === null) return 0;
      if (a.averageRating === null) return 1;
      if (b.averageRating === null) return -1;
      return b.averageRating - a.averageRating;
    });
  }

  return mapped;
}

export async function getRestaurantById(id: string): Promise<RestaurantWithVisits | null> {
  const result = await db.query.restaurants.findFirst({
    where: eq(restaurants.id, id),
    with: {
      visits: {
        columns: {
          id: true,
          restaurantId: true,
          userId: true,
          menu: true,
          rating: true,
          price: true,
          comment: true,
          visitedAt: true,
          createdAt: true,
          image: true,
        },
        orderBy: [desc(visits.visitedAt)],
      },
    },
  });

  if (!result) return null;

  const ratings = result.visits
    .filter((v) => v.rating !== null)
    .map((v) => parseFloat(v.rating!));
  const averageRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;

  return {
    ...result,
    visits: result.visits.map((v) => ({
      id: v.id,
      restaurantId: v.restaurantId,
      userId: v.userId,
      menu: v.menu,
      rating: v.rating,
      price: v.price,
      comment: v.comment,
      visitedAt: v.visitedAt,
      createdAt: v.createdAt,
      hasImage: v.image !== null,
    })) as VisitWithoutImage[],
    averageRating,
    visitCount: result.visits.length,
  };
}

export async function createRestaurant(data: {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
}) {
  const [restaurant] = await db
    .insert(restaurants)
    .values(data)
    .returning();

  revalidatePath("/");
  return restaurant;
}

export async function deleteRestaurant(id: string) {
  await db.delete(restaurants).where(eq(restaurants.id, id));
  revalidatePath("/");
}

export async function toggleFavorite(id: string) {
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.id, id),
  });

  if (!restaurant) return null;

  const [updated] = await db
    .update(restaurants)
    .set({ isFavorite: !restaurant.isFavorite })
    .where(eq(restaurants.id, id))
    .returning();

  revalidatePath("/");
  revalidatePath(`/restaurant/${id}`);
  return updated;
}
