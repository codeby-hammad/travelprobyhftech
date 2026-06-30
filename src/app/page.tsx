// // Temporary home page — we'll replace this with a landing page later
// import Link from 'next/link'

// export default function HomePage() {
//   return (
//     <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
//       <div className="text-center space-y-6">
//         <h1 className="text-4xl font-bold text-gray-900">
//           ✈️ TravelPro
//         </h1>
//         <p className="text-lg text-gray-600">
//           Travel Agency Management Software
//         </p>
//         <div className="flex gap-4 justify-center">
//           <Link
//             href="/login"
//             className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
//           >
//             Login
//           </Link>
//           <Link
//             href="/register"
//             className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-100 transition"
//           >
//             Register
//           </Link>
//         </div>
//       </div>
//     </main>
//   )
// }

import LandingPage from '@/components/landing/LandingPage'

export default function HomePage() {
  return <LandingPage />
}