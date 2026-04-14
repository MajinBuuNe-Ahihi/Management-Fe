/**
 * Safely copy text to clipboard with a fallback for insecure contexts (HTTP).
 * navigator.clipboard requires HTTPS/localhost, so we use a hidden textarea as fallback.
 * @param {string} text - The text to copy.
 * @returns {Promise<boolean>} - Resolves true if successful, false otherwise.
 */
export async function copyToClipboard(text) {
  if (!text) return false;

  // Try the modern Clipboard API first (requires HTTPS)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Modern Clipboard API failed:', err);
    }
  }

  // Fallback for HTTP contexts or failed modern API
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Position fixed and off-screen to avoid scroll jumps
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (err) {
    console.error('Fallback clipboard method failed:', err);
    return false;
  }
}
