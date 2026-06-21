import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const forceUpdateAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = (await import('../src/models/User.js')).default;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('Please set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file');
      process.exit(1);
    }

    // Find existing admin or create new one
    let admin = await User.findOne({ role: 'admin' });
    
    if (admin) {
      // Forcibly update existing admin
      admin.email = adminEmail.toLowerCase();
      admin.password = adminPassword; // Mongoose pre-save hook will hash this
      await admin.save();
      console.log('Successfully updated existing Admin account to use the new credentials from .env!');
    } else {
      // Create new admin
      admin = await User.create({
        email: adminEmail.toLowerCase(),
        password: adminPassword,
        whatsappNumber: '+201064866584',
        name: 'Admin',
        role: 'admin',
        isEmailVerified: true,
      });
      console.log('No admin found. Created a fresh Admin account!');
    }

    console.log('Admin Email:', admin.email);
    console.log('Ready to login!');
    process.exit(0);
  } catch (error) {
    console.error('Update failed:', error.message);
    process.exit(1);
  }
};

forceUpdateAdmin();
