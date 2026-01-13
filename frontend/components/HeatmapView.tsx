'use client';

import { useEffect, useRef, useState } from 'react';
import Map, { Layer, Source } from 'react-map-gl/maplibre';
import type { HeatmapLayer } from 'react-map-gl/maplibre';

interface HeatmapViewProps {
    latitude: number;
    longitude: number;
    zoom?: number;
    heatmapData?: any;
}

export default function HeatmapView({
    latitude,
    longitude,
    zoom = 15,
    heatmapData
}: HeatmapViewProps) {
    const mapRef = useRef(null);
    const [viewState, setViewState] = useState({
        latitude,
        longitude,
        zoom
    });

    // Heatmap layer configuration
    const heatmapLayer: HeatmapLayer = {
        id: 'signal-heatmap',
        type: 'heatmap',
        paint: {
            // Increase weight as signal strength increases
            'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['get', 'signal_dbm'],
                -100, 0,
                -40, 1
            ],
            // Increase intensity as zoom level increases
            'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 1,
                15, 3
            ],
            // Color ramp for heatmap
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(239, 68, 68, 0)',      // Transparent
                0.2, 'rgba(239, 68, 68, 0.5)',  // Poor signal - Red
                0.4, 'rgba(245, 158, 11, 0.6)', // Fair signal - Amber
                0.6, 'rgba(132, 204, 22, 0.7)', // Good signal - Lime
                0.8, 'rgba(16, 185, 129, 0.8)', // Excellent signal - Green
            ],
            // Adjust radius
            'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 2,
                15, 20
            ],
            // Transition from heatmap to circle layer by zoom level
            'heatmap-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                14, 1,
                16, 0
            ]
        }
    };

    return (
        <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl">
            <Map
                ref={mapRef}
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                style={{ width: '100%', height: '100%' }}
            >
                {heatmapData && (
                    <Source
                        id="signal-data"
                        type="geojson"
                        data={heatmapData}
                    >
                        <Layer {...heatmapLayer} />
                    </Source>
                )}

                {/* User location marker */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary-500 rounded-full border-2 border-white shadow-lg"
                    style={{ zIndex: 10 }}
                />
            </Map>

            {/* Legend */}
            <div className="absolute bottom-6 left-6 glass-dark p-4 rounded-lg">
                <div className="text-xs font-semibold text-white mb-2">Signal Strength</div>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-signal-excellent" />
                        <span className="text-xs text-gray-300">Excellent (-40 to -60 dBm)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-signal-good" />
                        <span className="text-xs text-gray-300">Good (-60 to -70 dBm)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-signal-fair" />
                        <span className="text-xs text-gray-300">Fair (-70 to -80 dBm)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-signal-poor" />
                        <span className="text-xs text-gray-300">Poor (-80 to -100 dBm)</span>
                    </div>
                </div>
            </div>

            {/* Zoom controls */}
            <div className="absolute top-6 right-6 flex flex-col gap-2">
                <button
                    onClick={() => setViewState(prev => ({ ...prev, zoom: prev.zoom + 1 }))}
                    className="w-10 h-10 glass-dark rounded-lg flex items-center justify-center text-white font-bold hover:bg-white/20 transition"
                >
                    +
                </button>
                <button
                    onClick={() => setViewState(prev => ({ ...prev, zoom: prev.zoom - 1 }))}
                    className="w-10 h-10 glass-dark rounded-lg flex items-center justify-center text-white font-bold hover:bg-white/20 transition"
                >
                    −
                </button>
            </div>
        </div>
    );
}
