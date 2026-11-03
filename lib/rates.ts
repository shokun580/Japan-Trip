// Today's yen in baht, from Frankfurter (ECB reference rates, no key). Fetched on
// the server and cached for six hours; a failed fetch means no converter today
// rather than a broken page.
export async function getYenRate(): Promise<number | null> {
  try {
    const response = await fetch("https://api.frankfurter.dev/v1/latest?from=JPY&to=THB", { next: { revalidate: 21_600 } });
    if (!response.ok) return null;
    const data = (await response.json()) as { rates?: { THB?: number } };
    return data.rates?.THB ?? null;
  } catch { return null; }
}
