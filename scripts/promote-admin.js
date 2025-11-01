#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const args = process.argv.slice(2);
const argMap = Object.fromEntries(args.map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v === undefined ? true : v];
}));

(async () => {
  try {
    if (!argMap.email && !argMap.matric) {
      console.error('Usage: node scripts/promote-admin.js --email=user@example.com [--create --name="Admin User" --password=Secret123] OR --matric=U1234');
      process.exit(1);
    }

    await connectDB();

    const filter = argMap.email
      ? { email: argMap.email.toLowerCase() }
      : { matricNo: argMap.matric.toUpperCase() };

    let user = await User.findOne(filter);
    if (!user) {
      if (argMap.create && argMap.email) {
        const email = String(argMap.email).toLowerCase();
        const fullName = argMap.name || argMap.fullName || argMap.fullname;
        const password = argMap.password;

        if (!fullName || !password) {
          console.error('When using --create, please provide --name and --password.');
          process.exit(1);
        }

        user = await User.create({
          email,
          password,
          fullName,
          role: 'admin',
          isActive: true
        });
        console.log('✅ Created admin user:', { id: user._id.toString(), email: user.email, name: user.fullName });
      } else {
        console.error('User not found for filter:', filter);
        process.exit(1);
      }
    }

    if (user.role === 'admin') {
      console.log('User is already an admin:', user.email || user.matricNo);
      process.exit(0);
    }

    user.role = 'admin';
    user.isActive = true;
    await user.save();

    console.log('✅ Promoted user to admin:', {
      id: user._id.toString(),
      email: user.email,
      matricNo: user.matricNo,
      role: user.role,
      isActive: user.isActive
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Promotion failed:', err);
    try { await mongoose.connection.close(); } catch (_) {}
    process.exit(1);
  }
})();
