"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button, Modal, BottomSheet, ConfirmModal } from "@/components/ui";
import { NaverMap } from "@/components/map";
import { VisitList } from "@/components/visit";
import { AddVisitForm, StarRating, type AddVisitFormData, type EditVisitFormData } from "@/components/form";
import { getRestaurantById } from "@/app/actions/restaurant";
import { useCreateVisit, useUpdateVisit, useDeleteVisit, useToggleFavorite, useIsDesktop } from "@/hooks";
import { useUserStore } from "@/stores/useUserStore";
import type { VisitWithoutImage } from "@/types";

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<VisitWithoutImage | null>(null);
  const [deletingVisitId, setDeletingVisitId] = useState<string | null>(null);
  const [confirmDeleteVisitId, setConfirmDeleteVisitId] = useState<string | null>(null);

  const isDesktop = useIsDesktop();
  const isReadonly = useUserStore((s) => s.isReadonly());

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["restaurant", id],
    queryFn: () => getRestaurantById(id),
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
    gcTime: 1000 * 60 * 30, // 30분간 캐시 유지
  });

  const createVisit = useCreateVisit();
  const updateVisit = useUpdateVisit();
  const deleteVisit = useDeleteVisit();
  const toggleFavorite = useToggleFavorite();

  const handleAddVisit = async (data: AddVisitFormData) => {
    await createVisit.mutateAsync({
      restaurantId: id,
      menu: data.menu,
      rating: data.rating,
      price: data.price,
      comment: data.comment,
      image: data.image,
      visitedAt: data.visitedAt,
    });
    setIsAddVisitOpen(false);
  };

  const handleEditVisit = (visit: VisitWithoutImage) => {
    setEditingVisit(visit);
  };

  const handleUpdateVisit = async (data: EditVisitFormData) => {
    if (!editingVisit) return;
    await updateVisit.mutateAsync({
      id: editingVisit.id,
      restaurantId: id,
      menu: data.menu,
      rating: data.rating,
      price: data.price,
      comment: data.comment,
      image: data.image,
      keepExistingImage: data.keepExistingImage,
      visitedAt: data.visitedAt,
    });
    setEditingVisit(null);
  };

  const handleDeleteVisit = (visitId: string) => {
    setConfirmDeleteVisitId(visitId);
  };

  const confirmDeleteVisit = async () => {
    if (!confirmDeleteVisitId || !restaurant) return;

    const isLastVisit = restaurant.visits.length === 1;

    setDeletingVisitId(confirmDeleteVisitId);
    setConfirmDeleteVisitId(null);
    await deleteVisit.mutateAsync({ id: confirmDeleteVisitId, restaurantId: id });
    setDeletingVisitId(null);

    // 마지막 방문 기록이었으면 홈으로 이동
    if (isLastVisit) {
      router.push("/");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">가게를 찾을 수 없습니다</p>
        <Link href="/">
          <Button>홈으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  const AddVisitFormContent = (
    <AddVisitForm
      onSubmit={handleAddVisit}
      onCancel={() => setIsAddVisitOpen(false)}
      isLoading={createVisit.isPending}
    />
  );

  return (
    <div className="h-screen-safe overflow-hidden bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="p-1 -ml-1 rounded-lg hover:bg-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold">{restaurant.name}</h1>
          <button
            onClick={() => toggleFavorite.mutate(id)}
            disabled={toggleFavorite.isPending}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={restaurant.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          >
            {restaurant.isFavorite ? (
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden lg:flex">
        {/* 가게 정보 */}
        <div className="h-full flex flex-col lg:w-[480px] lg:border-r lg:border-gray-200 bg-white">
          {/* 지도 - 고정 */}
          <div className="flex-shrink-0 h-40 lg:h-48">
            <NaverMap
              restaurants={[restaurant]}
              center={{ lat: restaurant.latitude, lng: restaurant.longitude }}
              className="w-full h-full"
            />
          </div>

          {/* 가게 정보 - 고정 */}
          <div className="flex-shrink-0 p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-sm rounded">
                {restaurant.category}
              </span>
              {restaurant.averageRating !== null && (
                <StarRating
                  value={restaurant.averageRating}
                  onChange={() => {}}
                  readonly
                  size="sm"
                />
              )}
            </div>
            <p className="text-sm text-gray-500">{restaurant.address}</p>
            <p className="text-sm text-gray-400 mt-1">
              총 {restaurant.visitCount}회 방문
            </p>
          </div>

          {/* 방문 기록 헤더 - 고정 */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-lg font-semibold">방문 기록</h2>
            {!isReadonly && (
              <Button size="sm" onClick={() => setIsAddVisitOpen(true)}>
                + 추가
              </Button>
            )}
          </div>

          {/* 방문 기록 목록 - 스크롤 */}
          <div className="flex-1 overflow-auto p-4">
            <VisitList
              visits={restaurant.visits}
              onEdit={isReadonly ? undefined : handleEditVisit}
              onDelete={isReadonly ? undefined : handleDeleteVisit}
              deletingId={deletingVisitId}
            />
          </div>
        </div>

        {/* 데스크톱: 지도 */}
        <div className="hidden lg:block lg:flex-1">
          <NaverMap
            restaurants={[restaurant]}
            center={{ lat: restaurant.latitude, lng: restaurant.longitude }}
            className="w-full h-full"
          />
        </div>
      </main>

      {/* 방문 추가 모달/바텀시트 */}
      {isDesktop ? (
        <Modal
          isOpen={isAddVisitOpen}
          onClose={() => setIsAddVisitOpen(false)}
          title="방문 기록 추가"
        >
          {AddVisitFormContent}
        </Modal>
      ) : (
        <BottomSheet
          isOpen={isAddVisitOpen}
          onClose={() => setIsAddVisitOpen(false)}
          title="방문 기록 추가"
        >
          {AddVisitFormContent}
        </BottomSheet>
      )}

      {/* 방문 수정 모달/바텀시트 */}
      {isDesktop ? (
        <Modal
          isOpen={!!editingVisit}
          onClose={() => setEditingVisit(null)}
          title="방문 기록 수정"
        >
          {editingVisit && (
            <AddVisitForm
              onSubmit={handleUpdateVisit}
              onCancel={() => setEditingVisit(null)}
              isLoading={updateVisit.isPending}
              initialData={editingVisit}
              mode="edit"
            />
          )}
        </Modal>
      ) : (
        <BottomSheet
          isOpen={!!editingVisit}
          onClose={() => setEditingVisit(null)}
          title="방문 기록 수정"
        >
          {editingVisit && (
            <AddVisitForm
              onSubmit={handleUpdateVisit}
              onCancel={() => setEditingVisit(null)}
              isLoading={updateVisit.isPending}
              initialData={editingVisit}
              mode="edit"
            />
          )}
        </BottomSheet>
      )}

      {/* 방문 기록 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={!!confirmDeleteVisitId}
        onClose={() => setConfirmDeleteVisitId(null)}
        onConfirm={confirmDeleteVisit}
        title="방문 기록 삭제"
        message="이 방문 기록을 삭제하시겠습니까?"
        confirmText="삭제"
        variant="danger"
      />

    </div>
  );
}
