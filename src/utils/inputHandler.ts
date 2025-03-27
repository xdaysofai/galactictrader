import { useEffect, useCallback } from 'react';

// Keyboard shortcuts configuration
export const KEYBOARD_SHORTCUTS = {
  TRADE: 't',
  MISSIONS: 'm',
  SHIP: 's',
  SETTINGS: 'escape',
  CLOSE_MODAL: 'escape',
  CONFIRM: 'enter',
} as const;

interface InputHandlerProps {
  onOpenTrading: () => void;
  onOpenMissions: () => void;
  onOpenShipManagement: () => void;
  onOpenSettings: () => void;
  onCloseModal?: () => void;
  isModalOpen: boolean;
}

export const useInputHandler = ({
  onOpenTrading,
  onOpenMissions,
  onOpenShipManagement,
  onOpenSettings,
  onCloseModal,
  isModalOpen,
}: InputHandlerProps) => {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts if user is typing in an input field
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = event.key.toLowerCase();

    // If a modal is open, only handle escape key
    if (isModalOpen) {
      if (key === KEYBOARD_SHORTCUTS.CLOSE_MODAL && onCloseModal) {
        event.preventDefault();
        onCloseModal();
      }
      return;
    }

    // Handle other shortcuts only when no modal is open
    switch (key) {
      case KEYBOARD_SHORTCUTS.TRADE:
        event.preventDefault();
        onOpenTrading();
        break;
      case KEYBOARD_SHORTCUTS.MISSIONS:
        event.preventDefault();
        onOpenMissions();
        break;
      case KEYBOARD_SHORTCUTS.SHIP:
        event.preventDefault();
        onOpenShipManagement();
        break;
      case KEYBOARD_SHORTCUTS.SETTINGS:
        event.preventDefault();
        onOpenSettings();
        break;
    }
  }, [isModalOpen, onCloseModal, onOpenTrading, onOpenMissions, onOpenShipManagement, onOpenSettings]);

  // Set up keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  // Return any methods that might be needed by components
  return {
    KEYBOARD_SHORTCUTS,
  };
};

interface TouchGestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export const addTouchGestures = (element: HTMLElement, handlers: TouchGestureHandlers): void => {
  let touchStartX = 0;
  let touchStartY = 0;
  const SWIPE_THRESHOLD = 50; // minimum distance for a swipe

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Determine if the swipe was horizontal or vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        if (deltaX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      }
    } else {
      if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
        if (deltaY > 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown();
        } else if (deltaY < 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp();
        }
      }
    }
  };

  // Clean up any existing listeners
  element.removeEventListener('touchstart', handleTouchStart);
  element.removeEventListener('touchend', handleTouchEnd);

  // Add new listeners
  element.addEventListener('touchstart', handleTouchStart);
  element.addEventListener('touchend', handleTouchEnd);
}; 