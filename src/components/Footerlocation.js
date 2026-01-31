import {
  FaTwitter,
  FaInstagram,
  FaTiktok,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  // State for toggling country sections
  const [expandedCountry, setExpandedCountry] = useState(null);

  // Popular countries with their major cities
  const popularCountries = [
    {
      name: "United States",
      cities: [
        "New York",
        "Los Angeles",
        "Chicago",
        "Houston",
        "Phoenix",
        "Philadelphia",
        "San Antonio",
        "San Diego",
        "Dallas",
        "Miami",
        "Atlanta",
        "Las Vegas",
        "Boston",
        "Seattle",
        "Washington DC",
        "Denver",
        "Austin",
        "Orlando",
        "Nashville",
        "Portland",
      ],
    },
    {
      name: "United Kingdom",
      cities: [
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
      ],
    },
    {
      name: "Canada",
      cities: [
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
      ],
    },
    {
      name: "Australia",
      cities: [
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
      ],
    },
    {
      name: "Germany",
      cities: [
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
      ],
    },
    {
      name: "France",
      cities: [
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
      ],
    },
  ];

  // More countries for second row (collapsed by default)
  const moreCountries = [
    {
      name: "Spain",
      cities: [
        "Madrid",
        "Barcelona",
        "Valencia",
        "Seville",
        "Zaragoza",
        "Málaga",
        "Murcia",
        "Palma",
        "Las Palmas",
        "Bilbao",
      ],
    },
    {
      name: "Italy",
      cities: [
        "Rome",
        "Milan",
        "Naples",
        "Turin",
        "Palermo",
        "Genoa",
        "Bologna",
        "Florence",
        "Bari",
        "Catania",
      ],
    },
    {
      name: "South Africa",
      cities: [
        "Johannesburg",
        "Cape Town",
        "Durban",
        "Pretoria",
        "Port Elizabeth",
        "Bloemfontein",
        "East London",
        "Pietermaritzburg",
        "Kimberley",
        "Polokwane",
      ],
    },
    {
      name: "Brazil",
      cities: [
        "São Paulo",
        "Rio de Janeiro",
        "Brasília",
        "Salvador",
        "Fortaleza",
        "Belo Horizonte",
        "Manaus",
        "Curitiba",
        "Recife",
        "Porto Alegre",
      ],
    },
    {
      name: "Mexico",
      cities: [
        "Mexico City",
        "Guadalajara",
        "Monterrey",
        "Puebla",
        "Tijuana",
        "León",
        "Ciudad Juárez",
        "Torreón",
        "Mérida",
        "San Luis Potosí",
      ],
    },
    {
      name: "India",
      cities: [
        "Mumbai",
        "Delhi",
        "Bangalore",
        "Hyderabad",
        "Ahmedabad",
        "Chennai",
        "Kolkata",
        "Surat",
        "Pune",
        "Jaipur",
      ],
    },
    {
      name: "Japan",
      cities: [
        "Tokyo",
        "Yokohama",
        "Osaka",
        "Nagoya",
        "Sapporo",
        "Fukuoka",
        "Kobe",
        "Kyoto",
        "Kawasaki",
        "Saitama",
      ],
    },
    {
      name: "United Arab Emirates",
      cities: [
        "Dubai",
        "Abu Dhabi",
        "Sharjah",
        "Al Ain",
        "Ajman",
        "Ras Al Khaimah",
        "Fujairah",
        "Umm Al Quwain",
      ],
    },
  ];

  // Toggle country expansion
  const toggleCountry = (countryName) => {
    setExpandedCountry(expandedCountry === countryName ? null : countryName);
  };

  // Handle city click - redirects to /discover/country/city
  const handleCityClick = (country, city) => {
    const countrySlug = country.toLowerCase().replace(/\s+/g, "-");
    const citySlug = city.toLowerCase().replace(/\s+/g, "-");
    return `/discover/${countrySlug}/${citySlug}`;
  };

  // Handle country click - redirects to /discover/country
  const handleCountryClick = (country) => {
    const countrySlug = country.toLowerCase().replace(/\s+/g, "-");
    return `/discover/${countrySlug}`;
  };

  return (
    <footer className="bg-neutral-950 text-neutral-300 pt-12 pb-6 mt-10 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-6">
        {/* Countries Section - Main Row */}
        <div className="mb-10">
          <h3 className="text-white text-lg font-semibold mb-4">
            Browse by Location
          </h3>
          <p className="text-sm text-neutral-400 mb-6">
            Find escorts in popular cities worldwide
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {popularCountries.map((country) => (
              <div
                key={country.name}
                className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-800 hover:border-pink-500/30 transition-colors"
              >
                <div className="flex justify-between items-center mb-3">
                  <Link
                    href={handleCountryClick(country.name)}
                    className="text-white font-medium hover:text-pink-400 transition"
                  >
                    {country.name}
                  </Link>
                  <button
                    onClick={() => toggleCountry(country.name)}
                    className="text-neutral-400 hover:text-white"
                    aria-label={`Toggle ${country.name} cities`}
                  >
                    {expandedCountry === country.name ? (
                      <FaChevronUp size={14} />
                    ) : (
                      <FaChevronDown size={14} />
                    )}
                  </button>
                </div>

                {/* Cities grid - shows first 4, expands on click */}
                <div
                  className={`grid grid-cols-2 gap-2 transition-all duration-300 ${
                    expandedCountry === country.name
                      ? "max-h-96 opacity-100"
                      : "max-h-24 opacity-100"
                  } overflow-hidden`}
                >
                  {country.cities
                    .slice(
                      0,
                      expandedCountry === country.name
                        ? country.cities.length
                        : 4,
                    )
                    .map((city) => (
                      <Link
                        key={city}
                        href={handleCityClick(country.name, city)}
                        className="text-xs text-neutral-400 hover:text-pink-300 hover:bg-pink-500/10 px-2 py-1 rounded transition"
                      >
                        {city}
                      </Link>
                    ))}
                </div>

                {country.cities.length > 4 && (
                  <div className="mt-3">
                    <button
                      onClick={() => toggleCountry(country.name)}
                      className="text-xs text-pink-400 hover:text-pink-300"
                    >
                      {expandedCountry === country.name
                        ? "Show less"
                        : `+${country.cities.length - 4} more cities`}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Show More Countries Button */}
          <div className="mt-8 text-center">
            <Link
              href="/location"
              className="inline-flex items-center px-4 py-2 bg-pink-500/20 text-pink-300 rounded-lg hover:bg-pink-500/30 border border-pink-500/30 transition"
            >
              Browse All Locations
            </Link>
          </div>
        </div>

        {/* Traditional Footer Content */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 pt-8 border-t border-neutral-800">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <h2 className="text-white text-lg font-semibold mb-3">
              MeetAnEscort
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Connecting clients with verified escorts in a safe, private, and
              professional way.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-white font-semibold mb-3">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/location" className="hover:text-white transition">
                  Locations
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-white transition">
                  Help / Support
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-white transition">
                  Safety & Verification
                </Link>
              </li>
              <li>
                <Link
                  href="/become-an-escort"
                  className="hover:text-white transition"
                >
                  Become an Escort
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal-notices"
                  className="hover:text-white transition"
                >
                  Legal Notices
                </Link>
              </li>
              <li>
                <Link
                  href="/anti-exploitation"
                  className="hover:text-white transition"
                >
                  Anti-Exploitation Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-semibold mb-3">Social</h3>
            <div className="flex space-x-4 text-neutral-400">
              <Link
                href="https://twitter.com"
                target="_blank"
                className="hover:text-white transition"
              >
                <FaTwitter size={18} />
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                className="hover:text-white transition"
              >
                <FaInstagram size={18} />
              </Link>
              <Link
                href="https://tiktok.com"
                target="_blank"
                className="hover:text-white transition"
              >
                <FaTiktok size={18} />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-10 pt-5 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} MeetAnEscort. All rights reserved. <br />
          This platform does not promote or facilitate illegal activity. Escorts
          operate independently and are responsible for compliance with local
          laws.
        </div>
      </div>
    </footer>
  );
}
