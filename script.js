/**
 * ==============================================================================
 * WeatherNow - Real-Time Weather Application
 * Vanilla JavaScript (ES6+) Implementation
 * ==============================================================================
 * 
 * Main Architecture:
 * 1. Configuration & API Key Management
 * 2. Application State Store
 * 3. DOM Elements Registry
 * 4. OpenWeatherMap API Service
 * 5. Data Formatting & Mathematical Helpers
 * 6. UI Renderers (Current, Hourly, Metrics, 5-Day Forecast)
 * 7. Dynamic Weather Background Theming
 * 8. Geolocation Service (HTML5 Geolocation API)
 * 9. Event Listeners & Lifecycle Initialization
 */

// ==============================================================================
// 1. CONFIGURATION & OPENWEATHERMAP API KEY
// ==============================================================================
/**
 * -----------------------------------------------------------------------------
 * PLACE YOUR OPENWEATHERMAP API KEY HERE:
 * -----------------------------------------------------------------------------
 * 1. Register for a free account at: https://home.openweathermap.org/users/sign_up
 * 2. Go to the "API keys" tab in your profile dashboard.
 * 3. Copy your 32-character key and replace "YOUR_API_KEY" below:
 *
 *    const API_KEY = "1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p";
 *
 * NOTE: You can also click the "API Key" button in the website header to paste
 * and save your key directly in your browser without editing this file!
 */
const API_KEY = "YOUR_API_KEY";

// Default city shown when the website first loads
const DEFAULT_CITY = "London";

// Base URLs for OpenWeatherMap 2.5 API endpoints
const API_BASE_CURRENT = "https://api.openweathermap.org/data/2.5/weather";
const API_BASE_FORECAST = "https://api.openweathermap.org/data/2.5/forecast";

// Local storage key names
const STORAGE_API_KEY = "weathernow_custom_api_key";
const STORAGE_RECENT_CITIES = "weathernow_recent_cities";
const STORAGE_UNIT = "weathernow_unit_preference";

// ==============================================================================
// 2. APPLICATION STATE
// ==============================================================================
const state = {
  // Current active unit: 'metric' (°C, m/s, km) or 'imperial' (°F, mph, mi)
  unit: localStorage.getItem(STORAGE_UNIT) || "metric",
  // Raw weather objects returned from OpenWeatherMap (cached in Celsius/metric)
  currentData: null,
  forecastData: null,
  // Current active city query
  currentCityName: "",
  // List of recent city search strings
  recentCities: JSON.parse(localStorage.getItem(STORAGE_RECENT_CITIES) || '["London", "Tokyo", "New York", "Paris"]'),
  // Loading flag
  isLoading: false
};

// ==============================================================================
// 3. DOM ELEMENTS REGISTRY
// ==============================================================================
const DOM = {
  body: document.body,
  navMenu: document.getElementById("navMenu"),
  mobileMenuToggle: document.getElementById("mobileMenuToggle"),
  searchForm: document.getElementById("searchForm"),
  cityInput: document.getElementById("cityInput"),
  clearInputBtn: document.getElementById("clearInputBtn"),
  searchBtn: document.getElementById("searchBtn"),
  locationBtn: document.getElementById("locationBtn"),
  recentSearchesBar: document.getElementById("recentSearchesBar"),
  chipsList: document.getElementById("chipsList"),
  
  // Units
  unitCBtn: document.getElementById("unitCBtn"),
  unitFBtn: document.getElementById("unitFBtn"),

  // Notification Banner
  notificationBanner: document.getElementById("notificationBanner"),
  notificationText: document.getElementById("notificationText"),
  notificationIcon: document.getElementById("notificationIcon"),
  notificationActionBtn: document.getElementById("notificationActionBtn"),
  notificationCloseBtn: document.getElementById("notificationCloseBtn"),

  // Loading State
  loadingState: document.getElementById("loadingState"),
  dashboardGrid: document.getElementById("dashboardGrid"),

  // Current Weather Card
  currentCityCountry: document.getElementById("currentCityCountry"),
  currentDateTime: document.getElementById("currentDateTime"),
  currentWeatherIcon: document.getElementById("currentWeatherIcon"),
  currentTempValue: document.getElementById("currentTempValue"),
  currentTempUnit: document.getElementById("currentTempUnit"),
  currentConditionText: document.getElementById("currentConditionText"),
  feelsLikeText: document.getElementById("feelsLikeText"),
  currentHighLow: document.getElementById("currentHighLow"),
  currentWindSummary: document.getElementById("currentWindSummary"),
  currentAtmosphereSummary: document.getElementById("currentAtmosphereSummary"),

  // Hourly Timeline
  hourlyScrollStrip: document.getElementById("hourlyScrollStrip"),

  // Details Grid
  detailHumidity: document.getElementById("detailHumidity"),
  detailHumidityHint: document.getElementById("detailHumidityHint"),
  humidityProgress: document.getElementById("humidityProgress"),
  detailWindSpeed: document.getElementById("detailWindSpeed"),
  detailWindDirection: document.getElementById("detailWindDirection"),
  detailWindGust: document.getElementById("detailWindGust"),
  windNeedle: document.getElementById("windNeedle"),
  detailPressure: document.getElementById("detailPressure"),
  detailPressureStatus: document.getElementById("detailPressureStatus"),
  detailVisibility: document.getElementById("detailVisibility"),
  detailVisibilityStatus: document.getElementById("detailVisibilityStatus"),
  detailCloudiness: document.getElementById("detailCloudiness"),
  detailCloudinessStatus: document.getElementById("detailCloudinessStatus"),
  cloudsProgress: document.getElementById("cloudsProgress"),
  detailSunrise: document.getElementById("detailSunrise"),
  detailSunriseSub: document.getElementById("detailSunriseSub"),
  detailSunset: document.getElementById("detailSunset"),
  detailSunsetSub: document.getElementById("detailSunsetSub"),

  // 5-Day Forecast Grid
  forecastCardsGrid: document.getElementById("forecastCardsGrid"),

  // API Key Modal Elements
  apiKeyModal: document.getElementById("apiKeyModal"),
  openApiKeyModalBtn: document.getElementById("openApiKeyModalBtn"),
  closeApiKeyModalBtn: document.getElementById("closeApiKeyModalBtn"),
  apiKeyInput: document.getElementById("apiKeyInput"),
  saveApiKeyBtn: document.getElementById("saveApiKeyBtn"),
  clearApiKeyBtn: document.getElementById("clearApiKeyBtn"),
  loadDemoBtn: document.getElementById("loadDemoBtn"),
  statusDot: document.getElementById("statusDot"),
  apiKeyStatusText: document.getElementById("apiKeyStatusText")
};

