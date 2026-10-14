import Task from '../models/Task.js';
import Employee from '../models/Employee.js';
import { stringify } from 'csv-stringify/sync';
import { DEPARTMENTS, PRIORITY_WEIGHT, TASK_PRIORITIES, TASK_STATUSES, normalizePagination, buildSortObject, isOverdue, validateEmployeeAssignment, validateStatusTransition } from '../utils/validation.js';

const buildFilterFromQuery = async (query) => {
  const { search = '', department = '', priority = '', status = '', dueDate = '' } = query;
  const filter = {};

  if (department) {
    filter.department = department;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (status) {
    filter.status = status;
  }

  if (dueDate) {
    const date = new Date(dueDate);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.dueDate = { $gte: start, $lte: end };
  }

  if (search) {
    const employees = await Employee.find({
      $or: [
        { fullName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');

    const employeeIds = employees.map((employee) => employee._id);

    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { assignedEmployee: { $in: employeeIds } }
    ];
  }

  return filter;
};

const ensureCapacity = async (employeeId, excludeTaskId = null) => {
  const activeTaskCount = await Task.countDocuments({
    assignedEmployee: employeeId,
    status: { $in: ['Todo', 'In Progress'] },
    _id: { $ne: excludeTaskId }
  });

  if (activeTaskCount >= 3) {
    throw Object.assign(new Error('This employee already has 3 active tasks. No additional active task can be assigned.'), { statusCode: 400 });
  }
};

const sanitizeTaskPayload = (payload = {}) => {
  const cleaned = { ...payload };

  if (cleaned.title) cleaned.title = cleaned.title.trim();
  if (cleaned.description) cleaned.description = cleaned.description.trim();
  if (cleaned.department && !DEPARTMENTS.includes(cleaned.department)) {
    throw Object.assign(new Error(`Department must be one of: ${DEPARTMENTS.join(', ')}`), { statusCode: 400 });
  }

  if (cleaned.priority && !TASK_PRIORITIES.includes(cleaned.priority)) {
    throw Object.assign(new Error(`Priority must be one of: ${TASK_PRIORITIES.join(', ')}`), { statusCode: 400 });
  }

  if (cleaned.status && !TASK_STATUSES.includes(cleaned.status)) {
    throw Object.assign(new Error(`Status must be one of: ${TASK_STATUSES.join(', ')}`), { statusCode: 400 });
  }

  return cleaned;
};

const validateTaskData = (payload) => {
  const required = ['title', 'description', 'assignedEmployee', 'department', 'priority', 'startDate', 'dueDate'];

  for (const field of required) {
    if (!payload[field] && payload[field] !== 0) {
      throw Object.assign(new Error(`${field} is required.`), { statusCode: 400 });
    }
  }

  if (new Date(payload.dueDate) < new Date(payload.startDate)) {
    throw Object.assign(new Error('Due Date cannot be earlier than Start Date.'), { statusCode: 400 });
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const { page, limit } = normalizePagination(req.query.page, req.query.limit);
    const { sortBy = 'createdDate', sortOrder = 'desc' } = req.query;
    const filter = await buildFilterFromQuery(req.query);

    const totalItems = await Task.countDocuments(filter);
    const sort = buildSortObject(sortBy, sortOrder);

    let tasks = await Task.find(filter)
      .populate('assignedEmployee', 'employeeId fullName email department role status')
      .sort(sort);

    if (sortBy === 'priority') {
      const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      tasks = tasks.sort((a, b) => {
        const diff = priorityOrder[b.priority] - priorityOrder[a.priority];
        return sortOrder === 'asc' ? -diff : diff;
      });
    }

    const paginatedTasks = tasks.slice((page - 1) * limit, page * limit);

    const result = paginatedTasks.map((task) => ({
      ...task.toObject(),
      overdue: isOverdue(task.toObject())
    }));

    res.json({
      success: true,
      data: result,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignedEmployee', 'employeeId fullName email department role status');
    if (!task) {
      throw Object.assign(new Error('Task not found.'), { statusCode: 404 });
    }

    res.json({ success: true, data: { ...task.toObject(), overdue: isOverdue(task.toObject()) } });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const payload = sanitizeTaskPayload(req.body);
    payload.status = payload.status || 'Todo';
    validateTaskData(payload);

    const employee = await Employee.findById(payload.assignedEmployee);
    validateEmployeeAssignment(employee, payload.startDate);
    await ensureCapacity(payload.assignedEmployee);

    const taskId = `TASK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const task = await Task.create({
      ...payload,
      taskId,
      employeeSnapshot: {
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        email: employee.email,
        department: employee.department,
        role: employee.role
      }
    });

    const createdTask = await Task.findById(task._id).populate('assignedEmployee', 'employeeId fullName email department role status');
    res.status(201).json({ success: true, data: createdTask });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      throw Object.assign(new Error('Task not found.'), { statusCode: 404 });
    }

    if (task.status === 'Completed' || task.status === 'Cancelled') {
      throw Object.assign(new Error('Completed and Cancelled tasks cannot be edited.'), { statusCode: 400 });
    }

    const payload = sanitizeTaskPayload(req.body);

    if (payload.status && payload.status !== task.status) {
      throw Object.assign(new Error('Use the status update endpoint to change the task status.'), { statusCode: 400 });
    }

    const nextData = {
      ...task.toObject(),
      ...payload,
      assignedEmployee: payload.assignedEmployee || task.assignedEmployee,
      startDate: payload.startDate || task.startDate,
      dueDate: payload.dueDate || task.dueDate,
      title: payload.title || task.title,
      description: payload.description || task.description,
      department: payload.department || task.department,
      priority: payload.priority || task.priority,
      status: task.status
    };

    validateTaskData(nextData);

    const employeeId = String(nextData.assignedEmployee);
    const employee = await Employee.findById(employeeId);
    validateEmployeeAssignment(employee, nextData.startDate);
    await ensureCapacity(employeeId, task._id);

    task.set({
      title: nextData.title,
      description: nextData.description,
      assignedEmployee: employeeId,
      department: nextData.department,
      priority: nextData.priority,
      startDate: nextData.startDate,
      dueDate: nextData.dueDate
    });

    task.employeeSnapshot = {
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      email: employee.email,
      department: employee.department,
      role: employee.role
    };

    await task.save();

    const updatedTask = await Task.findById(task._id).populate('assignedEmployee', 'employeeId fullName email department role status');
    res.json({ success: true, data: { ...updatedTask.toObject(), overdue: isOverdue(updatedTask.toObject()) } });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      throw Object.assign(new Error('Task not found.'), { statusCode: 404 });
    }

    if (task.status === 'Completed' || task.status === 'Cancelled') {
      throw Object.assign(new Error('Completed and Cancelled tasks cannot be edited.'), { statusCode: 400 });
    }

    const nextStatus = req.body.status;

    if (!nextStatus) {
      throw Object.assign(new Error('Status is required.'), { statusCode: 400 });
    }

    validateStatusTransition(task.status, nextStatus);

    task.status = nextStatus;
    if (nextStatus === 'Completed') {
      task.completedDate = new Date();
    } else {
      task.completedDate = null;
    }

    await task.save();

    const updatedTask = await Task.findById(task._id).populate('assignedEmployee', 'employeeId fullName email department role status');
    res.json({ success: true, data: { ...updatedTask.toObject(), overdue: isOverdue(updatedTask.toObject()) } });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      throw Object.assign(new Error('Task not found.'), { statusCode: 404 });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const exportTasksCsv = async (req, res, next) => {
  try {
    const filter = await buildFilterFromQuery(req.query);
    const tasks = await Task.find(filter).populate('assignedEmployee', 'employeeId fullName email department role status').sort({ createdDate: -1 });

    const rows = tasks.map((task) => ({
      taskId: task.taskId,
      title: task.title,
      description: task.description,
      assignedEmployee: task.employeeSnapshot?.fullName || task.assignedEmployee?.fullName || 'Unassigned',
      department: task.department,
      priority: task.priority,
      status: task.status,
      startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      createdDate: task.createdDate ? new Date(task.createdDate).toISOString().split('T')[0] : '',
      completedDate: task.completedDate ? new Date(task.completedDate).toISOString().split('T')[0] : '',
      overdue: isOverdue(task.toObject()) ? 'Yes' : 'No'
    }));

    const csv = stringify(rows, {
      header: true,
      columns: ['taskId', 'title', 'description', 'assignedEmployee', 'department', 'priority', 'status', 'startDate', 'dueDate', 'createdDate', 'completedDate', 'overdue']
    });

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="roots-media-tasks-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};
