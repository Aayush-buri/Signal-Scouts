import Link from 'next/link';
import { ArrowRight, Wifi, MapPin, TrendingUp } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Wifi className="text-primary-500" size={32} />
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
                            SignalTrail
                        </span>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/navigate" className="text-gray-700 dark:text-gray-300 hover:text-primary-500 transition">
                            Navigate
                        </Link>
                        <Link href="/admin" className="text-gray-700 dark:text-gray-300 hover:text-primary-500 transition">
                            Admin
                        </Link>
                        <Link href="/expenses" className="text-gray-700 dark:text-gray-300 hover:text-primary-500 transition">
                            Expenses
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 bg-clip-text text-transparent animate-pulse-slow">
                        Navigate to Better Signal
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
                        Stop guessing. Start navigating. SignalTrail shows you exactly where to go for stronger connectivity.
                    </p>
                    <Link href="/navigate" className="btn-gradient inline-flex items-center gap-2 text-lg">
                        Start Navigating
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-6 bg-white/50 dark:bg-gray-800/50">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="card-hover p-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mb-6">
                                <MapPin className="text-white" size={32} />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Real-Time Navigation</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Get compass-based directions pointing you toward areas with stronger signal strength.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="card-hover p-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-signal-good to-signal-excellent rounded-2xl flex items-center justify-center mb-6">
                                <TrendingUp className="text-white" size={32} />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Crowd-Sourced Data</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Powered by real signal readings from mobile devices. More data = better accuracy.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="card-hover p-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mb-6">
                                <Wifi className="text-white" size={32} />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Privacy First</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                All data is anonymized. No personal information or location history is stored.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Find Better Signal?</h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">
                        Join thousands of users already navigating to stronger connectivity.
                    </p>
                    <Link href="/navigate" className="btn-gradient inline-flex items-center gap-2 text-lg">
                        Get Started Now
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto text-center text-gray-600 dark:text-gray-400">
                    <p>&copy; 2026 SignalTrail. Built with Next.js and FastAPI.</p>
                </div>
            </footer>
        </div>
    );
}
