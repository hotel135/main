// src/components/auth/ProviderSignup.js
"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import LocationSearch from "@/components/ui/Locations";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function ProviderSignup() {
  const [formData, setFormData] = useState({
    // Basic Info
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    bio: "", // Add this line

    // Location & Services
    location: "",
    catersTo: "both",
    gender: "",
    age: "",
    bodyType: "",
    height: "",
    ethnicity: "",
    cupSize: "",
    hairColor: "",
    shoeSize: "",
    eyeColor: "",
    profileComplete: false, // Will be true after photo upload
    vdoc: true, // Will be true after admin approve

    verified: true, // Will be true after admin approve
    languages: ["English"],

    // Availability
    availability: {
      monday: { available: true },
      tuesday: { available: true },
      wednesday: { available: true },
      thursday: { available: true },
      friday: { available: true },
      saturday: { available: true },
      sunday: { available: true },
    },

    incallHours: "",
    incallPrice: "",
    incallNotes: "",

    outcallHours: "",
    outcallPrice: "",
    outcallNotes: "",

    travelFee: "",
    deposit: "",
    startTime: "09:00",
    endTime: "23:00",

    // Contact
    website: "",
    phone: "",
    preferredContact: "whatsapp",
    website: "",
    instagram: "",
    twitter: "",
    agreeToTerms: false,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const locations = [
    "Miami, Florida, United States",
    "Los Angeles, California, United States",
    "Las Vegas, Nevada, United States",
    "New York, New York, United States",
    "Chicago, Illinois, United States",
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleArrayChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const nextStep = () => {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }
    setCurrentStep((prev) => prev + 1);
    setError("");
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
    setError("");
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.displayName?.trim()) {
          return "Display name is required";
        }
        if (!formData.email?.trim()) {
          return "Email address is required";
        }
        if (!formData.password) {
          return "Password is required";
        }
        if (formData.password.length < 8) {
          return "Password must be at least 8 characters";
        }
        if (formData.password !== formData.confirmPassword) {
          return "Passwords do not match";
        }
        break;
      case 2:
        if (!formData.location) {
          return "Please select your location";
        }
        if (!formData.gender) {
          return "Please select your gender";
        }
        if (!formData.age) {
          return "Please select your age range";
        }
        if (!formData.bio?.trim()) {
          return "About Me section is required";
        }
        if (formData.bio.length < 50) {
          return "About Me should be at least 50 characters long";
        }
        break;
      case 3:
        if (!formData.incallHours?.trim()) {
          return "Please specify incall hours/duration";
        }
        // if (!formData.incallPrice || parseFloat(formData.incallPrice) <= 0) {
        //   return "Please enter a valid incall price";
        // }
        if (!formData.outcallHours?.trim()) {
          return "Please specify outcall hours/duration";
        }
        // if (!formData.outcallPrice || parseFloat(formData.outcallPrice) <= 0) {
        //   return "Please enter a valid outcall price";
        // }
        break;
      case 4:
        if (!formData.phone) {
          return "Phone number is required";
        }
        if (formData.phone && formData.phone.length < 8) {
          return "Please enter a valid phone number";
        }
        if (!formData.agreeToTerms) {
          return "You must agree to the platform policies";
        }
        break;
      default:
        break;
    }
    return null;
  };

  const updateAvailability = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Only check terms agreement on the final step
    if (currentStep === 4 && !formData.agreeToTerms) {
      setError("You must agree to the platform policies");
      return;
    }

    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (currentStep < 4) {
      nextStep();
      return;
    }

    // Final submission
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Prepare user data for Firestore
      const userData = {
        userType: "provider",
        bio: formData.bio.trim(), // Add this line

        displayName: formData.displayName.trim(),
        email: formData.email.trim(),
        location: formData.location,
        catersTo: formData.catersTo,
        gender: formData.gender,
        age: formData.age,
        bodyType: formData.bodyType,
        height: formData.height,
        ethnicity: formData.ethnicity,
        cupSize: formData.cupSize,
        hairColor: formData.hairColor,
        shoeSize: formData.shoeSize,
        eyeColor: formData.eyeColor,
        languages: formData.languages,
        availability: formData.availability,
        incallPrice: formData.incallPrice,
        outcallPrice: formData.outcallPrice,
        website: formData.website,
        // PHONE NUMBER FIELDS - ADD THESE
        phone: formData.phone, // This is the main phone number
        contactPhone: formData.phone, // Also save as contactPhone for consistency        agreeToTerms: formData.agreeToTerms,
        createdAt: new Date(),
        lastActive: new Date(),
        profileComplete: true,
        verified: true,
      };

      // Remove empty fields
      Object.keys(userData).forEach((key) => {
        if (
          userData[key] === "" ||
          userData[key] === null ||
          userData[key] === undefined
        ) {
          delete userData[key];
        }
      });
      await setDoc(doc(db, "users", userCredential.user.uid), userData);

      router.push("/dashboard/provider");
    } catch (error) {
      console.error("Provider signup error:", error);
      setError(error.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Basic Information
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-pink-200 mb-2">
          Display Name *
        </label>
        <input
          type="text"
          name="displayName"
          value={formData.displayName}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
          placeholder="Your professional name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-pink-200 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
          placeholder="your@email.com"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-pink-200 mb-2">
            Password *
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
            placeholder="Minimum 8 characters"
            required
            minLength="8"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-pink-200 mb-2">
            Confirm Password *
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
            placeholder="Confirm your password"
            required
          />
        </div>
      </div>
    </div>
  );

  // Step 2: Profile Details
  // Step 2: Profile Details with Location Search
  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-pink-200 mb-2">
          Based In *
        </label>
        <LocationSearch
          value={formData.location}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, location: value }))
          }
          className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
        />
        <p className="mt-1 text-xs text-pink-300/70">
          Start typing to search for your city
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-pink-200 mb-2">
          Caters To *
        </label>
        <select
          name="catersTo"
          value={formData.catersTo}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
        >
          <option value="men">Men</option>
          <option value="women">Women</option>
          <option value="both">Both</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-pink-200 mb-2">
            Gender *
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
            required
          >
            <option value="">Select</option>
            <option value="woman">Woman (She/Her)</option>
            <option value="man">Man (He/Him)</option>
            <option value="non-binary">Non-binary</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-pink-200 mb-2">
            Age *
          </label>
          <select
            name="age"
            value={formData.age}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
            required
          >
            <option value="">Select</option>
            <option value="18-25">18-25</option>
            <option value="26-30">26-30</option>
            <option value="31-35">31-35</option>
            <option value="36-40">36-40</option>
            <option value="41+">41+</option>
          </select>
        </div>
      </div>

      {/* Rest of your existing fields remain the same */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-pink-200 mb-2">
            Body Type
          </label>
          <select
            name="bodyType"
            value={formData.bodyType}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
          >
            <option value="">Select</option>
            <option value="petite">Petite</option>
            <option value="athletic">Athletic</option>
            <option value="curvy">Curvy</option>
            <option value="voluptuous">Voluptuous</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-pink-200 mb-2">
            Height
          </label>
          <input
            type="text"
            name="height"
            value={formData.height}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
            placeholder="169 cm / 5'7&quot;"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-pink-200 mb-2">
            Ethnicity
          </label>
          <input
            type="text"
            name="ethnicity"
            value={formData.ethnicity}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
            placeholder="Mixed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-pink-200 mb-2">
            Hair Color
          </label>
          <input
            type="text"
            name="hairColor"
            value={formData.hairColor}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
            placeholder="Brunette"
          />
        </div>
      </div>

      {/* About Me Section - Added Here */}
      <div>
        <label className="block text-sm font-medium text-pink-200 mb-2">
          About Me *
        </label>
        <textarea
          name="bio"
          value={formData.bio || ""}
          onChange={handleChange}
          rows={5}
          className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
          placeholder="Tell clients about yourself, your personality, interests, and what makes your service special. This is your chance to make a great first impression!"
          required
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-pink-300/70">
            Minimum 50 characters recommended
          </p>
          <span
            className={`text-xs ${
              (formData.bio?.length || 0) < 50
                ? "text-yellow-400"
                : "text-green-400"
            }`}
          >
            {formData.bio?.length || 0}/50 characters
          </span>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Incall Services - Your Location */}
      <div className="bg-black/20 rounded-xl p-4 border border-pink-500/20">
        <h4 className="text-lg font-semibold text-pink-300 mb-4 flex items-center">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Incall Services (Your Location)
        </h4>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-pink-200 mb-2">
                Hours/Duration
              </label>
              <input
                type="text"
                name="incallHours"
                value={formData.incallHours || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
                placeholder="e.g., 1 hour, 2 hours, overnight"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-pink-200 mb-2">
                Price (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-300">
                  $
                </span>
                <input
                  type="number"
                  name="incallPrice"
                  value={formData.incallPrice || ""}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
                  placeholder="275"
                  min="0"
                  step="10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-pink-200 mb-2">
                Additional Info
              </label>
              <input
                type="text"
                name="incallNotes"
                value={formData.incallNotes || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
                placeholder="e.g., Minimum 2 hours"
              />
            </div>
          </div>

          <div className="text-xs text-pink-300/70">
            💡 Example: 1 hour for $300, 2 hours for $500, Overnight for $1200
          </div>
        </div>
      </div>

      {/* Outcall Services - Client's Location */}
      <div className="bg-black/20 rounded-xl p-4 border border-pink-500/20">
        <h4 className="text-lg font-semibold text-pink-300 mb-4 flex items-center">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Outcall Services (Clients Location)
        </h4>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-pink-200 mb-2">
                Hours/Duration
              </label>
              <input
                type="text"
                name="outcallHours"
                value={formData.outcallHours || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
                placeholder="e.g., 1 hour, 2 hours, overnight"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-pink-200 mb-2">
                Price (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-300">
                  $
                </span>
                <input
                  type="number"
                  name="outcallPrice"
                  value={formData.outcallPrice || ""}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
                  placeholder="320"
                  min="0"
                  step="10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-pink-200 mb-2">
                Additional Info
              </label>
              <input
                type="text"
                name="outcallNotes"
                value={formData.outcallNotes || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
                placeholder="e.g., Plus travel fee"
              />
            </div>
          </div>

          <div className="text-xs text-pink-300/70">
            💡 Outcall prices are typically higher due to travel time and
            expenses
          </div>
        </div>
      </div>

      {/* Additional Pricing Options */}
      <div className="bg-black/20 rounded-xl p-4 border border-pink-500/20">
        <h4 className="text-lg font-semibold text-pink-300 mb-4">
          Additional Pricing
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-pink-200 mb-2">
              Travel Fee (Outside City)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-300">
                $
              </span>
              <input
                type="number"
                name="travelFee"
                value={formData.travelFee || ""}
                onChange={handleChange}
                className="w-full pl-8 pr-3 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
                placeholder="50"
                min="0"
              />
            </div>
            <p className="text-xs text-pink-300/70 mt-1">
              Fee for locations outside your city
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-pink-200 mb-2">
              Deposit Required
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-300">
                $
              </span>
              <input
                type="number"
                name="deposit"
                value={formData.deposit || ""}
                onChange={handleChange}
                className="w-full pl-8 pr-3 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition duration-200"
                placeholder="100"
                min="0"
              />
            </div>
            <p className="text-xs text-pink-300/70 mt-1">
              Advance deposit to secure booking
            </p>
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="bg-black/20 rounded-xl p-4 border border-pink-500/20">
        <h4 className="text-lg font-semibold text-pink-300 mb-4">
          Weekly Availability
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {Object.entries(formData.availability).map(([day, schedule]) => (
            <div
              key={day}
              className="flex flex-col items-center p-2 bg-black/30 rounded-lg border border-pink-500/20"
            >
              <span className="text-pink-200 capitalize text-sm font-medium mb-1">
                {day.substring(0, 3)}
              </span>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={schedule.available}
                  onChange={(e) =>
                    updateAvailability(day, "available", e.target.checked)
                  }
                  className="w-3 h-3 text-pink-500 bg-black/20 border-pink-500/30 rounded focus:ring-pink-400"
                />
                <span className="ml-1 text-pink-300 text-xs">
                  {schedule.available ? "Yes" : "No"}
                </span>
              </label>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-pink-200 mb-2">
              Typical Start Time
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime || "09:00"}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white focus:outline-none focus:border-pink-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-pink-200 mb-2">
              Typical End Time
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime || "23:00"}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white focus:outline-none focus:border-pink-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
  // Step 4: Final Details
  const renderStep4 = () => (
    <div className="space-y-6">
      {/* Contact Information */}
      <div className="bg-black/20 rounded-xl p-6 border border-pink-500/20">
        <h4 className="text-xl font-bold text-pink-300 mb-6">
          Contact Information
        </h4>

        <div className="space-y-6">
          {/* Phone Number - Full Width */}
          <div>
            <label className="block text-lg font-semibold text-pink-200 mb-3">
              Phone Number *
            </label>
            <div className="react-phone-input-custom">
              <PhoneInput
                international
                defaultCountry="US"
                value={formData.phone}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, phone: value }))
                }
                className="w-full"
              />
            </div>
            <p className="mt-2 text-sm text-pink-300/70">
              Your number will be verified for security
            </p>
          </div>

          {/* Preferred Contact Method - Full Width */}
          <div>
            <label className="block text-lg font-semibold text-pink-200 mb-3">
              Preferred Contact Method
            </label>
            <select
              name="preferredContact"
              value={formData.preferredContact}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-black/30 border border-pink-500/30 rounded-lg text-white focus:outline-none focus:border-pink-400 text-lg"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="signal">Signal</option>
              <option value="telegram">Telegram</option>
              <option value="phone">Phone Call</option>
              <option value="sms">SMS/Text</option>
              <option value="email">Email Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Online Presence */}
      <div className="bg-black/20 rounded-xl p-6 border border-pink-500/20">
        <h4 className="text-xl font-bold text-pink-300 mb-6">
          Online Presence (Optional)
        </h4>

        <div className="space-y-6">
          {/* Website - Full Width */}
          <div>
            <label className="block text-lg font-semibold text-pink-200 mb-3">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-black/30 border border-pink-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-400 text-lg"
              placeholder="https://yourwebsite.com"
            />
          </div>

          {/* Social Media - Still single column but spaced */}
          <div className="space-y-4">
            <div>
              <label className="block text-lg font-semibold text-pink-200 mb-3">
                Instagram
              </label>
              <div className="flex max-w-md">
                <span className="px-4 py-3 bg-black/40 border border-pink-500/30 border-r-0 rounded-l-lg text-pink-300 flex items-center">
                  @
                </span>
                <input
                  type="text"
                  name="instagram"
                  value={formData.instagram || ""}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 bg-black/30 border border-pink-500/30 border-l-0 rounded-r-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-400 text-lg"
                  placeholder="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-lg font-semibold text-pink-200 mb-3">
                Twitter
              </label>
              <div className="flex max-w-md">
                <span className="px-4 py-3 bg-black/40 border border-pink-500/30 border-r-0 rounded-l-lg text-pink-300 flex items-center">
                  @
                </span>
                <input
                  type="text"
                  name="twitter"
                  value={formData.twitter || ""}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 bg-black/30 border border-pink-500/30 border-l-0 rounded-r-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-400 text-lg"
                  placeholder="username"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-black/20 rounded-xl p-6 border border-pink-500/20">
        <div className="flex items-start space-x-4">
          <input
            type="checkbox"
            id="agreeToTerms"
            name="agreeToTerms"
            checked={formData.agreeToTerms}
            onChange={handleChange}
            className="w-5 h-5 text-pink-500 bg-black/30 border-pink-500/50 rounded focus:ring-pink-400 mt-1"
            required
          />
          <div>
            <label
              htmlFor="agreeToTerms"
              className="block text-lg font-semibold text-pink-300 mb-2"
            >
              Agreement to Terms
            </label>
            <p className="text-pink-200 leading-relaxed">
              I agree to the platform policies and confirm that I am over the
              age of 18 and the age of majority in my jurisdiction. I understand
              that my profile will be reviewed and verified before being
              published.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const steps = [
    { number: 1, title: "Basic Info", component: renderStep1 },
    { number: 2, title: "Profile Details", component: renderStep2 },
    { number: 3, title: "Pricing & Availability", component: renderStep3 },
    { number: 4, title: "Final Details", component: renderStep4 },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Steps - Mobile Responsive */}
      <div className="mb-8">
        {/* Mobile View - Compact */}
        <div className="block md:hidden">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-pink-300">
              Step {currentStep} of {steps.length}
            </div>
            <div className="text-sm text-pink-200 font-medium">
              {steps[currentStep - 1].title}
            </div>
          </div>
          <div className="w-full bg-pink-500/20 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Desktop View - Full Steps */}
        <div className="hidden md:flex justify-between items-center">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  currentStep >= step.number
                    ? "bg-pink-500 border-pink-500 text-white shadow-lg"
                    : "border-pink-500/30 text-pink-500/30"
                }`}
              >
                {step.number}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-0.5 mx-2 transition-all duration-300 ${
                    currentStep > step.number ? "bg-pink-500" : "bg-pink-500/30"
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm animate-pulse">
          <div className="flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Current Step Content */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 hidden md:block">
          {steps[currentStep - 1].title}
        </h3>
        {steps[currentStep - 1].component()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 space-x-4">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 1 || loading}
          className="px-6 py-3 border border-pink-500/50 text-pink-300 rounded-xl font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-pink-500/10 transition duration-200 flex-1 md:flex-none"
        >
          Previous
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 transition duration-200 disabled:opacity-50 flex-1 md:flex-none"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </div>
          ) : currentStep === 4 ? (
            "Complete Registration"
          ) : (
            "Next Step"
          )}
        </button>
      </div>
    </form>
  );
}
