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
      console.log('Admin already exists:', existingAdmin.phone);
      process.exit(0);
    }

    const adminPhone = process.env.ADMIN_PHONE;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPhone || !adminPassword) {
      console.error('Please set ADMIN_PHONE and ADMIN_PASSWORD in your .env file');
      process.exit(1);
    }

    const admin = await User.create({
      phone: adminPhone,
      password: adminPassword,
      name: 'Admin',
      role: 'admin',
      isPhoneVerified: true,
    });

    console.log('Admin created successfully!');
    console.log('Phone:', admin.phone);
    console.log('Password: [HIDDEN]');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seedAdmin();
