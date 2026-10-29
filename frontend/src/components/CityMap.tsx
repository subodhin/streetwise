import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";

maplibregl.setWorkerUrl(workerUrl);

type Report = {
  id: string;
  text: string;
  lat: number;
  lng: number;
  type: string;
  priority: number;
  status: string;
};

type CityMapProps = {
  reports: Report[];
  selectedReport: Report | null;
  onLocationSelect?: (lat: number, lng: number) => void;
};

function CityMap({
  reports,
  selectedReport,
  onLocationSelect,
}: CityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Initialize the map.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/dark",
      center: [79.874, 6.905],
      zoom: 12.2,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);
    // Allow citizens to select a report location.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onLocationSelect) return;

    const handleMapClick = (event: maplibregl.MapMouseEvent) => {
      onLocationSelect(event.lngLat.lat, event.lngLat.lng);
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [onLocationSelect]);

  // Render report markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let cancelled = false;

    const updateMarkers = () => {
      if (cancelled) return;

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      reports.forEach((report) => {
        if (
          !Number.isFinite(report.lat) ||
          !Number.isFinite(report.lng) ||
          report.lat < -90 ||
          report.lat > 90 ||
          report.lng < -180 ||
          report.lng > 180
        ) {
          return;
        }

        const markerElement = document.createElement("button");
        markerElement.className = `map-marker priority-marker-${Math.min(
          5,
          Math.max(1, report.priority),
        )}`;
        markerElement.type = "button";
        markerElement.setAttribute("aria-label", report.text);
        markerElement.title = `${report.type.replaceAll("_", " ")} · P${report.priority}`;

        const popup = new maplibregl.Popup({ offset: 18 }).setHTML(
          `<strong>${escapeHtml(report.text)}</strong>
           <p>${escapeHtml(report.type.replaceAll("_", " "))} · P${report.priority}</p>
           <small>${escapeHtml(report.status.replaceAll("_", " "))}</small>`,
        );

        const marker = new maplibregl.Marker({ element: markerElement })
          .setLngLat([report.lng, report.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });
    };

    if (map.isStyleLoaded()) {
      updateMarkers();
    } else {
      map.once("load", updateMarkers);
    }

    return () => {
      cancelled = true;
      map.off("load", updateMarkers);
    };
  }, [reports]);

  // Fly to the selected report.
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !selectedReport) return;

    if (
      !Number.isFinite(selectedReport.lat) ||
      !Number.isFinite(selectedReport.lng) ||
      selectedReport.lat < -90 ||
      selectedReport.lat > 90 ||
      selectedReport.lng < -180 ||
      selectedReport.lng > 180
    ) {
      return;
    }

    map.flyTo({
      center: [selectedReport.lng, selectedReport.lat],
      zoom: 15,
      duration: 1000,
    });

    const selectedMarker = markersRef.current.find(
      (marker) =>
        marker.getLngLat().lng === selectedReport.lng &&
        marker.getLngLat().lat === selectedReport.lat,
    );

    selectedMarker?.togglePopup();
  }, [selectedReport]);

  return <div ref={containerRef} className="city-map" />;
}


function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[character];
  });
}

export default CityMap;
