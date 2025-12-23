import bcrypt from "bcrypt";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  profileImageUrl: {
    type: String
  },
  profileImagePublicId: {
    type: String
  },
  username: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    tolowercase: true
  },
  mobile: {
    type: Number,
    required: true,
    unique: true,
    maxlength: 11
  },
  password: {
    type: String,
    required: true,
    select: false,
  }
});

//Hash password before saving
userSchema.pre('save', async function() {
  if(!this.isModified("password")) {
    return 
  }
  this.password = await bcrypt.hash(this.password, 12);
});

//Compare password before login
userSchema.methods.correctPassword = async function(inputPassword, savedPassword) {
  return await bcrypt.compare(inputPassword, savedPassword);
};

const User = mongoose.model('users', userSchema);

export default User;