// ==============================================================================
// 4. API KEY RETRIEVAL & VALIDATION HELPERS
// ==============================================================================
/**
 * Retrieves the active API key with fallback order:
 * 1. User key saved in browser localStorage
 * 2. Key declared in code constant API_KEY
 */
function getActiveApiKey() {
  const savedKey = localStorage.getItem(STORAGE_API_KEY);
  if (savedKey && savedKey.trim().length > 0) {
    return savedKey.trim();
  }
  if (API_KEY && API_KEY !== "YOUR_API_KEY" && API_KEY.trim().length > 0) {
    return API_KEY.trim();
  }
  return null;
}

/**
 * Updates status indicators in the API Key Modal.
 */
function refreshApiKeyModalStatus() {
  const activeKey = getActiveApiKey();
  if (activeKey) {
    DOM.statusDot.className = "status-indicator-dot active";
    DOM.apiKeyStatusText.textContent = `Active Key: ${activeKey.substring(0, 4)}••••••••${activeKey.substring(activeKey.length - 4)} (Ready for live calls)`;
    DOM.apiKeyInput.value = activeKey;
  } else {
    DOM.statusDot.className = "status-indicator-dot warning";
    DOM.apiKeyStatusText.textContent = "No valid key detected. Insert key above or in script.js to fetch live data.";
    DOM.apiKeyInput.value = "";
  }
}

// ==============================================================================
// 5. WEATHER API SERVICE
// ==============================================================================
/**
 * Fetches both current weather and 5-day forecast for a city name.
 * @param {string} city
 */
async function fetchWeatherByCity(city) {
  if (!city || city.trim().length === 0) {
    showNotification("Please enter a city name to check the weather.", "warning");
    return;
  }

  const apiKey = getActiveApiKey();
  if (!apiKey) {
    handleMissingApiKeyAlert();
    return;
  }

  setLoading(true);
  hideNotification();

  try {
    const currentUrl = `${API_BASE_CURRENT}?q=${encodeURIComponent(city.trim())}&units=metric&appid=${apiKey}`;
    const forecastUrl = `${API_BASE_FORECAST}?q=${encodeURIComponent(city.trim())}&units=metric&appid=${apiKey}`;

    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl)
    ]);

    if (!currentRes.ok) {
      await handleApiError(currentRes);
      return;
    }

    if (!forecastRes.ok) {
      await handleApiError(forecastRes);
      return;
    }

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    // Cache to state
    state.currentData = currentData;
    state.forecastData = forecastData;
    state.currentCityName = `${currentData.name}, ${currentData.sys.country || ""}`;

    // Update history
    addRecentCity(currentData.name);

    // Render dashboard
    renderAllWeatherViews();

  } catch (error) {
    console.error("Network or parsing error:", error);
    showNotification("Unable to connect to the weather service. Please check your internet connection.", "error");
  } finally {
    setLoading(false);
  }
}

