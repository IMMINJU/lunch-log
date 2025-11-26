"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getRestaurants, createRestaurant, deleteRestaurant, toggleFavorite } from "@/app/actions/restaurant";
import { createVisit } from "@/app/actions/visit";
import { useFilterStore } from "@/stores/useFilterStore";
import { useUserStore } from "@/stores/useUserStore";
import { compressAndConvertToBase64 } from "@/lib/imageUtils";
import { getErrorMessage } from "@/lib/errors";
import type { AddRestaurantFormData } from "@/components/form";

export function useRestaurants() {
  const { selectedCategory, sortOption } = useFilterStore();

  return useQuery({
    queryKey: ["restaurants", selectedCategory, sortOption],
    queryFn: () => getRestaurants(selectedCategory, sortOption),
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
    gcTime: 1000 * 60 * 30, // 30분간 캐시 유지
  });
}

export function useCreateRestaurant() {
  const queryClient = useQueryClient();
  const userId = useUserStore((s) => s.userId);

  return useMutation({
    mutationFn: async (data: AddRestaurantFormData) => {
      if (!data.place || !data.category || !data.price) {
        throw new Error("Required fields missing");
      }

      const restaurant = await createRestaurant({
        name: data.place.name,
        address: data.place.address,
        latitude: data.place.lat,
        longitude: data.place.lng,
        category: data.category,
      });

      let imageBase64: string | null = null;
      if (data.image) {
        imageBase64 = await compressAndConvertToBase64(data.image);
      }

      await createVisit({
        restaurantId: restaurant.id,
        userId,
        menu: data.menu,
        rating: data.rating,
        price: data.price,
        comment: data.comment || null,
        imageBase64,
        visitedAt: data.visitedAt,
      });

      return restaurant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      toast.success("가게가 추가되었습니다");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteRestaurant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRestaurant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      toast.success("가게가 삭제되었습니다");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleFavorite,
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant", id] });
      toast.success(result?.isFavorite ? "즐겨찾기에 추가됨" : "즐겨찾기 해제됨");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
