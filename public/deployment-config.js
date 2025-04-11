// This file is used to configure environment variables for the frontend
// It will be loaded before the main script.js file

// Helper function to get environment variables
function getEnvVar(name, fallback) {
  // Check if the variable exists in the window object (set by server-side rendering)
  if (window.ENV && window.ENV[name]) {
    return window.ENV[name];
  }
  
  // Check if the variable exists as a meta tag (a common deployment strategy)
  const metaTag = document.querySelector(`meta[name="${name}"]`);
  if (metaTag) {
    const content = metaTag.getAttribute('content');
    // Only use content if it's not the placeholder value (%%VAR_NAME%%)
    if (content && !content.includes('%%')) {
      return content;
    }
  }
  
  // Return fallback value if provided
  return fallback || '';
}

// Define API keys as global constants with fallbacks
window.ORS_API_KEY = getEnvVar('ORS_API_KEY', '5b3ce3597851110001cf624829442a9f43784ad9856a716a1af57237');
window.MAPBOX_ACCESS_TOKEN = getEnvVar('MAPBOX_ACCESS_TOKEN', 'pk.eyJ1Ijoicm9uYWs0MTQxNDEiLCJhIjoiY205ZDJuZTF3MDYzMTJrc2ExcHlsMHJyeSJ9.bm4bo3kjtKwlvVbL1Mdirg');
window.UNSPLASH_ACCESS_KEY = getEnvVar('UNSPLASH_ACCESS_KEY', 'w30gVPHf6paeTEWGQgP2maO_u5K4ncjRE4EAHicCskg');
window.GROQ_API_KEY = getEnvVar('GROQ_API_KEY', '');

// Log if we're using fallback values (but don't expose the actual values)
['ORS_API_KEY', 'MAPBOX_ACCESS_TOKEN', 'UNSPLASH_ACCESS_KEY', 'GROQ_API_KEY'].forEach(key => {
  if (!window[key]) {
    console.warn(`Warning: ${key} is not set. Some features may not work correctly.`);
  }
}); 