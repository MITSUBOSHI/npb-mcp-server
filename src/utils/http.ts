import fetch from 'node-fetch';

/**
 * HTTPクライアント設定
 */
const DEFAULT_HEADERS = {
  'User-Agent': 'NPB-MCP-Server/0.1.0',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en;q=0.9',
};

/**
 * URLからHTMLを取得
 */
export async function fetchHTML(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: DEFAULT_HEADERS,
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    return html;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch ${url}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 複数のURLから並列でHTMLを取得
 */
export async function fetchMultipleHTML(urls: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  const promises = urls.map(async (url) => {
    try {
      const html = await fetchHTML(url);
      results.set(url, html);
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      // エラーの場合は結果に含めない
    }
  });

  await Promise.all(promises);
  return results;
}
