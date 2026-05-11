const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const locationBtn = document.getElementById("location-btn");
const statusText = document.getElementById("status-text");
const forecastGrid = document.getElementById("forecast-grid");
const forecastTemplate = document.getElementById("forecast-template");
const unitButtons = document.querySelectorAll(".unit-btn");

const placeName = document.getElementById("place-name");
const localTime = document.getElementById("local-time");
const weatherBadge = document.getElementById("weather-badge");
const temperatureValue = document.getElementById("temperature-value");
const temperatureUnit = document.getElementById("temperature-unit");
const weatherDescription = document.getElementById("weather-description");
const feelsLike = document.getElementById("feels-like");
const windValue = document.getElementById("wind-value");
const humidityValue = document.getElementById("humidity-value");
const precipitationValue = document.getElementById("precipitation-value");
const dayNightValue = document.getElementById("day-night-value");
const sunriseValue = document.getElementById("sunrise-value");
const sunsetValue = document.getElementById("sunset-value");
const comfortPill = document.getElementById("comfort-pill");
const highlightSummary = document.getElementById("highlight-summary");

const appShell = document.body;

let currentUnit = "celsius";
let activeLocation = null;

const weatherCodeMap = {
  0: { label: "Clear sky", icon: "Sun", symbol: "01", theme: "theme-clear" },
  1: { label: "Mostly clear", icon: "Glow", symbol: "02", theme: "theme-clear" },
  2: { label: "Partly cloudy", icon: "Mix", symbol: "03", theme: "theme-cloudy" },
  3: { label: "Overcast", icon: "Cloud", symbol: "04", theme: "theme-cloudy" },
  45: { label: "Fog", icon: "Mist", symbol: "05", theme: "theme-cloudy" },
  48: { label: "Rime fog", icon: "Mist", symbol: "05", theme: "theme-cloudy" },
  51: { label: "Light drizzle", icon: "Drizzle", symbol: "06", theme: "theme-rain" },
  53: { label: "Drizzle", icon: "Drizzle", symbol: "06", theme: "theme-rain" },
  55: { label: "Heavy drizzle", icon: "Rain", symbol: "07", theme: "theme-rain" },
  56: { label: "Freezing drizzle", icon: "Rain", symbol: "07", theme: "theme-rain" },
  57: { label: "Dense freezing drizzle", icon: "Rain", symbol: "07", theme: "theme-rain" },
  61: { label: "Slight rain", icon: "Rain", symbol: "07", theme: "theme-rain" },
  63: { label: "Rain", icon: "Rain", symbol: "07", theme: "theme-rain" },
  65: { label: "Heavy rain", icon: "Storm", symbol: "08", theme: "theme-rain" },
  66: { label: "Freezing rain", icon: "Rain", symbol: "07", theme: "theme-rain" },
  67: { label: "Heavy freezing rain", icon: "Storm", symbol: "08", theme: "theme-rain" },
  71: { label: "Slight snow", icon: "Snow", symbol: "09", theme: "theme-cloudy" },
  73: { label: "Snow", icon: "Snow", symbol: "09", theme: "theme-cloudy" },
  75: { label: "Heavy snow", icon: "Snow", symbol: "09", theme: "theme-cloudy" },
  77: { label: "Snow grains", icon: "Snow", symbol: "09", theme: "theme-cloudy" },
  80: { label: "Rain showers", icon: "Showers", symbol: "10", theme: "theme-rain" },
  81: { label: "Rain showers", icon: "Showers", symbol: "10", theme: "theme-rain" },
  82: { label: "Violent showers", icon: "Storm", symbol: "08", theme: "theme-rain" },
  85: { label: "Snow showers", icon: "Snow", symbol: "09", theme: "theme-cloudy" },
  86: { label: "Heavy snow showers", icon: "Snow", symbol: "09", theme: "theme-cloudy" },
  95: { label: "Thunderstorm", icon: "Storm", symbol: "08", theme: "theme-rain" },
  96: { label: "Thunder with hail", icon: "Storm", symbol: "08", theme: "theme-rain" },
  99: { label: "Strong hailstorm", icon: "Storm", symbol: "08", theme: "theme-rain" }
};

function setStatus(message) {
  statusText.textContent = message;
}

function setLoadingState(isLoading) {
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    button.disabled = isLoading;
    button.style.opacity = isLoading ? "0.7" : "1";
  });
}

function getWeatherInfo(code, isDay = 1) {
  const fallback = { label: "Weather update", icon: "Now", symbol: "--", theme: "theme-cloudy" };
  const info = weatherCodeMap[code] || fallback;

  if (!isDay && (code === 0 || code === 1)) {
    return { label: "Clear night", icon: "Moon", symbol: "00", theme: "theme-night" };
  }

  return info;
}

function formatTemp(value) {
  return `${Math.round(value)}`;
}

function formatLocalTime(dateString, timeZone) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat([], {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone
  }).format(date);
}

function formatClock(dateString, timeZone) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
    timeZone
  }).format(date);
}

function comfortLabel(temp, wind, humidity) {
  if (temp >= 28 || humidity >= 85) {
    return { title: "Warm", summary: "Expect a sticky or hot feel today, especially outdoors." };
  }

  if (temp <= 5 || wind >= 30) {
    return { title: "Brisk", summary: "Cool air or stronger wind will make today feel sharper." };
  }

  return { title: "Balanced", summary: "Conditions look fairly comfortable for most plans." };
}

function applyTheme(themeName) {
  appShell.classList.remove("theme-clear", "theme-cloudy", "theme-rain", "theme-night");
  appShell.classList.add(themeName);
}

