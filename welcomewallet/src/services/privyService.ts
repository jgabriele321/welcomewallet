/**
 * Privy service for user authentication and wallet management
 */

// This file serves as a utility layer on top of Privy's React hooks
// Most Privy functionality is available through hooks in @privy-io/react-auth

/**
 * Formats a wallet address for display by truncating the middle portion
 * @param address - The wallet address to format
 * @param startChars - Number of characters to show at the start (default: 6)
 * @param endChars - Number of characters to show at the end (default: 4)
 * @returns Formatted address (e.g., "0xabcd...1234")
 */
export const formatWalletAddress = (
  address: string, 
  startChars = 6, 
  endChars = 4
): string => {
  if (!address) return '';
  
  // Make sure the address is valid
  if (typeof address !== 'string' || address.length < (startChars + endChars)) {
    return address;
  }
  
  const start = address.slice(0, startChars);
  const end = address.slice(-endChars);
  
  return `${start}...${end}`;
};

/**
 * Copies text to clipboard with fallbacks for browser compatibility
 * @param text - Text to copy to clipboard
 * @returns Whether the copy succeeded
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!text) return false;
  
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};