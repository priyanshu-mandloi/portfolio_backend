import authRoute from './route/auth_route.js';
import blogRoute from './route/blog_route.js'
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import messageRoute from './route/message_route.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 8000;


//middleware to parse JSON bodies
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true, 
}));
app.use(cookieParser());
// Routes connection
app.get('/',(req,res)=>{
  res.send('Welcome to the Portfolio API');
})
app.use("/api/auth",authRoute);
app.use("/api/blogs", blogRoute);
app.use("/api/messages", messageRoute);
// listening on port 8000
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});