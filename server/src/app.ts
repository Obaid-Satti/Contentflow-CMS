import express from "express";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        message: "ContentFlow API is running",
    });
});

export default app;
