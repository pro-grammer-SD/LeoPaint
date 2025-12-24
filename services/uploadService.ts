/**
 * Converts a Base64 Data URI to a Blob object.
 */
const dataURItoBlob = (dataURI: string): Blob => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], { type: mimeString });
};

/**
 * Uploads an image to catbox.moe using rotating CORS proxies.
 * Returns the public URL of the uploaded image.
 */
export const uploadToCatbox = async (dataURI: string): Promise<string> => {
  const blob = dataURItoBlob(dataURI);
  const filename = `leopaint-${Date.now()}.png`;
  
  // We need to recreate FormData for each request to be safe with some fetch polyfills,
  // although standard fetch handles reusable FormData fine.
  const createFormData = () => {
    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('userhash', ''); // Anonymous upload
    fd.append('fileToUpload', blob, filename);
    return fd;
  };

  const TARGET_URL = "https://catbox.moe/user/api.php";
  
  // Proxy strategies
  const proxies = [
    // Strategy 1: corsproxy.io (Standard)
    (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}`,
    // Strategy 2: CodeTabs (Fallback)
    (target: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`,
    // Strategy 3: AllOrigins (Fallback 2 - might struggle with POST but worth a try)
    (target: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`
  ];

  let lastError: Error | unknown;

  for (const urlBuilder of proxies) {
    try {
      const proxyUrl = urlBuilder(TARGET_URL);
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        body: createFormData(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      const trimmedResponse = responseText.trim();

      // Catbox success response is just the URL (starting with http)
      // Error responses are usually plain text descriptions like "File too big"
      if (!trimmedResponse.startsWith('http')) {
        throw new Error(`API Error: ${trimmedResponse}`);
      }

      return trimmedResponse;

    } catch (err) {
      console.warn(`Upload proxy attempt failed:`, err);
      lastError = err;
      // Continue to next proxy
    }
  }

  throw lastError instanceof Error ? lastError : new Error("All upload proxies failed");
};