/**
 * Fetches current weather and 5-day forecast using geographic coordinates.
 * @param {number} latitude
 * @param {number} longitude
 */
async function fetchWeatherByCoordinates(latitude, longitude) {
  const apiKey = getActiveApiKey();
  if (!apiKey) {
    handleMissingApiKeyAlert();
    return;
  }

  setLoading(true);
  hideNotification();

  try {
    const currentUrl = `${API_BASE_CURRENT}?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
    const forecastUrl = `${API_BASE_FORECAST}?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;

    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl)
    ]);

    if (!currentRes.ok) {
      await handleApiError(currentRes);
      return;
    }

    if (!forecastRes.ok) {
      await handleApiError(forecastRes);
      return;
    }

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    state.currentData = currentData;
    state.forecastData = forecastData;
    state.currentCityName = `${currentData.name}, ${currentData.sys.country || ""}`;

    addRecentCity(currentData.name);
    renderAllWeatherViews();

    showNotification(`Weather updated for your detected location: ${state.currentCityName}`, "info", 4000);

  } catch (error) {
    console.error("Coordinate fetch error:", error);
    showNotification("Failed to retrieve weather for your coordinates. Please try searching by city name.", "error");
  } finally {
    setLoading(false);
  }
}

/**
 * Handles HTTP response errors from OpenWeatherMap with friendly explanations.
 * @param {Response} response
 */
async function handleApiError(response) {
  let errorData = {};
  try {
    errorData = await response.json();
  } catch (e) {
    // Non-JSON response
  }

  const status = response.status;
  const message = errorData.message || "";

  if (status === 404) {
    showNotification("City not found. Please verify the spelling and try again.", "error");
  } else if (status === 401) {
    showNotification(
      "Invalid or unactivated OpenWeatherMap API key. Newly created keys can take 10 to 30 minutes to activate on OpenWeatherMap's servers.",
      "warning",
      null,
      "Configure Key",
      () => openApiKeyModal()
    );
  } else if (status === 429) {
    showNotification("API rate limit exceeded. Please wait a moment and try again later.", "warning");
  } else {
    showNotification(`Weather service error: ${message || "An unexpected error occurred."}`, "error");
  }
}

/**
 * Displays an alert when no API key has been specified yet.
 */
function handleMissingApiKeyAlert() {
  showNotification(
    "OpenWeatherMap API Key Required. To fetch live meteorological data, please configure your free API key or load the demo snapshot.",
    "warning",
    null,
    "Enter API Key",
    () => openApiKeyModal()
  );
}

// ==============================================================================
// 6. TEMPERATURE & UNIT CONVERSION HELPERS
// ==============================================================================
/**
 * Formats temperature based on active unit ('metric' °C vs 'imperial' °F).
 * Raw input values in state are always stored in Celsius.
 * @param {number} celsius
 * @returns {number}
 */
function convertTemperature(celsius) {
  if (celsius === null || celsius === undefined || isNaN(celsius)) return 0;
  if (state.unit === "imperial") {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius);
}

/**
 * Converts wind speed (m/s) to appropriate unit string.
 * @param {number} metersPerSec
 * @returns {string}
 */
function formatWindSpeed(metersPerSec) {
  if (metersPerSec === null || metersPerSec === undefined) return "--";
  if (state.unit === "imperial") {
    const mph = (metersPerSec * 2.23694).toFixed(1);
    return `${mph} mph`;
  }
  return `${metersPerSec.toFixed(1)} m/s`;
}

/**
 * Converts visibility (meters) to kilometers or miles.
 * @param {number} meters
 * @returns {string}
 */
function formatVisibility(meters) {
  if (!meters) return "--";
  if (state.unit === "imperial") {
    const miles = (meters / 1609.34).toFixed(1);
    return `${miles} mi`;
  }
  const km = (meters / 1000).toFixed(1);
  return `${km} km`;
}

/**
 * Converts meteorological degree angle (0-360°) to cardinal compass string.
 * @param {number} deg
 * @returns {string}
 */
function getWindCardinalDirection(deg) {
  if (deg === undefined || deg === null) return "N/A";
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(deg / 22.5) % 16;
  return `${directions[index]} (${deg}°)`;
}

/**
 * Formats a UNIX timestamp into a readable 12-hour or 24-hour time string in the city's timezone.
 * @param {number} unixSec
 * @param {number} timezoneOffsetSec
 * @returns {string}
 */
