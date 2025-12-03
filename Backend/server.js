const express = require("express");
const app = express();
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const compression = require("compression");
const globalRoutes = require("./routes/globalRoutes");
const { errorHander } = require("./middleware/errorHandler");

require("dotenv").config();

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", globalRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    health: "Good",
    agent: req.headers["user-agent"].split(" ")[0],
  });
});

app.use(errorHander);

app.use((req, res, next) => {
  res.json({ 404: "Page Not Found" });
});

const server = require("http").createServer(app);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(
    `-----------------Server is running on port ${PORT}-----------------`
  );
});
