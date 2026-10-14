export const DEPARTMENTS = ['Development', 'Design', 'QA', 'HR', 'Sales'];
export const EMPLOYEE_STATUSES = ['Active', 'Inactive', 'On Leave'];
export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const TASK_STATUSES = ['Todo', 'In Progress', 'Completed', 'Cancelled'];

export const VALID_STATUS_FLOW = {
  Todo: ['In Progress', 'Completed', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled']
};

export const PRIORITY_WEIGHT = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4
};

export const isDateInRange = (checkDate, startDate, endDate) => {
  const target = new Date(checkDate);
  const start = new Date(startDate);
  const end = new Date(endDate);
  return target >= start && target <= end;
};

export const validateEmployeeAssignment = (employee, startDate) => {
  if (!employee) {
    throw Object.assign(new Error('Employee not found.'), { statusCode: 404 });
  }

  if (employee.status === 'Inactive') {
    throw Object.assign(new Error('Assignment rejected: employee is inactive.'), { statusCode: 400 });
  }

  if (employee.status === 'On Leave' && employee.leaveStart && employee.leaveEnd) {
    const targetDate = new Date(startDate);
    const start = new Date(employee.leaveStart);
    const end = new Date(employee.leaveEnd);

    if (targetDate >= start && targetDate <= end) {
      throw Object.assign(new Error('Assignment rejected: employee is on leave during the task start date.'), { statusCode: 400 });
    }
  }
};

export const validateStatusTransition = (currentStatus, nextStatus) => {
  const validStatuses = VALID_STATUS_FLOW[currentStatus] || [];

  if (!validStatuses.includes(nextStatus)) {
    throw Object.assign(new Error(`Invalid status transition from ${currentStatus} to ${nextStatus}.`), { statusCode: 400 });
  }
};

export const isOverdue = (task) => {
  if (!task || !task.dueDate) return false;
  if (task.status === 'Completed' || task.status === 'Cancelled') return false;
  return new Date() > new Date(task.dueDate);
};

export const normalizePagination = (page, limit) => {
  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = Math.max(1, Number(limit) || 10);

  return {
    page: currentPage,
    limit: pageSize
  };
};

export const buildSortObject = (sortBy, sortOrder) => {
  const direction = sortOrder === 'asc' ? 1 : -1;

  switch (sortBy) {
    case 'createdDate':
      return { createdDate: direction };
    case 'dueDate':
      return { dueDate: direction };
    case 'priority':
      return { createdDate: -1 };
    case 'title':
      return { title: direction };
    default:
      return { createdDate: -1 };
  }
};
