const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNHANDLED EXCEPTION. PROCESS WILL EXIT NOW');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');
//  Connect to database
// dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
console.log(process.env.NODE_ENV);

mongoose
  .connect(DB)
  .then((connection) => console.log('DB CONNECTION SUCCESSFUL'))
  .catch('DB CONNECTION RAN IN TO PROBLEM');

//  START SERVER

const port = process.env.PORT || 3000;
const server = app.listen(3001, '0.0.0.0', () => {
  console.log(`App running `);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION. PROCESS WILL EXIT NOW');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
