// Global variables
let map;
let routeLayer;
let startMarker;
let endMarker;
let markers = [];
let gasMarkers = [];
let attractionMarkers = [];
let showGasStations = true;
let showAttractions = true;
let currentDistance = 0;
let currentGalleryIndex = 0;
let galleryImages = [];

// OpenRouteService API key - replace with your own
const ORS_API_KEY = '5b3ce3597851110001cf624829442a9f43784ad9856a716a1af57237';

// Mapbox access token - replace with your own
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoicm9uYWs0MTQxNDEiLCJhIjoiY205ZDJuZTF3MDYzMTJrc2ExcHlsMHJyeSJ9.bm4bo3kjtKwlvVbL1Mdirg';

// Unsplash API key for better images - replace with your own
const UNSPLASH_ACCESS_KEY = 'w30gVPHf6paeTEWGQgP2maO_u5K4ncjRE4EAHicCskg'; // Add your key here

// Initialize OpenRouteService clients
const orsDirections = new Openrouteservice.Directions({ api_key: ORS_API_KEY });
const orsGeocode = new Openrouteservice.Geocode({ api_key: ORS_API_KEY });
// Note: We're not using the client for POIs anymore since we're using direct fetch calls

// Map initialization function
function initMap() {
  // Set Mapbox access token
  mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
  
  // Initialize the map with center closer to a global view
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10', // Dark theme for tech vibe
    center: [0, 20], // More central global view
    zoom: 2 // Zoomed out to see more of the world
  });
  
  // Add navigation controls
  map.addControl(new mapboxgl.NavigationControl(), 'top-left');
  
  // Wait for map to load before adding event listeners
  map.on('load', function() {
    // Add custom layers for route
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      }
    });
    
    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#19e6b3', // Changed to teal to match the new theme
        'line-width': 6,
        'line-opacity': 0.8,
        'line-dasharray': [0, 2]
      }
    });
    
    // Add form submit listener
    document.getElementById('trip-form').addEventListener('submit', (e) => {
      e.preventDefault();
      calculateRoute();
    });
    
    // Add toggle button listeners
    document.getElementById('toggle-gas').addEventListener('click', toggleGasStations);
    document.getElementById('toggle-attractions').addEventListener('click', toggleAttractions);
    
    // Add gallery control listeners
    document.getElementById('gallery-close').addEventListener('click', closeGallery);
    document.getElementById('prev-image').addEventListener('click', showPrevImage);
    document.getElementById('next-image').addEventListener('click', showNextImage);
    
    // Show example locations for India
    document.getElementById('start').placeholder = 'Enter starting location (e.g., Delhi, India)';
    document.getElementById('end').placeholder = 'Enter destination (e.g., Mumbai, India)';
  });
}

// Toggle gas stations visibility
function toggleGasStations() {
  showGasStations = !showGasStations;
  const gasIcon = document.getElementById('gas-icon');
  
  gasMarkers.forEach(marker => {
    if (showGasStations) {
      // For Mapbox, we don't need to add it back, just make it visible
      marker.getElement().style.display = 'block';
      
      // Add bounce animation via DOM element
      const element = marker.getElement();
      element.classList.add('bounce-animation');
      setTimeout(() => element.classList.remove('bounce-animation'), 600);
    } else {
      // Hide the marker instead of removing it
      marker.getElement().style.display = 'none';
    }
  });
  
  // Update icon
  gasIcon.textContent = showGasStations ? '🟢' : '🔴';
}

// Toggle attractions visibility
function toggleAttractions() {
  showAttractions = !showAttractions;
  const attractionsIcon = document.getElementById('attractions-icon');
  
  attractionMarkers.forEach(marker => {
    if (showAttractions) {
      // For Mapbox, we don't need to add it back, just make it visible
      marker.getElement().style.display = 'block';
      
      // Add bounce animation via DOM element
      const element = marker.getElement();
      element.classList.add('bounce-animation');
      setTimeout(() => element.classList.remove('bounce-animation'), 600);
    } else {
      // Hide the marker instead of removing it
      marker.getElement().style.display = 'none';
    }
  });
  
  // Update icon
  attractionsIcon.textContent = showAttractions ? '🟢' : '🔴';
  
  // If showing attractions and we have images, also show gallery
  if (showAttractions && attractionMarkers.length > 0) {
    fetchAttractionImages();
  }
}

