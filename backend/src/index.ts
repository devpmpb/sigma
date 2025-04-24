import express, { Request, Response } from "express";

const app = express();
const port = 3000;

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

app.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "erro ao buscar usuarios" });
  }
});
