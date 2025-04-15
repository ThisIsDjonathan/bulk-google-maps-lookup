"use client"

import Link from "next/link"
import { Code, Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="mt-12 py-6 border-t border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
      <div className="container mx-auto flex justify-center">
        <Link
          href="https://djonathan.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:bg-white hover:shadow-md hover:scale-105"
        >
          <Code className="h-4 w-4 text-blue-500 group-hover:text-blue-600 transition-transform duration-300 group-hover:rotate-12" />
          <span className="text-sm text-slate-600 group-hover:text-slate-800">Coded by Dj during the spare time</span>
          <Heart className="h-3 w-3 text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:animate-pulse" />
        </Link>
      </div>
    </footer>
  )
}