// Calculate route between start and destination
async function calculateRoute() {
  const start = document.getElementById('start').value;
  const end = document.getElementById('end').value;

  if (!start || !end) {
    alert('Please enter both start and destination locations.');
    return;
  }

  const loadingElement = document.getElementById('loading');
  loadingElement.classList.remove('hidden');
  clearMarkers();

  try {
    // Geocode start location (removed US restriction)
    const startGeocode = await orsGeocode.geocode({
      text: start
    });
    
    // Geocode destination (removed US restriction)
    const endGeocode = await orsGeocode.geocode({
      text: end
    });
    
    if (!startGeocode.features || startGeocode.features.length === 0) {
      throw new Error(`Could not find location: ${start}`);
    }
    
    if (!endGeocode.features || endGeocode.features.length === 0) {
      throw new Error(`Could not find location: ${end}`);
    }
    
    const startCoords = startGeocode.features[0].geometry.coordinates;
    const endCoords = endGeocode.features[0].geometry.coordinates;
    const startAddress = startGeocode.features[0].properties.label;
    const endAddress = endGeocode.features[0].properties.label;
    
    // Calculate route
    await fetchRoute(startCoords, endCoords, startAddress, endAddress);
    
  } catch (error) {
    console.error('Error during route calculation:', error);
    alert(`Error: ${error.message || 'An error occurred while planning your route. Please try different locations.'}`);
    loadingElement.classList.add('hidden');
  }
}

// Fetch route from OpenRouteService
async function fetchRoute(startCoords, endCoords, startAddress, endAddress) {
  const avoidHighways = document.getElementById('avoid-highways').checked;
  const avoidTolls = document.getElementById('avoid-tolls').checked;
  const loadingElement = document.getElementById('loading');
  
  try {
    // Set route options
    const routeOptions = {
      coordinates: [startCoords, endCoords],
      profile: 'driving-car',
      preference: avoidHighways ? 'shortest' : 'recommended',
      instructions: true,
      format: 'geojson'
    };
    
    // Add avoid tolls if checked
    if (avoidTolls) {
      routeOptions.options = {
        avoid_features: ['tollways']
      };
    }
    
    // Get route from OpenRouteService
    const routeResponse = await orsDirections.calculate(routeOptions);
    
    // Display the route
    displayRoute(routeResponse, startCoords, endCoords, startAddress, endAddress);
    
  } catch (error) {
    console.error('Error fetching route:', error);
    
    // Check for specific errors that might indicate a problem with routing between distant locations
    if (error.message && error.message.includes('distance')) {
      alert('The locations are too far apart. Please try locations that are closer together.');
    } else {
      alert('Failed to calculate route. Please check your inputs and try again.');
    }
    
    loadingElement.classList.add('hidden');
  }
}

// Display route on map
function displayRoute(routeData, startCoords, endCoords, startAddress, endAddress) {
  // Update route source
  map.getSource('route').setData(routeData);
  
  // Get route summary for display
  const properties = routeData.features[0].properties;
  const distance = properties.summary.distance;
  const duration = properties.summary.duration;
  
  // Store in window object for chatbot access
  window.currentDistance = distance;
  window.currentDuration = duration;
  window.currentStartAddress = startAddress;
  window.currentEndAddress = endAddress;
  window.currentRoute = routeData;
  
  // Update trip summary
  updateTripSummary({
    distance,
    duration,
    startAddress,
    endAddress
  });
  
  // Calculate trip costs
  calculateTripCosts(distance, duration, startAddress, endAddress);
  
  // Update distance overlay
  updateDistanceOverlay(distance);
  
  // Add markers for start and end points
  addCustomMarker(startCoords, 'start', startAddress);
  addCustomMarker(endCoords, 'end', endAddress);
  
  // Find places along the route (gas stations and attractions)
  const routeCoords = routeData.features[0].geometry.coordinates;
  findPlacesAlongRoute(routeCoords);
  
  // Show summary section
  document.getElementById('summary').classList.remove('hidden');
  
  // Hide loading indicator
  document.getElementById('loading').classList.add('hidden');
  
  // Fit map to show entire route
  const bounds = new mapboxgl.LngLatBounds();
  routeCoords.forEach(coord => bounds.extend(coord));
  map.fitBounds(bounds, { padding: 50 });
}