function formatSunTime(unixSec, timezoneOffsetSec = 0) {
  if (!unixSec) return "--:--";
  // Create UTC date, then add city offset
  const utcMs = unixSec * 1000;
  const localMs = utcMs + timezoneOffsetSec * 1000;
  const date = new Date(localMs);

  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes} ${ampm}`;
}

/**
 * Formats local date and time for the primary weather card header.
 * @param {number} timezoneOffsetSec
 * @returns {string}
 */
function formatCurrentLocalDateTime(timezoneOffsetSec = 0) {
  const nowUtc = Date.now();
  const targetTime = new Date(nowUtc + timezoneOffsetSec * 1000);

  const options = {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  };

  return targetTime.toLocaleString("en-US", options);
}

// ==============================================================================
// 7. UI RENDERERS
// ==============================================================================
/**
 * Master rendering coordinator.
 */
function renderAllWeatherViews() {
  if (!state.currentData) return;

  renderCurrentWeatherCard();
  renderDetailedMetrics();
  renderHourlyTimeline();
  renderFiveDayForecast();
  updateDynamicTheme(state.currentData.weather[0]?.main);
}

/**
 * Renders the primary current weather showcase card.
 */
function renderCurrentWeatherCard() {
  const data = state.currentData;
  if (!data) return;

  const weather = data.weather[0] || {};
  const main = data.main || {};
  const sys = data.sys || {};
  const wind = data.wind || {};

  // Location & Time
  DOM.currentCityCountry.textContent = `${data.name}, ${sys.country || ""}`;
  DOM.currentDateTime.textContent = formatCurrentLocalDateTime(data.timezone || 0);

  // Weather Icon
  const iconCode = weather.icon || "01d";
  DOM.currentWeatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
  DOM.currentWeatherIcon.alt = weather.description || "Weather icon";

  // Temperatures
  const tempVal = convertTemperature(main.temp);
  DOM.currentTempValue.textContent = tempVal;
  DOM.currentTempUnit.textContent = state.unit === "imperial" ? "°F" : "°C";

  // Condition & Feels Like
  DOM.currentConditionText.textContent = weather.description || weather.main || "--";
  const feelsLikeVal = convertTemperature(main.feels_like);
  DOM.feelsLikeText.textContent = `Feels like ${feelsLikeVal}°`;

  // High / Low
  const highVal = convertTemperature(main.temp_max);
  const lowVal = convertTemperature(main.temp_min);
  DOM.currentHighLow.textContent = `${highVal}° / ${lowVal}°`;

  // Quick Wind & Atmosphere
  DOM.currentWindSummary.textContent = `${formatWindSpeed(wind.speed)} · ${getWindCardinalDirection(wind.deg)}`;
  DOM.currentAtmosphereSummary.textContent = `${main.pressure || "--"} hPa · ${main.humidity || "--"}% hum.`;
}

/**
 * Renders the 7 detailed atmospheric metric cards.
 */
function renderDetailedMetrics() {
  const data = state.currentData;
  if (!data) return;

  const main = data.main || {};
  const wind = data.wind || {};
  const clouds = data.clouds || {};
  const sys = data.sys || {};
  const timezone = data.timezone || 0;

  // 1. Humidity
  const humidity = main.humidity !== undefined ? main.humidity : 0;
  DOM.detailHumidity.textContent = `${humidity}%`;
  DOM.humidityProgress.style.width = `${Math.min(100, Math.max(0, humidity))}%`;
  DOM.detailHumidityHint.textContent = humidity > 70 ? "High humidity / sticky" : humidity < 30 ? "Dry atmospheric air" : "Comfortable humidity";

  // 2. Wind Speed & Direction
  DOM.detailWindSpeed.textContent = formatWindSpeed(wind.speed);
  DOM.detailWindDirection.textContent = `Direction: ${getWindCardinalDirection(wind.deg)}`;
  DOM.windNeedle.style.transform = `rotate(${wind.deg || 0}deg)`;
  DOM.detailWindGust.textContent = wind.gust ? `Gusts up to ${formatWindSpeed(wind.gust)}` : "Gentle breeze";

  // 3. Air Pressure
  const pressure = main.pressure || 1013;
  DOM.detailPressure.textContent = `${pressure} hPa`;
  DOM.detailPressureStatus.textContent = pressure > 1020 ? "High pressure (stable)" : pressure < 1005 ? "Low pressure (storm risk)" : "Normal atmospheric pressure";

  // 4. Visibility
  const visibility = data.visibility !== undefined ? data.visibility : 10000;
  DOM.detailVisibility.textContent = formatVisibility(visibility);
  DOM.detailVisibilityStatus.textContent = visibility >= 10000 ? "Clear horizon visibility" : visibility >= 5000 ? "Moderate atmospheric haze" : "Reduced visibility / fog";

  // 5. Cloudiness
  const cloudiness = clouds.all !== undefined ? clouds.all : 0;
  DOM.detailCloudiness.textContent = `${cloudiness}%`;
  DOM.cloudsProgress.style.width = `${Math.min(100, Math.max(0, cloudiness))}%`;
  DOM.detailCloudinessStatus.textContent = cloudiness > 80 ? "Overcast skies" : cloudiness > 40 ? "Partly cloudy" : "Clear sunny skies";

  // 6. Sunrise & 7. Sunset
  DOM.detailSunrise.textContent = formatSunTime(sys.sunrise, timezone);
  DOM.detailSunset.textContent = formatSunTime(sys.sunset, timezone);
  DOM.detailSunriseSub.textContent = "Local solar dawn";
  DOM.detailSunsetSub.textContent = "Local solar dusk";
}

/**
 * Renders the next 24-hour timeline in 3-hour intervals from forecast data.
 */
function renderHourlyTimeline() {
  const forecast = state.forecastData;
  if (!forecast || !forecast.list || forecast.list.length === 0) {
    DOM.hourlyScrollStrip.innerHTML = '<div class="scroll-empty">Hourly forecast unavailable</div>';
    return;
  }

  // Next 8 items = 24 hours (8 * 3h)
  const items = forecast.list.slice(0, 8);
  const timezone = forecast.city?.timezone || 0;

  DOM.hourlyScrollStrip.innerHTML = items.map((item) => {
    const temp = convertTemperature(item.main.temp);
    const weather = item.weather[0] || {};
    const icon = weather.icon || "01d";
    const pop = Math.round((item.pop || 0) * 100);

    // Format local time
    const timeStr = formatSunTime(item.dt, timezone);

    return `
      <div class="hourly-item-card">
        <span class="hourly-time">${timeStr}</span>
        <img class="hourly-icon" src="https://openweathermap.org/img/wn/${icon}.png" alt="${weather.description || 'weather'}" loading="lazy" />
        <span class="hourly-temp">${temp}°</span>
        <span class="hourly-pop" title="Precipitation Probability">
          <i class="fa-solid fa-droplet"></i>
          <span>${pop}%</span>
        </span>
      </div>
    `;
  }).join("");
}

/**
 * Aggregates and renders the 5-Day forecast cards.
 */
function renderFiveDayForecast() {
  const forecast = state.forecastData;
  if (!forecast || !forecast.list || forecast.list.length === 0) {
    DOM.forecastCardsGrid.innerHTML = '<div class="forecast-empty">Forecast data unavailable</div>';
    return;
  }

  // Group 3-hour entries by calendar date in local timezone
  const dailyGroups = {};
  const timezone = forecast.city?.timezone || 0;

  forecast.list.forEach((item) => {
    // Local date string YYYY-MM-DD
    const itemUtcMs = item.dt * 1000;
    const localDate = new Date(itemUtcMs + timezone * 1000);
    const dateKey = localDate.toISOString().split("T")[0];

    if (!dailyGroups[dateKey]) {
      dailyGroups[dateKey] = [];
    }
    dailyGroups[dateKey].push(item);
  });

  // Take the next 5 upcoming days
  const dateKeys = Object.keys(dailyGroups).slice(0, 5);

  DOM.forecastCardsGrid.innerHTML = dateKeys.map((dateKey) => {
    const dayEntries = dailyGroups[dateKey];
    
    // Calculate daily maximum and minimum temps
    let maxTempC = -999;
    let minTempC = 999;

    dayEntries.forEach((entry) => {
      if (entry.main.temp_max > maxTempC) maxTempC = entry.main.temp_max;
      if (entry.main.temp_min < minTempC) minTempC = entry.main.temp_min;
    });

    // Pick midday entry (near 12:00) for representative condition icon
    const midEntry = dayEntries[Math.floor(dayEntries.length / 2)] || dayEntries[0];
    const weather = midEntry.weather[0] || {};
    const icon = weather.icon || "01d";
    const condition = weather.description || weather.main || "Clear";

    // Format Day name and Date
    const firstLocal = new Date(dayEntries[0].dt * 1000 + timezone * 1000);
    const dayName = firstLocal.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
    const dateStr = firstLocal.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

    const maxDisplay = convertTemperature(maxTempC);
    const minDisplay = convertTemperature(minTempC);

    return `
      <article class="weather-card forecast-day-card">
        <div class="card-glass-glow" aria-hidden="true"></div>
        <div class="forecast-date-cluster">
          <span class="forecast-day-name">${dayName}</span>
          <span class="forecast-date-num">${dateStr}</span>
        </div>

        <div class="forecast-icon-box">
          <img class="forecast-icon-img" src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${condition}" loading="lazy" />
        </div>

        <span class="forecast-condition-name">${condition}</span>

        <div class="forecast-temp-range">
          <span class="forecast-high">${maxDisplay}°</span>
          <span class="forecast-low">${minDisplay}°</span>
        </div>
      </article>
    `;
  }).join("");
}

// ==============================================================================
// 8. DYNAMIC WEATHER BACKGROUND THEMES
// ==============================================================================
/**
 * Changes background theme according to real-time weather conditions.
 * @param {string} weatherMain ('Clear', 'Clouds', 'Rain', 'Snow', 'Thunderstorm', 'Mist', etc.)
 */
function updateDynamicTheme(weatherMain) {
  if (!weatherMain) return;

  const condition = weatherMain.toLowerCase();
  DOM.body.classList.remove(
    "theme-default",
    "theme-clear",
    "theme-clouds",
    "theme-rain",
    "theme-snow",
    "theme-thunderstorm",
    "theme-mist"
  );

  if (condition.includes("clear")) {
    DOM.body.classList.add("theme-clear");
  } else if (condition.includes("cloud")) {
    DOM.body.classList.add("theme-clouds");
  } else if (condition.includes("rain") || condition.includes("drizzle")) {
    DOM.body.classList.add("theme-rain");
  } else if (condition.includes("snow")) {
    DOM.body.classList.add("theme-snow");
  } else if (condition.includes("thunder") || condition.includes("storm")) {
    DOM.body.classList.add("theme-thunderstorm");
  } else if (
    condition.includes("mist") ||
    condition.includes("fog") ||
    condition.includes("haze") ||
    condition.includes("smoke") ||
    condition.includes("dust")
  ) {
    DOM.body.classList.add("theme-mist");
  } else {
    DOM.body.classList.add("theme-default");
  }
}

// ==============================================================================
// 9. GEOLOCATION SERVICE
// ==============================================================================
/**
 * Triggers browser geolocation request and fetches weather for current position.
 */
function handleUseMyLocation() {
  if (!navigator.geolocation) {
    showNotification("Geolocation is not supported by your browser.", "warning");
    return;
  }

  setLoading(true, "Detecting your geographic coordinates...");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeatherByCoordinates(latitude, longitude);
    },
    (geoError) => {
      setLoading(false);
      let errorMsg = "Could not access location. Please check your browser permissions.";
      if (geoError.code === geoError.PERMISSION_DENIED) {
        errorMsg = "Location access was denied. You can search for your city directly in the search bar.";
      } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
        errorMsg = "Location information is currently unavailable.";
      } else if (geoError.code === geoError.TIMEOUT) {
        errorMsg = "Location request timed out. Please try searching manually.";
      }
      showNotification(errorMsg, "warning");
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000
    }
  );
}

// ==============================================================================
// 10. RECENT SEARCHES MANAGEMENT
// ==============================================================================
/**
 * Adds city name to recent searches list in localStorage.
 * @param {string} cityName
 */
function addRecentCity(cityName) {
  if (!cityName) return;
  const normalized = cityName.trim();
  
  // Remove duplicate if exists
  let list = state.recentCities.filter((c) => c.toLowerCase() !== normalized.toLowerCase());
  // Prepend to top
  list.unshift(normalized);
  // Keep max 5
  if (list.length > 5) list = list.slice(0, 5);

  state.recentCities = list;
  localStorage.setItem(STORAGE_RECENT_CITIES, JSON.stringify(list));
  renderRecentChips();
}

/**
 * Renders quick city chips below the search input.
 */
function renderRecentChips() {
  if (!state.recentCities || state.recentCities.length === 0) {
    DOM.chipsList.innerHTML = "";
    return;
  }

  DOM.chipsList.innerHTML = state.recentCities.map((city) => {
    return `<button type="button" class="city-chip" data-city="${city}">${city}</button>`;
  }).join("");

  // Attach click handlers to chips
  DOM.chipsList.querySelectorAll(".city-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const city = btn.getAttribute("data-city");
      if (city) {
        DOM.cityInput.value = city;
        fetchWeatherByCity(city);
      }
    });
  });
}

// ==============================================================================
// 11. NOTIFICATIONS & LOADING FEEDBACK
// ==============================================================================
let notificationTimeout = null;

/**
 * Displays top notification banner with custom styling and action buttons.
 * @param {string} message
 * @param {'info'|'warning'|'error'} type
 * @param {number|null} autoDismissMs
 * @param {string|null} actionLabel
 * @param {Function|null} actionCallback
 */
function showNotification(message, type = "info", autoDismissMs = null, actionLabel = null, actionCallback = null) {
  if (notificationTimeout) clearTimeout(notificationTimeout);

  DOM.notificationText.textContent = message;
  DOM.notificationBanner.className = `notification-banner ${type}`;

  // Update Icon
  if (type === "error") {
    DOM.notificationIcon.className = "fa-solid fa-triangle-exclamation notification-icon";
  } else if (type === "warning") {
    DOM.notificationIcon.className = "fa-solid fa-circle-exclamation notification-icon";
  } else {
    DOM.notificationIcon.className = "fa-solid fa-circle-info notification-icon";
  }

  // Action Button
  if (actionLabel && actionCallback) {
    DOM.notificationActionBtn.textContent = actionLabel;
    DOM.notificationActionBtn.classList.remove("hidden");
    DOM.notificationActionBtn.onclick = () => {
      actionCallback();
      hideNotification();
    };
  } else {
    DOM.notificationActionBtn.classList.add("hidden");
    DOM.notificationActionBtn.onclick = null;
  }

  DOM.notificationBanner.classList.remove("hidden");

  if (autoDismissMs) {
    notificationTimeout = setTimeout(() => {
      hideNotification();
    }, autoDismissMs);
  }
}

function hideNotification() {
  DOM.notificationBanner.classList.add("hidden");
  if (notificationTimeout) clearTimeout(notificationTimeout);
}

/**
 * Toggles loading state spinner.
 * @param {boolean} isLoading
 * @param {string} customText
 */
function setLoading(isLoading, customText = "Fetching live atmospheric data...") {
  state.isLoading = isLoading;
  const textEl = document.getElementById("loadingText");
  if (textEl) textEl.textContent = customText;

  if (isLoading) {
    DOM.loadingState.classList.remove("hidden");
    DOM.dashboardGrid.style.opacity = "0.4";
    DOM.searchBtn.disabled = true;
  } else {
    DOM.loadingState.classList.add("hidden");
    DOM.dashboardGrid.style.opacity = "1";
    DOM.searchBtn.disabled = false;
  }
}

// ==============================================================================
// 12. DEMO SNAPSHOT DATA (FOR IMMEDIATE TESTING BEFORE KEY ACTIVATION)
// ==============================================================================
/**
 * Loads authentic sample dataset matching OpenWeatherMap 2.5 schemas for London.
 * Allows full inspection of all dashboard cards, °C/°F toggling, and UI responsiveness.
 */
function loadDemoSnapshot() {
  hideNotification();
  closeApiKeyModal();

  const mockCurrent = {
    name: "London",
    sys: { country: "GB", sunrise: 1728542100, sunset: 1728581700 },
    timezone: 3600,
    weather: [{ main: "Clouds", description: "scattered clouds", icon: "03d" }],
    main: {
      temp: 18.5,
      feels_like: 18.2,
      temp_min: 14.8,
      temp_max: 20.4,
      pressure: 1016,
      humidity: 64
    },
    wind: { speed: 4.8, deg: 230, gust: 7.2 },
    clouds: { all: 40 },
    visibility: 10000
  };

  const nowSec = Math.floor(Date.now() / 1000);
  const mockForecastList = [];

  for (let i = 0; i < 40; i++) {
    const dt = nowSec + i * 3 * 3600;
    const dayOffset = Math.floor(i / 8);
    const tempBase = 18 - dayOffset * 1.2 + Math.sin(i * 0.8) * 3;
    mockForecastList.push({
      dt: dt,
      main: {
        temp: parseFloat(tempBase.toFixed(1)),
        temp_min: parseFloat((tempBase - 2.5).toFixed(1)),
        temp_max: parseFloat((tempBase + 3.1).toFixed(1)),
        pressure: 1015,
        humidity: 60 + (i % 20)
      },
      weather: [
        {
          main: i % 4 === 0 ? "Rain" : i % 3 === 0 ? "Clear" : "Clouds",
          description: i % 4 === 0 ? "light rain" : i % 3 === 0 ? "clear sky" : "broken clouds",
          icon: i % 4 === 0 ? "10d" : i % 3 === 0 ? "01d" : "04d"
        }
      ],
      pop: i % 4 === 0 ? 0.65 : 0.15
    });
  }

  state.currentData = mockCurrent;
  state.forecastData = { city: { name: "London", country: "GB", timezone: 3600 }, list: mockForecastList };
  state.currentCityName = "London, GB";

  renderAllWeatherViews();
  showNotification("Demo Snapshot loaded for London. Enter your OpenWeatherMap API key anytime to fetch live data.", "info", 5000);
}

// ==============================================================================
// 13. API KEY MODAL CONTROLS
// ==============================================================================
function openApiKeyModal() {
  refreshApiKeyModalStatus();
  DOM.apiKeyModal.classList.remove("hidden");
  DOM.apiKeyInput.focus();
}

function closeApiKeyModal() {
  DOM.apiKeyModal.classList.add("hidden");
}

function saveCustomApiKey() {
  const val = DOM.apiKeyInput.value.trim();
  if (val.length === 0) {
    showNotification("Please enter an API key or click Clear Key.", "warning");
    return;
  }
  localStorage.setItem(STORAGE_API_KEY, val);
  refreshApiKeyModalStatus();
  closeApiKeyModal();
  showNotification("API key saved successfully! Refreshing weather data...", "info", 3000);

  // Re-fetch current city
  const city = DOM.cityInput.value.trim() || DEFAULT_CITY;
  fetchWeatherByCity(city);
}

function clearCustomApiKey() {
  localStorage.removeItem(STORAGE_API_KEY);
  DOM.apiKeyInput.value = "";
  refreshApiKeyModalStatus();
  showNotification("Custom API key cleared from browser storage.", "info", 3000);
}

// ==============================================================================
// 14. UNIT SWITCHER (°C / °F)
// ==============================================================================
/**
 * Toggles between Metric (°C) and Imperial (°F).
 * Updates UI immediately using cached Celsius values.
 * @param {'metric'|'imperial'} newUnit
 */
function setTemperatureUnit(newUnit) {
  if (state.unit === newUnit) return;
  state.unit = newUnit;
  localStorage.setItem(STORAGE_UNIT, newUnit);

  if (newUnit === "imperial") {
    DOM.unitFBtn.classList.add("active");
    DOM.unitCBtn.classList.remove("active");
  } else {
    DOM.unitCBtn.classList.add("active");
    DOM.unitFBtn.classList.remove("active");
  }

  // Instantly re-render with new unit calculations
  renderAllWeatherViews();
}

// ==============================================================================
// 15. EVENT LISTENERS & LIFECYCLE
// ==============================================================================
function setupEventListeners() {
  // Search Form Submit
  DOM.searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const city = DOM.cityInput.value.trim();
    if (city) {
      fetchWeatherByCity(city);
    } else {
      showNotification("Please enter a city name to search.", "warning");
    }
  });

  // Search Input Input/Clear
  DOM.cityInput.addEventListener("input", () => {
    if (DOM.cityInput.value.trim().length > 0) {
      DOM.clearInputBtn.classList.remove("hidden");
    } else {
      DOM.clearInputBtn.classList.add("hidden");
    }
  });

  DOM.clearInputBtn.addEventListener("click", () => {
    DOM.cityInput.value = "";
    DOM.clearInputBtn.classList.add("hidden");
    DOM.cityInput.focus();
  });

  // Geolocation Button
  DOM.locationBtn.addEventListener("click", () => {
    handleUseMyLocation();
  });

  // Temperature Unit Toggles
  DOM.unitCBtn.addEventListener("click", () => setTemperatureUnit("metric"));
  DOM.unitFBtn.addEventListener("click", () => setTemperatureUnit("imperial"));

  // Notification Close Button
  DOM.notificationCloseBtn.addEventListener("click", () => {
    hideNotification();
  });

  // Mobile Menu Toggle
  DOM.mobileMenuToggle.addEventListener("click", () => {
    DOM.navMenu.classList.toggle("open");
    const isOpen = DOM.navMenu.classList.contains("open");
    DOM.mobileMenuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Close Mobile Menu on Nav Link Click
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      DOM.navMenu.classList.remove("open");
      DOM.mobileMenuToggle.setAttribute("aria-expanded", "false");
    });
  });

  // API Key Modal Triggers
  DOM.openApiKeyModalBtn.addEventListener("click", openApiKeyModal);
  DOM.closeApiKeyModalBtn.addEventListener("click", closeApiKeyModal);
  DOM.saveApiKeyBtn.addEventListener("click", saveCustomApiKey);
  DOM.clearApiKeyBtn.addEventListener("click", clearCustomApiKey);
  DOM.loadDemoBtn.addEventListener("click", loadDemoSnapshot);

  // Close modal when clicking on the backdrop
  DOM.apiKeyModal.addEventListener("click", (e) => {
    if (e.target === DOM.apiKeyModal) {
      closeApiKeyModal();
    }
  });

  // Keyboard accessibility for modal (ESC to close)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !DOM.apiKeyModal.classList.contains("hidden")) {
      closeApiKeyModal();
    }
  });
}

// ==============================================================================
// 16. APPLICATION INITIALIZATION
// ==============================================================================
function initApp() {
  // Sync unit button active state
  if (state.unit === "imperial") {
    DOM.unitFBtn.classList.add("active");
    DOM.unitCBtn.classList.remove("active");
  } else {
    DOM.unitCBtn.classList.add("active");
    DOM.unitFBtn.classList.remove("active");
  }

  // Render recent city chips
  renderRecentChips();

  // Attach all user interaction handlers
  setupEventListeners();

  // Check if API key is present
  const apiKey = getActiveApiKey();
  if (apiKey) {
    // If active API key is set, fetch default city
    fetchWeatherByCity(DEFAULT_CITY);
  } else {
    // If no API key configured yet, load realistic snapshot so the app is immediately visible and functional
    loadDemoSnapshot();
    // Show polite notice about API key setup
    setTimeout(() => {
      showNotification(
        "Welcome to WeatherNow! We loaded the London snapshot for preview. To query any city with live telemetry, connect your OpenWeatherMap API key.",
        "info",
        8000,
        "API Setup",
        () => openApiKeyModal()
      );
    }, 1000);
  }
}

// Start application when DOM is fully loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