function renderForecast(daily, unitSymbol) {
  forecastGrid.innerHTML = "";

  daily.time.forEach((date, index) => {
    const node = forecastTemplate.content.firstElementChild.cloneNode(true);
    const weatherInfo = getWeatherInfo(daily.weather_code[index], 1);

    node.querySelector(".forecast-day").textContent = new Intl.DateTimeFormat([], {
      weekday: "short"
    }).format(new Date(date));
    node.querySelector(".forecast-icon").textContent = weatherInfo.symbol;
    node.querySelector(".forecast-desc").textContent = weatherInfo.label;
    node.querySelector(".forecast-max").textContent = `${Math.round(daily.temperature_2m_max[index])}${unitSymbol}`;
    node.querySelector(".forecast-min").textContent = `${Math.round(daily.temperature_2m_min[index])}${unitSymbol}`;

    forecastGrid.appendChild(node);
  });
}

function updateCurrentWeather(locationLabel, payload) {
  const { current, daily, timezone } = payload;
  const weatherInfo = getWeatherInfo(current.weather_code, current.is_day);
  const unitSymbol = currentUnit === "celsius" ? "°C" : "°F";
  const windSpeedUnit = currentUnit === "celsius" ? "km/h" : "mph";
  const comfort = comfortLabel(current.temperature_2m, current.wind_speed_10m, current.relative_humidity_2m);

  placeName.textContent = locationLabel;
  localTime.textContent = formatLocalTime(current.time, timezone);
  weatherBadge.textContent = weatherInfo.icon;
  temperatureValue.textContent = formatTemp(current.temperature_2m);
  temperatureUnit.textContent = unitSymbol;
  weatherDescription.textContent = weatherInfo.label;
  feelsLike.textContent = `Feels like ${Math.round(current.apparent_temperature)}${unitSymbol}`;
  windValue.textContent = `${Math.round(current.wind_speed_10m)} ${windSpeedUnit}`;
  humidityValue.textContent = `${current.relative_humidity_2m}%`;
  precipitationValue.textContent = `${current.precipitation.toFixed(1)} mm`;
  dayNightValue.textContent = current.is_day ? "Day" : "Night";
  sunriseValue.textContent = formatClock(daily.sunrise[0], timezone);
  sunsetValue.textContent = formatClock(daily.sunset[0], timezone);
  comfortPill.textContent = comfort.title;
  highlightSummary.textContent = comfort.summary;

  applyTheme(weatherInfo.theme);
  renderForecast(daily, unitSymbol);
}

async function fetchWeather(latitude, longitude, locationLabel) {
  const temperatureUnit = currentUnit === "celsius" ? "celsius" : "fahrenheit";
  const windSpeedUnit = currentUnit === "celsius" ? "kmh" : "mph";
  const url = new URL("https://api.open-meteo.com/v1/forecast");

  url.search = new URLSearchParams({
    latitude,
    longitude,
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "is_day",
      "precipitation",
      "weather_code",
      "wind_speed_10m"
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset"
    ].join(","),
    forecast_days: "7",
    timezone: "auto",
    temperature_unit: temperatureUnit,
    wind_speed_unit: windSpeedUnit,
    precipitation_unit: "mm"
  }).toString();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Weather service unavailable");
  }

  const data = await response.json();
  activeLocation = {
    latitude,
    longitude,
    label: locationLabel,
    timezone: data.timezone
  };

  updateCurrentWeather(locationLabel, data);
  setStatus(`Showing live weather for ${locationLabel}.`);
}

async function geocodeCity(query) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({
    name: query,
    count: "1",
    language: "en",
    format: "json"
  }).toString();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Search service unavailable");
  }

  const data = await response.json();
  if (!data.results || !data.results.length) {
    throw new Error("City not found. Try adding country or region.");
  }

  return data.results[0];
}

async function loadWeatherByQuery(query) {
  setLoadingState(true);
  setStatus(`Searching for ${query}...`);

  try {
    const result = await geocodeCity(query);
    const labelParts = [result.name, result.admin1, result.country].filter(Boolean);
    await fetchWeather(result.latitude, result.longitude, labelParts.join(", "));
  } catch (error) {
    setStatus(error.message || "Unable to load weather right now.");
  } finally {
    setLoadingState(false);
  }
}

function loadWeatherByCoordinates(latitude, longitude) {
  setLoadingState(true);
  setStatus("Finding weather for your location...");

  fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Reverse geocoding unavailable");
      }
      return response.json();
    })
    .then((data) => {
      const result = data.results?.[0];
      const label = result
        ? [result.name, result.admin1, result.country].filter(Boolean).join(", ")
        : "Your Location";

      return fetchWeather(latitude, longitude, label);
    })
    .catch((error) => {
      setStatus(error.message || "Unable to load your local weather.");
    })
    .finally(() => {
      setLoadingState(false);
    });
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = cityInput.value.trim();
  if (!query) {
    setStatus("Enter a city name to search.");
    return;
  }

  loadWeatherByQuery(query);
});

locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not supported in this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      loadWeatherByCoordinates(coords.latitude, coords.longitude);
    },
    () => {
      setStatus("Location access was denied. Search for a city instead.");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

unitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextUnit = button.dataset.unit;
    if (nextUnit === currentUnit) {
      return;
    }

    currentUnit = nextUnit;
    unitButtons.forEach((item) => item.classList.toggle("is-active", item === button));

    if (activeLocation) {
      setLoadingState(true);
      setStatus(`Refreshing weather in ${activeLocation.label}...`);
      fetchWeather(activeLocation.latitude, activeLocation.longitude, activeLocation.label)
        .catch((error) => {
          setStatus(error.message || "Unable to refresh weather right now.");
        })
        .finally(() => {
          setLoadingState(false);
        });
    }
  });
});

loadWeatherByQuery("Algiers");
