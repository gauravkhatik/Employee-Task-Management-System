import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      enum: ['Development', 'Design', 'QA', 'HR', 'Sales'],
      required: true
    },
    role: {
      type: String,
      required: true,
      trim: true
    },
    joiningDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'On Leave'],
      required: true
    },
    skills: [{
      type: String,
      trim: true
    }],
    leaveStart: {
      type: Date,
      default: null
    },
    leaveEnd: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

employeeSchema.pre('save', function normalizeEmail(next) {
  if (this.email) {
    this.email = this.email.trim().toLowerCase();
  }

  if (this.status !== 'On Leave') {
    this.leaveStart = null;
    this.leaveEnd = null;
  }

  next();
});

export default mongoose.model('Employee', employeeSchema);
