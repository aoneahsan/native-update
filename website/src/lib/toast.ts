type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

class ToastManager {
  private container: HTMLDivElement | null = null;

  private ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  show({ title, description, type = 'info', duration = 5000 }: ToastOptions) {
    const container = this.ensureContainer();

    const toast = document.createElement('div');
    toast.className = `
      pointer-events-auto w-96 rounded-lg border p-4 shadow-lg transition-all
      ${type === 'success' ? 'bg-green-50 border-green-200 text-green-900' : ''}
      ${type === 'error' ? 'bg-red-50 border-red-200 text-red-900' : ''}
      ${type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-900' : ''}
      ${type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-900' : ''}
      animate-in slide-in-from-right
    `;

    const titleEl = document.createElement('div');
    titleEl.className = 'font-semibold mb-1';
    titleEl.textContent = title;
    toast.appendChild(titleEl);

    if (description) {
      const descEl = document.createElement('div');
      descEl.className = 'text-sm opacity-90';
      descEl.textContent = description;
      toast.appendChild(descEl);
    }

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        container.removeChild(toast);
      }, 300);
    }, duration);
  }

  success(title: string, description?: string) {
    this.show({ title, description, type: 'success' });
  }

  error(title: string, description?: string) {
    this.show({ title, description, type: 'error' });
  }

  info(title: string, description?: string) {
    this.show({ title, description, type: 'info' });
  }

  warning(title: string, description?: string) {
    this.show({ title, description, type: 'warning' });
  }
}

export const toast = new ToastManager();
