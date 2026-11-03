// A server action that cannot reach the server — no signal underground, a dropped
// connection — throws instead of answering. This turns that into an ordinary
// failed result, so every caller shows it and undoes whatever it showed early,
// exactly as it would for a refusal from the server.
export const NO_SIGNAL = { ok: false as const, message: "ยังไม่มีสัญญาณอินเทอร์เน็ต ลองใหม่อีกครั้งเมื่อเชื่อมต่อได้" };

export async function reach<T>(call: Promise<T>): Promise<T | typeof NO_SIGNAL> {
  try { return await call; } catch { return NO_SIGNAL; }
}
