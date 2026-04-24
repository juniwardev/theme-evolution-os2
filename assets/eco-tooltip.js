class EcoTooltip {
  constructor() {
    this.tooltips = new Map();
    this.cache = new Map();
    this.debounceTimer = null;
    this.init();
  }

  init() {
    document.body.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.body.addEventListener('mouseout', this.handleMouseOut.bind(this));
  }

  handleMouseOver(event) {
    const trigger = event.target.closest('.eco-tooltip-trigger');
    if (!trigger) return;

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.showTooltip(trigger);
    }, 100);
  }

  handleMouseOut(event) {
    const trigger = event.target.closest('.eco-tooltip-trigger');
    if (!trigger) return;

    clearTimeout(this.debounceTimer);
    this.hideTooltip(trigger);
  }

  async showTooltip(trigger) {
    const materialHandle = trigger.dataset.materialHandle;
    if (!materialHandle) return;

    let tooltip = this.tooltips.get(materialHandle);
    let materialData = this.cache.get(materialHandle);

    if (tooltip && materialData) {
      this.positionTooltip(trigger, tooltip);
      tooltip.classList.add('is-visible');
      return;
    }

    if (!materialData) {
      try {
        // Use GET request to /search with section_id and q for data passing
        const url = `/search?section_id=material-tooltip&q=${materialHandle}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        // Shopify returns HTML directly for the section requested
        materialData = await response.text();
        
        if (!materialData || materialData.trim() === "") {
          throw new Error('Empty response from Section Rendering API');
        }
        
        this.cache.set(materialHandle, materialData);
      } catch (error) {
        console.error('EcoTooltip: Error fetching material data:', error);
        return;
      }
    }

    if (!tooltip) {
      tooltip = this.createTooltipElement(materialData);
      this.tooltips.set(materialHandle, tooltip);
      document.body.appendChild(tooltip);
    } else {
      tooltip.innerHTML = materialData;
    }
    
    this.positionTooltip(trigger, tooltip);
    tooltip.classList.add('is-visible');
  }

  hideTooltip(trigger) {
    const materialHandle = trigger.dataset.materialHandle;
    const tooltip = this.tooltips.get(materialHandle);
    if (tooltip) {
      tooltip.classList.remove('is-visible');
    }
  }

  createTooltipElement(content) {
    const tooltip = document.createElement('div');
    tooltip.classList.add('eco-tooltip');
    tooltip.innerHTML = content;
    // Positioning is handled by positionTooltip
    return tooltip;
  }

  positionTooltip(trigger, tooltip) {
    const triggerRect = trigger.getBoundingClientRect();
    
    // Temporarily show to get dimensions
    tooltip.style.display = 'block';
    tooltip.style.visibility = 'hidden';
    const tooltipRect = tooltip.getBoundingClientRect();
    tooltip.style.display = '';
    tooltip.style.visibility = '';

    let top = triggerRect.bottom + window.scrollY + 10;
    let left = triggerRect.left + window.scrollX;

    if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width - 10;
    }

    if (left < 0) left = 10;

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }
}

// Initialize
if (!window.ecoTooltipInstance) {
  window.ecoTooltipInstance = new EcoTooltip();
}
