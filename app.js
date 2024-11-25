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
// List of allowed origins
// const allowedOrigins = [
//   "http://localhost:3000",
//   "https://golden-queijadas-d9b5e0.netlify.app",
// ];
var corsOptions = {
  origin: 'http://localhost:3000',
  credentials : true
 }

app.use(cors(corsOptions));

app.use(function (req, res, next) {	
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');    
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');   
    res.setHeader('Access-Control-Allow-Credentials', true);    
    next();
});
app.use(router);
app.use("/files", express.static("./public/files"));

const port = process.env.PORT || 8005;

//for deployment
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

app.listen(port, () => {
  console.log(`server started at port ${port}`);
});

DefaultData();
