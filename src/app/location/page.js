// app/discover/locations/page.js (or wherever you want it)
"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, ChevronUp, Globe, MapPin } from "lucide-react";
import Image from "next/image";

// Define apiCache for API caching
const apiCache = new Map();

export default function LocationsDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContinent, setSelectedContinent] = useState("all");
  const [expandedCountries, setExpandedCountries] = useState({});
  const [countryCities, setCountryCities] = useState({});
  const [loadingCountries, setLoadingCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // All continents with their countries
  const continents = useMemo(
    () => [
      {
        id: "all",
        name: "All Locations",
        icon: "🌍",
      },
      {
        id: "north-america",
        name: "North America",
        icon: "🇺🇸",
        countries: [
          "United States",
          "Canada",
          "Mexico",
          "Cuba",
          "Dominican Republic",
          "Jamaica",
          "Haiti",
          "Bahamas",
          "Puerto Rico",
          "Costa Rica",
          "Panama",
          "Guatemala",
          "Honduras",
          "El Salvador",
          "Nicaragua",
        ],
      },
      {
        id: "europe",
        name: "Europe",
        icon: "🇪🇺",
        countries: [
          "United Kingdom",
          "Germany",
          "France",
          "Italy",
          "Spain",
          "Netherlands",
          "Belgium",
          "Switzerland",
          "Austria",
          "Portugal",
          "Sweden",
          "Norway",
          "Denmark",
          "Finland",
          "Ireland",
          "Poland",
          "Greece",
          "Turkey",
          "Russia",
          "Ukraine",
        ],
      },
      {
        id: "asia",
        name: "Asia",
        icon: "🌏",
        countries: [
          "China",
          "India",
          "Japan",
          "South Korea",
          "Thailand",
          "Philippines",
          "Vietnam",
          "Malaysia",
          "Singapore",
          "Indonesia",
          "United Arab Emirates",
          "Saudi Arabia",
          "Qatar",
          "Israel",
          "Pakistan",
          "Bangladesh",
          "Sri Lanka",
        ],
      },
      {
        id: "africa",
        name: "Africa",
        icon: "🌍",
        countries: [
          "Nigeria",
          "Ghana",
          "Kenya",
          "South Africa",
          "Egypt",
          "Morocco",
          "Tunisia",
          "Ethiopia",
          "Uganda",
          "Tanzania",
          "Rwanda",
          "Senegal",
          "Ivory Coast",
          "Cameroon",
          "Zimbabwe",
          "Zambia",
          "Botswana",
          "Namibia",
        ],
      },
      {
        id: "south-america",
        name: "South America",
        icon: "🇧🇷",
        countries: [
          "Brazil",
          "Argentina",
          "Colombia",
          "Chile",
          "Peru",
          "Venezuela",
          "Ecuador",
          "Bolivia",
          "Paraguay",
          "Uruguay",
        ],
      },
      {
        id: "oceania",
        name: "Oceania",
        icon: "🇦🇺",
        countries: [
          "Australia",
          "New Zealand",
          "Fiji",
          "Papua New Guinea",
          "Samoa",
          "Tonga",
          "Vanuatu",
          "Solomon Islands",
        ],
      },
    ],
    [],
  );

  // All countries for filtering
  const allCountries = useMemo(() => {
    return continents.flatMap((continent) => continent.countries || []);
  }, [continents]);

  // Filtered countries based on search and continent
  const filteredCountries = useMemo(() => {
    let filtered = allCountries;

    // Filter by continent
    if (selectedContinent !== "all") {
      const continent = continents.find((c) => c.id === selectedContinent);
      filtered = continent?.countries || [];
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((country) =>
        country.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [allCountries, selectedContinent, searchQuery, continents]);

  // Get popular cities for a country (using API or local data)
  const getCitiesForCountry = useCallback(
    async (country) => {
      if (countryCities[country]) {
        return countryCities[country];
      }

      // Check cache first
      if (apiCache.has(`cities-${country}`)) {
        return apiCache.get(`cities-${country}`);
      }

      // Local city data for major countries
      const localCityData = {
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
          "Fort Worth",
          "Columbus",
          "Charlotte",
          "San Francisco",
          "Indianapolis",
          "Seattle",
          "Denver",
          "Washington DC",
        ],
        "United Kingdom": [
          "London",
          "Manchester",
          "Birmingham",
          "Liverpool",
          "Leeds",
          "Glasgow",
          "Sheffield",
          "Bristol",
          "Cardiff",
          "Edinburgh",
          "Leicester",
          "Nottingham",
          "Newcastle",
          "Brighton",
          "Southampton",
          "Portsmouth",
          "Milton Keynes",
          "Aberdeen",
          "Oxford",
          "Cambridge",
        ],
        Canada: [
          "Toronto",
          "Vancouver",
          "Montreal",
          "Calgary",
          "Edmonton",
          "Ottawa",
          "Winnipeg",
          "Quebec City",
          "Hamilton",
          "Halifax",
          "Victoria",
          "Saskatoon",
          "Regina",
          "St. John's",
          "Kelowna",
          "Moncton",
          "Sherbrooke",
          "Kingston",
          "Guelph",
          "Sudbury",
        ],
        Australia: [
          "Sydney",
          "Melbourne",
          "Brisbane",
          "Perth",
          "Adelaide",
          "Gold Coast",
          "Canberra",
          "Newcastle",
          "Wollongong",
          "Hobart",
          "Geelong",
          "Townsville",
          "Cairns",
          "Darwin",
          "Toowoomba",
          "Ballarat",
          "Bendigo",
          "Launceston",
          "Mackay",
          "Rockhampton",
        ],
        Nigeria: [
          "Lagos",
          "Abuja",
          "Port Harcourt",
          "Benin City",
          "Kano",
          "Ibadan",
          "Abeokuta",
          "Enugu",
          "Warri",
          "Calabar",
          "Uyo",
          "Asaba",
          "Owerri",
          "Akure",
          "Ilorin",
          "Aba",
          "Onitsha",
          "Jos",
          "Sokoto",
          "Maiduguri",
        ],
        Germany: [
          "Berlin",
          "Hamburg",
          "Munich",
          "Cologne",
          "Frankfurt",
          "Stuttgart",
          "Düsseldorf",
          "Dortmund",
          "Essen",
          "Leipzig",
          "Bremen",
          "Dresden",
          "Hannover",
          "Nuremberg",
          "Duisburg",
          "Bochum",
          "Wuppertal",
          "Bielefeld",
          "Bonn",
          "Münster",
        ],
        France: [
          "Paris",
          "Marseille",
          "Lyon",
          "Toulouse",
          "Nice",
          "Nantes",
          "Strasbourg",
          "Montpellier",
          "Bordeaux",
          "Lille",
          "Rennes",
          "Reims",
          "Le Havre",
          "Saint-Étienne",
          "Toulon",
          "Grenoble",
          "Dijon",
          "Angers",
          "Nîmes",
          "Villeurbanne",
        ],
        // Add more countries as needed
      };

      // If we have local data, use it immediately
      if (localCityData[country]) {
        const cities = localCityData[country].map((city) => ({
          name: city,
          url: `/discover/${country.toLowerCase().replace(/\s+/g, "-")}/${city
            .toLowerCase()
            .replace(/\s+/g, "-")}`,
        }));
        setCountryCities((prev) => ({ ...prev, [country]: cities }));
        apiCache.set(`cities-${country}`, cities);
        return cities;
      }

      // Otherwise, try to fetch from API
      try {
        setLoadingCountries((prev) => [...prev, country]);

        const API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
        let apiCities = [];

        if (API_KEY) {
          // Try Geoapify for city data
          const response = await fetch(
            `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
              country,
            )}&apiKey=${API_KEY}&limit=20&type=city`,
          );

          if (response.ok) {
            const data = await response.json();
            apiCities =
              data.features?.map((place) => ({
                name: place.properties.city || place.properties.name,
                url: `/discover/${country
                  .toLowerCase()
                  .replace(/\s+/g, "-")}/${(
                  place.properties.city || place.properties.name
                )
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`,
              })) || [];
          }
        }

        // If no API results, use a fallback
        if (apiCities.length === 0) {
          // Fallback: generate some common city names for the country
          const fallbackCities = [
            "Capital City",
            "Main City",
            "Commercial Hub",
            "Cultural Center",
            "Port City",
            "University Town",
            "Industrial Area",
            "Tourist Destination",
            "Business District",
            "Historic Center",
          ].map((city, index) => ({
            name: `${city} ${index + 1}`,
            url: `/discover/${country
              .toLowerCase()
              .replace(
                /\s+/g,
                "-",
              )}/${city.toLowerCase().replace(/\s+/g, "-")}-${index + 1}`,
          }));
          apiCities = fallbackCities;
        }

        // Cache and return results
        setCountryCities((prev) => ({ ...prev, [country]: apiCities }));
        apiCache.set(`cities-${country}`, apiCities);
        return apiCities;
      } catch (error) {
        console.error(`Error fetching cities for ${country}:`, error);
        return [];
      } finally {
        setLoadingCountries((prev) => prev.filter((c) => c !== country));
      }
    },
    [countryCities],
  );

  // Toggle country expansion
  const toggleCountry = useCallback(
    async (country) => {
      if (expandedCountries[country]) {
        setExpandedCountries((prev) => ({ ...prev, [country]: false }));
      } else {
        setExpandedCountries((prev) => ({ ...prev, [country]: true }));
        // Load cities if not already loaded
        if (!countryCities[country]) {
          await getCitiesForCountry(country);
        }
      }
    },
    [expandedCountries, countryCities, getCitiesForCountry],
  );

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/discover/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Handle city click
  const handleCityClick = (country, city) => {
    const countrySlug = country.toLowerCase().replace(/\s+/g, "-");
    const citySlug = city.toLowerCase().replace(/\s+/g, "-");
    router.push(`/discover/${countrySlug}/${citySlug}`);
  };

  // Handle country click
  const handleCountryClick = (country) => {
    const countrySlug = country.toLowerCase().replace(/\s+/g, "-");
    router.push(`/discover/${countrySlug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header/Nav */}
      <nav className="relative bg-white/5 backdrop-blur-md border-b border-pink-500/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient hidden md:block">
                  MeetAnEscort
                </h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-pink-600 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-pink-500/20 hover:scale-105"
              >
                Home
              </Link>
              <Link
                href="/discover"
                className="text-pink-600 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-pink-500/20 hover:scale-105"
              >
                Discover
              </Link>
              <Link
                href="/login"
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-pink-500/25"
              >
                Join Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                Global Escort Directory
              </span>
            </h1>
            <p className="text-xl text-pink-200 mb-10">
              Find verified escorts in cities around the world. Browse by
              country, continent, or search for specific locations.
            </p>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="max-w-2xl mx-auto mb-12 relative"
            >
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search countries, cities, or regions..."
                  className="w-full bg-black/50 border-2 border-pink-500/30 rounded-full px-6 py-4 pl-14 text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/50 transition"
                />
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-pink-400 h-5 w-5" />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-full hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Continent Filter */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Globe className="h-6 w-6 text-pink-400" />
            Browse by Continent
          </h2>
          <div className="flex flex-wrap gap-3">
            {continents.map((continent) => (
              <button
                key={continent.id}
                onClick={() => setSelectedContinent(continent.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300 ${
                  selectedContinent === continent.id
                    ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/50 text-white"
                    : "bg-black/30 border-pink-500/20 text-gray-300 hover:border-pink-500/40 hover:text-white"
                }`}
              >
                <span className="text-xl">{continent.icon}</span>
                <span>{continent.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Stats */}
        <div className="mb-8">
          <p className="text-pink-300">
            Showing{" "}
            <span className="text-white font-semibold">
              {filteredCountries.length}
            </span>{" "}
            {selectedContinent === "all" ? "countries" : "countries"} worldwide
          </p>
        </div>

        {/* Countries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCountries.map((country) => (
            <div
              key={country}
              className="bg-black/30 rounded-2xl border border-pink-500/20 hover:border-pink-500/40 transition-all duration-500 overflow-hidden"
            >
              {/* Country Header */}
              <div className="p-5 border-b border-pink-500/10">
                <div className="flex justify-between items-center">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleCountryClick(country)}
                  >
                    <h3 className="text-xl font-bold text-white hover:text-pink-300 transition">
                      {country}
                    </h3>
                    <p className="text-sm text-pink-200 mt-1">
                      Click to view all escorts in {country}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleCountry(country)}
                    className="ml-4 p-2 rounded-full bg-pink-500/10 hover:bg-pink-500/20 transition"
                    disabled={loadingCountries.includes(country)}
                  >
                    {loadingCountries.includes(country) ? (
                      <div className="h-5 w-5 border-2 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : expandedCountries[country] ? (
                      <ChevronUp className="h-5 w-5 text-pink-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-pink-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Cities List (Expanded) */}
              {expandedCountries[country] && (
                <div className="p-5">
                  {loadingCountries.includes(country) ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-8 w-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-3 text-pink-300">
                        Loading cities...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {(countryCities[country] || [])
                          .slice(0, 8)
                          .map((city) => (
                            <Link
                              key={city.name}
                              href={city.url}
                              className="group flex items-center gap-2 text-sm text-gray-300 hover:text-white hover:bg-pink-500/10 px-3 py-2 rounded-lg transition"
                            >
                              <MapPin className="h-3 w-3 text-pink-400 group-hover:text-pink-300" />
                              <span className="truncate">{city.name}</span>
                            </Link>
                          ))}
                      </div>
                      {countryCities[country]?.length > 8 && (
                        <div className="text-center pt-3 border-t border-pink-500/10">
                          <button
                            onClick={() => handleCountryClick(country)}
                            className="text-pink-400 hover:text-pink-300 text-sm font-medium transition"
                          >
                            View all {countryCities[country]?.length || 0}{" "}
                            cities →
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredCountries.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-pink-500/10 mb-6">
              <Globe className="h-10 w-10 text-pink-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              No locations found
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              We couldn't find any countries matching your search. Try a
              different continent or search term.
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-16 p-6 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-2xl border border-pink-500/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {allCountries.length}
              </div>
              <div className="text-sm text-pink-200">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">1000+</div>
              <div className="text-sm text-pink-200">Cities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-sm text-pink-200">Updated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">Global</div>
              <div className="text-sm text-pink-200">Coverage</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Can't find your location?
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Our directory is constantly growing. If you don't see your city,
            check back soon or contact us to suggest new locations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/discover"
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              Browse All Escorts
            </Link>
            <Link
              href="/contact"
              className="bg-black/30 border border-pink-500/30 text-pink-300 px-8 py-3 rounded-xl font-semibold hover:border-pink-500/50 hover:bg-pink-500/10 transition"
            >
              Suggest a Location
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/50 border-t border-pink-500/20 pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">MeetAnEscort</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              The global directory for connecting with verified escorts
              worldwide. Safe, private, and professional.
            </p>
            <div className="flex justify-center gap-6">
              <Link
                href="/about"
                className="text-gray-400 hover:text-white transition"
              >
                About
              </Link>
              <Link
                href="/safety"
                className="text-gray-400 hover:text-white transition"
              >
                Safety
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 hover:text-white transition"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-white transition"
              >
                Privacy
              </Link>
              <Link
                href="/contact"
                className="text-gray-400 hover:text-white transition"
              >
                Contact
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-5 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} MeetAnEscort. All rights reserved.
            <br />
            This platform does not promote or facilitate illegal activity.
          </div>
        </div>
      </footer>
    </div>
  );
}
