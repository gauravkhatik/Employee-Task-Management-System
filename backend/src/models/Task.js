import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      unique: true,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    employeeSnapshot: {
      employeeId: String,
      fullName: String,
      email: String,
      department: String,
      role: String
    },
    department: {
      type: String,
      enum: ['Development', 'Design', 'QA', 'HR', 'Sales'],
      required: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      required: true
    },
    status: {
      type: String,
      enum: ['Todo', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Todo',
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    createdDate: {
      type: Date,
      default: Date.now
    },
    completedDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

taskSchema.pre('save', function setCompletionDate(next) {
  if (this.status === 'Completed') {
    this.completedDate = this.completedDate || new Date();
  } else {
    this.completedDate = null;
  }

  if (this.dueDate < this.startDate) {
    const error = new Error('Due Date cannot be earlier than Start Date.');
    error.statusCode = 400;
    return next(error);
  }

  next();
});

taskSchema.pre('findOneAndUpdate', function setUpdateValues(next) {
  const update = this.getUpdate();

  if (update.status === 'Completed') {
    update.completedDate = update.completedDate || new Date();
  } else if (update.status && update.status !== 'Completed') {
    update.completedDate = null;
  }

  if (update.dueDate && update.startDate && new Date(update.dueDate) < new Date(update.startDate)) {
    const error = new Error('Due Date cannot be earlier than Start Date.');
    error.statusCode = 400;
    return next(error);
  }

  next();
});

export default mongoose.model('Task', taskSchema);
