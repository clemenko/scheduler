const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const bcrypt = require('bcryptjs');
const { User } = require('./models');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://wavfd_sched_mongo:27017/scheduler';

const seedAdminUser = async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_super_secret_jwt_secret_change_me') {
    console.warn('WARNING: JWT_SECRET is not set or using default value. Set a strong secret for production.');
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected for seeding');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'Pa22word';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      adminUser.password = hashedPassword;
      adminUser.role = 'admin';
      await adminUser.save();
      console.log('Admin user updated successfully.');
    } else {
      adminUser = new User({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      });
      await adminUser.save();
      console.log('Admin user created successfully.');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

seedAdminUser();
