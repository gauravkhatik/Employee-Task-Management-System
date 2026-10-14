import Employee from '../models/Employee.js';
import Task from '../models/Task.js';
import { DEPARTMENTS, EMPLOYEE_STATUSES, normalizePagination } from '../utils/validation.js';

const normalizeEmployeePayload = (payload) => {
  const cleaned = { ...payload };
  const fields = ['employeeId', 'fullName', 'email', 'phone', 'department', 'role', 'joiningDate', 'status', 'skills'];

  fields.forEach((field) => {
    if (cleaned[field] !== undefined && cleaned[field] !== null && typeof cleaned[field] === 'string') {
      cleaned[field] = cleaned[field].trim();
    }
  });

  if (cleaned.email) {
    cleaned.email = cleaned.email.toLowerCase();
  }

  if (cleaned.skills && Array.isArray(cleaned.skills)) {
    cleaned.skills = cleaned.skills.map((item) => String(item).trim()).filter(Boolean);
  }

  return cleaned;
};

const validateEmployeeData = (employeeData, isUpdate = false) => {
  const requiredFields = ['employeeId', 'fullName', 'email', 'phone', 'department', 'role', 'joiningDate', 'status'];

  for (const field of requiredFields) {
    if (!employeeData[field] && employeeData[field] !== 0) {
      throw Object.assign(new Error(`${field} is required.`), { statusCode: 400 });
    }
  }

  if (!DEPARTMENTS.includes(employeeData.department)) {
    throw Object.assign(new Error(`Department must be one of: ${DEPARTMENTS.join(', ')}`), { statusCode: 400 });
  }

  if (!EMPLOYEE_STATUSES.includes(employeeData.status)) {
    throw Object.assign(new Error(`Status must be one of: ${EMPLOYEE_STATUSES.join(', ')}`), { statusCode: 400 });
  }

  if (employeeData.status === 'On Leave') {
    if (!employeeData.leaveStart || !employeeData.leaveEnd) {
      throw Object.assign(new Error('Leave start and end dates are required when status is On Leave.'), { statusCode: 400 });
    }

    if (new Date(employeeData.leaveEnd) < new Date(employeeData.leaveStart)) {
      throw Object.assign(new Error('Leave end date cannot be earlier than leave start date.'), { statusCode: 400 });
    }
  }

  if (isUpdate && employeeData.status !== 'On Leave') {
    employeeData.leaveStart = null;
    employeeData.leaveEnd = null;
  }

  return true;
};

export const getEmployees = async (req, res, next) => {
  try {
    const { page, limit } = normalizePagination(req.query.page, req.query.limit);
    const { search = '', department = '', status = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = {};

    if (department) {
      filter.department = department;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;

    const totalItems = await Employee.countDocuments(filter);
    const employees = await Employee.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: employees,
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

export const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      throw Object.assign(new Error('Employee not found.'), { statusCode: 404 });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (req, res, next) => {
  try {
    const payload = normalizeEmployeePayload(req.body);
    validateEmployeeData(payload);

    const employeeIdExists = await Employee.findOne({ employeeId: payload.employeeId });
    if (employeeIdExists) {
      throw Object.assign(new Error('Employee ID already exists.'), { statusCode: 409 });
    }

    const emailExists = await Employee.findOne({ email: payload.email });
    if (emailExists) {
      throw Object.assign(new Error('Email is already in use.'), { statusCode: 409 });
    }

    const employee = await Employee.create(payload);
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      throw Object.assign(new Error('Employee not found.'), { statusCode: 404 });
    }

    const payload = normalizeEmployeePayload(req.body);
    validateEmployeeData({ ...employee.toObject(), ...payload }, true);

    if (payload.employeeId && payload.employeeId !== employee.employeeId) {
      const duplicateId = await Employee.findOne({ employeeId: payload.employeeId, _id: { $ne: employee._id } });
      if (duplicateId) {
        throw Object.assign(new Error('Employee ID already exists.'), { statusCode: 409 });
      }
    }

    if (payload.email && payload.email !== employee.email) {
      const duplicateEmail = await Employee.findOne({ email: payload.email, _id: { $ne: employee._id } });
      if (duplicateEmail) {
        throw Object.assign(new Error('Email is already in use.'), { statusCode: 409 });
      }
    }

    Object.assign(employee, payload);
    await employee.save();

    await Task.updateMany(
      { assignedEmployee: employee._id },
      {
        employeeSnapshot: {
          employeeId: employee.employeeId,
          fullName: employee.fullName,
          email: employee.email,
          department: employee.department,
          role: employee.role
        }
      }
    );

    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      throw Object.assign(new Error('Employee not found.'), { statusCode: 404 });
    }

    const activeTasks = await Task.find({
      assignedEmployee: employee._id,
      status: { $in: ['Todo', 'In Progress'] }
    });

    if (activeTasks.length > 0) {
      throw Object.assign(new Error('Cannot delete employee while they have Todo or In Progress tasks.'), { statusCode: 400 });
    }

    await Employee.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Employee deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
