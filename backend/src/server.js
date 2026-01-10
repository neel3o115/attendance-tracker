const app = require("./app");
require("dotenv").config();

const connectDB = require("./config/db");

const PORT = process.env.PORT || 4000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`server running on http://localhost:${PORT}`);
    });
}

startServer();

