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
  const WEATHER_API_KEY = '03e28cb2274d124535328b83b4f64ff4';
  
  // Groq API key - use the one from deployment-config.js or fallback to a default
  const GROQ_API_KEY = window.GROQ_API_KEY || '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';
  
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
  
  // Add a message with HTML to the chat
  function addHTMLMessage(html, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chatbot-message');
    messageElement.classList.add(sender + '-message');
    messageElement.innerHTML = html;
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
      if (!location && window.currentEndAddress) {
        location = window.currentEndAddress.split(',')[0]; // Use just the city name
      }
      
      // If we have a location, fetch weather
      if (location) {
        console.log("Fetching weather for:", location);
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
    
    // Check for attraction queries - use Groq API
    if (
      lowerMessage.includes('attraction') || 
      lowerMessage.includes('see') || 
      lowerMessage.includes('visit') || 
      lowerMessage.includes('place') ||
      lowerMessage.includes('tourist') ||
      lowerMessage.includes('things to do')
    ) {
      if (window.currentStartAddress && window.currentEndAddress) {
        const startCity = window.currentStartAddress.split(',')[0];
        const endCity = window.currentEndAddress.split(',')[0];
        fetchRouteAttractionsWithGroq(startCity, endCity, message);
      } else if (window.attractionsList && window.attractionsList.length > 0) {
        const attractions = window.attractionsList.slice(0, 3);
        let attractionsHTML = `<div>Here are some attractions along your route:</div>
                             <div class="attractions-list">`;
        
        attractions.forEach((attraction, i) => {
          attractionsHTML += `<div class="attraction-item">
                            <span class="attraction-number">${i+1}.</span> 
                            <span class="attraction-name">${attraction.name}</span>
                          </div>`;
        });
        
        attractionsHTML += `</div>
                         <div class="attraction-tip">You can see them on the map by making sure the Attractions toggle is enabled.</div>`;
        
        hideTypingIndicator();
        addHTMLMessage(attractionsHTML, 'bot');
      } else {
        hideTypingIndicator();
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
        const stations = window.gasStationsList.slice(0, 3);
        let stationsHTML = `<div>Here are some gas stations along your route:</div>
                          <div class="stations-list">`;
        
        stations.forEach((station, i) => {
          stationsHTML += `<div class="station-item">
                         <span class="station-number">${i+1}.</span> 
                         <span class="station-name">${station.name}</span>
                         <span class="station-distance">(${(station.distance/1000).toFixed(1)} km from route)</span>
                       </div>`;
        });
        
        stationsHTML += `</div>
                      <div class="station-tip">You can view them on the map by enabling the Gas Stations toggle.</div>`;
        
        addHTMLMessage(stationsHTML, 'bot');
      } else {
        addMessage("I don't see any gas stations loaded. Please plan a route first, and I'll find gas stations along the way.", 'bot');
      }
      return;
    }
    
    // Use Groq API for general questions
    if (message.trim().endsWith('?') || 
        message.length > 15 || 
        lowerMessage.includes('what') || 
        lowerMessage.includes('how') ||
        lowerMessage.includes('why') ||
        lowerMessage.includes('can you')) {
      fetchGroqResponse(message);
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
  
  // Fetch weather data from OpenWeatherMap API - using native fetch instead of axios
  async function fetchWeather(location) {
    try {
      console.log(`Fetching weather for ${location} with API key ${WEATHER_API_KEY}`);
      
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${WEATHER_API_KEY}&units=metric`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Weather API response:", data);
      
      const weatherDescription = data.weather[0].description;
      const temperature = data.main.temp;
      const feelsLike = data.main.feels_like;
      const humidity = data.main.humidity;
      const windSpeed = data.wind.speed;
      const icon = data.weather[0].icon;
      
      hideTypingIndicator();
      
      // Create a formatted weather message with icon
      const weatherHTML = `
        <div>Current weather in ${data.name}:</div>
        <div class="weather-card">
          <div class="weather-icon">
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${weatherDescription}">
          </div>
          <div class="weather-details">
            <h4>${weatherDescription.charAt(0).toUpperCase() + weatherDescription.slice(1)}</h4>
            <div>🌡️ Temperature: ${temperature.toFixed(1)}°C (Feels like: ${feelsLike.toFixed(1)}°C)</div>
            <div>💧 Humidity: ${humidity}%</div>
            <div>💨 Wind: ${windSpeed} m/s</div>
          </div>
        </div>
      `;
      
      // Create a weather message element
      addHTMLMessage(weatherHTML, 'bot');
      
    } catch (error) {
      console.error('Error fetching weather:', error);
      hideTypingIndicator();
      addMessage(`I couldn't find weather information for ${location}. Please try another location.`, 'bot');
    }
  }
  
  // Fetch attractions using Groq API - using native fetch
  async function fetchAttractionsWithGroq(destination, userQuery) {
    try {
      hideTypingIndicator();
      showTypingIndicator();
      
      const prompt = `You are a travel assistant. The user is planning a trip to ${destination} and wants to know about attractions or things to do there. Their query was: "${userQuery}". 
      
      Provide a concise list of 5 specific attractions or activities in ${destination} that would appeal to most travelers. Format it as a numbered list with brief 1-line descriptions for each. Focus on the most popular or interesting places. Keep your response under 200 words and make it enthusiastic but factual.`;
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: "You are a helpful travel assistant providing concise, accurate information about attractions and points of interest." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });
      
      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Groq API response:", data);
      
      if (data && data.choices && data.choices[0]) {
        const attractionsText = data.choices[0].message.content;
        
        // Format the attractions with nice HTML
        const formattedHTML = `
          <div class="groq-attractions">
            <div class="groq-attractions-title">Top attractions in ${destination}:</div>
            <div class="groq-attractions-content">${attractionsText.replace(/\n/g, '<br>')}</div>
          </div>
        `;
        
        hideTypingIndicator();
        addHTMLMessage(formattedHTML, 'bot');
      } else {
        throw new Error("Invalid response from Groq API");
      }
    } catch (error) {
      console.error('Error fetching attractions with Groq:', error);
      hideTypingIndicator();
      
      // Fallback to basic attractions list
      if (window.attractionsList && window.attractionsList.length > 0) {
        const attractions = window.attractionsList.slice(0, 3);
        let response = "Here are some attractions along your route:\n";
        attractions.forEach((attraction, i) => {
          response += `${i+1}. ${attraction.name}\n`;
        });
        response += "\nYou can see them on the map by making sure the Attractions toggle is enabled.";
        addMessage(response, 'bot');
      } else {
        addMessage(`I couldn't get information about attractions in ${destination} right now. Please try again later.`, 'bot');
      }
    }
  }
  
  // Fetch route attractions using Groq API - using native fetch
  async function fetchRouteAttractionsWithGroq(startCity, endCity, userQuery) {
    try {
      hideTypingIndicator();
      showTypingIndicator();
      
      // Determine if we have intermediate cities or locations
      let routeDescription = '';
      let majorLocations = [];
      if (window.currentRoute && window.currentRoute.features && window.currentRoute.features[0].properties.segments) {
        const segments = window.currentRoute.features[0].properties.segments;
        if (segments[0] && segments[0].steps) {
          const steps = segments[0].steps;
          // Extract major cities from the route steps
          majorLocations = steps
            .filter(step => step.name && step.name.length > 3)
            .map(step => step.name)
            .filter((name, index, self) => self.indexOf(name) === index)
            .slice(0, 5); // Limit to 5 major points
            
          if (majorLocations.length > 0) {
            routeDescription = `, passing through ${majorLocations.join(', ')}`;
          }
        }
      }
      
      // Create a comprehensive prompt for the route
      const prompt = `You are a travel assistant. The user is planning a road trip from ${startCity} to ${endCity}${routeDescription} and wants to know about attractions to visit along this route. Their query was: "${userQuery}".
      
      Provide a detailed response with the following structure:
      
      1. A brief introduction about the route's tourism potential (1-2 sentences only)
      2. A list of 10 must-visit attractions along this entire route (not just at the destination)
      3. Group attractions by location/city when possible
      4. For each attraction, provide a one-line description of what makes it interesting
      5. Include a mix of natural landmarks, historical sites, and entertainment venues
      
      Format the attractions in a numbered list with city/location names as subheadings in bold or with markdown (e.g., **City Name**). Your entire response should be under 400 words and enthusiastic but factual.`;
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: "You are a helpful travel assistant providing concise, accurate information about road trips and attractions along routes. You specialize in providing well-organized lists of diverse attractions that cover the entire journey, not just the destination." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 600
        })
      });
      
      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Groq Route Attractions API response:", data);
      
      if (data && data.choices && data.choices[0]) {
        const attractionsText = data.choices[0].message.content;
        
        // Create a visual route representation
        let routeVisualization = `
          <div class="route-attractions-map">
            <span class="route-start">${startCity}</span>
            <span class="route-line"></span>
        `;
        
        // Add intermediate points if available
        if (majorLocations.length > 0) {
          // Only show up to 3 intermediate locations to avoid clutter
          const displayLocations = majorLocations.slice(0, Math.min(3, majorLocations.length));
          displayLocations.forEach(location => {
            routeVisualization += `
              <span class="route-mid">${location}</span>
              <span class="route-line"></span>
            `;
          });
        }
        
        routeVisualization += `<span class="route-end">${endCity}</span></div>`;
        
        // Format the attractions with nice HTML
        const formattedHTML = `
          <div class="groq-attractions">
            <div class="groq-attractions-title">Top attractions from ${startCity} to ${endCity}:</div>
            ${routeVisualization}
            <div class="groq-attractions-content">${attractionsText
              .replace(/\n/g, '<br>')
              .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
              .replace(/^(\d+)\./gm, '<strong>$1.</strong>')}
            </div>
          </div>
        `;
        
        hideTypingIndicator();
        addHTMLMessage(formattedHTML, 'bot');
      } else {
        throw new Error("Invalid response from Groq API");
      }
    } catch (error) {
      console.error('Error fetching route attractions with Groq:', error);
      hideTypingIndicator();
      
      // Try the destination-only approach as fallback
      try {
        fetchAttractionsWithGroq(endCity, userQuery);
      } catch (fallbackError) {
        // Final fallback to basic attractions list
        if (window.attractionsList && window.attractionsList.length > 0) {
          const attractions = window.attractionsList.slice(0, 3);
          let response = "Here are some attractions along your route:\n";
          attractions.forEach((attraction, i) => {
            response += `${i+1}. ${attraction.name}\n`;
          });
          response += "\nYou can see them on the map by making sure the Attractions toggle is enabled.";
          addMessage(response, 'bot');
        } else {
          addMessage(`I couldn't get information about attractions between ${startCity} and ${endCity} right now. Please try again later.`, 'bot');
        }
      }
    }
  }
  
  // Fetch general response using Groq API - using native fetch
  async function fetchGroqResponse(userQuery) {
    try {
      const routeInfo = window.currentStartAddress && window.currentEndAddress ? 
        `The user is planning a road trip from ${window.currentStartAddress} to ${window.currentEndAddress}.` : 
        'The user is planning a road trip.';
      
      const prompt = `${routeInfo} They asked: "${userQuery}". 
      
      Provide a helpful, concise response that directly answers their question. Keep it under 100 words and be friendly but to the point.`;
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: "You are a travel assistant providing concise, helpful information to travelers planning road trips." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });
      
      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.choices && data.choices[0]) {
        hideTypingIndicator();
        addMessage(data.choices[0].message.content, 'bot');
      } else {
        throw new Error("Invalid response from Groq API");
      }
    } catch (error) {
      console.error('Error fetching response from Groq:', error);
      hideTypingIndicator();
      addMessage("I'm not sure about that. Could you ask something about your trip, weather, or attractions?", 'bot');
    }
  }
}); 