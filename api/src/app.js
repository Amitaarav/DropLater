import express from "express";
import notesRoutes from "./routes/notesRoutes";
import { errorHandler } from "./middleware/errorHandler";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", notesRoutes);
app.use(errorHandler);

export default app;
