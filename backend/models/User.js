const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
    },
    role: {
      type: String,
      enum: {
        values: ['ADMIN', 'CLIENT'],
        message: '{VALUE} is not a valid role. Allowed values are ADMIN, CLIENT',
      },
      default: 'CLIENT',
      uppercase: true,
    },
    gender: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'DISABLED'],
        message: '{VALUE} is not a valid status. Allowed values are ACTIVE, DISABLED',
      },
      default: 'ACTIVE',
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
