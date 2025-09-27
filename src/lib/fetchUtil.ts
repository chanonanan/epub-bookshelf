import localforage from 'localforage';

const networkCache = localforage.createInstance({
  name: 'epubBookshelf',
  storeName: 'network',
});

export async function fetchWithCache(
  url: string,
  options: RequestInit = {},
  cacheDuration = 5 * 60 * 1000, // default 5 minutes
): Promise<Response> {
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  const now = Date.now();

  // Check cache
  const cached = await networkCache.getItem<{
    timestamp: number;
    response: string;
    status: number;
    statusText: string;
    headers: [string, string][];
  }>(cacheKey);

  if (cached && now - cached.timestamp < cacheDuration) {
    return new Response(cached.response, {
      status: cached.status,
      statusText: cached.statusText,
      headers: new Headers(cached.headers),
    });
  }

  // Fetch from network
  const response = await fetch(url, options);
  const responseClone = response.clone();
  const responseText = await responseClone.text();

  // Store in cache
  await networkCache.setItem(cacheKey, {
    timestamp: now,
    response: responseText,
    status: response.status,
    statusText: response.statusText,
    headers: Array.from(response.headers.entries()),
  });

  return response;
}
