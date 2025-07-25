import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

dotenv.config();

export const register = async (req, res) => {
    const {username,email,password} = req.body;
    const avatarUrl = req.file?.path || req.file?.secure_url || null;
    
    try{
      const hashPassword = await bcrypt.hash(password,10);
      const role = email === process.env.Admin_Email ? 'ADMIN' : 'USER';
      // create user in the  database
       await prisma.user.create({
         data:{
            username,
            email,
            password: hashPassword,
            avatarUrl,
            role
         }
       });
        res.status(201).json({ message: "User created successfully" });
    }catch(err){
        console.error("Registration error:", err);
       res.status(500).json({message: 'Failed to create user!'});
    }
}

export const login = async (req, res) => {
    const {email,password} = req.body;
    try{
      const user = await prisma.user.findUnique({
         where : { email }
      });  
      if(!user){
        return res.status(404).json({message: 'User not found!'});
      }
      const isPasswordValid = await bcrypt.compare(password,user.password);
      if(!isPasswordValid){
        return res.status(401).json({message: 'Invalid password!'});
      }
      const age = 1000 * 60 * 60 * 24 * 7;   // Time for one week in (ms)*(second)*(minute)*(hours)*(No. of days in a week)
      const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
       process.env.JWT_SECRET_KEY, 
       {expiresIn: age}
    );
    // const isProd = process.env.NODE_ENV === 'production';
    const {password:userPassword, ...userData} = user;
        res.cookie("token", token, {
        httpOnly: true,
        secure: true,          // only secure over HTTPS
        sameSite: "None",
        // secure: isProd,          // only secure over HTTPS
        // sameSite: isProd ? "None" : "Lax",
        maxAge: age,
      })
      .status(200)
      .json(userData);
}catch(err){
        console.log(err);
        res.status(500).json({message: 'Login failed!'});
    }
}

export const logout = (req,res)=>{
    res.clearCookie("token").status(200).json({message: 'Logout successful!'});
}



export const editProfile = async (req, res) => {
  try {
    const userId = req.user.id; // from verifyToken middleware
    const { username, email, currentPassword, newPassword } = req.body;
    const avatarUrl = req.file?.path || req.file?.secure_url || undefined;

    // 2MB file constraint (in case of upload middleware)
    if (req.file && req.file.size > 2 * 1024 * 1024) {
      return res.status(400).json({ message: "Profile picture must be less than 2 MB." });
    }

    // Check if username or email is already taken (optional)
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: { username, NOT: { id: userId } },
      });
      if (existingUser)
        return res.status(400).json({ message: "Username already taken" });
    }

    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
      });
      if (existingEmail)
        return res.status(400).json({ message: "Email already taken" });
    }

    // Password update logic
    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    }

    // Update user profile data
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        email,
        ...(avatarUrl && { avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        avatarUrl: true,
        role: true,
        updatedAt: true,
      },
    });

    return res
      .status(200)
      .json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Edit profile error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};