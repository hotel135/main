// src/components/LocationFooter.js - ALWAYS SHOW COUNTRIES BY DEFAULT
"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import cities from "cities-list";

export default function LocationFooter({ currentLocation = "" }) {
  const [popularCities, setPopularCities] = useState([]);
  const [currentCountry, setCurrentCountry] = useState("");
  const router = useRouter();

  // Convert cities object to array and get unique countries
  const allCities = useMemo(() => {
    return Object.keys(cities).map((cityName) => ({
      name: cityName,
      country: cities[cityName],
    }));
  }, []);

  // Popular countries to suggest (always shown)
  const suggestedCountries = useMemo(
    () => [
      "United States",
      "United Kingdom",
      "Canada",
      "Australia",
      "Germany",
      "France",
      "Italy",
      "Spain",
      "Nigeria",
      "Ghana",
      "Kenya",
      "South Africa",
      "Brazil",
      "Mexico",
      "India",
      "China",
      "Japan",
      "United Arab Emirates",
      "Egypt",
      "Morocco",
    ],
    []
  );

  // Improved country extraction
  const extractCountryFromLocation = (location) => {
    if (!location || typeof location !== "string") return "";

    const locationLower = location.toLowerCase().trim();

    // Map common country names to package country names
    const countryMappings = {
      usa: "United States",
      us: "United States",
      "united states": "United States",
      "united states of america": "United States",
      uk: "United Kingdom",
      "united kingdom": "United Kingdom",
      england: "United Kingdom",
      uae: "United Arab Emirates",
      emirates: "United Arab Emirates",
      canada: "Canada",
      australia: "Australia",
      germany: "Germany",
      france: "France",
      italy: "Italy",
      spain: "Spain",
      brazil: "Brazil",
      india: "India",
      china: "China",
      japan: "Japan",
      mexico: "Mexico",
      russia: "Russia",
      "south korea": "South Korea",
      nigeria: "Nigeria",
      ghana: "Ghana",
      kenya: "Kenya",
      "south africa": "South Africa",
      egypt: "Egypt",
      morocco: "Morocco",
    };

    // Check direct mappings first
    if (countryMappings[locationLower]) {
      return countryMappings[locationLower];
    }

    // Extract from comma-separated location
    const parts = location.split(",").map((part) => part.trim().toLowerCase());

    // Check each part for country matches
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];

      // Check direct mappings
      if (countryMappings[part]) {
        return countryMappings[part];
      }

      // Check if any country name contains this part
      const matchedCountry = suggestedCountries.find((country) => {
        if (country && typeof country === "string") {
          return country.toLowerCase().includes(part);
        }
        return false;
      });

      if (matchedCountry) {
        return matchedCountry;
      }
    }

    return "";
  };

  // Get popular cities for the current country
  const getCitiesForCountry = useMemo(() => {
    return (country) => {
      if (!country) return [];

      // Get all cities for this country from the package
      const countryCities = allCities
        .filter((city) => city.country === country)
        .map((city) => city.name)
        .sort();

      // If we have cities from the package, use them
      if (countryCities.length > 0) {
        // Return top 24 cities
        return countryCities.slice(0, 24).map((cityName) => ({
          display: cityName,
          search: `${cityName}, ${country}`,
        }));
      }

      // Fallback for countries not in the package
      const fallbackCities = {
        "United States": [
          "New York",
          "Los Angeles",
          "Chicago",
          "Houston",
          "Phoenix",
          "Philadelphia",
          "San Antonio",
          "San Diego",
          "Dallas",
          "San Jose",
          "Austin",
          "Jacksonville",
          "San Francisco",
          "Seattle",
          "Denver",
          "Washington",
          "Boston",
          "Las Vegas",
          "Atlanta",
          "Miami",
        ],
        Nigeria: [
          "Lagos",
          "Abuja",
          "Port Harcourt",
          "Benin City",
          "Kano",
          "Ibadan",
        ],
        "United Kingdom": [
          "London",
          "Manchester",
          "Birmingham",
          "Liverpool",
          "Leeds",
          "Glasgow",
        ],
        default: ["New York", "London", "Toronto", "Sydney", "Berlin", "Paris"],
      };

      const cities = fallbackCities[country] || fallbackCities["default"];
      return cities.map((cityName) => ({
        display: cityName,
        search: `${cityName}, ${country}`,
      }));
    };
  }, [allCities]);

  // Create URL with encoded spaces
  const createUrlWithSpaces = (cityData) => {
    const { search } = cityData;

    // Split the search into parts
    const parts = search
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter((part) => part.length > 0);

    // Join parts with forward slashes
    return parts.join("/");
  };

  // City click handler
  const handleCityClick = (cityData) => {
    const urlPath = createUrlWithSpaces(cityData);
    router.push(`/discover/${urlPath}`);
  };

  // Country click handler
  const handleCountryClick = (country) => {
    const urlPath = country.toLowerCase().replace(/\s+/g, " ");
    router.push(`/discover/${urlPath}`);
  };

  // Update cities when location changes
  useEffect(() => {
    const country = extractCountryFromLocation(currentLocation);
    setCurrentCountry(country);

    if (country) {
      const cities = getCitiesForCountry(country);
      setPopularCities(cities);
    } else {
      setPopularCities([]);
    }
  }, [currentLocation, getCitiesForCountry]);

  // ALWAYS show the footer now
  return (
    <div className="bg-black/50 border-t border-pink-500/20 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show cities for specific country when detected */}
        {currentCountry && popularCities.length > 0 ? (
          <>
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">
                Popular Cities in {currentCountry}
              </h3>
              <p className="text-pink-200 text-sm">
                Find independent escorts in these popular locations
              </p>
            </div>

            {/* Cities Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
              {popularCities.map((cityData, index) => (
                <button
                  key={index}
                  onClick={() => handleCityClick(cityData)}
                  className="bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 rounded-lg px-3 py-2 text-pink-200 hover:text-white transition-all duration-300 hover:scale-105 hover:border-pink-500/50 text-xs text-center break-words min-h-[40px] flex items-center justify-center"
                >
                  {cityData.display}
                </button>
              ))}
            </div>

            {/* View All Link */}
            <div className="text-center mt-6">
              <button
                onClick={() => handleCountryClick(currentCountry)}
                className="text-pink-400 hover:text-pink-300 text-sm font-medium transition duration-300 hover:underline"
              >
                View all cities in {currentCountry} →
              </button>
            </div>
          </>
        ) : (
          /* ALWAYS show suggested countries by default */
          <>
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">
                Popular Countries
              </h3>
              <p className="text-pink-200 text-sm">
                Find independent escorts in these popular countries
              </p>
            </div>

            {/* Countries Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
              {suggestedCountries.map((country, index) => (
                <button
                  key={index}
                  onClick={() => handleCountryClick(country)}
                  className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg px-3 py-2 text-purple-200 hover:text-white transition-all duration-300 hover:scale-105 hover:border-purple-500/50 text-xs text-center break-words min-h-[40px] flex items-center justify-center"
                >
                  {country}
                </button>
              ))}
            </div>

            {/* Browse All Link */}
            <div className="text-center mt-6">
              <button
                onClick={() => router.push("/discover")}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium transition duration-300 hover:underline"
              >
                Browse all locations →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
