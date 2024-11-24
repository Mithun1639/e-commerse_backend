require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
require("./db/conn");
const Products = require("./models/productsSchema");
const USER = require("./models/userSchema");
const router = require("./routes/router");
const DefaultData = require("./defaultdata");
const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(router);
app.use("/files",express.static("./public/files"))

const port = process.env.PORT || 8005;


//for deployment
if(process.env.NODE_ENV==="production"){
  app.use(express.static("client/build"))
}

app.listen(port, () => {
  console.log(`server started at port ${port}`);
});

DefaultData();
