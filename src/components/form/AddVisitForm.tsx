"use client";

import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui";
import { StarRating } from "./StarRating";
import { DatePicker } from "./DatePicker";
import { InlineTextField } from "./InlineTextField";
import { PriceDropdown } from "./PriceDropdown";
import { ImagePreview } from "./ImagePreview";
import type { PriceRange, VisitWithoutImage } from "@/types";
import { format } from "date-fns";

export interface AddVisitFormData {
  menu: string;
  rating: number | null;
  price: PriceRange | null;
  comment: string;
  image: File | null;
  visitedAt: string;
}

export interface EditVisitFormData extends AddVisitFormData {
  keepExistingImage: boolean;
}

interface AddVisitFormPropsBase {
  onCancel: () => void;
  isLoading?: boolean;
}

interface AddModeProps extends AddVisitFormPropsBase {
  mode?: "add";
  onSubmit: (data: AddVisitFormData) => Promise<void>;
  initialData?: never;
}

interface EditModeProps extends AddVisitFormPropsBase {
  mode: "edit";
  onSubmit: (data: EditVisitFormData) => Promise<void>;
  initialData: VisitWithoutImage;
}

type AddVisitFormProps = AddModeProps | EditModeProps;

export function AddVisitForm(props: AddVisitFormProps) {
  const { onCancel, isLoading = false } = props;
  const mode = props.mode ?? "add";
  const initialData = props.mode === "edit" ? props.initialData : undefined;
  const onSubmit = props.onSubmit as (data: EditVisitFormData) => Promise<void>;

  const { control, handleSubmit, watch, setValue } = useForm<EditVisitFormData>({
    defaultValues: {
      menu: initialData?.menu || "",
      rating: initialData?.rating ? parseFloat(initialData.rating) : null,
      price: (initialData?.price as PriceRange) || null,
      comment: initialData?.comment || "",
      image: null,
      visitedAt: initialData?.visitedAt || format(new Date(), "yyyy-MM-dd"),
      keepExistingImage: initialData?.hasImage || false,
    },
  });

  const watchedValues = watch();
  const { menu, keepExistingImage } = watchedValues;

  const existingImageUrl = initialData?.id ? `/api/visit/${initialData.id}/image` : undefined;

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
              existingImageUrl={existingImageUrl}
              hasExistingImage={mode === "edit" && initialData?.hasImage && keepExistingImage}
              onChange={field.onChange}
              onRemoveExisting={() => setValue("keepExistingImage", false)}
              height="md"
            />
          )}
        />

        {/* 콘텐츠 영역 */}
        <div className="p-4 space-y-3">
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
                  className="flex-1 min-w-0 -mx-2 -my-1"
                  inputClassName="font-semibold text-gray-900 placeholder:font-normal"
                  displayClassName="font-semibold text-gray-900"
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
                inputClassName="text-sm text-gray-600"
                displayClassName="text-sm text-gray-600"
                maxLength={60}
              />
            )}
          />

          {/* 방문일 */}
          <Controller
            name="visitedAt"
            control={control}
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          취소
        </Button>
        <Button type="submit" disabled={isLoading || !menu} className="flex-1">
          {isLoading
            ? mode === "edit"
              ? "수정 중..."
              : "등록 중..."
            : mode === "edit"
            ? "수정하기"
            : "등록하기"}
        </Button>
      </div>
    </form>
  );
}
