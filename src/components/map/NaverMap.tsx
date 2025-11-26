"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useCallback, useImperativeHandle, forwardRef } from "react";
import type { Restaurant } from "@/db/schema";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    __naverMapsLoaded?: boolean;
    __goToRestaurant__?: (id: string) => void;
    __openNaverMapDirections__?: (lat: number, lng: number, name: string) => void;
    __shareRestaurant__?: (name: string, address: string) => void;
  }
}

export interface NaverMapHandle {
  panToRestaurant: (restaurant: Restaurant) => void;
}

interface NaverMapProps {
  restaurants: Restaurant[];
  onMarkerClick?: (restaurant: Restaurant) => void;
  center?: { lat: number; lng: number };
  className?: string;
  selectedRestaurantId?: string | null;
}

// 여민빌딩 (경기도 성남시 분당구 정자동)
const DEFAULT_CENTER = { lat: 37.3654466, lng: 127.1067284 };

// 카테고리별 마커 색상
const CATEGORY_COLORS: Record<string, string> = {
  한식: "#E74C3C",
  중식: "#F39C12",
  일식: "#3498DB",
  양식: "#9B59B6",
  분식: "#E91E63",
  기타: "#607D8B",
};

function getServerSnapshot(): boolean {
  return false;
}

function useNaverMapsLoaded() {
  const subscribe = useCallback((callback: () => void) => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID;
    if (!clientId) return () => {};

    if (window.naver && window.naver.maps) {
      window.__naverMapsLoaded = true;
      return () => {};
    }

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = () => {
      window.__naverMapsLoaded = true;
      callback();
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const getSnapshot = useCallback(() => {
    return !!(window.naver && window.naver.maps);
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// 커스텀 마커 아이콘 SVG 생성
function createMarkerIcon(color: string, isSelected: boolean = false): string {
  const size = isSelected ? 44 : 32;
  const height = isSelected ? 55 : 40;
  const strokeWidth = isSelected ? 3 : 2;
  const circleR = isSelected ? 8 : 6;
  const centerX = size / 2;
  const centerY = isSelected ? 20 : 15;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${height}" viewBox="0 0 ${size} ${height}">
      <path fill="${color}" stroke="#fff" stroke-width="${strokeWidth}" d="M${centerX} 1C${centerX - 7.732} 1 ${centerX - 14} 7.268 ${centerX - 14} 15c0 10.5 14 ${height - 17} 14 ${height - 17}s14-${height - 27.5} 14-${height - 17}c0-7.732-6.268-14-14-14z"/>
      <circle fill="#fff" cx="${centerX}" cy="${centerY}" r="${circleR}"/>
      ${isSelected ? `<animate attributeName="opacity" values="1;0.7;1" dur="1s" repeatCount="indefinite"/>` : ''}
    </svg>
  `)}`;
}

// 선택된 마커 아이콘 (더 큰 사이즈)
function createSelectedMarkerIcon(color: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="55" viewBox="0 0 44 55">
      <path fill="${color}" stroke="#fff" stroke-width="3" d="M22 1C12.611 1 5 8.611 5 18c0 13.5 17 35 17 35s17-21.5 17-35c0-9.389-7.611-17-17-17z"/>
      <circle fill="#fff" cx="22" cy="18" r="8"/>
    </svg>
  `)}`;
}

export const NaverMap = forwardRef<NaverMapHandle, NaverMapProps>(function NaverMap({
  restaurants,
  onMarkerClick,
  center,
  className,
  selectedRestaurantId,
}, ref) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<Map<string, naver.maps.Marker>>(new Map());
  const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null);
  const myLocationMarkerRef = useRef<naver.maps.Marker | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(selectedRestaurantId ?? null);
  const isLoaded = useNaverMapsLoaded();

  // 외부에서 selectedRestaurantId가 변경되면 반영 (controlled component 패턴)
  const effectiveSelectedId = selectedRestaurantId !== undefined ? selectedRestaurantId : selectedId;

  // 부드러운 이동 함수
  const panTo = useCallback((lat: number, lng: number, zoom?: number) => {
    if (!mapInstanceRef.current) return;
    const targetPosition = new window.naver.maps.LatLng(lat, lng);
    mapInstanceRef.current.panTo(targetPosition, { duration: 300, easing: 'easeOutCubic' });
    if (zoom) {
      setTimeout(() => {
        mapInstanceRef.current?.setZoom(zoom, true);
      }, 300);
    }
  }, []);

  // ref로 외부에서 호출 가능한 메서드 노출
  useImperativeHandle(ref, () => ({
    panToRestaurant: (restaurant: Restaurant) => {
      panTo(restaurant.latitude, restaurant.longitude, 17);
      setSelectedId(restaurant.id);

      // 해당 마커의 InfoWindow 열기 (약간의 딜레이 후)
      setTimeout(() => {
        const marker = markersRef.current.get(restaurant.id);
        if (marker && mapInstanceRef.current) {
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }

          const infoWindow = new window.naver.maps.InfoWindow({
            content: `
              <div style="padding: 16px; min-width: 220px; font-family: sans-serif; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600;">${restaurant.name}</h3>
                <p style="margin: 0 0 4px; font-size: 13px; color: #6B7280;">
                  <span style="display: inline-block; padding: 2px 8px; background: #E0F2FE; color: #0369A1; border-radius: 4px; font-size: 12px;">${restaurant.category}</span>
                </p>
                <p style="margin: 8px 0 12px; font-size: 12px; color: #9CA3AF;">${restaurant.address}</p>

                <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                  <button
                    onclick="window.__openNaverMapDirections__(${restaurant.latitude}, ${restaurant.longitude}, '${restaurant.name.replace(/'/g, "\\'")}')"
                    style="flex: 1; padding: 8px; background: #10B981; color: white; border: none; border-radius: 8px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                    </svg>
                    길찾기
                  </button>
                  <button
                    onclick="window.__shareRestaurant__('${restaurant.name.replace(/'/g, "\\'")}', '${restaurant.address.replace(/'/g, "\\'")}')"
                    style="flex: 1; padding: 8px; background: #6B7280; color: white; border: none; border-radius: 8px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98M21 5a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0zM21 19a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    공유
                  </button>
                </div>

                <button
                  onclick="window.__goToRestaurant__('${restaurant.id}')"
                  style="width: 100%; padding: 10px 16px; background: #0EA5E9; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
                >
                  상세보기
                </button>
              </div>
            `,
            borderWidth: 0,
            backgroundColor: "transparent",
            disableAnchor: true,
            pixelOffset: new window.naver.maps.Point(0, -10),
          });

          infoWindow.open(mapInstanceRef.current, marker);
          infoWindowRef.current = infoWindow;
        }
      }, 350);
    },
  }), [panTo]);

  const mapCenter = center || DEFAULT_CENTER;
  const initialCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  // 지도 초기화 (한 번만)
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const mapOptions = {
      center: new window.naver.maps.LatLng(mapCenter.lat, mapCenter.lng),
      zoom: 15,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
      },
    };

    mapInstanceRef.current = new window.naver.maps.Map(mapRef.current, mapOptions);
    initialCenterRef.current = mapCenter;

    // 지도 클릭 시 InfoWindow 닫기
    window.naver.maps.Event.addListener(mapInstanceRef.current, "click", () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        setSelectedId(null);
      }
    });
  }, [isLoaded, mapCenter]);

  // 내 위치(여민빌딩) 마커 표시
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    // 기존 내 위치 마커 제거
    if (myLocationMarkerRef.current) {
      myLocationMarkerRef.current.setMap(null);
    }

    // 내 위치 마커 생성 (파란색 원형)
    const myLocationIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#0EA5E9" stroke="#fff" stroke-width="3"/>
        <circle cx="12" cy="12" r="4" fill="#fff"/>
      </svg>
    `)}`;

    myLocationMarkerRef.current = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
      map: mapInstanceRef.current,
      icon: {
        url: myLocationIcon,
        size: new window.naver.maps.Size(24, 24),
        anchor: new window.naver.maps.Point(12, 12),
      },
      zIndex: 50,
    });
  }, [isLoaded]);

  // center 변경 시 지도 이동
  useEffect(() => {
    if (!mapInstanceRef.current || !initialCenterRef.current) return;
    if (mapCenter.lat === initialCenterRef.current.lat && mapCenter.lng === initialCenterRef.current.lng) return;

    mapInstanceRef.current.setCenter(new window.naver.maps.LatLng(mapCenter.lat, mapCenter.lng));
  }, [mapCenter]);

  // 마커 아이콘 업데이트 (선택 상태 변경 시)
  const updateMarkerIcon = useCallback((restaurantId: string, isSelected: boolean) => {
    const marker = markersRef.current.get(restaurantId);
    if (!marker) return;

    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (!restaurant) return;

    const color = CATEGORY_COLORS[restaurant.category] || CATEGORY_COLORS["기타"];

    if (isSelected) {
      marker.setIcon({
        url: createSelectedMarkerIcon(color),
        size: new window.naver.maps.Size(44, 55),
        anchor: new window.naver.maps.Point(22, 55),
      });
      marker.setZIndex(200);
    } else {
      marker.setIcon({
        url: createMarkerIcon(color),
        size: new window.naver.maps.Size(32, 40),
        anchor: new window.naver.maps.Point(16, 40),
      });
      marker.setZIndex(100);
    }
  }, [restaurants]);

  // 선택 상태 변경 시 마커 업데이트
  useEffect(() => {
    if (!isLoaded) return;

    // 모든 마커를 기본 상태로
    markersRef.current.forEach((marker, id) => {
      updateMarkerIcon(id, false);
    });

    // 선택된 마커 강조
    if (effectiveSelectedId) {
      updateMarkerIcon(effectiveSelectedId, true);
    }
  }, [effectiveSelectedId, isLoaded, updateMarkerIcon]);

  // 가게 마커 그리기
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    // 기존 마커 정리
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();

    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    restaurants.forEach((restaurant) => {
      const color = CATEGORY_COLORS[restaurant.category] || CATEGORY_COLORS["기타"];

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(
          restaurant.latitude,
          restaurant.longitude
        ),
        map: mapInstanceRef.current!,
        title: restaurant.name,
        icon: {
          url: createMarkerIcon(color),
          size: new window.naver.maps.Size(32, 40),
          anchor: new window.naver.maps.Point(16, 40),
        },
        zIndex: 100,
      });

      window.naver.maps.Event.addListener(marker, "click", () => {
        // 부드럽게 이동
        panTo(restaurant.latitude, restaurant.longitude);
        setSelectedId(restaurant.id);

        // InfoWindow 열기
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }

        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
            <div style="padding: 16px; min-width: 220px; font-family: sans-serif; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
              <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600;">${restaurant.name}</h3>
              <p style="margin: 0 0 4px; font-size: 13px; color: #6B7280;">
                <span style="display: inline-block; padding: 2px 8px; background: #E0F2FE; color: #0369A1; border-radius: 4px; font-size: 12px;">${restaurant.category}</span>
              </p>
              <p style="margin: 8px 0 12px; font-size: 12px; color: #9CA3AF;">${restaurant.address}</p>

              <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <button
                  onclick="window.__openNaverMapDirections__(${restaurant.latitude}, ${restaurant.longitude}, '${restaurant.name.replace(/'/g, "\\'")}')"
                  style="flex: 1; padding: 8px; background: #10B981; color: white; border: none; border-radius: 8px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                  </svg>
                  길찾기
                </button>
                <button
                  onclick="window.__shareRestaurant__('${restaurant.name.replace(/'/g, "\\'")}', '${restaurant.address.replace(/'/g, "\\'")}')"
                  style="flex: 1; padding: 8px; background: #6B7280; color: white; border: none; border-radius: 8px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98M21 5a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0zM21 19a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  공유
                </button>
              </div>

              <button
                onclick="window.__goToRestaurant__('${restaurant.id}')"
                style="width: 100%; padding: 10px 16px; background: #0EA5E9; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
              >
                상세보기
              </button>
            </div>
          `,
          borderWidth: 0,
          backgroundColor: "transparent",
          disableAnchor: true,
          pixelOffset: new window.naver.maps.Point(0, -10),
        });

        infoWindow.open(mapInstanceRef.current!, marker);
        infoWindowRef.current = infoWindow;

        if (onMarkerClick) {
          onMarkerClick(restaurant);
        }
      });

      markersRef.current.set(restaurant.id, marker);
    });

    // 가게가 있으면 bounds 조정
    if (restaurants.length > 0 && mapInstanceRef.current && !center) {
      const allPoints = restaurants.map((r) => ({ lat: r.latitude, lng: r.longitude }));

      if (allPoints.length > 1) {
        const bounds = new window.naver.maps.LatLngBounds(
          new window.naver.maps.LatLng(
            Math.min(...allPoints.map((p) => p.lat)),
            Math.min(...allPoints.map((p) => p.lng))
          ),
          new window.naver.maps.LatLng(
            Math.max(...allPoints.map((p) => p.lat)),
            Math.max(...allPoints.map((p) => p.lng))
          )
        );
        mapInstanceRef.current.fitBounds(bounds, {
          top: 80,
          right: 50,
          bottom: 50,
          left: 50,
        });
      }
    }
  }, [isLoaded, restaurants, onMarkerClick, center, panTo]);

  // 전역 함수들 등록
  useEffect(() => {
    // 상세보기
    window.__goToRestaurant__ = (id: string) => {
      router.push(`/restaurant/${id}`);
    };

    // 네이버 지도 길찾기
    window.__openNaverMapDirections__ = (lat: number, lng: number, name: string) => {
      const url = `nmap://route/walk?dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(name)}&appname=lunch`;
      const webUrl = `https://map.naver.com/v5/directions/-/-/-/walk?c=${lng},${lat},15,0,0,0,dh`;

      // 모바일에서는 앱 열기 시도, 실패하면 웹으로
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = url;
        setTimeout(() => {
          window.open(webUrl, '_blank');
        }, 1500);
      } else {
        window.open(webUrl, '_blank');
      }
    };

    // 공유하기
    window.__shareRestaurant__ = async (name: string, address: string) => {
      const shareData = {
        title: name,
        text: `${name}\n${address}`,
        url: window.location.href,
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch {
          // 사용자가 취소한 경우
        }
      } else {
        // Web Share API 미지원 시 클립보드 복사
        await navigator.clipboard.writeText(`${name}\n${address}`);
        alert('주소가 클립보드에 복사되었습니다.');
      }
    };

    return () => {
      delete window.__goToRestaurant__;
      delete window.__openNaverMapDirections__;
      delete window.__shareRestaurant__;
    };
  }, [router]);

  if (!process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-500 ${className}`}
      >
        네이버 지도 API 키를 설정해주세요
      </div>
    );
  }

  // 내 위치(여민빌딩)로 이동
  const handleMyLocationClick = () => {
    panTo(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, 16);
  };

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full">
        {!isLoaded && (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
          </div>
        )}
      </div>

      {/* 현재 위치 버튼 */}
      {isLoaded && (
        <button
          onClick={handleMyLocationClick}
          className="absolute bottom-24 lg:bottom-6 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
          aria-label="현재 위치로 이동"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}
    </div>
  );
});
