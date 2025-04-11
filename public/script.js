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
const orsPois = new Openrouteservice.Pois({ api_key: ORS_API_KEY });

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
        'line-color': '#39ff14', // Neon green
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
  
  // Update trip summary
  updateTripSummary({
    distance: distance,
    duration: duration,
    startAddress: startAddress,
    endAddress: endAddress
  });
  
  // Update distance overlay
  updateDistanceOverlay(distance);
  
  // Get coordinates for markers
  const routeCoords = routeData.features[0].geometry.coordinates;
  
  // Add start and end markers
  addCustomMarker(startCoords, 'start', startAddress);
  addCustomMarker(endCoords, 'end', endAddress);
  
  // Find places along route
  findPlacesAlongRoute(routeCoords);
  
  // Fit map to show the route
  const bounds = new mapboxgl.LngLatBounds();
  routeCoords.forEach(coord => bounds.extend(coord));
  map.fitBounds(bounds, { padding: 50 });
  
  // Show summary section
  document.getElementById('summary').classList.remove('hidden');
  
  // Hide loading indicator
  document.getElementById('loading').classList.add('hidden');
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
  const allPlaces = [];
  const uniqueIds = new Set();
  
  // Search for POIs near each point
  for (const point of points) {
    try {
      const response = await orsPois.pois({
        request: 'pois',
        geojson: {
          type: 'Point',
          coordinates: point
        },
        filter_category_ids: getCategoryIdsForType(categories),
        buffer: 5000, // Increased to 5km radius for better results
        limit: 20
      });
      
      if (response.features && response.features.length > 0) {
        response.features.forEach(place => {
          // Check if we already have this place
          if (!uniqueIds.has(place.properties.osm_id)) {
            uniqueIds.add(place.properties.osm_id);
            allPlaces.push(place);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching POIs:', error);
    }
  }
  
  // If we didn't find any places, try a fallback approach with a larger radius
  if (allPlaces.length === 0) {
    try {
      const middlePoint = points[Math.floor(points.length / 2)];
      const response = await orsPois.pois({
        request: 'pois',
        geojson: {
          type: 'Point',
          coordinates: middlePoint
        },
        filter_category_ids: getCategoryIdsForType(categories),
        buffer: 10000, // 10km radius
        limit: 20
      });
      
      if (response.features && response.features.length > 0) {
        response.features.forEach(place => {
          if (!uniqueIds.has(place.properties.osm_id)) {
            uniqueIds.add(place.properties.osm_id);
            allPlaces.push(place);
          }
        });
      }
    } catch (error) {
      console.error('Error in fallback POI search:', error);
    }
  }
  
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
  const coordinates = place.geometry.coordinates;
  const properties = place.properties;
  const name = properties.name || 'Unnamed';
  
  // Create marker element
  const el = document.createElement('div');
  el.className = type === 'gas' ? 'marker-gas' : 'marker-attraction';
  el.setAttribute('data-place-name', name);
  
  // Create popup content
  const popupContent = `
    <div>
      <h3 class="font-bold text-lg">${name}</h3>
      <p>${type === 'gas' ? 'Gas Station' : 'Attraction'}</p>
      ${type === 'attraction' ? 
        `<button class="px-2 py-1 mt-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 view-photos" 
        data-name="${name}">View Photos</button>` : ''}
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
  
  // Add click handler for attractions to show images
  if (type === 'attraction') {
    // Direct click handler on the element itself
    el.addEventListener('click', () => {
      marker.togglePopup(); // Show the popup
    });
    
    // When popup is open, attach event listener to the button
    marker.getElement().addEventListener('click', () => {
      setTimeout(() => {
        const button = document.querySelector('.view-photos');
        if (button) {
          button.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop event propagation
            const name = e.target.getAttribute('data-name');
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
  const listElement = type === 'gas' ? 
    document.getElementById('gas-stations-list') : 
    document.getElementById('attractions-list');
  
  listElement.innerHTML = '';
  
  if (places.length > 0) {
    places.forEach(place => {
      const properties = place.properties;
      const placeName = properties.name || 'Unnamed';
      
      const placeElement = document.createElement('div');
      placeElement.className = 'mb-2 p-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700 transition-colors';
      placeElement.innerHTML = `
        <p class="font-medium">${placeName}</p>
        <p class="text-xs text-gray-400">${type === 'gas' ? 'Gas Station' : 'Attraction'}</p>
      `;
      
      // Add click handler for attractions to view photos
      if (type === 'attraction' && placeName !== 'Unnamed') {
        placeElement.addEventListener('click', () => fetchImagesByPlace(placeName));
        placeElement.title = 'Click to view photos';
      }
      
      listElement.appendChild(placeElement);
    });
  } else {
    listElement.innerHTML = `<p>No ${type === 'gas' ? 'gas stations' : 'attractions'} found along this route.</p>`;
  }
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
  
  // First try Unsplash API if key is provided
  if (UNSPLASH_ACCESS_KEY && UNSPLASH_ACCESS_KEY !== 'YOUR_UNSPLASH_API_KEY') {
    fetchUnsplashImages(placeName);
  } else {
    // Fallback to Flickr API
    fetchFlickrImages(placeName);
  }
}

// Fetch images from Unsplash
function fetchUnsplashImages(placeName) {
  const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(placeName)}&per_page=10&client_id=${UNSPLASH_ACCESS_KEY}`;
  
  fetch(unsplashUrl)
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch images from Unsplash');
      return response.json();
    })
    .then(data => {
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