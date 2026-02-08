export default (req, res, next) => {
    // authMiddleware must run before this to populate req.user
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admins only' });
    }

    next();
};
