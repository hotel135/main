// src/components/ui/LocationSearch.js - WITH API
"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function LocationSearch({
  value,
  onChange,
  className,
  name,
  placeholder,
  onSearch,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();

  // Enhanced common locations - more cities worldwide
  const commonLocations = useRef([
    // US Cities
    "New York, NY, USA",
    "Los Angeles, CA, USA",
    "Chicago, IL, USA",
    "Houston, TX, USA",
    "Phoenix, AZ, USA",
    "Philadelphia, PA, USA",
    "San Antonio, TX, USA",
    "San Diego, CA, USA",
    "Dallas, TX, USA",
    "San Jose, CA, USA",

    // UK Cities
    "London, UK",
    "Manchester, UK",
    "Birmingham, UK",
    "Liverpool, UK",
    "Glasgow, UK",
    "Leeds, UK",

    // Canada
    "Toronto, Canada",
    "Vancouver, Canada",
    "Montreal, Canada",
    "Calgary, Canada",
    "Edmonton, Canada",
    "Ottawa, Canada",

    // Australia
    "Sydney, Australia",
    "Melbourne, Australia",
    "Brisbane, Australia",
    "Perth, Australia",
    "Adelaide, Australia",

    // Europe
    "Paris, France",
    "Berlin, Germany",
    "Rome, Italy",
    "Madrid, Spain",
    "Amsterdam, Netherlands",

    // Africa
    "Lagos, Nigeria",
    "Abuja, Nigeria",
    "Port Harcourt, Nigeria",
    "Benin City, Nigeria",
    "Accra, Ghana",
    "Nairobi, Kenya",
    "Johannesburg, South Africa",
    "Cape Town, South Africa",
    "Cairo, Egypt",
    "Casablanca, Morocco",

    // Asia
    "Tokyo, Japan",
    "Delhi, India",
    "Shanghai, China",
    "Mumbai, India",
    "Beijing, China",
    "Dubai, UAE",
    "Singapore, Singapore",
    "Seoul, South Korea",
    "Bangkok, Thailand",

    // South America
    "São Paulo, Brazil",
    "Rio de Janeiro, Brazil",
    "Buenos Aires, Argentina",
    "Lima, Peru",
    "Bogotá, Colombia",
  ]);

  const makeCleanUrl = useCallback((location) => {
    if (!location) return "";

    return location
      .toLowerCase()
      .replace(/\s*,\s*/g, "/")
      .replace(/\s+/g, " ");
  }, []);

  // Enhanced search with API integration
  const searchLocations = useCallback(async (query) => {
    if (!query || query.length < 2) {
      // Show common locations when query is short
      const filtered = commonLocations.current
        .filter((loc) => loc.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8);
      setSuggestions(filtered.map((loc) => ({ value: loc, label: loc })));
      return;
    }

    setIsLoading(true);

    try {
      // Try RapidAPI GeoDB first if API key exists
      const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
      if (apiKey && query.length >= 2) {
        try {
          const response = await fetch(
            `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${encodeURIComponent(
              query
            )}&limit=10&sort=-population`,
            {
              headers: {
                "X-RapidAPI-Key": apiKey,
                "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.length > 0) {
              const apiSuggestions = data.data.map((city) => {
                let locationString = city.city;
                if (city.region) locationString += `, ${city.region}`;
                locationString += `, ${city.country}`;

                return {
                  value: locationString,
                  label: locationString,
                  isFromAPI: true,
                };
              });

              // Combine with local results for better coverage
              const localResults = commonLocations.current
                .filter(
                  (loc) =>
                    loc.toLowerCase().includes(query.toLowerCase()) &&
                    !apiSuggestions.some((api) => api.value === loc)
                )
                .slice(0, 5)
                .map((loc) => ({ value: loc, label: loc, isFromAPI: false }));

              const combinedResults = [
                ...apiSuggestions,
                ...localResults,
              ].slice(0, 12);
              setSuggestions(combinedResults);
              setIsLoading(false);
              return;
            }
          }
        } catch (apiError) {
          console.log("API call failed, using fallback:", apiError);
          // Continue to fallback
        }
      }

      // Fallback: Enhanced local search
      const queryLower = query.toLowerCase().trim();
      const filtered = commonLocations.current
        .filter((loc) => {
          const locLower = loc.toLowerCase();

          // Exact match at start (highest priority)
          if (locLower.startsWith(queryLower)) {
            return true;
          }

          // Contains the query anywhere
          if (locLower.includes(queryLower)) {
            return true;
          }

          // Match individual words
          const queryWords = queryLower.split(/\s+/);
          const locWords = locLower.split(/\s+|,/);

          return queryWords.some(
            (word) =>
              word.length > 2 &&
              locWords.some((locWord) => locWord.includes(word))
          );
        })
        .slice(0, 10);

      // Simulate API delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 200));

      setSuggestions(
        filtered.map((loc) => ({ value: loc, label: loc, isFromAPI: false }))
      );
    } catch (error) {
      console.log("Search error, using fallback:", error);
      // Final fallback to simple search
      const filtered = commonLocations.current
        .filter((loc) => loc.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8);
      setSuggestions(
        filtered.map((loc) => ({ value: loc, label: loc, isFromAPI: false }))
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      onChange(newValue);

      if (newValue.trim()) {
        searchLocations(newValue);
      } else {
        setSuggestions([]);
      }
    },
    [onChange, searchLocations]
  );

  const handleSuggestionClick = useCallback(
    (suggestion) => {
      onChange(suggestion.value);
      setShowSuggestions(false);

      const cleanUrl = makeCleanUrl(suggestion.value);

      if (onSearch) {
        onSearch(suggestion.value, cleanUrl);
      } else {
        router.push(`/discover/${cleanUrl}`);
      }
    },
    [onChange, makeCleanUrl, onSearch, router]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && value) {
        e.preventDefault();

        const cleanUrl = makeCleanUrl(value);

        if (onSearch) {
          onSearch(value, cleanUrl);
        } else {
        }

        setShowSuggestions(false);
      }

      // Escape key to close suggestions
      if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [value, makeCleanUrl, onSearch, router]
  );

  const handleFocus = useCallback(() => {
    setShowSuggestions(true);
    if (!value && suggestions.length === 0) {
      // Show popular locations when focused and empty
      const popularLocations = commonLocations.current
        .filter(
          (loc) =>
            loc.includes("USA") ||
            loc.includes("UK") ||
            loc.includes("Nigeria") ||
            loc.includes("Canada")
        )
        .slice(0, 8);

      setSuggestions(
        popularLocations.map((loc) => ({
          value: loc,
          label: loc,
          isFromAPI: false,
        }))
      );
    }
  }, [value, suggestions.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={inputRef}>
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        className={className}
        placeholder={placeholder}
        required
        autoComplete="off"
      />

      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-900/95 backdrop-blur-md border border-pink-500/30 rounded-xl shadow-2xl max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-3 cursor-pointer hover:bg-pink-500/20 transition duration-200 border-b border-pink-500/10 last:border-b-0 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-white font-medium">
                    {suggestion.label.split(",")[0]}
                  </div>
                  <div className="text-pink-300 text-sm">
                    {suggestion.label.split(",").slice(1).join(",").trim()}
                  </div>
                </div>
                {/* {suggestion.isFromAPI && (
                  <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs bg-pink-500/20 text-pink-300 px-2 py-1 rounded-full">
                      API
                    </span>
                  </div>
                )} */}
              </div>
            </div>
          ))}
        </div>
      )}

      {showSuggestions &&
        !isLoading &&
        value.length >= 2 &&
        suggestions.length === 0 && (
          <div className="absolute z-50 w-full mt-2 bg-gray-900/95 backdrop-blur-md border border-pink-500/30 rounded-xl p-4 text-pink-300">
            <p>No locations found for &quot;{value}&quot;</p>
            <p className="text-sm mt-1">
              Try searching for a city, state, or country
            </p>
          </div>
        )}

      {/* Search tips */}
      {!value && (
        <div className="absolute -bottom-2 left-0 right-0 transform translate-y-full mt-1">
          <p className="text-pink-300/70 text-xs text-center">
            Try: &quot;New York&quot;, &quot;London&quot;, &quot;Lagos&quot;,
            etc.
          </p>
        </div>
      )}
    </div>
  );
}
