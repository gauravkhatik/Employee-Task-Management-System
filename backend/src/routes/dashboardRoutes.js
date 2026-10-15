import express from 'express';
import Employee from '../models/Employee.js';
import Task from '../models/Task.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const employeesByStatus = await Employee.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const totalTasks = await Task.countDocuments();
    const tasksByStatus = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const overdueTasks = await Task.countDocuments({
      status: { $nin: ['Completed', 'Cancelled'] },
      dueDate: { $lt: startOfToday }
    });

    const employeeLoad = await Task.aggregate([
      {
        $match: { status: { $in: ['Todo', 'In Progress'] } }
      },
      {
        $group: {
          _id: '$assignedEmployee',
          activeTasks: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: '$employee'
      },
      {
        $project: {
          _id: 0,
          employeeId: '$employee.employeeId',
          fullName: '$employee.fullName',
          department: '$employee.department',
          activeTasks: 1
        }
      },
      { $sort: { activeTasks: -1, fullName: 1 } }
    ]);

    const statusMap = Object.fromEntries(
      employeesByStatus.map((item) => [item._id, item.count])
    );

    const taskStatusMap = Object.fromEntries(
      tasksByStatus.map((item) => [item._id, item.count])
    );

    res.json({
      success: true,
      data: {
        totalEmployees,
        employeesByStatus: {
          Active: statusMap.Active || 0,
          Inactive: statusMap.Inactive || 0,
          'On Leave': statusMap['On Leave'] || 0
        },
        totalTasks,
        tasksByStatus: {
          Todo: taskStatusMap.Todo || 0,
          'In Progress': taskStatusMap['In Progress'] || 0,
          Completed: taskStatusMap.Completed || 0,
          Cancelled: taskStatusMap.Cancelled || 0
        },
        overdueTasks,
        employeeLoad
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
