export default {
    readFileSync: () => { },
    readFile: () => { },
    writeFileSync: () => { },
    writeFile: () => { },
    existsSync: () => false,
    statSync: () => ({ isFile: () => false, isDirectory: () => false }),
};
