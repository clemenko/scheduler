const rateMap = new Map();

export default function rateLimit({ windowMs = 15 * 60 * 1000, max = 10 } = {}) {
  return function check(request) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!rateMap.has(ip)) {
      rateMap.set(ip, []);
    }

    const timestamps = rateMap.get(ip).filter(t => t > windowStart);
    timestamps.push(now);
    rateMap.set(ip, timestamps);

    if (timestamps.length > max) {
      return { error: { msg: 'Too many requests, please try again later' }, status: 429 };
    }

    return null;
  };
}