// Calculate trip costs using Groq API
async function calculateTripCosts(distance, duration, startAddress, endAddress) {
  try {
    // Default calculations first (as fallback)
    const distanceKm = distance / 1000;
    const durationHours = duration / 3600;
    
    // Set default values - using Indian metrics
    // Average fuel price in India is around 100 INR per liter
    // Average car consumption is around 15 km/liter in India
    const fuelConsumptionLPer100Km = 6.7; // 15 km/L is about 6.7L/100km
    const fuelPriceINR = 100; // ₹100 per liter
    const fuelCostINR = (distanceKm / 100) * fuelConsumptionLPer100Km * fuelPriceINR;
    
    let fuelCost = `₹${fuelCostINR.toFixed(2)}`;
    let travelTime = `${Math.floor(durationHours)} hours ${Math.floor((durationHours % 1) * 60)} minutes`;
    let restStops = Math.ceil(durationHours / 2); // Indian roads often require more rest stops
    let tollCost = 'No data available';
    
    // Update UI with default calculations first
    document.getElementById('fuel-cost').textContent = fuelCost;
    document.getElementById('travel-time').textContent = travelTime;
    document.getElementById('rest-stops').textContent = restStops;
    document.getElementById('toll-cost').textContent = tollCost;
    
    // Make API request to Groq for more accurate data
    if (window.GROQ_API_KEY) {
      // Show loading state
      const costElements = ['fuel-cost', 'rest-stops', 'toll-cost'];
      costElements.forEach(id => {
        const element = document.getElementById(id);
        element.classList.add('cost-loading');
        element.dataset.originalText = element.textContent;
        element.textContent = 'Calculating...';
      });
      
      const prompt = `You are a road trip cost calculator assistant for travel in India. 
      
      Calculate the following for a road trip from ${startAddress} to ${endAddress} with a distance of ${distanceKm.toFixed(1)} km and duration of ${durationHours.toFixed(1)} hours in India:
      
      1. Estimated fuel cost (in Indian Rupees)
      2. Suggested number of rest stops
      3. Estimated toll expenses (if any)
      
      For fuel cost, assume average fuel consumption of 15km/liter and current Indian fuel prices of around 100 INR per liter. For tolls, check if the route likely includes toll roads between these locations in India.
      
      Reply with ONLY a JSON object with these properties:
      {
        "fuelCost": "₹XX.XX",
        "restStops": X,
        "tollCost": "₹XX.XX" or "None" if no tolls
      }
      
      Ensure the format is exactly as specified, with no additional text.`;
      
      // Make request to Groq API
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: "You are a helpful assistant that calculates road trip costs for Indian travel and returns data in JSON format only." },
            { role: "user", content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 250,
          response_format: { type: "json_object" }
        })
      });
      
      const data = await response.json();
      
      // Remove loading state for all elements
      costElements.forEach(id => {
        const element = document.getElementById(id);
        element.classList.remove('cost-loading');
        // Restore original text if we can't get new data
        element.textContent = element.dataset.originalText;
      });
      
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        try {
          // Parse the JSON response
          const tripData = JSON.parse(data.choices[0].message.content);
          
          // Update UI with the more accurate data
          if (tripData.fuelCost) document.getElementById('fuel-cost').textContent = tripData.fuelCost;
          if (tripData.restStops) document.getElementById('rest-stops').textContent = tripData.restStops;
          if (tripData.tollCost) document.getElementById('toll-cost').textContent = tripData.tollCost;
          
          // Add highlight animation to the updated fields
          ['fuel-cost', 'rest-stops', 'toll-cost'].forEach(id => {
            const element = document.getElementById(id);
            element.classList.add('highlight');
            setTimeout(() => element.classList.remove('highlight'), 2000);
          });
        } catch (parseError) {
          console.error('Error parsing Groq API response:', parseError);
        }
      }
    }
  } catch (error) {
    console.error('Error calculating trip costs:', error);
    // Reset loading state on error
    ['fuel-cost', 'rest-stops', 'toll-cost'].forEach(id => {
      const element = document.getElementById(id);
      if (element.classList.contains('cost-loading')) {
        element.classList.remove('cost-loading');
        element.textContent = element.dataset.originalText || 'Error';
      }
    });
  }
}

