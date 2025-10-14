import express, { Request, Response } from "express";
import routes from "./routes";
import cors from "cors";

const app = express();
const port = 3001;
app.use(express.json());
app.use(cors());
app.use("/api", routes);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
