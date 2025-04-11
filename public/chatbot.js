// Chatbot functionality for Smart Road Trip Planner
document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const chatbotButton = document.getElementById('chatbot-button');
  const chatbotPanel = document.getElementById('chatbot-panel');
  const chatbotClose = document.getElementById('chatbot-close');
  const chatbotInput = document.getElementById('chatbot-input');
  const chatbotSend = document.getElementById('chatbot-send');
  const chatbotMessages = document.getElementById('chatbot-messages');
  
  // Weather API key - OpenWeatherMap (Free tier)
  const WEATHER_API_KEY = '5fa27f5ad98ea9590d1bf51dad39c241';
  
  // Toggle chatbot panel visibility
  chatbotButton.addEventListener('click', () => {
    chatbotPanel.classList.add('active');
  });
  
  chatbotClose.addEventListener('click', () => {
    chatbotPanel.classList.remove('active');
  });
  
  // Handle sending messages
  const sendMessage = () => {
    const message = chatbotInput.value.trim();
    if (message === '') return;
    
    // Add user message to chat
    addMessage(message, 'user');
    chatbotInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Process the message
    processUserMessage(message);
  };
  
  // Send message on button click
  chatbotSend.addEventListener('click', sendMessage);
  
  // Send message on Enter key
  chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // Add a message to the chat
  function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chatbot-message');
    messageElement.classList.add(sender + '-message');
    messageElement.textContent = text;
    chatbotMessages.appendChild(messageElement);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }
  
  // Show typing indicator
  function showTypingIndicator() {
    const typingIndicator = document.createElement('div');
    typingIndicator.classList.add('typing-indicator');
    typingIndicator.id = 'typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    chatbotMessages.appendChild(typingIndicator);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }
  
  // Hide typing indicator
  function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
  
  // Process user message
  async function processUserMessage(message) {
    // Lowercase message for easier matching
    const lowerMessage = message.toLowerCase();
    
    // Delay to simulate thinking
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check for weather related queries
    if (
      lowerMessage.includes('weather') || 
      lowerMessage.includes('temperature') || 
      lowerMessage.includes('rain') || 
      lowerMessage.includes('forecast')
    ) {
      // Extract location from the message or use route information
      let location = '';
      
      // Try to extract location after "in"
      const inMatch = lowerMessage.match(/weather\s+in\s+([a-z\s]+)/i);
      if (inMatch && inMatch[1]) {
        location = inMatch[1].trim();
      } 
      // Try to extract location at the beginning
      else {
        const startMatch = lowerMessage.match(/^([a-z\s]+)\s+weather/i);
        if (startMatch && startMatch[1]) {
          location = startMatch[1].trim();
        }
      }
      
      // If no location found but we have a route, use the destination
      if (!location && window.currentRoute) {
        location = window.currentEndAddress || '';
      }
      
      // If we have a location, fetch weather
      if (location) {
        fetchWeather(location);
      } else {
        // Ask for a location
        hideTypingIndicator();
        addMessage("Which location's weather would you like to know about?", 'bot');
      }
      return;
    }
    
    // Check for route information queries
    if (
      lowerMessage.includes('route') || 
      lowerMessage.includes('distance') || 
      lowerMessage.includes('how far') || 
      lowerMessage.includes('how long')
    ) {
      hideTypingIndicator();
      if (window.currentDistance && window.currentDuration) {
        const hours = Math.floor(window.currentDuration / 3600);
        const minutes = Math.floor((window.currentDuration % 3600) / 60);
        addMessage(`Your current route is ${(window.currentDistance / 1000).toFixed(1)} km and will take approximately ${hours} hours and ${minutes} minutes.`, 'bot');
      } else {
        addMessage("I don't see an active route. Please plan a route first using the form above.", 'bot');
      }
      return;
    }
    
    // Check for attraction queries
    if (
      lowerMessage.includes('attraction') || 
      lowerMessage.includes('see') || 
      lowerMessage.includes('visit') || 
      lowerMessage.includes('place') ||
      lowerMessage.includes('tourist')
    ) {
      hideTypingIndicator();
      if (window.attractionsList && window.attractionsList.length > 0) {
        let response = "Here are some attractions along your route:\n";
        const attractions = window.attractionsList.slice(0, 3);
        attractions.forEach((attraction, i) => {
          response += `${i+1}. ${attraction.name}\n`;
        });
        response += "\nYou can see them on the map by making sure the Attractions toggle is enabled.";
        addMessage(response, 'bot');
      } else {
        addMessage("I don't see any attractions loaded. Please plan a route first, and I'll find attractions along the way.", 'bot');
      }
      return;
    }
    
    // Check for gas station queries
    if (
      lowerMessage.includes('gas') || 
      lowerMessage.includes('fuel') || 
      lowerMessage.includes('petrol') || 
      lowerMessage.includes('station') ||
      lowerMessage.includes('refill')
    ) {
      hideTypingIndicator();
      if (window.gasStationsList && window.gasStationsList.length > 0) {
        let response = "Here are some gas stations along your route:\n";
        const stations = window.gasStationsList.slice(0, 3);
        stations.forEach((station, i) => {
          response += `${i+1}. ${station.name}\n`;
        });
        response += "\nYou can see them on the map by making sure the Gas Stations toggle is enabled.";
        addMessage(response, 'bot');
      } else {
        addMessage("I don't see any gas stations loaded. Please plan a route first, and I'll find gas stations along the way.", 'bot');
      }
      return;
    }
    
    // Default responses for other queries
    const defaultResponses = [
      "I can help with weather information, route details, attractions, and gas stations. What would you like to know?",
      "Try asking me about the weather at your destination, attractions along your route, or nearby gas stations.",
      "I'm your trip assistant. I can provide information about your route, weather conditions, and points of interest.",
      "Need help planning your trip? Ask me about weather, attractions, or gas stations along your route."
    ];
    
    hideTypingIndicator();
    addMessage(defaultResponses[Math.floor(Math.random() * defaultResponses.length)], 'bot');
  }
  
  // Fetch weather data from OpenWeatherMap API
  async function fetchWeather(location) {
    try {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: {
          q: location,
          appid: WEATHER_API_KEY,
          units: 'metric'
        }
      });
      
      const data = response.data;
      const weatherDescription = data.weather[0].description;
      const temperature = data.main.temp;
      const feelsLike = data.main.feels_like;
      const humidity = data.main.humidity;
      const windSpeed = data.wind.speed;
      
      hideTypingIndicator();
      
      // Create a formatted weather message
      const weatherHTML = `
        <div>Current weather in ${data.name}:</div>
        <div class="weather-card">
          <h4>${weatherDescription.charAt(0).toUpperCase() + weatherDescription.slice(1)}</h4>
          <div>🌡️ Temperature: ${temperature.toFixed(1)}°C (Feels like: ${feelsLike.toFixed(1)}°C)</div>
          <div>💧 Humidity: ${humidity}%</div>
          <div>💨 Wind: ${windSpeed} m/s</div>
        </div>
      `;
      
      // Create a weather message element
      const messageElement = document.createElement('div');
      messageElement.classList.add('chatbot-message');
      messageElement.classList.add('bot-message');
      messageElement.innerHTML = weatherHTML;
      chatbotMessages.appendChild(messageElement);
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
      
    } catch (error) {
      console.error('Error fetching weather:', error);
      hideTypingIndicator();
      addMessage(`I couldn't find weather information for ${location}. Please try another location.`, 'bot');
    }
  }
}); 