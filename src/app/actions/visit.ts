"use server";

import { db } from "@/db";
import { visits } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { USERS } from "@/constants";

function isReadonlyUser(userId: string): boolean {
  const user = USERS.find((u) => u.id === userId);
  return user?.readonly ?? false;
}

export async function createVisit(data: {
  restaurantId: string;
  userId: string;
  menu: string;
  rating?: number | null;
  price?: string | null;
  comment?: string | null;
  imageBase64?: string | null;
  visitedAt: string;
}) {
  // readonly 사용자는 생성 불가
  if (isReadonlyUser(data.userId)) {
    throw new Error("권한이 없습니다");
  }

  // base64를 Buffer로 변환
  const imageBuffer = data.imageBase64
    ? Buffer.from(data.imageBase64, "base64")
    : null;

  const [visit] = await db
    .insert(visits)
    .values({
      restaurantId: data.restaurantId,
      userId: data.userId,
      menu: data.menu,
      rating: data.rating?.toString() ?? null,
      price: data.price ?? null,
      comment: data.comment ?? null,
      image: imageBuffer,
      visitedAt: data.visitedAt,
    })
    .returning();

  revalidatePath("/");
  revalidatePath(`/restaurant/${data.restaurantId}`);

  // image 필드는 Uint8Array라서 클라이언트로 전달 불가, hasImage로 변환
  return {
    id: visit.id,
    restaurantId: visit.restaurantId,
    userId: visit.userId,
    menu: visit.menu,
    rating: visit.rating,
    price: visit.price,
    comment: visit.comment,
    visitedAt: visit.visitedAt,
    createdAt: visit.createdAt,
    hasImage: visit.image !== null,
  };
}

export async function getVisitWithImage(id: string) {
  const result = await db.query.visits.findFirst({
    where: eq(visits.id, id),
  });

  return result;
}

export async function updateVisit(data: {
  id: string;
  userId: string;
  restaurantId: string;
  menu: string;
  rating?: number | null;
  price?: string | null;
  comment?: string | null;
  imageBase64?: string | null;
  keepExistingImage?: boolean;
  visitedAt: string;
}) {
  // 본인 기록인지 확인
  const existing = await db.query.visits.findFirst({
    where: eq(visits.id, data.id),
  });

  if (!existing) {
    throw new Error("방문 기록을 찾을 수 없습니다");
  }

  if (existing.userId !== data.userId) {
    throw new Error("본인의 기록만 수정할 수 있습니다");
  }

  // 이미지 처리
  const imageUpdate: { image?: Buffer | null } = {};
  if (data.imageBase64) {
    // 새 이미지 업로드
    imageUpdate.image = Buffer.from(data.imageBase64, "base64");
  } else if (!data.keepExistingImage) {
    // 기존 이미지 삭제
    imageUpdate.image = null;
  }
  // keepExistingImage가 true이고 새 이미지가 없으면 이미지 필드를 업데이트하지 않음

  const [visit] = await db
    .update(visits)
    .set({
      menu: data.menu,
      rating: data.rating?.toString() ?? null,
      price: data.price ?? null,
      comment: data.comment ?? null,
      visitedAt: data.visitedAt,
      ...imageUpdate,
    })
    .where(eq(visits.id, data.id))
    .returning();

  revalidatePath("/");
  revalidatePath(`/restaurant/${data.restaurantId}`);

  return {
    id: visit.id,
    restaurantId: visit.restaurantId,
    userId: visit.userId,
    menu: visit.menu,
    rating: visit.rating,
    price: visit.price,
    comment: visit.comment,
    visitedAt: visit.visitedAt,
    createdAt: visit.createdAt,
    hasImage: visit.image !== null,
  };
}

export async function deleteVisit(id: string, restaurantId: string, userId: string) {
  // 본인 기록인지 확인
  const existing = await db.query.visits.findFirst({
    where: eq(visits.id, id),
  });

  if (!existing) {
    throw new Error("방문 기록을 찾을 수 없습니다");
  }

  if (existing.userId !== userId) {
    throw new Error("본인의 기록만 삭제할 수 있습니다");
  }

  await db.delete(visits).where(eq(visits.id, id));
  revalidatePath("/");
  revalidatePath(`/restaurant/${restaurantId}`);
}
