import { toast } from "@/components/ui/use-toast";

/**
 * Modern notification system to replace browser alerts
 * Provides non-blocking, integrated UI notifications
 */

export const notifications = {
  /**
   * Show success notification
   */
  success: (message: string, title?: string) => {
    toast({
      title: title || "Success",
      description: message,
      variant: "default",
    });
  },

  /**
   * Show error notification
   */
  error: (message: string, title?: string) => {
    toast({
      title: title || "Error",
      description: message,
      variant: "destructive",
    });
  },

  /**
   * Show warning notification
   */
  warning: (message: string, title?: string) => {
    toast({
      title: title || "Warning",
      description: message,
      variant: "default",
    });
  },

  /**
   * Show info notification
   */
  info: (message: string, title?: string) => {
    toast({
      title: title || "Info",
      description: message,
      variant: "default",
    });
  },

  /**
   * Show confirmation dialog (replaces confirm())
   * Returns a promise that resolves to true/false
   */
  confirm: (message: string, title?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // For now, we'll use a simple confirm but this could be enhanced
      // with a custom modal component in the future
      const result = window.confirm(`${title ? title + '\n\n' : ''}${message}`);
      resolve(result);
    });
  }
};

/**
 * Legacy alert replacement - shows as toast notification
 */
export const showAlert = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  notifications[type](message);
};

/**
 * Legacy confirm replacement - shows as confirmation dialog
 */
export const showConfirm = (message: string, title?: string): Promise<boolean> => {
  return notifications.confirm(message, title);
};
