# Smart Road Trip Planner

A lightweight, frontend-focused web application for planning road trips with scenic routes, gas stations, and attractions.

## Features

- **Route Planning**: Enter start and destination points to calculate a scenic route
- **Gas Stations**: Find gas stations along your route
- **Attractions**: Discover interesting places to visit during your trip
- **Interactive Map**: View your route and points of interest on a sleek dark-themed map
- **Trip Summary**: See distance, time, and a list of stops

## Tech Stack

- **Backend**: Node.js with Express (serving static files only)
- **Frontend**: HTML, JavaScript, Tailwind CSS
- **APIs**: Google Maps JavaScript API (Maps, Directions, Places)

## Setup Instructions

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Replace the Google Maps API key in `public/index.html`:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&callback=initMap" async defer></script>
   ```
   Replace `YOUR_API_KEY` with your actual Google Maps API key. The key needs to have the following APIs enabled:
   - Maps JavaScript API
   - Directions API
   - Places API

4. Start the server:
   ```
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3000`

## API Key Instructions

To obtain a Google Maps API key:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to APIs & Services > Credentials
4. Create an API key
5. Enable the required APIs (Maps JavaScript API, Directions API, Places API)
6. (Optional) Restrict the API key to HTTP referrers for security

## Usage

1. Enter your starting point in the "Starting Point" field
2. Enter your destination in the "Destination" field
3. (Optional) Check "Prefer scenic routes" to avoid highways
4. (Optional) Check "Avoid toll roads" to skip toll routes
5. Click the "Plan My Trip" button
6. View your route on the map and see gas stations and attractions along the way
7. Click on markers to see more information about each location

## License

MIT 