// Starts a real temporary MongoDB server for local development without Docker.
const {MongoMemoryServer} = require('mongodb-memory-server');
const {start} = require('./app');
(async () => {
  const mongo = await MongoMemoryServer.create({instance: {dbName: 'dealershipsDB'}});
  const server = await start(mongo.getUri());
  async function stop() {server.close(); await mongo.stop(); process.exit(0);}
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})().catch(err => {console.error(err); process.exit(1);});
