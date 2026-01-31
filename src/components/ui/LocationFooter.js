// src/components/LocationFooter.js - WITH apiCache DEFINED
"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";

// Define apiCache OUTSIDE the component (so it persists between renders)
const apiCache = new Map();

// Random city pool to draw from when we need to fill up to 20
const randomCityPool = [
  // Major global cities
  { display: "New York", search: "New York, USA" },
  { display: "London", search: "London, UK" },
  { display: "Tokyo", search: "Tokyo, Japan" },
  { display: "Paris", search: "Paris, France" },
  { display: "Dubai", search: "Dubai, UAE" },
  { display: "Singapore", search: "Singapore" },
  { display: "Sydney", search: "Sydney, Australia" },
  { display: "Toronto", search: "Toronto, Canada" },
  { display: "Berlin", search: "Berlin, Germany" },
  { display: "Mumbai", search: "Mumbai, India" },
  { display: "Bangkok", search: "Bangkok, Thailand" },
  { display: "Istanbul", search: "Istanbul, Turkey" },
  { display: "Seoul", search: "Seoul, South Korea" },
  { display: "Hong Kong", search: "Hong Kong, China" },
  { display: "Los Angeles", search: "Los Angeles, USA" },
  { display: "Chicago", search: "Chicago, USA" },
  { display: "Miami", search: "Miami, USA" },
  { display: "Las Vegas", search: "Las Vegas, USA" },

  // Additional major cities
  { display: "Amsterdam", search: "Amsterdam, Netherlands" },
  { display: "Rome", search: "Rome, Italy" },
  { display: "Madrid", search: "Madrid, Spain" },
  { display: "Vienna", search: "Vienna, Austria" },
  { display: "Prague", search: "Prague, Czech Republic" },
  { display: "Cairo", search: "Cairo, Egypt" },
  { display: "Cape Town", search: "Cape Town, South Africa" },
  { display: "Nairobi", search: "Nairobi, Kenya" },
  { display: "Accra", search: "Accra, Ghana" },
  { display: "Lagos", search: "Lagos, Nigeria" },
  { display: "Abuja", search: "Abuja, Nigeria" },
  { display: "Johannesburg", search: "Johannesburg, South Africa" },
  { display: "Rio de Janeiro", search: "Rio de Janeiro, Brazil" },
  { display: "São Paulo", search: "São Paulo, Brazil" },
  { display: "Buenos Aires", search: "Buenos Aires, Argentina" },
  { display: "Mexico City", search: "Mexico City, Mexico" },
  { display: "Shanghai", search: "Shanghai, China" },
  { display: "Beijing", search: "Beijing, China" },
  { display: "Moscow", search: "Moscow, Russia" },
];

// Function to get random cities from pool (ensures no duplicates with existing cities)
const getRandomCities = (existingCities = [], count = 10) => {
  const existingCityNames = existingCities.map((city) =>
    city.display.toLowerCase(),
  );
  const availableCities = randomCityPool.filter(
    (city) => !existingCityNames.includes(city.display.toLowerCase()),
  );

  // Shuffle the available cities
  const shuffled = [...availableCities].sort(() => 0.5 - Math.random());

  // Return requested number of cities
  return shuffled.slice(0, count);
};

