'use client';

import { useState, useEffect } from 'react';
import SignalCompass from '@/components/SignalCompass';
import HeatmapView from '@/components/HeatmapView';
import { MapPin, Compass, Map as MapIcon, RefreshCw, AlertCircle } from 'lucide-react';

interface NavigationData {
    bearing_degrees: number;
    distance_meters: number;
    confidence_score: number;
    target_signal_dbm?: number;
    current_signal_dbm?: number;
}

export default function NavigatePage() {
    const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [heading, setHeading] = useState(0);
    const [navigationData, setNavigationData] = useState<NavigationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'compass' | 'map'>('compass');

    // Request geolocation permission
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                (error) => {
                    setError('Location access denied. Please enable location services.');
                }
            );
        }
    }, []);

    // Watch device orientation (compass)
    useEffect(() => {
        if (window.DeviceOrientationEvent) {
            const handleOrientation = (event: DeviceOrientationEvent) => {
                if (event.alpha !== null) {
                    setHeading(360 - event.alpha);
                }
            };

            window.addEventListener('deviceorientation', handleOrientation);
            return () => window.removeEventListener('deviceorientation', handleOrientation);
        }
    }, []);

    // Fetch navigation vector
    const fetchNavigation = async () => {
        if (!location) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/navigate/vector?lat=${location.lat}&lon=${location.lon}&radius_meters=500`
            );

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('No signal data available in this area. This might be a cold start zone.');
                }
                throw new Error('Failed to fetch navigation data');
            }

            const data = await response.json();
            setNavigationData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch on location change
    useEffect(() => {
        if (location) {
            fetchNavigation();
        }
    }, [location]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 glass-dark">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Compass className="text-primary-500" size={28} />
                        <span className="text-xl font-bold text-white">SignalTrail Navigator</span>
                    </div>

                    {/* View Toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('compass')}
                            className={`px-4 py-2 rounded-lg transition ${viewMode === 'compass'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                        >
                            <Compass size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`px-4 py-2 rounded-lg transition ${viewMode === 'map'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                        >
                            <MapIcon size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="pt-24 pb-12 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Error State */}
                    {error && (
                        <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
                            <AlertCircle className="text-red-500 mt-0.5" size={20} />
                            <div>
                                <div className="font-semibold text-red-200">Error</div>
                                <div className="text-sm text-red-300">{error}</div>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="mb-8 text-center">
                            <RefreshCw className="animate-spin mx-auto mb-2 text-primary-500" size={32} />
                            <p className="text-gray-400">Finding best signal direction...</p>
                        </div>
                    )}

                    {/* GPS Info */}
                    {location && (
                        <div className="mb-6 glass-dark p-4 rounded-lg flex items-center gap-3">
                            <MapPin className="text-primary-500" size={20} />
                            <div className="text-sm text-gray-300">
                                <span className="font-semibold">Your Location:</span>{' '}
                                {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
                            </div>
                            <button
                                onClick={fetchNavigation}
                                className="ml-auto px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition flex items-center gap-2"
                            >
                                <RefreshCw size={16} />
                                Refresh
                            </button>
                        </div>
                    )}

                    {/* Main Content */}
                    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
                        {viewMode === 'compass' && navigationData && (
                            <SignalCompass
                                targetBearing={navigationData.bearing_degrees}
                                distance={navigationData.distance_meters}
                                confidence={navigationData.confidence_score}
                                userHeading={heading}
                                targetSignal={navigationData.target_signal_dbm}
                                currentSignal={navigationData.current_signal_dbm}
                            />
                        )}

                        {viewMode === 'map' && location && (
                            <div className="h-[600px]">
                                <HeatmapView
                                    latitude={location.lat}
                                    longitude={location.lon}
                                    zoom={15}
                                />
                            </div>
                        )}

                        {!navigationData && !loading && !error && (
                            <div className="text-center py-12">
                                <Compass className="mx-auto mb-4 text-gray-600" size={64} />
                                <p className="text-xl text-gray-400">
                                    Waiting for location data...
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Instructions */}
                    <div className="mt-8 glass-dark p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-white mb-4">How to Use</h3>
                        <ul className="space-y-2 text-gray-300 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-primary-500">•</span>
                                <span>The compass points toward better signal zones based on crowd-sourced data</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-500">•</span>
                                <span>Walk in the direction shown to improve your connectivity</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-500">•</span>
                                <span>Higher confidence scores mean more reliable data</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-500">•</span>
                                <span>Switch to map view to see heatmap of signal coverage</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
