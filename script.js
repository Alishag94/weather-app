// --- Sound Management ---
const weatherSounds = {
  sun: "sounds/birds.mp3",
  rain: "sounds/rain.mp3",
  wind: "sounds/wind.mp3",
  snow: "sounds/snow.mp3",
};
let currentAudio = null;

function playWeatherSound(type) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (weatherSounds[type]) {
    currentAudio = new Audio(weatherSounds[type]);
    currentAudio.loop = true;
    currentAudio.volume = 0.5;
    currentAudio.play();
  }
}
function stopWeatherSound() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

// --- Overlay Management ---
function showWeatherOverlay(type) {
  document.getElementById('sunOverlay').classList.remove('active');
  document.getElementById('rainOverlay').classList.remove('active');
  document.getElementById('windOverlay').classList.remove('active');
  document.getElementById('snowOverlay').classList.remove('active');
  if (type && document.getElementById(type + 'Overlay')) {
    document.getElementById(type + 'Overlay').classList.add('active');
  }
}

// --- Main Weather Fetch ---
async function getWeather(cityInput = null) {
  const city = cityInput || document.getElementById("cityInput").value.trim();
  const output = document.getElementById("output");
  const useFahrenheit = document.getElementById("unitToggle").checked;
  const icon = document.getElementById("weatherIcon");
  const bg = document.getElementById("backgroundEffect");
  const forecastElement = document.getElementById("forecast");

  if (!city) {
    output.textContent = "Please enter a city name.";
    icon.style.display = "none";
    bg.style.backgroundImage = "";
    showWeatherOverlay();
    stopWeatherSound();
    return;
  }

  output.textContent = `Fetching weather for ${city}...`;
  icon.style.display = "none";
  showWeatherOverlay();
  stopWeatherSound();
  forecastElement.innerHTML = "";

  try {
    // 1. Geocode
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`);
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      output.textContent = "City not found.";
      return;
    }
    const { latitude, longitude, name } = geoData.results[0];
    const unit = useFahrenheit ? "fahrenheit" : "celsius";

    // 2. Current weather
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=${unit}`);
    const weatherData = await weatherRes.json();
    const temp = weatherData.current_weather.temperature;
    const code = weatherData.current_weather.weathercode;

    output.textContent = `Current temperature in ${name}: ${temp}°${useFahrenheit ? "F" : "C"}`;

    // 3. Weather Icon
    let iconUrl = "";
    if ([0, 1].includes(code)) iconUrl = "https://cdn.weatherbit.io/static/img/icons/c01d.png"; // Clear
    else if ([2, 3].includes(code)) iconUrl = "https://cdn.weatherbit.io/static/img/icons/c02d.png"; // Cloudy/Wind
    else if ([45, 48].includes(code)) iconUrl = "https://cdn.weatherbit.io/static/img/icons/a05d.png"; // Fog/Wind
    else if ([51, 61, 63, 80].includes(code)) iconUrl = "https://cdn.weatherbit.io/static/img/icons/r01d.png"; // Rain
    else if ([71, 73, 75, 85].includes(code)) iconUrl = "https://cdn.weatherbit.io/static/img/icons/s02d.png"; // Snow
    else iconUrl = "https://cdn.weatherbit.io/static/img/icons/u00d.png";
    icon.src = iconUrl;
    icon.style.display = "inline-block";

    // 4. Effects and Sounds
    // Sun: code 0, 1 | Rain: 51, 61, 63, 80 | Wind: 2, 3, 45, 48 | Snow: 71, 73, 75, 85
    if ([0, 1].includes(code)) {
      bg.style.backgroundImage = "linear-gradient(to bottom right, #fceabb, #f8b500)";
      showWeatherOverlay("sun");
      playWeatherSound("sun");
    } else if ([51, 61, 63, 80].includes(code)) {
      bg.style.backgroundImage = "linear-gradient(to bottom right, #4a90e2, #3b5998)";
      showWeatherOverlay("rain");
      playWeatherSound("rain");
    } else if ([71, 73, 75, 85].includes(code)) {
      bg.style.backgroundImage = "linear-gradient(to bottom right, #e0f7fa, #b2ebf2)";
      showWeatherOverlay("snow");
      playWeatherSound("snow");
    } else if ([2, 3, 45, 48].includes(code)) {
      bg.style.backgroundImage = "linear-gradient(to bottom right, #b0bec5, #eceff1)";
      showWeatherOverlay("wind");
      playWeatherSound("wind");
    } else {
      bg.style.backgroundImage = "linear-gradient(to bottom right, #dddddd, #eeeeee)";
      showWeatherOverlay();
      stopWeatherSound();
    }

    // 5. 7-day forecast
    const forecastRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`
    );
    const forecastData = await forecastRes.json();
    const days = forecastData.daily.time;
    const tempsMax = forecastData.daily.temperature_2m_max;
    const tempsMin = forecastData.daily.temperature_2m_min;
    const codes = forecastData.daily.weathercode;

    for (let i = 0; i < days.length; i++) {
      const date = new Date(days[i]).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      let forecastIcon = "";
      if ([0, 1].includes(codes[i])) forecastIcon = "https://cdn.weatherbit.io/static/img/icons/c01d.png";
      else if ([2, 3].includes(codes[i])) forecastIcon = "https://cdn.weatherbit.io/static/img/icons/c02d.png";
      else if ([45, 48].includes(codes[i])) forecastIcon = "https://cdn.weatherbit.io/static/img/icons/a05d.png";
      else if ([51, 61, 63, 80].includes(codes[i])) forecastIcon = "https://cdn.weatherbit.io/static/img/icons/r01d.png";
      else if ([71, 73, 75, 85].includes(codes[i])) forecastIcon = "https://cdn.weatherbit.io/static/img/icons/s02d.png";
      else forecastIcon = "https://cdn.weatherbit.io/static/img/icons/u00d.png";

      forecastElement.innerHTML += `
        <div class="bg-white/80 backdrop-blur-md rounded-xl shadow-md p-4 flex flex-col items-center space-y-2">
          <div class="text-sm font-medium">${date}</div>
          <img src="${forecastIcon}" alt="" class="w-10 h-10" />
          <div class="text-sm">
            <span class="font-semibold">${tempsMax[i]}&deg;</span> / <span>${tempsMin[i]}&deg;</span>
          </div>
        </div>
      `;
    }
  } catch (error) {
    output.textContent = "Something went wrong. Try again later.";
    icon.style.display = "none";
    showWeatherOverlay();
    stopWeatherSound();
    console.error("Error:", error);
  }
}

// --- Auto-location on load ---
window.onload = function () {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}`);
        const data = await res.json();
        if (data && data.name) {
          document.getElementById("cityInput").value = data.name;
          getWeather(data.name);
        }
      } catch (err) {
        console.error("Location error:", err);
      }
    });
  }
};

// --- Event Listeners ---
document.getElementById('fetchBtn').addEventListener('click', () => getWeather());
document.getElementById('unitToggle').addEventListener('change', () => getWeather());
document.getElementById('cityInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') getWeather();
});