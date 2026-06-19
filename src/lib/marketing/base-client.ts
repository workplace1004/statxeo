/**
 * Base Marketing API Client
 * Provides exponential backoff, rate limit handling, and generic JSON fetching capabilities
 * to all child network classes (Google, Meta, TikTok, etc).
 */
export class BaseAdsClient {
  protected maxRetries = 3;
  protected baseBackoffMs = 1000;

  /**
   * Helper function to delay execution (sleep)
   */
  protected sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Execute an HTTP request with exponential backoff and 429 rate-limit handling
   */
  protected async fetchWithBackoff(url: string, options: RequestInit): Promise<Response> {
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        const response = await fetch(url, options);

        // Success
        if (response.ok) {
          return response;
        }

        // Rate Limit Exceeded (HTTP 429)
        if (response.status === 429) {
          attempt++;
          const retryAfterHeader = response.headers.get("Retry-After");
          
          let waitMs = this.baseBackoffMs * Math.pow(2, attempt);
          
          // If the API explicitly tells us how long to wait, respect it
          if (retryAfterHeader) {
            const parsedSeconds = parseInt(retryAfterHeader, 10);
            if (!isNaN(parsedSeconds)) {
              waitMs = parsedSeconds * 1000;
            }
          }

          console.warn(`[BaseAdsClient] Rate limit hit on ${url}. Retrying in ${waitMs}ms (Attempt ${attempt}/${this.maxRetries})`);
          await this.sleep(waitMs);
          continue;
        }

        // Other HTTP errors (e.g., 400 Bad Request, 401 Unauthorized)
        return response; // Return it so the specific child client can handle auth rotation or errors

      } catch (error) {
        // Network failures
        attempt++;
        if (attempt >= this.maxRetries) {
          throw error;
        }
        
        const waitMs = this.baseBackoffMs * Math.pow(2, attempt);
        console.warn(`[BaseAdsClient] Network failure on ${url}. Retrying in ${waitMs}ms (Attempt ${attempt}/${this.maxRetries})`);
        await this.sleep(waitMs);
      }
    }

    throw new Error(`[BaseAdsClient] Failed after ${this.maxRetries} attempts.`);
  }
}
