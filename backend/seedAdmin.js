const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/user');

// Load environment variables
dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/HumanOS';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for admin seeding...');

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@humanos.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'change_this_password';
    const adminName = process.env.ADMIN_NAME || 'HumanOS Administrator';

    // Check if an ADMIN user already exists with this email or role
    const existingAdmin = await User.findOne({
      $or: [{ email: adminEmail }, { role: 'ADMIN' }],
    });

    if (existingAdmin) {
      console.log(`Admin account already exists: ${existingAdmin.email} (Role: ${existingAdmin.role})`);
      process.exit(0);
    }

    // Hash password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create the ADMIN user
    const adminUser = await User.create({
      fullName: adminName,
      email: adminEmail,
      phoneNumber: '',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    console.log('✅ Admin user created successfully!');
    console.log(`- ID: ${adminUser._id}`);
    console.log(`- Name: ${adminUser.fullName}`);
    console.log(`- Email: ${adminUser.email}`);
    console.log(`- Role: ${adminUser.role}`);
    console.log(`- Status: ${adminUser.status}`);

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    process.exit(1);
  }
};

seedAdmin();
