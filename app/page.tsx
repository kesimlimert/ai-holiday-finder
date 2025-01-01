'use client';
import { useState } from "react";

type HolidayType = 'summer' | 'winter' | 'historical' | 'safari' | 'adventure' | 'cultural' | 'culinary' | 'wellness';
type Temperature = 'warm' | 'cold' | 'moderate';

interface HolidayPreferences {
  temperature: Temperature;
  type: HolidayType;
  budgetMin: number;
  budgetMax: number;
}

interface Destination {
  name: string;
  country: string;
  description: string;
  estimatedCost: number;
  bestTimeToVisit: string;
  highlights: string[];
}

export default function Home() {
  const [preferences, setPreferences] = useState<HolidayPreferences>({
    temperature: 'warm',
    type: 'summer',
    budgetMin: 1000,
    budgetMax: 5000
  });
  const [recommendations, setRecommendations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const holidayTypes: HolidayType[] = [
    'summer',
    'winter',
    'historical',
    'safari',
    'adventure',
    'cultural',
    'culinary',
    'wellness'
  ];

  const temperatures: Temperature[] = ['warm', 'cold', 'moderate'];

  const getAIRecommendations = async (prefs: HolidayPreferences, count: number = 5) => {
    setLoading(true);
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...prefs, count }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }

      if (!data.destinations || !Array.isArray(data.destinations)) {
        throw new Error('Invalid response format');
      }

      return data.destinations;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      // You might want to show this error to the user
      alert(error instanceof Error ? error.message : 'Failed to get recommendations');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const results = await getAIRecommendations(preferences, 5);
    setRecommendations(results);
    setShowMore(false);
  };

  const handleShowMore = async () => {
    const additionalResults = await getAIRecommendations(preferences, 5);
    setRecommendations([...recommendations, ...additionalResults]);
    setShowMore(true);
  };

  const getAirbnbSearchUrl = (destination: Destination) => {
    // Format the search query for Airbnb
    const searchQuery = `${destination.name}, ${destination.country}`;
    const encodedQuery = encodeURIComponent(searchQuery);
    return `https://www.airbnb.com/s/${encodedQuery}/homes`;
  };

  return (
    <div className="min-h-screen p-8 pb-20 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Plan Your Perfect Holiday</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Temperature Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Preferred Temperature</label>
            <select
              className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
              value={preferences.temperature}
              onChange={(e) => setPreferences({
                ...preferences,
                temperature: e.target.value as Temperature
              })}
            >
              {temperatures.map((temp) => (
                <option key={temp} value={temp}>
                  {temp.charAt(0).toUpperCase() + temp.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Holiday Type Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Holiday Type</label>
            <select
              className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
              value={preferences.type}
              onChange={(e) => setPreferences({
                ...preferences,
                type: e.target.value as HolidayType
              })}
            >
              {holidayTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)} Holiday
                </option>
              ))}
            </select>
          </div>

          {/* Budget Range */}
          <div className="space-y-4">
            <label className="block text-sm font-medium">Budget Range ($)</label>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Min Budget"
                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                  value={preferences.budgetMin}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    budgetMin: parseInt(e.target.value)
                  })}
                  min="0"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Max Budget"
                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                  value={preferences.budgetMax}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    budgetMax: parseInt(e.target.value)
                  })}
                  min={preferences.budgetMin}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Find My Perfect Holiday
          </button>
        </form>

        {/* Recommendations Section */}
        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2">Finding perfect destinations for you...</p>
          </div>
        )}

        {recommendations.length > 0 && !loading && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6">Recommended Destinations</h2>
            <div className="space-y-6">
              {recommendations.map((dest, index) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all hover:shadow-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold">
                      {dest.name}, {dest.country}
                    </h3>
                    <a
                      href={getAirbnbSearchUrl(dest)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm px-3 py-1.5 bg-[#FF385C] text-white rounded-lg hover:bg-[#E31C5F] transition-colors"
                    >
                      <svg 
                        className="w-5 h-5" 
                        viewBox="0 0 24 24" 
                        fill="currentColor"
                      >
                        <path d="M22.5 12c0 5.799-4.701 10.5-10.5 10.5S1.5 17.799 1.5 12 6.201 1.5 12 1.5 22.5 6.201 22.5 12zm1.5 0c0-6.627-5.373-12-12-12S0 5.373 0 12s5.373 12 12 12 12-5.373 12-12zm-9.75-1.5a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0zm1.5 0a3.75 3.75 0 1 0-7.5 0 3.75 3.75 0 0 0 7.5 0z"/>
                      </svg>
                      Find on Airbnb
                    </a>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {dest.description}
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                    <p>Estimated Cost: ${dest.estimatedCost}</p>
                    <p>Best Time to Visit: {dest.bestTimeToVisit}</p>
                    <div>
                      <p className="font-medium mb-1">Highlights:</p>
                      <ul className="list-disc list-inside pl-2">
                        {dest.highlights.map((highlight, idx) => (
                          <li key={idx}>{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!showMore && (
              <button
                onClick={handleShowMore}
                className="mt-6 w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Show More Destinations
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
