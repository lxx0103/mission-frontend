const Database = require('better-sqlite3');
const db = new Database('mission.db', { verbose: console.log});

export {db};