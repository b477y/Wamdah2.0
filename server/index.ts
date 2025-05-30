import dotenv from "dotenv";
dotenv.config();
import express from "express";
import bootstrap from './src/app.controller'

const app = express();
const PORT = process.env.PORT

async function main() {
  await bootstrap(app, express)

  app.listen(PORT, () => {
    console.info(`Server is running on port ${PORT}`);
  });
}

main();
