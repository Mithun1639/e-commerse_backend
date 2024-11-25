const express = require("express");
const router = new express.Router();
const Products = require("../models/productsSchema");
const USER = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const athenticate = require("../middleware/authenticate");
const csv = require("fast-csv");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const fs = require("fs");
const secretKey = `${process.env.KEY}`;
const BASE_URL = process.env.BASE_URL;
const PASS = process.env.PASS;
const FRONT_URL = process.env.FRONT_URL;

//email configaration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mithunreddy011@gmail.com",
    pass: PASS,
  },
});

//get productsdata api
router.get("/getproducts", async (req, res) => {
  try {
    const productsdata = await Products.find();
    // console.log(productsdata);
    res.status(201).json(productsdata);
  } catch (error) {
    console.log(error);
  }
});

//get individual data
router.get("/getproductsone/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const nId = id.slice(2, 10); //new line added by me
    // console.log(nId);
    const individualdata = await Products.findOne({ id: nId });

    // console.log(individualdata)
    res.status(200).json(individualdata);
  } catch (error) {
    // console.log(error);
    res.status(400).json({ msg: "error" });
  }
});

router.post("/register", async (req, res) => {
  const { fname, email, mobile, password, cpassword } = req.body;

  if (!fname || !email || !mobile || !password || !cpassword) {
    res.status(422).json({ error: "fill all details" });
  } else {
    try {
      const preuser = await USER.findOne({ email: email });
      if (preuser) {
        res.status(422).json({ msg: "user already registered" });
      } else {
        const finalUser = new USER({
          fname,
          email,
          mobile,
          password,
          cpassword,
        });

        const storedata = await finalUser.save();
        console.log(storedata);
        res.status(201).json({ storedata });
      }
    } catch (error) {
      res.status(422).json(error);
      console.log("catch block error");
    }
  }
});

//lign user api

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "fill all details" });
  } else {
    try {
      const userLogin = await USER.findOne({ email: email });
      console.log(userLogin);
      if (userLogin) {
        const isMatch = await bcrypt.compare(password, userLogin.password);
        console.log(isMatch);

        //token generate
        const token = await userLogin.generateAuthToken();
        console.log(token);

        res.cookie("amazonWeb", token, {
          expires: new Date(Date.now() + 900000),
          httpOnly: true,
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: "Lax",
          domain: "http://localhost:3000", // Ensure this matches your actual domain 
          path: '***/***'
        });

        console.log(secure);
        console.log("cookie below line");

        const result = {
          userLogin,
          token,
        };

        if (!isMatch) {
          res.status(400).json({ error: "Invalid Details" });
        } else {
          res.status(201).json({ result });
        }
      } else {
        res.status(400).json({ error: "Invalid details" });
      }
    } catch (error) {
      res.status(400).json({ error: "invalid details" });
    }
  }
});

//adding the data into cart

router.post("/addcart/:id", athenticate, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const rId = id.slice(1, 9);
    const cart = await Products.findOne({ id: rId });
    // console.log(cart+"cart value");
    console.log(req.rootUser + " lsdjfknsidkjjfd");

    const UserContact = await USER.findOne({ _id: req.userID });
    // console.log(UserContact);

    if (UserContact) {
      const cartData = await UserContact.addcartdata(cart);
      await UserContact.save();
      // console.log(cartData);
      // console.log(UserContact);
      res.status(201).json(UserContact);
    } else {
      res.status(401).json({ error: "invalid user" });
    }
  } catch (error) {
    res.status(401).json({ error: "invalid user" });
  }
});

//get cart details

router.get("/cartdetails", athenticate, async (req, res) => {
  try {
    const buyuser = await USER.findOne({ _id: req.userID });
    res.status(201).json(buyuser);
  } catch (error) {
    console.log(error);
  }
});

//get valid user
router.get("/validateuser", athenticate, async (req, res) => {
  try {
    const validuserone = await USER.findOne({ _id: req.userID });
    res.status(201).json(validuserone);
  } catch (error) {
    console.log(error);
  }
});

// remove item from cart
router.delete("/remove/:id", athenticate, async (req, res) => {
  try {
    const { id } = req.params;
    req.rootUser.carts = req.rootUser.carts.filter((cruval) => {
      return cruval.id != id;
    });
    req.rootUser.save();
    res.status(201).json(req.rootUser);
    console.log("item removed");

    console.log(req.rootUser);
  } catch (error) {
    res.status(400).json(error);
    console.log("delete route catch block error");
  }
});

