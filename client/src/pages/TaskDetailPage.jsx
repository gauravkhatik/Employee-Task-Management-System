import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';
import StatusBadge from '../components/StatusBadge';

const nextStatusMap = {
  Todo: ['In Progress', 'Completed', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled']
};

function TaskDetailPage() {
  const { id } = useParams();
  const [task, setTask] = useState(null);

  const fetchTask = async () => {
    try {
      const response = await api.get(`/tasks/${id}`);
      setTask(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleStatusChange = async (status) => {
    try {
      await api.put(`/tasks/${id}/status`, { status });
      fetchTask();
    } catch (error) {
      window.alert(error.response?.data?.message || 'Unable to update status.');
    }
  };

  if (!task) return <div className="panel">Loading task details...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{task.title}</h1>
        <div className="action-row">
          <Link to={`/tasks/${id}/edit`} className="secondary-btn">Edit</Link>
        </div>
      </div>

      <div className="detail-grid">
        <div className="panel">
          <h3>Task Overview</h3>
          <ul className="summary-list">
            <li><span>Task ID</span><strong>{task.taskId}</strong></li>
            <li><span>Priority</span><strong><StatusBadge value={task.priority} /></strong></li>
            <li><span>Status</span><strong><StatusBadge value={task.status} /></strong></li>
            <li><span>Department</span><strong>{task.department}</strong></li>
            <li><span>Start Date</span><strong>{new Date(task.startDate).toLocaleDateString()}</strong></li>
            <li><span>Due Date</span><strong>{new Date(task.dueDate).toLocaleDateString()}</strong></li>
            <li><span>Created Date</span><strong>{new Date(task.createdDate).toLocaleDateString()}</strong></li>
          </ul>
        </div>

        <div className="panel">
          <h3>Assigned Employee</h3>
          <ul className="summary-list">
            <li><span>Name</span><strong>{task.employeeSnapshot?.fullName || task.assignedEmployee?.fullName || 'N/A'}</strong></li>
            <li><span>Email</span><strong>{task.employeeSnapshot?.email || task.assignedEmployee?.email || 'N/A'}</strong></li>
            <li><span>Department</span><strong>{task.employeeSnapshot?.department || task.assignedEmployee?.department || 'N/A'}</strong></li>
            <li><span>Role</span><strong>{task.employeeSnapshot?.role || task.assignedEmployee?.role || 'N/A'}</strong></li>
          </ul>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '20px' }}>
        <h3>Description</h3>
        <p>{task.description}</p>

        {nextStatusMap[task.status] && (
          <div style={{ marginTop: '18px' }}>
            <label>Update Status</label>
            <div className="action-row" style={{ marginTop: '10px' }}>
              {nextStatusMap[task.status].map((status) => (
                <button key={status} className="secondary-btn" onClick={() => handleStatusChange(status)}>{status}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskDetailPage;
