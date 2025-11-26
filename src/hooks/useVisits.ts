"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createVisit, updateVisit, deleteVisit } from "@/app/actions/visit";
import { compressAndConvertToBase64 } from "@/lib/imageUtils";
import { getErrorMessage } from "@/lib/errors";
import type { PriceRange } from "@/types";
import { useUserStore } from "@/stores/useUserStore";

interface CreateVisitData {
  restaurantId: string;
  menu: string;
  rating: number | null;
  price: PriceRange | null;
  comment: string;
  image: File | null;
  visitedAt: string;
}

export function useCreateVisit() {
  const queryClient = useQueryClient();
  const userId = useUserStore((s) => s.userId);

  return useMutation({
    mutationFn: async (data: CreateVisitData) => {
      let imageBase64: string | null = null;
      if (data.image) {
        imageBase64 = await compressAndConvertToBase64(data.image);
      }

      return createVisit({
        restaurantId: data.restaurantId,
        userId,
        menu: data.menu,
        rating: data.rating,
        price: data.price,
        comment: data.comment || null,
        imageBase64,
        visitedAt: data.visitedAt,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant", variables.restaurantId] });
      toast.success("방문 기록이 추가되었습니다");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

interface UpdateVisitData {
  id: string;
  restaurantId: string;
  menu: string;
  rating: number | null;
  price: PriceRange | null;
  comment: string;
  image: File | null;
  keepExistingImage: boolean;
  visitedAt: string;
}

export function useUpdateVisit() {
  const queryClient = useQueryClient();
  const userId = useUserStore((s) => s.userId);

  return useMutation({
    mutationFn: async (data: UpdateVisitData) => {
      let imageBase64: string | null = null;
      if (data.image) {
        imageBase64 = await compressAndConvertToBase64(data.image);
      }

      return updateVisit({
        id: data.id,
        userId,
        restaurantId: data.restaurantId,
        menu: data.menu,
        rating: data.rating,
        price: data.price,
        comment: data.comment || null,
        imageBase64,
        keepExistingImage: data.keepExistingImage,
        visitedAt: data.visitedAt,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant", variables.restaurantId] });
      toast.success("방문 기록이 수정되었습니다");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteVisit() {
  const queryClient = useQueryClient();
  const userId = useUserStore((s) => s.userId);

  return useMutation({
    mutationFn: ({ id, restaurantId }: { id: string; restaurantId: string }) =>
      deleteVisit(id, restaurantId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant", variables.restaurantId] });
      toast.success("방문 기록이 삭제되었습니다");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
