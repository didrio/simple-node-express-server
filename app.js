const express = require("express");
const helmet = require("helmet");
const app = express();

app.use(helmet());
app.use(express.static("./public"));

app.listen(3000, () => {console.log("Server Connected")});
