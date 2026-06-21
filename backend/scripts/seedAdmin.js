import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = (await import('../src/models/User.js')).default;

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.email);
      process.exit(0);
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('Please set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file');
      process.exit(1);
    }

    const admin = await User.create({
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      whatsappNumber: '+201064866584', // Admin contact whatsapp
      name: 'Admin',
      role: 'admin',
      isEmailVerified: true,
    });

    console.log('Admin created successfully!');
    console.log('Email:', admin.email);
    console.log('Password: [HIDDEN]');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seedAdmin();
