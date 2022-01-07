const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('unhandledRejection', (err) => {
  console.log(`There is an unhandled exception 🔥, Shutting down...`);
  console.log(err.name, err.message);
  process.exit();
});

dotenv.config({ path: `./config.env` });
const app = require('./app');

if (Array.from(process.argv).includes(`NODE_ENV=production`))
  process.env.NODE_ENV = `production`;

console.log(`'${process.env.NODE_ENV.toUpperCase()}' -------- environment`);

// Connecting Atlas(Cloud hosted) DB
mongoose
  .connect(process.env.DB)
  .then(() => console.log(`DB Connection sucessful`));

const port = process.env.PORT || 3000;
// Express server listening to the port
const server = app.listen(port, () =>
  console.log(
    `Server running at port http://localhost:${port}/ OR http://127.0.0.1:${port}/`
  )
);

process.on('uncaughtException', (err) => {
  console.log(`There is an uncaught exception 🔥, Shutting down...`);
  console.log(err.name, err.message);
  server.close(() => {
    process.exit();
  });
});
