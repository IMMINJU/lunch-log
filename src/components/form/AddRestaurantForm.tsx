"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui";
import { SearchInput } from "./SearchInput";
import { StarRating } from "./StarRating";
import { DatePicker } from "./DatePicker";
import { InlineTextField } from "./InlineTextField";
import { PriceDropdown } from "./PriceDropdown";
import { CategoryDropdown } from "./CategoryDropdown";
import { ImagePreview } from "./ImagePreview";
import type { Category, PriceRange } from "@/types";
import { format } from "date-fns";

interface PlaceInfo {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface AddRestaurantFormData {
  place: PlaceInfo | null;
  category: Category | null;
  menu: string;
  rating: number | null;
  price: PriceRange | null;
  comment: string;
  image: File | null;
  visitedAt: string;
}

interface AddRestaurantFormProps {
  onSubmit: (data: AddRestaurantFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AddRestaurantForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: AddRestaurantFormProps) {
  const [isEditingPlace, setIsEditingPlace] = useState(false);

  const { control, handleSubmit, watch } = useForm<AddRestaurantFormData>({
    defaultValues: {
      place: null,
      category: null,
      menu: "",
      rating: null,
      price: null,
      comment: "",
      image: null,
      visitedAt: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const watchedValues = watch();
  const { place, category, menu } = watchedValues;

  const isFormValid = place && category && menu;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 프리뷰 카드 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* 이미지 영역 */}
        <Controller
          name="image"
          control={control}
          render={({ field }) => (
            <ImagePreview
              image={field.value}
              onChange={field.onChange}
              height="sm"
            />
          )}
        />

        {/* 콘텐츠 영역 */}
        <div className="p-4 space-y-2">
          {/* 가게명 + 카테고리 */}
          <div className="flex items-center gap-2">
            <div
              onClick={() => !place && setIsEditingPlace(true)}
              className={`flex-1 min-w-0 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors ${
                isEditingPlace
                  ? "bg-sky-50 ring-2 ring-sky-500"
                  : !place
                  ? "hover:bg-gray-50 cursor-pointer"
                  : ""
              }`}
            >
              {isEditingPlace ? (
                <Controller
                  name="place"
                  control={control}
                  rules={{ required: "가게를 선택해주세요" }}
                  render={({ field }) => (
                    <SearchInput
                      onSelect={(selectedPlace) => {
                        field.onChange(selectedPlace);
                        setIsEditingPlace(false);
                      }}
                      placeholder="가게 이름 검색"
                      variant="inline"
                      autoFocus
                    />
                  )}
                />
              ) : place ? (
                <span className="font-medium text-[15px] text-gray-900">{place.name}</span>
              ) : (
                <span className="text-gray-400 text-[15px]">가게 검색 *</span>
              )}
            </div>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <CategoryDropdown value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          {/* 별점 */}
          <div className="px-2 py-1 -mx-2">
            <Controller
              name="rating"
              control={control}
              render={({ field }) => (
                <StarRating value={field.value} onChange={field.onChange} size="sm" />
              )}
            />
          </div>

          {/* 메뉴 + 가격대 */}
          <div className="flex items-center gap-2">
            <Controller
              name="menu"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <InlineTextField
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="메뉴 입력"
                  required
                  className="flex-1 min-w-0 -mx-2"
                  inputClassName="text-[13px] text-gray-600"
                  displayClassName="text-[13px] text-gray-600"
                />
              )}
            />
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <PriceDropdown value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          {/* 한줄평 */}
          <Controller
            name="comment"
            control={control}
            render={({ field }) => (
              <InlineTextField
                value={field.value}
                onChange={field.onChange}
                placeholder="한줄평 입력"
                emptyText="한줄평 추가"
                className="-mx-2"
                inputClassName="text-[13px] text-gray-500"
                displayClassName="text-[13px] text-gray-500 truncate"
                maxLength={60}
              />
            )}
          />

          {/* 주소 + 방문일 */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[12px] text-gray-400 truncate flex-1">
              {place?.address || "주소"}
            </span>
            <Controller
              name="visitedAt"
              control={control}
              render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          취소
        </Button>
        <Button type="submit" disabled={isLoading || !isFormValid} className="flex-1">
          {isLoading ? "등록 중..." : "등록하기"}
        </Button>
      </div>
    </form>
  );
}
