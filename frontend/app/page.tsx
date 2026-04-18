'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowRight,
  Leaf,
  MapPin,
  Users,
  TrendingUp,
  Shield,
  Clock,
  Package,
  Heart,
  CheckCircle,
} from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()

  const getDashboardPath = () => {
    if (!user) return '/signin'
    if (user.role === 'ADMIN') return '/admin'
    if (user.role === 'NGO') return '/ngo'
    return '/donor'
  }

  const dashboardPath = getDashboardPath()
  const isAuthenticated = user && !loading

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900 dark:text-white">FoodFlow</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#impact" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                Impact
              </Link>
              <Link href="#network" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                Network
              </Link>
              <Link href="#about" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                About
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Button asChild size="sm" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100">
                  <Link href={dashboardPath}>Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild size="sm">
                    <Link href="/signin">Sign In</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                  <span className="text-slate-900 dark:text-white">Redistribute</span>
                  <br />
                  <span className="text-slate-900 dark:text-white">Surplus Food.</span>
                  <br />
                  <span className="text-slate-900 dark:text-white">Reduce Waste.</span>
                  <br />
                  <span className="text-slate-900 dark:text-white">Feed</span>
                  <br />
                  <span className="text-slate-900 dark:text-white">Communities.</span>
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl">
                  FoodFlow is an intelligent platform connecting food donors with NGOs to eliminate waste and fight hunger through real-time redistribution.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <Button size="lg" asChild className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 h-12 px-8">
                    <Link href={dashboardPath}>
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button size="lg" asChild className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 h-12 px-8">
                      <Link href="/signup">
                        Donate Food
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="h-12 px-8 border-slate-300 dark:border-slate-700">
                      <Link href="/signin">Join as NGO</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative">
              <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-800 dark:border-slate-700">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                    <span className="text-sm font-medium text-slate-400">Dashboard Overview</span>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-800 dark:bg-slate-700 rounded-lg">
                        <div className="w-10 h-10 bg-slate-700 dark:bg-slate-600 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-2 bg-slate-700 dark:bg-slate-600 rounded w-3/4"></div>
                          <div className="h-2 bg-slate-700 dark:bg-slate-600 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">1.2M+</div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Meals Redistributed</div>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Connecting surplus food with communities in need</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">450 Tons</div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Food Waste Reduced</div>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Preventing perfectly good food from landfills</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">2,840</div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Active Partners</div>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Donors and NGOs working together</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Redistribution Protocol */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">The Redistribution Protocol</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <Card className="bg-emerald-900 text-white border-0">
              <CardContent className="p-8">
                <div className="mb-6">
                  <MapPin className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">01. Donors List Surplus</h3>
                <p className="text-emerald-100 leading-relaxed">
                  Restaurants, bakeries, and grocery stores list surplus food with location, quantity, and expiry details in real-time.
                </p>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <CardContent className="p-8">
                <div className="mb-6">
                  <Users className="w-8 h-8 text-slate-900 dark:text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">02. NGOs Discover & Claim</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Verified NGOs browse available food on an interactive map and claim items that match their community needs instantly.
                </p>
              </CardContent>
            </Card>

            {/* Card 3 */}
            <div className="relative">
              <div className="absolute inset-0 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
              <div className="relative h-full bg-slate-200 dark:bg-slate-600 rounded-lg p-8 flex items-center justify-center">
                <Package className="w-24 h-24 text-slate-400 dark:text-slate-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Food Claimed & Delivered */}
      <section className="py-16 bg-slate-900 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-3">03. Food Claimed & Delivered</h3>
              <p className="text-slate-300 leading-relaxed max-w-2xl">
                Coordinated pickup with real-time tracking ensures food reaches communities while fresh. Our optimized logistics reduce delivery time and maximize impact.
              </p>
            </div>
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white h-12 px-8">
              View Live Deliveries
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full mb-6">
                LIVE NOW
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Metropolitan Redistribution Network
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                Track food redistribution across your city in real-time. Our intelligent network connects donors with NGOs within minutes, ensuring no meal goes to waste.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Active Pickup Points</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">12 donors currently have food available</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">NGO Distribution Centers</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">8 NGOs ready to receive donations</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="relative">
              <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden">
                <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-500 font-medium">Interactive Map View</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logistics Built for Resilience */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Logistics Built for Resilience
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-white dark:text-slate-900" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Real-Time Sync</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Instant notifications and live tracking ensure perfect coordination between all parties.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-white dark:text-slate-900" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Smart Routing</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                AI-optimized routes minimize delivery time and maximize food freshness.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-white dark:text-slate-900" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Demand Prediction</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Machine learning forecasts community needs to optimize distribution.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-white dark:text-slate-900" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Full Transparency</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Complete audit trail from donation to delivery builds trust and accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Voices */}
      <section className="py-24 bg-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-4">Verified Voices in the Ecosystem</h2>
            <p className="text-emerald-100 max-w-2xl">
              Real stories from donors and NGOs making a difference in their communities through FoodFlow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-emerald-800 border-emerald-700 text-white">
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="text-2xl font-bold mb-1">Metro Bakery</div>
                  <div className="text-sm text-emerald-200">Donor Since 2024</div>
                </div>
                <p className="text-sm text-emerald-100 leading-relaxed">
                  "We've redistributed over 500kg of baked goods. FoodFlow makes it effortless to connect with local NGOs."
                </p>
              </CardContent>
            </Card>

            <Card className="bg-emerald-800 border-emerald-700 text-white">
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="text-2xl font-bold mb-1">Community Kitchen</div>
                  <div className="text-sm text-emerald-200">NGO Partner</div>
                </div>
                <p className="text-sm text-emerald-100 leading-relaxed">
                  "The real-time alerts help us claim food quickly. We've served 2,000+ meals thanks to this platform."
                </p>
              </CardContent>
            </Card>

            <Card className="bg-emerald-800 border-emerald-700 text-white">
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="text-2xl font-bold mb-1">City Fresh Market</div>
                  <div className="text-sm text-emerald-200">Donor Since 2023</div>
                </div>
                <p className="text-sm text-emerald-100 leading-relaxed">
                  "Instead of waste, we create impact. The platform is intuitive and the NGO network is reliable."
                </p>
              </CardContent>
            </Card>

            <Card className="bg-emerald-800 border-emerald-700 text-white">
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="text-2xl font-bold mb-1">Hope Foundation</div>
                  <div className="text-sm text-emerald-200">NGO Partner</div>
                </div>
                <p className="text-sm text-emerald-100 leading-relaxed">
                  "FoodFlow's logistics support has transformed how we operate. More food, less waste, greater reach."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to Optimize Your Impact?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Whether you're a donor with surplus food or an NGO serving communities, join our network today and start making a difference.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Button size="lg" asChild className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 h-14 px-10">
                <Link href={dashboardPath}>
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 h-14 px-10">
                  <Link href="/signup">Donate as Donor</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-14 px-10 border-slate-300 dark:border-slate-700">
                  <Link href="/signup">Apply as NGO</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-bold text-lg text-slate-900 dark:text-white mb-4">FoodFlow</div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Ending hunger by reducing waste through intelligent food redistribution.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white">Features</Link></li>
                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white">How It Works</Link></li>
                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white">Blog</Link></li>
                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white">Careers</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white">Privacy</Link></li>
                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white">Terms</Link></li>
                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              © 2026 FoodFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
