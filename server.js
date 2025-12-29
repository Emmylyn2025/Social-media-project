import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import router from "./Routes/router.js";
import {appError} from "./error-handling/error404.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import helment from "helmet"
dotenv.config();

//Connect to database
mongoose.connect(process.env.dataBaseConn).then(() => {
  console.log("Connection to database successful");
}).catch((error) => {
  console.log("Error while connecting to database", error);
});

const app = express();

//Middlewares
app.use(helment({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/social/media', router);

//Route not found middleware
app.use((req, res, next) => {
  next(new appError(`Can't find ${req.originalUrl} on the server`, 404));
});

//Global error handler
app.use((err, req, res, next) => {
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  });
})

//Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});