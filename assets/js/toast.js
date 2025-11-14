// Toast Notification System
// Ersetzt alert() und bietet eine bessere UX

class ToastNotification {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  show(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    const icon = this.getIcon(type);
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Schließen');
    closeBtn.onclick = () => this.remove(toast);

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${this.escapeHtml(message)}</span>
      </div>
    `;
    toast.appendChild(closeBtn);

    this.container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('toast-show');
    });

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }

    return toast;
  }

  remove(toast) {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Convenience methods
  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// Create global instance - wait for DOM to be ready
let toast;

// Check if DOM is already loaded
if (document.readyState === 'loading') {
  // DOM is still loading, wait for it
  document.addEventListener('DOMContentLoaded', () => {
    toast = new ToastNotification();
  });
} else {
  // DOM is already loaded (script was loaded after DOMContentLoaded)
  toast = new ToastNotification();
}

// Export for modules if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = toast;
}
