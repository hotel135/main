// src/app/register/page.js
"use client";
import { useState } from "react";
import Link from "next/link";
import ClientSignup from "@/components/auth/ClientSignup";
import ProviderSignup from "@/components/auth/ProviderSignup";

export default function Register() {
  const [userType, setUserType] = useState("client");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-pink-500/30 shadow-2xl">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              MeetAnEscort
            </h1>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-white">
            Create Your Account
          </h2>
          <p className="mt-2 text-pink-200">
            Join our exclusive community today
          </p>
        </div>

        {/* User Type Selection */}
        <div className="bg-black/20 rounded-2xl p-1 border border-pink-500/20">
          <div className="flex rounded-lg bg-transparent">
            <button
              onClick={() => setUserType("client")}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                userType === "client"
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg"
                  : "text-pink-200 hover:text-white hover:bg-pink-500/10"
              }`}
            >
              👤 I&apos;m a Client
            </button>
            <button
              onClick={() => setUserType("provider")}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                userType === "provider"
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg"
                  : "text-pink-200 hover:text-white hover:bg-pink-500/10"
              }`}
            >
              💼 I&apos;m a Provider
            </button>
          </div>
        </div>

        {/* Form Section */}
        <div className="mt-8">
          {userType === "client" ? <ClientSignup /> : <ProviderSignup />}
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-pink-200">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-pink-400 hover:text-pink-300 font-medium transition-colors duration-200"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