// Update distance overlay
function updateDistanceOverlay(distance) {
  currentDistance = distance;
  const distanceKm = (distance / 1000).toFixed(1);
  const distanceMiles = (distanceKm * 0.621371).toFixed(1);
  
  const overlay = document.getElementById('distance-overlay');
  overlay.textContent = `Distance: ${distanceKm} km (${distanceMiles} mi)`;
  
  // Show with animation
  setTimeout(() => {
    overlay.classList.add('active');
  }, 300);
}

// Find places along the route
async function findPlacesAlongRoute(routeCoords) {
  // Get evenly spaced points along the route for searching
  const numPoints = routeCoords.length;
  
  // Ensure we have enough points
  if (numPoints < 4) {
    console.warn('Not enough route points to find places along route');
    return;
  }
  
  const quarter = Math.floor(numPoints / 4);
  const middle = Math.floor(numPoints / 2);
  const threeQuarters = Math.floor(numPoints * 3 / 4);
  
  const searchPoints = [
    routeCoords[quarter],
    routeCoords[middle],
    routeCoords[threeQuarters]
  ];
  
  try {
    // Find gas stations using OpenRouteService POIs
    const gasStations = await findPointsOfInterest(searchPoints, ['fuel']);
    
    // Find attractions using OpenRouteService POIs
    const attractions = await findPointsOfInterest(searchPoints, ['tourism', 'natural']);
    
    // Add markers and update lists
    gasStations.forEach(place => addPlaceMarker(place, 'gas'));
    attractions.forEach(place => addPlaceMarker(place, 'attraction'));
    
    updatePlacesList(gasStations, 'gas');
    updatePlacesList(attractions, 'attraction');
  } catch (error) {
    console.error('Error finding places along route:', error);
  }
}

