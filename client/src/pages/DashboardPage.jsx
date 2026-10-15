import { useEffect, useState } from 'react';
import api from '../lib/api';
import StatusBadge from '../components/StatusBadge';

function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('https://employee-task-management-system-bac.vercel.app/api/dashboard');
        setDashboard(response.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <div className="panel">Loading dashboard...</div>;
  if (!dashboard) return <div className="panel">Unable to load dashboard.</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="grid grid-4">
        <div className="stat-card">
          <div className="label">Total Employees</div>
          <div className="value">{dashboard.totalEmployees}</div>
        </div>
        <div className="stat-card">
          <div className="label">Active Tasks</div>
          <div className="value">{(dashboard.tasksByStatus['Todo'] || 0) + (dashboard.tasksByStatus['In Progress'] || 0)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Completed Tasks</div>
          <div className="value">{dashboard.tasksByStatus.Completed || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Overdue Tasks</div>
          <div className="value">{dashboard.overdueTasks || 0}</div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginTop: '20px' }}>
        <div className="panel">
          <h3>Employee Status</h3>
          <ul className="summary-list">
            {Object.entries(dashboard.employeesByStatus).map(([key, value]) => (
              <li key={key}><span>{key}</span><strong>{value}</strong></li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <h3>Task Status</h3>
          <ul className="summary-list">
            {Object.entries(dashboard.tasksByStatus).map(([key, value]) => (
              <li key={key}><span>{key}</span><strong>{value}</strong></li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <h3>Employee Workload</h3>
          <ul className="summary-list">
            {dashboard.employeeLoad.map((employee) => (
              <li key={employee.employeeId}>
                <span>{employee.fullName}</span>
                <strong>{employee.activeTasks} active</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