//for user log out

router.get("/logout", athenticate, (req, res) => {
  try {
    req.rootUser.tokens = req.rootUser.tokens.filter((currele) => {
      return currele.token !== req.token;
    });

    res.clearCookie("amazonWeb", { path: "/" });

    req.rootUser.save();

    res.status(201).json(req.rootUser);
    console.log("user logout");
  } catch (err) {
    console.log(err + " error for logout router");
  }
});

//export to csv

router.get("/exporttocsv", athenticate, async (req, res) => {
  try {
    console.log(req.userID);
    const user = await USER.findOne({ _id: req.userID });

    const csvStream = csv.format({ headers: true });

    if (!fs.existsSync("public/files/export")) {
      if (!fs.existsSync("public/files")) {
        fs.mkdirSync("public/files/");
      }

      if (!fs.existsSync("public/files/export")) {
        fs.mkdirSync("./public/files/export");
      }
    }

    const writablestream = fs.createWriteStream(
      "public/files/export/cartdata.csv"
    );

    csvStream.pipe(writablestream);

    writablestream.on("finish", function () {
      res.json({
        downloadUrl: `${BASE_URL}/files/export/cartdata.csv`,
      });
    });

    if (user.carts.length > 0) {
      user.carts.map((cart) => {
        csvStream.write({
          ProductID: cart._id ? cart._id : "-",
          ProductName: cart.title.shortTitle ? cart.title.shortTitle : "-",
          ProductPrice: cart.price.mrp ? cart.price.mrp : "-",
          ProductDiscount: cart.price.discount ? cart.price.discount : "-",
          ProductCost: cart.price.cost ? cart.price.cost : "-",
        });
      });
    }

    csvStream.end();
    writablestream.end();
  } catch (error) {
    console.log(error);
  }
});

//send email link for reset password

router.post("/sendpasswordlink", async (req, res) => {
  const { mail } = req.body;
  if (!mail) {
    res.status(401).json({ status: 401, message: "Enter your email" });
  }

  try {
    const userFind = await USER.findOne({ email: mail });
    if (!userFind) {
      return res.status(401).json({ status: 401, message: "User not found" });
    }
    const token = jwt.sign({ _id: userFind._id }, secretKey, {
      expiresIn: "1d",
    });
    // console.log(token);
    const setusertoken = await USER.findByIdAndUpdate(
      { _id: userFind._id },
      { verifytoken: token },
      { new: true }
    );
    // console.log("setusertoken", setusertoken);
    if (setusertoken) {
      const mailOptions = {
        from: "mithunreddy011@gmail.com",
        to: mail,
        subject: "Reset Password", ///forgotpassword/:id/:token
        text: `${FRONT_URL}/forgotpassword/${userFind.id}/${setusertoken.verifytoken}`,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          res.status(401).json({ status: 401, msg: "email not sent" });
        } else {
          res.status(201).json({ status: 201, msg: "Email sent successfully" });
        }
      });
    }
  } catch (error) {
    res.status(401).json({ status: 401, error });
  }
});

// verify user for forgot password time
router.get("/forgotpassword/:id/:token", async (req, res) => {
  const { id, token } = req.params;

  try {
    const validUser = await USER.findOne({ _id: id, verifytoken: token });

    const verifyToken = jwt.verify(token, secretKey);

    if (validUser && verifyToken) {
      res.status(200).json({ status: 200, msg: "User verified successfully" });
    } else {
      res
        .status(401)
        .json({ status: 401, msg: "Invalid token or user not found" });
    }
  } catch (error) {
    console.log(error);
  }
});

//change password

router.post("/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;
  try {
    const validUser = await USER.findOne({ _id: id, verifytoken: token });

    const verifyToken = jwt.verify(token, secretKey);

    if (validUser && verifyToken) {
      const hashedPassword = await bcrypt.hash(password, 12);
      const updateuser = await USER.findByIdAndUpdate(
        { _id: id },
        { password: hashedPassword }
      );
      updateuser.save();
      res.status(201).json({ status: 201, updateuser });
    } else {
      res.status(401).json({ status: 401, msg: "Invalid" });
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
