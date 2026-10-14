import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';
import StatusBadge from '../components/StatusBadge';

function EmployeeDetailPage() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const employeeResponse = await api.get(`/employees/${id}`);
        setEmployee(employeeResponse.data.data);

        const tasksResponse = await api.get('/tasks', {
          params: { page: 1, limit: 50, search: employeeResponse.data.data.fullName }
        });
        setTasks(tasksResponse.data.data.filter((task) => task.assignedEmployee?._id === id));
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [id]);

  if (!employee) return <div className="panel">Loading employee details...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{employee.fullName}</h1>
        <div className="action-row">
          <Link to={`/employees/${id}/edit`} className="secondary-btn">Edit</Link>
        </div>
      </div>

      <div className="detail-grid">
        <div className="panel">
          <h3>Employee Information</h3>
          <ul className="summary-list">
            <li><span>Employee ID</span><strong>{employee.employeeId}</strong></li>
            <li><span>Email</span><strong>{employee.email}</strong></li>
            <li><span>Phone</span><strong>{employee.phone}</strong></li>
            <li><span>Department</span><strong>{employee.department}</strong></li>
            <li><span>Role</span><strong>{employee.role}</strong></li>
            <li><span>Status</span><strong><StatusBadge value={employee.status} /></strong></li>
            <li><span>Joining Date</span><strong>{new Date(employee.joiningDate).toLocaleDateString()}</strong></li>
          </ul>
        </div>

        <div className="panel">
          <h3>Skills</h3>
          <div className="pill-row">
            {(employee.skills || []).map((skill) => <span key={skill} className="badge todo">{skill}</span>)}
          </div>
          {employee.status === 'On Leave' && (
            <div style={{ marginTop: '18px' }}>
              <p className="muted">Leave period</p>
              <strong>{new Date(employee.leaveStart).toLocaleDateString()} - {new Date(employee.leaveEnd).toLocaleDateString()}</strong>
            </div>
          )}
        </div>
      </div>

      <div className="panel" style={{ marginTop: '20px' }}>
        <h3>Assigned Tasks</h3>
        {tasks.length === 0 ? <div className="empty-state">No tasks assigned to this employee.</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id}>
                    <td><Link to={`/tasks/${task._id}`}>{task.title}</Link></td>
                    <td><StatusBadge value={task.status} /></td>
                    <td><StatusBadge value={task.priority} /></td>
                    <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeDetailPage;
