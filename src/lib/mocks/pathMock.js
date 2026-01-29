export default {
    dirname: (p) => {
        if (!p) return '.';
        const parts = p.split('/');
        parts.pop();
        return parts.join('/') || '.';
    },
    join: (...args) => args.join('/'),
    resolve: (...args) => args.join('/'),
    basename: (p) => p ? p.split('/').pop() : '',
    extname: (p) => p ? '.' + p.split('.').pop() : '',
};
