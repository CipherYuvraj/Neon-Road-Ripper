# Smart Road Trip Planner

![Smart Road Trip Planner](https://i.imgur.com/qmYuQBJ.png)

## Overview

Smart Road Trip Planner is a modern web application designed to help travelers plan their road trips with detailed route information, gas station locations, attractions, cost estimation, and AI-powered assistance. The application features an interactive map interface with a sleek dark mode design and teal accent colors.

## Features

### 🗺️ Interactive Mapping
- Responsive map interface powered by Mapbox GL JS
- Custom route visualization with teal color scheme
- Interactive markers for start, end, gas stations, and attractions
- Distance overlay showing route length in km and miles

### 🚗 Route Planning
- Global location support with special enhancements for Indian travel
- Customizable routes with options for scenic routes and toll avoidance
- Detailed turn-by-turn directions
- Trip summary with distance and estimated duration

### ⛽ Gas Station Locator
- Automatic discovery of gas stations along your route
- Interactive gas station list with distance information
- Toggle gas station visibility with a single click

### 🏞️ Attraction Finder
- Discover interesting attractions along your journey
- Image gallery for attractions using Unsplash API with Flickr as fallback
- Rich attraction information with interactive markers
- Toggle attraction visibility

### 💰 Cost Calculator
- Detailed trip cost estimation for fuel expenses
- Customized for Indian travel with INR currency support
- Rest stop recommendations based on trip duration
- Toll expense estimates for major routes

### 🤖 AI Chatbot Assistant
- Integrated AI chatbot using Groq's LLama3 model
- Get weather conditions along your route
- Ask for personalized trip recommendations
- Natural language interaction for route inquiries

### 🌙 Dark Mode UI
- Modern dark-themed interface with teal neon accents
- Responsive design that works on desktop and mobile devices
- Animated transitions and interactive elements

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Tailwind CSS
- **Mapping**: Mapbox GL JS
- **Routing**: OpenRouteService API
- **Geocoding**: OpenRouteService Geocoding API
- **Points of Interest**: OpenRouteService POI API, Overpass API (fallback)
- **Image Search**: Unsplash API with Flickr API fallback
- **AI Integration**: Groq API (LLama3-8b model)
- **Weather Data**: Weather API integration

## Setup Instructions

### Prerequisites
- API Keys for:
  - OpenRouteService (`ORS_API_KEY`)
  - Mapbox (`MAPBOX_ACCESS_TOKEN`)
  - Unsplash (`UNSPLASH_ACCESS_KEY`)
  - Groq (`GROQ_API_KEY`) - optional, for AI features

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/smart-road-trip-planner.git
   cd smart-road-trip-planner
   ```

2. Update API keys in `script.js`:
   ```javascript
   const ORS_API_KEY = 'your_openrouteservice_api_key';
   const MAPBOX_ACCESS_TOKEN = 'your_mapbox_api_key';
   const UNSPLASH_ACCESS_KEY = 'your_unsplash_api_key';
   ```

3. Update Groq API key in `chatbot.js` (if using AI features):
   ```javascript
   const GROQ_API_KEY = 'your_groq_api_key';
   ```

4. Serve the application:
   - For local development, you can use a simple HTTP server:
     ```bash
     # Python 3
     python -m http.server
     
     # Or with Node.js
     npx serve
     ```
   - Or deploy to your preferred hosting service

5. Access the application in your browser at `http://localhost:8000` or your hosted URL

## Usage Guide

### Planning a Trip
1. Enter a starting location and destination in the input fields
2. Optionally select route preferences (scenic routes, avoid tolls)
3. Click "Plan My Trip" to calculate and display the route
4. View trip summary with distance, duration, and cost estimates

### Finding Gas Stations & Attractions
1. After planning a trip, gas stations and attractions along the route are automatically discovered
2. Use the "Gas Stations" and "Attractions" toggle buttons to show/hide markers
3. Click on markers or list items to view more details
4. For attractions, click "View Photos" to open the image gallery

### Using the AI Chatbot
1. Click the chat icon in the bottom-right corner to open the chatbot panel
2. Ask questions about your trip, such as:
   - "What's the weather like along my route?"
   - "Recommend attractions between Delhi and Mumbai"
   - "How long will it take to drive from Bangalore to Chennai?"
   - "What's the fuel cost for this trip?"

## Deployment

This application is ready for deployment on various platforms. For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Quick Deployment Options

- **Vercel**: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fsmart-road-trip-planner)
- **Heroku**: [![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/yourusername/smart-road-trip-planner)
- **Netlify**: [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/smart-road-trip-planner)

Remember to set your environment variables as described in the deployment guide.

## API Reference

### OpenRouteService
- **Geocoding**: Convert location names to coordinates
- **Directions**: Calculate routes between locations
- **Places**: Find points of interest along routes

### Mapbox GL JS
- Map rendering and interaction
- Custom marker and layer styling
- Route visualization

### Unsplash API
- Search for high-quality images of attractions
- Display image galleries

### Groq API
- Natural language processing for the chatbot
- Trip cost calculations and recommendations

## Project Structure

```
smart-road-trip-planner/
├── public/               # Static files
│   ├── index.html        # Main HTML file
│   ├── styles.css        # External CSS styles
│   ├── script.js         # Main application logic
│   ├── chatbot.js        # AI chatbot integration
│   └── deployment-config.js # Environment variable handling
├── server.js             # Express server for serving the application
├── package.json          # Project dependencies and scripts
├── .env.example          # Example environment variables
├── .gitignore            # Git ignore configuration
├── vercel.json           # Vercel deployment configuration
├── Procfile              # Heroku deployment configuration
├── DEPLOYMENT.md         # Detailed deployment instructions
└── README.md             # This documentation
```

## Customization Options

### Changing Default Locations
- Update placeholder text in `script.js` to show different default locations
- Modify the default map center in the `initMap()` function

### Styling
- Modify the color scheme by updating CSS variables in `styles.css`
- Customize UI components using Tailwind classes in `index.html`

### Indian Travel Customization
- Fuel consumption and price defaults are set for Indian travel (15km/liter, ₹100/liter)
- Modify these values in the `calculateTripCosts()` function if needed

## Limitations & Known Issues

- Route calculation may fail for very long distances
- POI discovery depends on OpenRouteService API coverage
- Some attractions may not have available images
- Weather data is approximate and may not be available for all locations

## Future Enhancements

- Add multi-stop route planning
- Implement user accounts for saving trips
- Incorporate real-time traffic data
- Add more transportation options (walking, cycling, public transport)
- Enhance offline capabilities

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- OpenRouteService for routing and POI APIs
- Mapbox for mapping technology
- Unsplash and Flickr for image search capabilities
- Groq for AI chatbot capabilities

---

© 2025 Smart Road Trip Planner | Made with ♥ for global travelers 