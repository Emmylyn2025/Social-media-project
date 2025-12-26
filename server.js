import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import router from "./Routes/router.js";
import {appError} from "./error-handling/error404.js";
import cookieParser from "cookie-parser";
dotenv.config();

//Connect to database
mongoose.connect(process.env.dataBaseConn).then(() => {
  console.log("Connection to database successful");
}).catch((error) => {
  console.log("Error while connecting to database", error);
});

const app = express();

//Middlewares
app.use(express.json());
app.use(cookieParser());
app.use('/social/media', router);

//Error handling middleware
app.use((req, res, next) => {
  res.status(404).json({
    message: "Route not found"
  });
});


//Error middleware
app.use(appError);

//Global error handler
app.use((err, req, res, next) => {
  console.log(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message
  });
})

//Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});