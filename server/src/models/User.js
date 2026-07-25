import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    isAdmin: { type: Boolean, default: false },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    // Password reset. Only the SHA-256 hash of the token is stored — a leaked
    // database dump then cannot be used to reset anyone's password, the same
    // reason `password` is bcrypt-hashed above.
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
    // When the last reset email went out, so a script cannot spam an inbox.
    resetRequestedAt: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model('User', userSchema);
