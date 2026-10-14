import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';

const departments = ['Development', 'Design', 'QA', 'HR', 'Sales'];
const priorities = ['Low', 'Medium', 'High', 'Critical'];
const statuses = ['Todo', 'In Progress', 'Completed', 'Cancelled'];

function TaskListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const currentPage = Number(searchParams.get('page') || 1);

  const filters = useMemo(() => ({
    search: searchParams.get('search') || '',
    department: searchParams.get('department') || '',
    priority: searchParams.get('priority') || '',
    status: searchParams.get('status') || '',
    dueDate: searchParams.get('dueDate') || '',
    sortBy: searchParams.get('sortBy') || 'createdDate',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  }), [searchParams]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await api.get('/tasks', {
          params: {
            page: currentPage,
            limit: 10,
            ...filters
          }
        });
        setTasks(response.data.data);
        setTotalPages(response.data.pagination.totalPages || 1);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [currentPage, filters]);

  const updateQuery = (changes) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (!value || value === 'all') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });

    if (changes.page) {
      next.set('page', String(changes.page));
    }
    if (changes.search !== undefined || changes.department !== undefined || changes.priority !== undefined || changes.status !== undefined || changes.dueDate !== undefined || changes.sortBy !== undefined || changes.sortOrder !== undefined) {
      next.set('page', '1');
    }

    setSearchParams(next);
  };

  const handleStatusChange = async (id, status) => {
    if (!status) return;

    try {
      await api.put(`/tasks/${id}/status`, { status });
      const next = new URLSearchParams(searchParams.toString());
      setSearchParams(next);
      window.location.reload();
    } catch (error) {
      window.alert(error.response?.data?.message || 'Unable to update status.');
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams(searchParams.toString());
    window.open(`/api/tasks/export/csv?${params.toString()}`, '_blank');
  };

  const nextStatusMap = {
    Todo: ['In Progress', 'Completed', 'Cancelled'],
    'In Progress': ['Completed', 'Cancelled']
  };

  return (
    <div>
      <div className="page-header">
        <h1>Tasks</h1>
        <div className="action-row">
          <button className="outline-btn" onClick={handleExport}>Export CSV</button>
          <Link to="/tasks/new" className="primary-btn">Add Task</Link>
        </div>
      </div>

      <div className="panel">
        <div className="filters">
          <div className="field-row">
            <label>Search</label>
            <input value={filters.search} onChange={(event) => updateQuery({ search: event.target.value })} placeholder="Title or employee" />
          </div>
          <div className="field-row">
            <label>Department</label>
            <select value={filters.department} onChange={(event) => updateQuery({ department: event.target.value })}>
              <option value="">All Departments</option>
              {departments.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="field-row">
            <label>Priority</label>
            <select value={filters.priority} onChange={(event) => updateQuery({ priority: event.target.value })}>
              <option value="">All Priorities</option>
              {priorities.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="field-row">
            <label>Status</label>
            <select value={filters.status} onChange={(event) => updateQuery({ status: event.target.value })}>
              <option value="">All Statuses</option>
              {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="field-row">
            <label>Due Date</label>
            <input type="date" value={filters.dueDate} onChange={(event) => updateQuery({ dueDate: event.target.value })} />
          </div>
          <div className="field-row">
            <label>Sort By</label>
            <select value={filters.sortBy} onChange={(event) => updateQuery({ sortBy: event.target.value })}>
              <option value="createdDate">Created Date</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>

        {loading ? <div className="empty-state">Loading tasks...</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state">No tasks found.</td>
                  </tr>
                ) : tasks.map((task) => (
                  <tr key={task._id}>
                    <td><Link to={`/tasks/${task._id}`}>{task.title}</Link></td>
                    <td>{task.employeeSnapshot?.fullName || task.assignedEmployee?.fullName || 'N/A'}</td>
                    <td>{task.department}</td>
                    <td><StatusBadge value={task.priority} /></td>
                    <td><StatusBadge value={task.status} /></td>
                    <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                    <td>
                      <div className="action-row">
                        {nextStatusMap[task.status] ? (
                          <select value="" onChange={(event) => handleStatusChange(task._id, event.target.value)} style={{ minWidth: '140px' }}>
                            <option value="">Update Status</option>
                            {nextStatusMap[task.status].map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        ) : null}
                        <Link to={`/tasks/${task._id}`} className="action-link">View</Link>
                        <Link to={`/tasks/${task._id}/edit`} className="action-link">Edit</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={currentPage} totalPages={totalPages} onChange={(page) => updateQuery({ page })} />
      </div>
    </div>
  );
}

export default TaskListPage;