export default function LocationFooter({ currentLocation = "" }) {
  const [popularCities, setPopularCities] = useState([]);
  const [currentCountry, setCurrentCountry] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
    [],
  );

  // Enhanced Nigerian locations with proper hierarchy
  const nigerianLocations = {
    states: {
      Lagos: [
        "Ikeja",
        "Victoria Island",
        "Lekki",
        "Surulere",
        "Yaba",
        "Apapa",
        "Maryland",
        "Ikorodu",
      ],
      Abuja: [
        "Garki",
        "Wuse",
        "Maitama",
        "Asokoro",
        "Gwarinpa",
        "Kubwa",
        "Lugbe",
      ],
      Rivers: ["Port Harcourt", "Bonny", "Eleme", "Okrika", "Oyigbo"],
      Oyo: ["Ibadan", "Ogbomoso", "Iseyin", "Oyo", "Saki"],
      Kano: ["Kano", "Dawakin Kudu", "Tarauni", "Nassarawa"],
      Edo: ["Benin City", "Auchi", "Ekpoma", "Irrua"],
      Delta: ["Warri", "Asaba", "Sapele", "Ughelli", "Agbor"],
      Ogun: ["Abeokuta", "Sagamu", "Ijebu Ode", "Ilaro", "Ifo"],
      Kaduna: ["Kaduna", "Zaria", "Kafanchan"],
      Enugu: ["Enugu", "Nsukka", "Agbani", "Awgu"],
      Anambra: ["Awka", "Onitsha", "Nnewi", "Ekwulobia"],
      Imo: ["Owerri", "Orlu", "Okigwe"],
      Ondo: ["Akure", "Ondo", "Owo"],
      Kwara: ["Ilorin", "Offa", "Omu-Aran"],
      Plateau: ["Jos", "Bukuru", "Shendam"],
    },
    nearbyCities: {
      Lagos: ["Ikeja", "Surulere", "Yaba", "Ikorodu", "Epe", "Badagry"],
      Abuja: ["Kubwa", "Lugbe", "Gwarinpa", "Karu", "Nyanya"],
      "Port Harcourt": ["Oyigbo", "Eleme", "Okrika", "Omoku"],
      Ibadan: ["Oyo", "Ogbomoso", "Iseyin", "Saki"],
      "Benin City": ["Auchi", "Ekpoma", "Irrua", "Uromi"],
      Kano: ["Dawakin Kudu", "Tarauni", "Nassarawa", "Gaya"],
      Warri: ["Sapele", "Ughelli", "Agbor", "Burutu"],
      Abeokuta: ["Sagamu", "Ijebu Ode", "Ilaro", "Ifo"],
    },
  };

  // US locations
  const usLocations = {
    states: {
      California: [
        "Los Angeles",
        "San Francisco",
        "San Diego",
        "Sacramento",
        "San Jose",
      ],
      "New York": ["New York", "Buffalo", "Rochester", "Albany", "Syracuse"],
      Texas: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth"],
      Florida: ["Miami", "Orlando", "Tampa", "Jacksonville", "Tallahassee"],
      Illinois: ["Chicago", "Springfield", "Naperville", "Peoria"],
    },
    nearbyCities: {
      "New York": ["Brooklyn", "Queens", "Bronx", "Manhattan", "Staten Island"],
      "Los Angeles": [
        "Hollywood",
        "Beverly Hills",
        "Santa Monica",
        "Long Beach",
      ],
      Chicago: ["Evanston", "Oak Park", "Naperville", "Schaumburg"],
      Houston: ["Sugar Land", "The Woodlands", "Pearland", "Katy"],
      Miami: ["Miami Beach", "Coral Gables", "Hialeah", "Fort Lauderdale"],
    },
  };

  // Extract location components
  const extractLocationComponents = useCallback(
    (location) => {
      if (!location || typeof location !== "string")
        return { country: "", city: "", state: "" };

      const parts = location.split(",").map((part) => part.trim());

      if (parts.length === 1) {
        const singlePart = parts[0].toLowerCase();
        const countryMatch = suggestedCountries.find(
          (country) => country.toLowerCase() === singlePart,
        );

        if (countryMatch) {
          return { country: countryMatch, city: "", state: "" };
        }

        return { country: "", city: parts[0], state: "" };
      }

      if (parts.length === 2) {
        const [first, second] = parts;
        const secondLower = second.toLowerCase();

        const countryMatch = suggestedCountries.find((country) =>
          country.toLowerCase().includes(secondLower),
        );

        if (countryMatch) {
          if (nigerianLocations.states[first]) {
            return { country: countryMatch, city: "", state: first };
          }
          if (usLocations.states[first]) {
            return { country: countryMatch, city: "", state: first };
          }
          return { country: countryMatch, city: first, state: "" };
        }

        return { country: "", city: first, state: second };
      }

      if (parts.length >= 3) {
        const [city, state, countryPart] = parts;
        const countryMatch = suggestedCountries.find((country) =>
          country.toLowerCase().includes(countryPart.toLowerCase()),
        );

        return {
          country: countryMatch || countryPart,
          city: city,
          state: state,
        };
      }

      return { country: "", city: "", state: "" };
    },
    [suggestedCountries],
  );

  // Check if we have good local data for this city
  const hasGoodLocalData = useCallback((city, country) => {
    if (country === "Nigeria" && nigerianLocations.nearbyCities[city]) {
      return true;
    }
    if (country === "United States" && usLocations.nearbyCities[city]) {
      return true;
    }
    return false;
  }, []);

  // OPTIMIZED: Faster API calls with caching and timeout
  const getNearbyCities = useCallback(
    async (city, country) => {
      if (!city) return [];

      const cacheKey = `${city.toLowerCase()}-${country?.toLowerCase() || ""}`;

      // Check cache first (instant)
      if (apiCache.has(cacheKey)) {
        return apiCache.get(cacheKey);
      }

      // Return local data immediately for known cities
      if (hasGoodLocalData(city, country)) {
        const localData = getLocalNearbyCities(city, country, "");
        apiCache.set(cacheKey, localData);
        return localData;
      }

      try {
        // Use AbortController to cancel slow requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        // Try Geoapify first (fastest)
        const API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
        if (API_KEY) {
          const response = await fetch(
            `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
              city + (country ? `, ${country}` : ""),
            )}&apiKey=${API_KEY}&limit=6&type=city`,
            { signal: controller.signal },
          );

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const apiResults =
              data.features
                ?.filter(
                  (place) =>
                    place.properties.city &&
                    !place.properties.city
                      .toLowerCase()
                      .includes(city.toLowerCase()),
                )
                .map((place) => ({
                  display: place.properties.city,
                  search: `${place.properties.city}, ${place.properties.country}`,
                }))
                .slice(0, 6) || [];

            apiCache.set(cacheKey, apiResults);
            return apiResults;
          }
        }

        // Fallback to OpenStreetMap if Geoapify fails or no key
        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            `city near ${city}${country ? `, ${country}` : ""}`,
          )}&limit=6&featureType=city`,
          { signal: controller.signal },
        );

        clearTimeout(timeoutId);

        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          const apiResults = data
            .filter((place) => {
              const placeName = place.display_name?.toLowerCase() || "";
              return (
                !placeName.includes(city.toLowerCase()) &&
                place.importance > 0.2
              );
            })
            .map((place) => {
              const name = place.display_name.split(",")[0];
              return {
                display: name,
                search: `${name}, ${country || ""}`.trim(),
                importance: place.importance,
              };
            })
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 6);

          apiCache.set(cacheKey, apiResults);
          return apiResults;
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.log("API call failed:", error);
        }
      }

      // Fallback to local data
      const localData = getLocalNearbyCities(city, country, "");
      apiCache.set(cacheKey, localData);
      return localData;
    },
    [hasGoodLocalData],
  );

  // Enhanced local fallback data
  const getLocalNearbyCities = useCallback((city, country, state) => {
    // Nigeria-specific logic
    if (country === "Nigeria") {
      // If searching for a state, show its cities
      if (state && nigerianLocations.states[state]) {
        return nigerianLocations.states[state].map((cityName) => ({
          display: cityName,
          search: `${cityName}, ${state}, Nigeria`,
        }));
      }

      // If searching for a city, show nearby cities from our local data
      if (city && nigerianLocations.nearbyCities[city]) {
        return nigerianLocations.nearbyCities[city].map((cityName) => ({
          display: cityName,
          search: `${cityName}, Nigeria`,
        }));
      }

      // Fallback: major Nigerian cities (excluding current city)
      const majorCities = [
        "Lagos",
        "Abuja",
        "Port Harcourt",
        "Benin City",
        "Kano",
        "Ibadan",
        "Abeokuta",
        "Enugu",
      ];
      return majorCities
        .filter((c) => c !== city)
        .map((cityName) => ({
          display: cityName,
          search: `${cityName}, Nigeria`,
        }));
    }

    // US-specific logic
    if (country === "United States") {
      if (state && usLocations.states[state]) {
        return usLocations.states[state].map((cityName) => ({
          display: cityName,
          search: `${cityName}, ${state}, USA`,
        }));
      }

      if (city && usLocations.nearbyCities[city]) {
        return usLocations.nearbyCities[city].map((cityName) => ({
          display: cityName,
          search: `${cityName}, USA`,
        }));
      }

      const majorCities = [
        "New York",
        "Los Angeles",
        "Chicago",
        "Houston",
        "Phoenix",
        "Philadelphia",
      ];
      return majorCities
        .filter((c) => c !== city)
        .map((cityName) => ({
          display: cityName,
          search: `${cityName}, USA`,
        }));
    }

    // For other countries, return major cities
    const fallbackCities = {
      "United Kingdom": [
        "London",
        "Manchester",
        "Birmingham",
        "Liverpool",
        "Leeds",
        "Glasgow",
      ],
      Canada: [
        "Toronto",
        "Vancouver",
        "Montreal",
        "Calgary",
        "Edmonton",
        "Ottawa",
      ],
      Australia: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
      Ghana: ["Accra", "Kumasi", "Tamale", "Sekondi-Takoradi", "Sunyani"],
      Kenya: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"],
      "South Africa": [
        "Johannesburg",
        "Cape Town",
        "Durban",
        "Pretoria",
        "Port Elizabeth",
      ],
      default: ["New York", "London", "Toronto", "Sydney", "Berlin", "Paris"],
    };

    const cities = fallbackCities[country] || fallbackCities["default"];
    return cities
      .filter((c) => c !== city)
      .map((cityName) => ({
        display: cityName,
        search: `${cityName}, ${country}`,
      }));
  }, []);

  // Get cities for a country
  const getCitiesForCountry = useCallback((country) => {
    const countryCities = {
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
      ],
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
      ],
      Ghana: [
        "Accra",
        "Kumasi",
        "Tamale",
        "Sekondi-Takoradi",
        "Sunyani",
        "Cape Coast",
        "Obuasi",
        "Teshie",
      ],
      Kenya: [
        "Nairobi",
        "Mombasa",
        "Kisumu",
        "Nakuru",
        "Eldoret",
        "Thika",
        "Malindi",
        "Kitale",
      ],
      "South Africa": [
        "Johannesburg",
        "Cape Town",
        "Durban",
        "Pretoria",
        "Port Elizabeth",
        "Bloemfontein",
        "East London",
        "Pietermaritzburg",
      ],
      default: [
        "New York",
        "London",
        "Toronto",
        "Sydney",
        "Berlin",
        "Paris",
        "Tokyo",
        "Dubai",
        "Mumbai",
        "Singapore",
      ],
    };

    const cities = countryCities[country] || countryCities["default"];
    return cities.map((cityName) => ({
      display: cityName,
      search: `${cityName}, ${country}`,
    }));
  }, []);

  // NEW: Function to ensure we always have at least 20 cities
  const ensureMinimumCities = useCallback((cities, currentCity = "") => {
    // If we already have 20 or more cities, return as-is
    if (cities.length >= 20) return cities;

    // Get random cities to fill up to 20
    const neededCities = 20 - cities.length;
    const randomCities = getRandomCities(cities, neededCities);

    // Combine existing cities with random ones
    return [...cities, ...randomCities];
  }, []);

  // Create URL with encoded spaces
  const createUrlWithSpaces = useCallback((cityData) => {
    const { search } = cityData;
    const parts = search.split(",").map((part) => part.trim().toLowerCase());
    return parts.join("/");
  }, []);

  // City click handler
  const handleCityClick = useCallback(
    (cityData) => {
      const urlPath = createUrlWithSpaces(cityData);
      router.push(`/discover/${urlPath}`);
    },
    [createUrlWithSpaces, router],
  );

  // Country click handler
  const handleCountryClick = useCallback(
    (country) => {
      const urlPath = country.toLowerCase().replace(/\s+/g, " ");
      router.push(`/discover/${urlPath}`);
    },
    [router],
  );

  // OPTIMIZED: Update cities with debouncing and immediate local data
  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const updateLocationData = async () => {
      const { country, city, state } =
        extractLocationComponents(currentLocation);

      if (!isMounted) return;

      setCurrentCountry(country);
      setCurrentCity(city);

      if (city) {
        // Show local data IMMEDIATELY (fast)
        const immediateData = getLocalNearbyCities(city, country, state);
        const immediateDataWithFill = ensureMinimumCities(immediateData, city);
        setPopularCities(immediateDataWithFill.slice(0, 20)); // Always show up to 20

        // Then try API in background (delayed)
        timeoutId = setTimeout(async () => {
          if (!isMounted) return;

          setIsLoading(true);
          const apiData = await getNearbyCities(city, country);
          if (isMounted) {
            // Combine API data with immediate data, remove duplicates
            const combined = [...apiData, ...immediateData];
            const uniqueCities = combined.reduce((acc, current) => {
              const x = acc.find((item) => item.display === current.display);
              if (!x) {
                return acc.concat([current]);
              } else {
                return acc;
              }
            }, []);

            // Ensure we have at least 20 cities
            const filledCities = ensureMinimumCities(uniqueCities, city);
            setPopularCities(filledCities.slice(0, 20));
          }
          setIsLoading(false);
        }, 200); // Short delay for API call
      } else if (country) {
        const countryCities = getCitiesForCountry(country);
        const countryCitiesWithFill = ensureMinimumCities(countryCities);
        setPopularCities(countryCitiesWithFill.slice(0, 20)); // Always show up to 20
      } else {
        // For default view (countries), we don't need to fill to 20
        setPopularCities([]);
      }
    };

    updateLocationData();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [
    currentLocation,
    extractLocationComponents,
    getLocalNearbyCities,
    getNearbyCities,
    getCitiesForCountry,
    ensureMinimumCities,
  ]);

  // Preload common cities on component mount
  useEffect(() => {
    const commonCities = [
      "Lagos",
      "Abuja",
      "London",
      "New York",
      "Los Angeles",
    ];
    commonCities.forEach((city) => {
      getNearbyCities(city, ""); // Pre-cache in background
    });
  }, [getNearbyCities]);

  // Determine what to display
  const getDisplayContent = () => {
    if (currentCity && popularCities.length > 0) {
      return {
        type: "nearby",
        title: `Cities near ${currentCity}${
          currentCountry ? `, ${currentCountry}` : ""
        }`,
        subtitle: "Explore nearby locations",
        cities: popularCities.slice(0, 20), // Always limit to 20
        buttonText: `View all in ${currentCountry || "this region"}`,
        buttonClick: () => currentCountry && handleCountryClick(currentCountry),
      };
    } else if (currentCountry && popularCities.length > 0) {
      return {
        type: "country",
        title: `Popular Cities in ${currentCountry}`,
        subtitle: "Find independent escorts in these locations",
        cities: popularCities.slice(0, 20), // Always limit to 20
        buttonText: `View all cities in ${currentCountry}`,
        buttonClick: () => handleCountryClick(currentCountry),
      };
    } else {
      return {
        type: "default",
        title: "Popular Countries",
        subtitle: "Find independent escorts in these popular countries",
        countries: suggestedCountries.slice(0, 20), // Show up to 20 countries
        buttonText: "Browse all locations",
        buttonClick: () => router.push("/discover"),
      };
    }
  };

  const displayContent = getDisplayContent();

  return (
    <div className="bg-black/50 border-t border-pink-500/20 mt-16 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">
            {displayContent.title}
          </h3>
          <p className="text-pink-200 text-sm">{displayContent.subtitle}</p>
        </div>

        {/* Cities/Countries Grid - Now always shows up to 20 items */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
          {(displayContent.type === "default"
            ? displayContent.countries
            : displayContent.cities
          )
            .slice(0, 20) // Always show exactly 20 items when available
            .map((item, index) => (
              <button
                key={index}
                onClick={() =>
                  displayContent.type === "default"
                    ? handleCountryClick(item)
                    : handleCityClick(item)
                }
                className={`
                  ${
                    displayContent.type === "nearby"
                      ? index <
                        popularCities.length - getRandomCities([], 0).length // Real cities
                        ? "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 hover:border-blue-500/50 text-blue-200"
                        : "bg-gray-700/20 hover:bg-gray-700/30 border-gray-500/30 hover:border-gray-500/50 text-gray-300" // Random cities style
                      : displayContent.type === "country"
                        ? "bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/30 hover:border-pink-500/50 text-pink-200"
                        : "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 hover:border-purple-500/50 text-purple-200"
                  } 
                  hover:text-white border rounded-lg px-3 py-2 transition-all duration-300 hover:scale-105 text-xs text-center break-words min-h-[40px] flex items-center justify-center
                `}
                disabled={isLoading}
              >
                {displayContent.type === "default" ? item : item.display}
              </button>
            ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center mt-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
            <p className="text-pink-300 text-sm mt-2">
              Finding nearby locations...
            </p>
          </div>
        )}

        {/* View All Link */}
        {!isLoading && displayContent.buttonText && (
          <div className="text-center mt-6">
            <button
              onClick={displayContent.buttonClick}
              className={`
                ${
                  displayContent.type === "nearby"
                    ? "text-blue-400 hover:text-blue-300"
                    : displayContent.type === "country"
                      ? "text-pink-400 hover:text-pink-300"
                      : "text-purple-400 hover:text-purple-300"
                } 
                text-sm font-medium transition duration-300 hover:underline
              `}
            >
              {displayContent.buttonText} →
            </button>
          </div>
        )}

        {/* Show count of real vs random cities for debugging (optional) */}
        {process.env.NODE_ENV === "development" &&
          displayContent.type === "nearby" && (
            <div className="text-center mt-2">
              <p className="text-gray-400 text-xs">
                Showing {popularCities.length} locations (
                {popularCities.length - getRandomCities([], 0).length} nearby,
                {getRandomCities([], 0).length} popular cities)
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
