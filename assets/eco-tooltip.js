class EcoTooltip {
  constructor() {
    this.tooltips = new Map();
    this.cache = new Map();
    this.debounceTimer = null;
    this.activeTrigger = null;
    this.init();
  }

  init() {
    document.body.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.body.addEventListener('mouseout', this.handleMouseOut.bind(this));
    // Why: keyboard users reach triggers with Tab (WCAG 2.1.1) and dismiss the tooltip with Escape (1.4.13).
    document.body.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.body.addEventListener('focusout', this.handleFocusOut.bind(this));
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  handleMouseOver(event) {
    const trigger = event.target.closest('.eco-tooltip-trigger');
    if (!trigger) return;

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.activeTrigger = trigger;
      this.showTooltip(trigger);
    }, 100);
  }

  handleMouseOut(event) {
    const trigger = event.target.closest('.eco-tooltip-trigger');
    if (!trigger) return;

    clearTimeout(this.debounceTimer);
    // Why: a keyboard-focused trigger keeps its tooltip when the pointer leaves; a mouse click doesn't make it stick.
    if (document.activeElement === trigger && trigger.matches(':focus-visible')) return;
    if (this.activeTrigger === trigger) this.activeTrigger = null;
    this.hideTooltip(trigger);
  }

  handleFocusIn(event) {
    const trigger = event.target.closest('.eco-tooltip-trigger');
    if (!trigger) return;

    clearTimeout(this.debounceTimer);
    this.activeTrigger = trigger;
    this.showTooltip(trigger);
  }

  handleFocusOut(event) {
    const trigger = event.target.closest('.eco-tooltip-trigger');
    if (!trigger) return;

    if (this.activeTrigger === trigger) this.activeTrigger = null;
    this.hideTooltip(trigger);
  }

  handleKeydown(event) {
    if (event.key !== 'Escape') return;

    this.activeTrigger = null;
    this.tooltips.forEach((tooltip) => tooltip.classList.remove('is-visible'));
  }

  async showTooltip(trigger) {
    const materialHandle = trigger.dataset.materialHandle;
    if (!materialHandle) return;

    let tooltip = this.tooltips.get(materialHandle);
    let materialData = this.cache.get(materialHandle);

    if (tooltip && materialData) {
      // Why: the trigger may have lost focus or hover since this call started.
      if (this.activeTrigger !== trigger) return;
      this.positionTooltip(trigger, tooltip);
      trigger.setAttribute('aria-describedby', tooltip.id);
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
      tooltip = this.createTooltipElement(materialData, materialHandle);
      this.tooltips.set(materialHandle, tooltip);
      document.body.appendChild(tooltip);
    } else {
      tooltip.innerHTML = materialData;
    }
    
    // Why: the fetch is async; a tooltip whose trigger lost focus or hover meanwhile must not appear afterwards and stay.
    if (this.activeTrigger !== trigger) return;
    this.positionTooltip(trigger, tooltip);
    trigger.setAttribute('aria-describedby', tooltip.id);
    tooltip.classList.add('is-visible');
  }

  hideTooltip(trigger) {
    const materialHandle = trigger.dataset.materialHandle;
    const tooltip = this.tooltips.get(materialHandle);
    if (tooltip) {
      tooltip.classList.remove('is-visible');
    }
  }

  createTooltipElement(content, materialHandle) {
    const tooltip = document.createElement('div');
    tooltip.classList.add('eco-tooltip');
    tooltip.id = 'eco-tooltip-' + materialHandle;
    tooltip.setAttribute('role', 'tooltip');
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
