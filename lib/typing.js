/**
 * Typing Animation System
 * Accessible typing animation with exact text requirements
 */

class TypingAnimation {
  constructor(element, options = {}) {
    this.element = element;
    this.config = {
      text: "Hello Im Jeremy! Welcome to my Website:)",
      speed: 55, // ms per character
      speedVariation: 15, // ±ms random variation
      cursorBlink: true,
      cursorChar: '|',
      cursorClass: 'typing-cursor',
      announceText: true, // For screen readers
      ...options
    };
    
    this.isComplete = false;
    this.currentIndex = 0;
    this.timeoutId = null;
    this.cursorElement = null;
    this.announceElement = null;
    
    this.init();
  }
  
  init() {
    // Check for reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.showComplete();
      return;
    }
    
    // Setup elements
    this.setupElements();
    
    // Start typing when ready
    if (this.config.announceText) {
      this.setupAccessibility();
    }
  }
  
  setupElements() {
    // Clear existing content
    this.element.textContent = '';
    
    // Create text container
    this.textContainer = document.createElement('span');
    this.textContainer.setAttribute('aria-live', 'off'); // We'll handle announcements separately
    this.element.appendChild(this.textContainer);
    
    // Create cursor
    if (this.config.cursorBlink) {
      this.cursorElement = document.createElement('span');
      this.cursorElement.className = this.config.cursorClass;
      this.cursorElement.textContent = this.config.cursorChar;
      this.cursorElement.setAttribute('aria-hidden', 'true');
      this.element.appendChild(this.cursorElement);
    }
  }
  
  setupAccessibility() {
    // Create hidden element for screen reader announcements
    this.announceElement = document.createElement('div');
    this.announceElement.className = 'sr-only';
    this.announceElement.setAttribute('aria-live', 'polite');
    this.announceElement.setAttribute('aria-atomic', 'true');
    document.body.appendChild(this.announceElement);
  }
  
  start() {
    if (this.isComplete) return;
    
    this.currentIndex = 0;
    this.typeNext();
  }
  
  typeNext() {
    if (this.currentIndex >= this.config.text.length) {
      this.complete();
      return;
    }
    
    // Add next character
    const char = this.config.text[this.currentIndex];
    this.textContainer.textContent = this.config.text.slice(0, this.currentIndex + 1);
    this.currentIndex++;
    
    // Calculate next delay with variation
    const baseSpeed = this.config.speed;
    const variation = (Math.random() - 0.5) * this.config.speedVariation * 2;
    const delay = Math.max(20, baseSpeed + variation);
    
    // Schedule next character
    this.timeoutId = setTimeout(() => this.typeNext(), delay);
  }
  
  complete() {
    this.isComplete = true;
    
    // Announce final text to screen readers
    if (this.config.announceText && this.announceElement) {
      this.announceElement.textContent = this.config.text;
    }
    
    // Dispatch completion event
    this.element.dispatchEvent(new CustomEvent('typing:complete', {
      detail: { text: this.config.text }
    }));
    
    // Start cursor blinking if enabled
    if (this.cursorElement) {
      this.cursorElement.style.animation = `typing-blink 1s step-end infinite`;
    }
  }
  
  showComplete() {
    // Immediate display for reduced motion
    this.element.textContent = this.config.text;
    this.isComplete = true;
    
    // Still announce for accessibility
    if (this.config.announceText) {
      const announceElement = document.createElement('div');
      announceElement.className = 'sr-only';
      announceElement.setAttribute('aria-live', 'polite');
      announceElement.textContent = this.config.text;
      document.body.appendChild(announceElement);
      
      // Clean up after announcement
      setTimeout(() => {
        if (announceElement.parentNode) {
          announceElement.parentNode.removeChild(announceElement);
        }
      }, 2000);
    }
    
    // Dispatch completion event
    this.element.dispatchEvent(new CustomEvent('typing:complete', {
      detail: { text: this.config.text, reducedMotion: true }
    }));
  }
  
  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
  
  reset() {
    this.stop();
    this.isComplete = false;
    this.currentIndex = 0;
    
    if (this.textContainer) {
      this.textContainer.textContent = '';
    }
    
    if (this.cursorElement) {
      this.cursorElement.style.animation = '';
    }
  }
  
  destroy() {
    this.stop();
    
    if (this.announceElement && this.announceElement.parentNode) {
      this.announceElement.parentNode.removeChild(this.announceElement);
    }
  }
  
  // Static method to create and start typing animation
  static create(element, options = {}) {
    const animation = new TypingAnimation(element, options);
    return animation;
  }
  
  // Static method for immediate text display (reduced motion)
  static showImmediate(element, text) {
    element.textContent = text;
    
    // Announce for accessibility
    const announceElement = document.createElement('div');
    announceElement.className = 'sr-only';
    announceElement.setAttribute('aria-live', 'polite');
    announceElement.textContent = text;
    document.body.appendChild(announceElement);
    
    setTimeout(() => {
      if (announceElement.parentNode) {
        announceElement.parentNode.removeChild(announceElement);
      }
    }, 2000);
    
    return { isComplete: true, text };
  }
}

// Utility function for easy integration
function createTypingAnimation(selector, options = {}) {
  const element = typeof selector === 'string' 
    ? document.querySelector(selector)
    : selector;
    
  if (!element) {
    console.warn('TypingAnimation: Element not found:', selector);
    return null;
  }
  
  return new TypingAnimation(element, options);
}

// Auto-start functionality
function autoStartTyping() {
  // Look for elements with data-typing attribute
  const elements = document.querySelectorAll('[data-typing]');
  
  elements.forEach(element => {
    const text = element.dataset.typing || element.textContent;
    const speed = parseInt(element.dataset.typingSpeed) || 55;
    const delay = parseInt(element.dataset.typingDelay) || 0;
    
    const animation = new TypingAnimation(element, { text, speed });
    
    if (delay > 0) {
      setTimeout(() => animation.start(), delay);
    } else {
      animation.start();
    }
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoStartTyping);
} else {
  autoStartTyping();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TypingAnimation, createTypingAnimation };
}

// Global export for script tag use
if (typeof window !== 'undefined') {
  window.TypingAnimation = TypingAnimation;
  window.createTypingAnimation = createTypingAnimation;
}