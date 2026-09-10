import dotenv from "dotenv";
import express, { Request, Response } from "express";

import bookingRouter from "./routes/booking.routes";
import authRouter from "./routes/auth.routes";
import { errorHandler } from "./middlewares/error.middleware";
import { globalLimiter } from "./middlewares/rateLimiter.middleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(globalLimiter);

app.get("/check", (req: Request, res: Response) => {
    res.status(200).json({
        status: "success",
        message: "Server jalan bosss!",
        timestamp: new Date().toISOString(),
        datetime: new Date().toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
        }) + " (Timezone: Asia/Jakarta)",
    });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/booking", bookingRouter);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});

export default app;
