import express, { Request, Response } from "express";
import bairroRoutes from "./routes/bairroRoutes";
import cors from "cors";

const app = express();
const port = 3001;

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
app.use(cors());
app.use("/api", bairroRoutes);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
