import Navbar from './components/Navbar'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-50 to-white">
        <h1 className="text-5xl font-bold mb-4">🌍 GeoHistory</h1>
        <p className="text-xl text-gray-600 mb-8 text-center max-w-2xl">
          Map historical events around the world. Explore timelines, discover where history happened, 
          and contribute to a collaborative historical map.
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <Link 
            href="/map" 
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Explore Map
          </Link>
          <Link 
            href="/timeline" 
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            View Timeline
          </Link>
          <Link 
            href="/auth" 
            className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Get Started
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl">
          <div className="text-center p-6">
            <h2 className="text-2xl font-bold mb-2">📍 Mark Events</h2>
            <p className="text-gray-600">Right-click on the map to add historical events with exact locations</p>
          </div>
          <div className="text-center p-6">
            <h2 className="text-2xl font-bold mb-2">📅 Timeline View</h2>
            <p className="text-gray-600">Browse history year by year and see events appear on the map</p>
          </div>
          <div className="text-center p-6">
            <h2 className="text-2xl font-bold mb-2">👥 Collaborate</h2>
            <p className="text-gray-600">Contribute to the global historical map and help others discover history</p>
          </div>
        </div>
      </main>
    </>
  )
}