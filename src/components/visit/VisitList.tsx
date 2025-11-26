"use client";

import { VisitCard } from "./VisitCard";
import { useUserStore } from "@/stores/useUserStore";
import type { VisitWithoutImage } from "@/types";

interface VisitListProps {
  visits: VisitWithoutImage[];
  onEdit?: (visit: VisitWithoutImage) => void;
  onDelete?: (id: string) => void;
  deletingId?: string | null;
}

export function VisitList({ visits, onEdit, onDelete, deletingId }: VisitListProps) {
  const currentUserId = useUserStore((s) => s.userId);

  if (visits.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">방문 기록이 없습니다</p>
    );
  }

  return (
    <div className="space-y-3">
      {visits.map((visit) => {
        const isOwner = visit.userId === currentUserId;
        return (
          <VisitCard
            key={visit.id}
            visit={visit}
            onEdit={onEdit && isOwner ? () => onEdit(visit) : undefined}
            onDelete={onDelete && isOwner ? () => onDelete(visit.id) : undefined}
            isDeleting={deletingId === visit.id}
          />
        );
      })}
    </div>
  );
}
