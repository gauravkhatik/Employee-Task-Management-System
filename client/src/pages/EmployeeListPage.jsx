import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';

const departments = ['Development', 'Design', 'QA', 'HR', 'Sales'];
const employeeStatuses = ['Active', 'Inactive', 'On Leave'];

function EmployeeListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const currentPage = Number(searchParams.get('page') || 1);

  const filters = useMemo(() => ({
    search: searchParams.get('search') || '',
    department: searchParams.get('department') || '',
    status: searchParams.get('status') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  }), [searchParams]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setLoadError('');
        const response = await api.get('/employees', {
          params: {
            page: currentPage,
            limit: 10,
            ...filters
          }
        });
        setEmployees(response.data.data);
        setTotalPages(response.data.pagination.totalPages || 1);
      } catch (error) {
        setLoadError(error.response?.data?.message || 'Unable to load employees.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
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
    if (changes.search !== undefined || changes.department !== undefined || changes.status !== undefined || changes.sortBy !== undefined || changes.sortOrder !== undefined) {
      next.set('page', '1');
    }

    setSearchParams(next);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Delete this employee?');
    if (!confirmed) return;

    try {
      await api.delete(`/employees/${id}`);
      const nextPage = currentPage > 1 && employees.length === 1 ? currentPage - 1 : currentPage;
      updateQuery({ page: nextPage });
      window.location.reload();
    } catch (error) {
      window.alert(error.response?.data?.message || 'Unable to delete employee.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Employees</h1>
        <Link to="/employees/new" className="primary-btn">Add Employee</Link>
      </div>

      <div className="panel">
        <div className="filters">
          <div className="field-row">
            <label>Search</label>
            <input value={filters.search} onChange={(event) => updateQuery({ search: event.target.value })} placeholder="Name, email or ID" />
          </div>
          <div className="field-row">
            <label>Department</label>
            <select value={filters.department} onChange={(event) => updateQuery({ department: event.target.value })}>
              <option value="">All Departments</option>
              {departments.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="field-row">
            <label>Status</label>
            <select value={filters.status} onChange={(event) => updateQuery({ status: event.target.value })}>
              <option value="">All Statuses</option>
              {employeeStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="field-row">
            <label>Sort By</label>
            <select value={filters.sortBy} onChange={(event) => updateQuery({ sortBy: event.target.value })}>
              <option value="createdAt">Created Date</option>
              <option value="joiningDate">Joining Date</option>
              <option value="fullName">Name</option>
            </select>
          </div>
          <div className="field-row">
            <label>Order</label>
            <select value={filters.sortOrder} onChange={(event) => updateQuery({ sortOrder: event.target.value })}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        {loading ? <div className="empty-state">Loading employees...</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadError ? (
                  <tr>
                    <td colSpan="6" className="empty-state">{loadError}</td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state">No employees found.</td>
                  </tr>
                ) : employees.map((employee) => (
                  <tr key={employee._id}>
                    <td>{employee.employeeId}</td>
                    <td>{employee.fullName}</td>
                    <td>{employee.email}</td>
                    <td>{employee.department}</td>
                    <td><StatusBadge value={employee.status} /></td>
                    <td>
                      <div className="action-row">
                        <Link to={`/employees/${employee._id}`} className="action-link">View</Link>
                        <Link to={`/employees/${employee._id}/edit`} className="action-link">Edit</Link>
                        <button className="action-link danger" onClick={() => handleDelete(employee._id)}>Delete</button>
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

export default EmployeeListPage;
