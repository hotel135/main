// src/components/auth/ClientSignup.js
"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function ClientSignup() {
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    about: "",
    dateOfBirth: "",
    agreeToTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (formData.password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }
    if (!formData.agreeToTerms) {
      return "You must agree to the platform policies";
    }

    // Age validation
    const today = new Date();
    const birthDate = new Date(
      formData.dateOfBirth.split("/").reverse().join("-")
    );
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      return "You must be at least 18 years old";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Create user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        userType: "client",
        displayName: formData.displayName,
        email: formData.email,
        about: formData.about,
        dateOfBirth: formData.dateOfBirth,
        createdAt: new Date(),
        profileComplete: true,
      });

      // Redirect to dashboard
      router.push("/dashboard/client");
    } catch (error) {
      console.error("Signup error:", error);
      setError(error.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="displayName"
          className="block text-sm font-medium text-pink-200 mb-2"
        >
          Display Name *
        </label>
        <input
          type="text"
          id="displayName"
          name="displayName"
          required
          value={formData.displayName}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
          placeholder="How providers will see you"
        />
        <p className="mt-1 text-xs text-pink-300/70">
          This is the name providers will see when you message them.
        </p>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-pink-200 mb-2"
        >
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
          placeholder="your@email.com"
        />
        <p className="mt-1 text-xs text-pink-300/70">
          We recommend you don&apos;t use a business or shared email address.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-pink-200 mb-2"
          >
            Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
            placeholder="Minimum 8 characters"
          />
        </div>
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-pink-200 mb-2"
          >
            Repeat Password **
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
            placeholder="Confirm your password"
          />
        </div>
      </div>
      <p className="text-xs text-pink-300/70 -mt-2">
        8 characters minimum. Make sure to set a strong, unique password.
      </p>

      <div>
        <label
          htmlFor="about"
          className="block text-sm font-medium text-pink-200 mb-2"
        >
          About Yourself *
        </label>
        <textarea
          id="about"
          name="about"
          required
          rows={4}
          value={formData.about}
          onChange={handleChange}
          maxLength={300}
          className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200 resize-none"
          placeholder="Age, location, hobbies, and what you're looking for..."
        />
        <p className="mt-1 text-xs text-pink-300/70">
          Max 300 characters. This will be visible to providers you contact.
        </p>
        <div className="text-right text-xs text-pink-300/50">
          {formData.about.length}/300
        </div>
      </div>

      <div>
        <label
          htmlFor="dateOfBirth"
          className="block text-sm font-medium text-pink-200 mb-2"
        >
          Date of Birth *
        </label>
        <input
          type="text"
          id="dateOfBirth"
          name="dateOfBirth"
          required
          value={formData.dateOfBirth}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
          placeholder="DD/MM/YYYY"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="agreeToTerms"
          name="agreeToTerms"
          checked={formData.agreeToTerms}
          onChange={handleChange}
          className="w-4 h-4 text-pink-500 bg-black/20 border-pink-500/30 rounded focus:ring-pink-400 focus:ring-2"
        />
        <label htmlFor="agreeToTerms" className="ml-2 text-sm text-pink-200">
          I agree to the platform policies and that I am over the age of 18 and
          the age of majority in my jurisdiction.
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {loading ? "Creating Account..." : "Create Client Account"}
      </button>
    </form>
  );
}
