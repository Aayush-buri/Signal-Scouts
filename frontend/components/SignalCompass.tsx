'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Navigation2, AlertTriangle } from 'lucide-react';

interface SignalCompassProps {
    targetBearing: number;
    distance: number;
    confidence: number;
    userHeading?: number;
    targetSignal?: number;
    currentSignal?: number;
}

export default function SignalCompass({
    targetBearing,
    distance,
    confidence,
    userHeading = 0,
    targetSignal,
    currentSignal
}: SignalCompassProps) {
    const [compassRotation, setCompassRotation] = useState(0);

    useEffect(() => {
        // Calculate relative bearing (target bearing - user heading)
        const relativeBearing = (targetBearing - userHeading + 360) % 360;
        setCompassRotation(relativeBearing);
    }, [targetBearing, userHeading]);

    // Get signal quality color
    const getSignalColor = (dbm?: number) => {
        if (!dbm) return 'text-gray-400';
        if (dbm >= -60) return 'text-signal-excellent';
        if (dbm >= -70) return 'text-signal-good';
        if (dbm >= -80) return 'text-signal-fair';
        return 'text-signal-poor';
    };

    // Get confidence color
    const getConfidenceColor = (conf: number) => {
        if (conf >= 0.7) return 'bg-signal-excellent';
        if (conf >= 0.5) return 'bg-signal-good';
        if (conf >= 0.3) return 'bg-signal-fair';
        return 'bg-signal-poor';
    };

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Main Compass */}
            <div className="relative w-80 h-80">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-900/50 bg-gradient-radial from-white to-primary-50 dark:from-gray-800 dark:to-gray-900 shadow-2xl" />

                {/* Cardinal directions */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full">
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-bold text-primary-600">N</div>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-bold text-gray-400">S</div>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">W</div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">E</div>
                    </div>
                </div>

                {/* Animated arrow */}
                <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ rotate: compassRotation }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                >
                    <div className="relative">
                        <Navigation2
                            size={80}
                            className="text-primary-500 drop-shadow-2xl filter"
                            fill="currentColor"
                        />
                        {/* Pulse effect */}
                        <motion.div
                            className="absolute inset-0 rounded-full bg-primary-500/20"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                </motion.div>

                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary-600 shadow-lg" />
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                {/* Distance */}
                <div className="glass-dark p-4 rounded-xl">
                    <div className="text-xs text-gray-400 mb-1">Distance</div>
                    <div className="text-2xl font-bold text-white">
                        {distance < 1000
                            ? `${Math.round(distance)}m`
                            : `${(distance / 1000).toFixed(1)}km`
                        }
                    </div>
                </div>

                {/* Bearing */}
                <div className="glass-dark p-4 rounded-xl">
                    <div className="text-xs text-gray-400 mb-1">Bearing</div>
                    <div className="text-2xl font-bold text-white">
                        {Math.round(targetBearing)}°
                    </div>
                </div>

                {/* Current Signal */}
                {currentSignal && (
                    <div className="glass-dark p-4 rounded-xl">
                        <div className="text-xs text-gray-400 mb-1">Current</div>
                        <div className={`text-2xl font-bold ${getSignalColor(currentSignal)}`}>
                            {currentSignal} dBm
                        </div>
                    </div>
                )}

                {/* Target Signal */}
                {targetSignal && (
                    <div className="glass-dark p-4 rounded-xl">
                        <div className="text-xs text-gray-400 mb-1">Target</div>
                        <div className={`text-2xl font-bold ${getSignalColor(targetSignal)}`}>
                            {targetSignal} dBm
                        </div>
                    </div>
                )}
            </div>

            {/* Confidence Badge */}
            <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">Data Confidence</div>
                <div className="flex items-center gap-2">
                    <div className="w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full ${getConfidenceColor(confidence)}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${confidence * 100}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                    <span className="text-sm font-semibold">{Math.round(confidence * 100)}%</span>
                </div>
            </div>

            {/* Low confidence warning */}
            {confidence < 0.3 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-lg">
                    <AlertTriangle size={20} className="text-amber-500" />
                    <span className="text-sm text-amber-700 dark:text-amber-300">
                        Low data confidence. Results may be inaccurate.
                    </span>
                </div>
            )}
        </div>
    );
}
