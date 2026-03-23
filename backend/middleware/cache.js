import NodeCache from 'node-cache';

// TTL: 1 hour (3600 seconds)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

const cacheMiddleware = (duration) => (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return next();
    }

    const key = req.originalUrl || req.url;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
        console.log(`[Cache] Hit: ${key}`);
        return res.json(cachedResponse);
    }

    console.log(`[Cache] Miss: ${key}`);

    // Original res.json to wrap and save response
    const originalJson = res.json;
    res.json = (body) => {
        cache.set(key, body, duration);
        res.json = originalJson;
        return res.json(body);
    };

    next();
};

export const clearCache = (key) => {
    if (key) {
        cache.del(key);
        console.log(`[Cache] Cleared key: ${key}`);
    } else {
        cache.flushAll();
        console.log('[Cache] Flushed all');
    }
};

export default cacheMiddleware;
