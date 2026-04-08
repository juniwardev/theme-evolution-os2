/**
 * Fetches product metaobject data from the custom Liquid API endpoint.
 * @param {string} productUrl - The base URL of the product.
 */
async function fetchMaterialData(productUrl) {
  const apiUrl = `${productUrl}?view=api`;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch material data:", error);
    throw error;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const accordion = document.getElementById('MaterialAccordion');
  const container = document.getElementById('material-data-container');

  if (!accordion || !container) return;

  accordion.addEventListener('toggle', async (event) => {
    // Execute ONLY if the accordion is opening and hasn't been loaded yet
    if (accordion.open && accordion.getAttribute('data-loaded') !== 'true') {
      try {
        const data = await fetchMaterialData(window.location.pathname);
        
        // Clear the loading state
        container.innerHTML = '';
        
        if (data.has_material && data.material_data) {
          const { icon, story } = data.material_data;
          
          // Build and inject the DOM elements dynamically
          if (icon) {
            const img = document.createElement('img');
            img.src = icon;
            img.alt = "Material icon";
            img.className = "material-accordion__thumbnail";
            img.loading = "lazy";
            container.appendChild(img);
          }
          
          if (story) {
            const textContainer = document.createElement('div');
            textContainer.className = "material-accordion__story";
            // Using innerHTML to respect newline/br formatting from the metaobject
            textContainer.innerHTML = story;
            container.appendChild(textContainer);
          }
        } else {
          // Fallback if the JSON reports no material data
          container.innerHTML = `<p class="material-accordion__story">${data.message || "No specific material story available for this product."}</p>`;
        }

        // Flag as loaded to prevent future API calls on subsequent toggles
        accordion.setAttribute('data-loaded', 'true');
        
      } catch (error) {
        console.error('Error parsing material specs:', error);
        container.innerHTML = '<p class="material-accordion__story">Failed to load material specifications. Please try again later.</p>';
        
        // We do NOT set data-loaded='true' here, allowing the user to try again by closing/reopening
      }
    }
  });
});