// Find points of interest near route points
async function findPointsOfInterest(points, categories) {
  console.log("Searching for POIs in categories:", categories);
  const allPlaces = [];
  const uniqueIds = new Set();
  
  // Get category IDs
  const categoryIds = getCategoryIdsForType(categories);
  console.log("Using category IDs:", categoryIds);
  
  // Search for POIs near each point
  for (const point of points) {
    try {
      console.log("Searching near point:", point);
      
      // Direct API call with fetch instead of using the client
      const url = `https://api.openrouteservice.org/pois`;
      const body = {
        request: 'pois',
        geojson: {
          type: 'Point',
          coordinates: point
        },
        filter_category_ids: categoryIds,
        buffer: 5000, // 5km radius
        limit: 20,
        sortby: 'distance'
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
          'Authorization': ORS_API_KEY,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('POI API error:', response.status, errorText);
        throw new Error(`POI search failed: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log("POI API response:", data);
      
      if (data.features && data.features.length > 0) {
        // Process and add places to our results
        data.features.forEach(place => {
          // Extract a unique ID
          const id = place.properties.osm_id || 
                   place.properties.id || 
                   `${place.geometry.coordinates[0]}-${place.geometry.coordinates[1]}`;
          
          // Check if we already have this place
          if (!uniqueIds.has(id)) {
            uniqueIds.add(id);
            
            // Create a standardized place object
            const processedPlace = {
              id: id,
              name: place.properties.name || 
                   place.properties.category_name || 
                   (categories[0] === 'fuel' ? 'Gas Station' : 'Attraction'),
              geometry: place.geometry,
              properties: place.properties,
              distance: place.properties.distance || 0
            };
            
            allPlaces.push(processedPlace);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching POIs:', error);
    }
  }
  
  // If we didn't find any places, try a fallback approach with Overpass API
  if (allPlaces.length === 0) {
    console.log("No POIs found, trying fallback...");
    
    try {
      const middlePoint = points[Math.floor(points.length / 2)];
      
      // Use Overpass API as fallback
      let overpassQuery;
      if (categories.includes('fuel')) {
        overpassQuery = `[out:json];(node["amenity"="fuel"](around:10000,${middlePoint[1]},${middlePoint[0]}););out body 10;`;
      } else {
        overpassQuery = `[out:json];(node["tourism"](around:10000,${middlePoint[1]},${middlePoint[0]});node["natural"](around:10000,${middlePoint[1]},${middlePoint[0]}););out body 10;`;
      }
      
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
      const data = await response.json();
      
      console.log("Overpass API fallback response:", data);
      
      if (data.elements && data.elements.length > 0) {
        // Process Overpass results
        data.elements.forEach(element => {
          const id = `overpass-${element.id}`;
          if (!uniqueIds.has(id)) {
            uniqueIds.add(id);
            
            // Create GeoJSON feature
            const place = {
              id: id,
              name: element.tags.name || 
                   (categories[0] === 'fuel' ? 'Gas Station' : 'Attraction'),
              geometry: {
                type: 'Point',
                coordinates: [element.lon, element.lat]
              },
              properties: {
                ...element.tags,
                osm_id: element.id,
                distance: 0 // We don't have exact distance info
              }
            };
            
            allPlaces.push(place);
          }
        });
      }
    } catch (error) {
      console.error('Error in fallback POI search:', error);
    }
  }
  
  console.log(`Found ${allPlaces.length} places for categories: ${categories}`);
  
  // Limit to 5 results
  return allPlaces.slice(0, 5);
}

// Get category IDs for OpenRouteService POIs
function getCategoryIdsForType(categories) {
  const categoryMapping = {
    'fuel': [560], // Gas stations
    'tourism': [300, 310, 320, 330, 340, 350, 360, 390, 400, 420], // Tourist attractions
    'natural': [170, 171, 172, 173, 174, 570] // Natural features
  };
  
  let result = [];
  categories.forEach(category => {
    if (categoryMapping[category]) {
      result = result.concat(categoryMapping[category]);
    }
  });
  
  return result;
}

// Add custom marker for start and end points
function addCustomMarker(coords, type, title) {
  // Create marker element
  const el = document.createElement('div');
  el.className = type === 'start' ? 'marker-start' : 'marker-end';
  
  // Create popup
  const popup = new mapboxgl.Popup({ offset: 25 })
    .setHTML(`
      <div>
        <h3 class="font-bold">${type === 'start' ? 'Starting Point' : 'Destination'}</h3>
        <p>${title}</p>
      </div>
    `);
  
  // Add marker to map
  const marker = new mapboxgl.Marker(el)
    .setLngLat(coords)
    .setPopup(popup)
    .addTo(map);
  
  // Save reference to marker
  if (type === 'start') {
    startMarker = marker;
  } else {
    endMarker = marker;
  }
  
  markers.push(marker);
  return marker;
}

// Add marker for places (gas stations or attractions)
function addPlaceMarker(place, type) {
  console.log(`Adding ${type} marker for:`, place);
  
  // Handle different data structures
  const coordinates = place.geometry ? place.geometry.coordinates : place.coordinates;
  const name = place.name || 'Unnamed';
  const placeId = place.id || place.properties?.osm_id || `place-${Math.random().toString(36).substring(2, 10)}`;
  
  // Skip if no valid coordinates
  if (!coordinates || coordinates.length < 2) {
    console.error('Invalid coordinates for place:', place);
    return null;
  }
  
  // Create marker element
  const el = document.createElement('div');
  el.className = type === 'gas' ? 'marker-gas' : 'marker-attraction';
  el.setAttribute('data-place-name', name);
  el.setAttribute('data-place-id', placeId);
  
  // Create popup content
  const popupContent = `
    <div>
      <h3 class="font-bold text-lg">${name}</h3>
      <p>${type === 'gas' ? 'Gas Station' : 'Attraction'}</p>
      ${type === 'attraction' ? 
        `<button class="px-2 py-1 mt-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 view-photos" 
        data-name="${name.replace(/"/g, '&quot;')}">View Photos</button>` : ''}
    </div>
  `;
  
  // Create popup
  const popup = new mapboxgl.Popup({ offset: 25 })
    .setHTML(popupContent);
  
  // Add marker to map
  const marker = new mapboxgl.Marker(el)
    .setLngLat(coordinates)
    .setPopup(popup)
    .addTo(map);
    
  // Store the place data with the marker for easy access
  marker.placeData = {
    id: placeId,
    name: name,
    coordinates: coordinates,
    distance: place.distance || place.properties?.distance || 0
  };
  
  // Add click handler for attractions to show images
  if (type === 'attraction') {
    // Direct click handler on the element itself
    el.addEventListener('click', () => {
      marker.togglePopup(); // Show the popup
    });
    
    // When popup is open, attach event listener to the button
    popup.on('open', () => {
      setTimeout(() => {
        const button = document.querySelector('.view-photos');
        if (button) {
          button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Stop event propagation
            const name = button.getAttribute('data-name');
            fetchImagesByPlace(name);
          });
        }
      }, 100);
    });
    
    attractionMarkers.push(marker);
    if (!showAttractions) marker.getElement().style.display = 'none';
  } else {
    gasMarkers.push(marker);
    if (!showGasStations) marker.getElement().style.display = 'none';
  }
  
  markers.push(marker);
  return marker;
}

// Update trip summary
function updateTripSummary(data) {
  const distance = (data.distance / 1000).toFixed(1) + ' km';
  const duration = (data.duration / 3600).toFixed(1) + ' hrs';
  
  document.getElementById('route-details').innerHTML = `
    <p><strong>Distance:</strong> ${distance}</p>
    <p><strong>Duration:</strong> ${duration}</p>
    <p><strong>Start:</strong> ${data.startAddress}</p>
    <p><strong>End:</strong> ${data.endAddress}</p>
  `;
}

// Update places list in the summary
function updatePlacesList(places, type) {
  console.log(`Updating ${type} places list with:`, places);
  
  // Get the appropriate container
  const container = type === 'gas' ? document.getElementById('gas-stations-list') : document.getElementById('attractions-list');
  
  // Clear existing content
  container.innerHTML = '';
  
  // If no places found
  if (!places || places.length === 0) {
    container.innerHTML = `<p>No ${type === 'gas' ? 'gas stations' : 'attractions'} found along this route.</p>`;
    return;
  }
  
  // Normalize places data for consistent access
  const normalizedPlaces = places.map(place => ({
    id: place.id,
    name: place.name || place.properties?.name || 'Unnamed Place',
    distance: place.distance || place.properties?.distance || 0,
    coordinates: place.geometry?.coordinates || [0, 0]
  }));
  
  // Store in window object for chatbot access
  if (type === 'gas') {
    window.gasStationsList = normalizedPlaces;
  } else {
    window.attractionsList = normalizedPlaces;
  }
  
  // Add places to list
  normalizedPlaces.forEach(place => {
    const placeElement = document.createElement('div');
    placeElement.classList.add('mb-2', 'pb-2', 'border-b', 'border-gray-600');
    
    // Create clickable name that will show the place on map
    const nameElement = document.createElement('div');
    nameElement.classList.add('font-medium', 'cursor-pointer', 'hover:text-green-400');
    nameElement.textContent = place.name;
    
    // Add click event to highlight marker on map
    nameElement.addEventListener('click', () => {
      // Find marker and trigger animation
      const marker = type === 'gas' ? 
        gasMarkers.find(m => m.getElement().getAttribute('data-place-id') === place.id.toString()) :
        attractionMarkers.find(m => m.getElement().getAttribute('data-place-id') === place.id.toString());
      
      if (marker) {
        // Pan map to marker
        map.flyTo({
          center: marker.getLngLat(),
          zoom: 15,
          speed: 1.5
        });
        
        // Add bounce animation
        const element = marker.getElement();
        element.classList.add('bounce-animation');
        setTimeout(() => element.classList.remove('bounce-animation'), 600);
        
        // If it's an attraction, also load images
        if (type === 'attraction') {
          fetchImagesByPlace(place.name);
        }
      } else {
        console.warn(`Could not find marker for place: ${place.id}`);
        // If marker not found, at least try to center on the coordinates
        if (place.coordinates && place.coordinates.length === 2) {
          map.flyTo({
            center: place.coordinates,
            zoom: 15,
            speed: 1.5
          });
          
          // For attractions, load images anyway
          if (type === 'attraction') {
            fetchImagesByPlace(place.name);
          }
        }
      }
    });
    
    placeElement.appendChild(nameElement);
    
    // Add distance from route if available
    if (place.distance) {
      const distanceElement = document.createElement('div');
      distanceElement.classList.add('text-xs', 'text-gray-400');
      distanceElement.textContent = `${(place.distance / 1000).toFixed(1)} km from route`;
      placeElement.appendChild(distanceElement);
    }
    
    container.appendChild(placeElement);
  });
}

// Fetch images for attractions
function fetchAttractionImages() {
  // Get names of all attractions
  const attractionNames = attractionMarkers
    .map(marker => marker.getElement().getAttribute('data-place-name'))
    .filter(name => name && name !== 'Unnamed');
  
  if (attractionNames.length > 0) {
    // Use first attraction name
    fetchImagesByPlace(attractionNames[0]);
  }
}

// Fetch images for a specific place name
function fetchImagesByPlace(placeName) {
  // Reset gallery
  galleryImages = [];
  currentGalleryIndex = 0;
  
  // Show loading animation on gallery title
  const galleryTitle = document.getElementById('gallery-title');
  galleryTitle.textContent = `Loading images for: ${placeName}...`;
  document.getElementById('image-gallery').classList.add('active');
  
  // First try Unsplash API
  fetchUnsplashImages(placeName);
}

// Fetch images from Unsplash
function fetchUnsplashImages(placeName) {
  console.log("Fetching Unsplash images for:", placeName);
  const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(placeName)}&per_page=10&client_id=${UNSPLASH_ACCESS_KEY}`;
  
  fetch(unsplashUrl)
    .then(response => {
      if (!response.ok) {
        console.error('Unsplash API error:', response.status);
        throw new Error('Failed to fetch images from Unsplash');
      }
      return response.json();
    })
    .then(data => {
      console.log("Unsplash API response:", data);
      if (data.results && data.results.length > 0) {
        // Build image URLs
        galleryImages = data.results.map(photo => ({
          url: photo.urls.regular,
          title: photo.description || photo.alt_description || placeName
        }));
        
        // Show first image
        showImage(0);
        document.getElementById('gallery-title').textContent = placeName;
      } else {
        console.log("No Unsplash results, falling back to Flickr");
        // Fallback to Flickr if no results
        fetchFlickrImages(placeName);
      }
    })
    .catch(err => {
      console.error('Error fetching Unsplash images:', err);
      // Fallback to Flickr
      fetchFlickrImages(placeName);
    });
}

// Fetch images from Flickr (fallback)
function fetchFlickrImages(placeName) {
  // Use Flickr API to get images based on place name
  const apiKey = 'a359fae9c87bb52fe6a0a15c74d3ccb9'; // Public Flickr API key
  const flickrUrl = `https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=${apiKey}&text=${encodeURIComponent(placeName)}&format=json&nojsoncallback=1&per_page=10&sort=relevance`;
  
  fetch(flickrUrl)
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch images from Flickr');
      return response.json();
    })
    .then(data => {
      if (data.photos && data.photos.photo && data.photos.photo.length > 0) {
        // Build image URLs
        galleryImages = data.photos.photo.map(photo => ({
          url: `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_b.jpg`,
          title: photo.title || placeName
        }));
        
        // Show first image
        showImage(0);
        document.getElementById('gallery-title').textContent = placeName;
      } else {
        // Try fallback with just the first part of the name
        const simplifiedName = placeName.split(' ')[0];
        if (simplifiedName !== placeName) {
          fetchFlickrImages(simplifiedName);
        } else {
          // Show generic message
          document.getElementById('gallery-image').src = '';
          galleryTitle.textContent = `No images found for "${placeName}"`;
        }
      }
    })
    .catch(err => {
      console.error('Error fetching Flickr images:', err);
      document.getElementById('gallery-image').src = '';
      document.getElementById('gallery-title').textContent = 'Error loading images';
    });
}

// Show image at specific index
function showImage(index) {
  if (galleryImages.length === 0) return;
  
  // Ensure index is within bounds
  currentGalleryIndex = (index + galleryImages.length) % galleryImages.length;
  
  // Get image element
  const imgElement = document.getElementById('gallery-image');
  
  // Animate the transition
  imgElement.style.opacity = '0';
  imgElement.style.transform = 'scale(0.9)';
  
  setTimeout(() => {
    // Update image source
    imgElement.src = galleryImages[currentGalleryIndex].url;
    
    // Update title
    document.getElementById('gallery-title').textContent = galleryImages[currentGalleryIndex].title;
    
    // Restore visibility with animation
    imgElement.style.opacity = '1';
    imgElement.style.transform = 'scale(1)';
  }, 300);
}

// Show next image
function showNextImage() {
  showImage(currentGalleryIndex + 1);
}

// Show previous image
function showPrevImage() {
  showImage(currentGalleryIndex - 1);
}

// Close gallery
function closeGallery() {
  document.getElementById('image-gallery').classList.remove('active');
}

// Clear all markers
function clearMarkers() {
  // Remove all markers
  markers.forEach(marker => marker.remove());
  markers = [];
  gasMarkers = [];
  attractionMarkers = [];
  
  // Clear start/end markers
  if (startMarker) startMarker.remove();
  if (endMarker) endMarker.remove();
  startMarker = null;
  endMarker = null;
  
  // Clear route
  if (map.getSource('route')) {
    map.getSource('route').setData({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: []
      }
    });
  }
  
  // Hide distance overlay
  document.getElementById('distance-overlay').classList.remove('active');
}

// Add keyboard controls for gallery
document.addEventListener('keydown', (e) => {
  if (document.getElementById('image-gallery').classList.contains('active')) {
    if (e.key === 'Escape') closeGallery();
    if (e.key === 'ArrowRight') showNextImage();
    if (e.key === 'ArrowLeft') showPrevImage();
  }
});

// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', initMap);

// Add Groq API key from chatbot.js if it exists
document.addEventListener('DOMContentLoaded', function() {
  // Wait a bit to ensure chatbot.js has loaded
  setTimeout(() => {
    // Try to get Groq API key from global scope (set by chatbot.js)
    if (typeof GROQ_API_KEY !== 'undefined') {
      window.GROQ_API_KEY = GROQ_API_KEY;
    }
  }, 500);
});