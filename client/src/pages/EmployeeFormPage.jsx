import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';

const defaultForm = {
  employeeId: '',
  fullName: '',
  email: '',
  phone: '',
  department: 'Development',
  role: '',
  joiningDate: '',
  status: 'Active',
  skills: '',
  leaveStart: '',
  leaveEnd: ''
};

function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!editing) {
      setLoading(false);
      return;
    }

    const fetchEmployee = async () => {
      try {
        const response = await api.get(`/employees/${id}`);
        const employee = response.data.data;
        setForm({
          ...employee,
          skills: (employee.skills || []).join(', '),
          leaveStart: employee.leaveStart ? new Date(employee.leaveStart).toISOString().split('T')[0] : '',
          leaveEnd: employee.leaveEnd ? new Date(employee.leaveEnd).toISOString().split('T')[0] : ''
        });
      } catch (error) {
        window.alert(error.response?.data?.message || 'Unable to load employee.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [editing, id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean)
    };

    try {
      if (editing) {
        await api.put(`/employees/${id}`, payload);
      } else {
        await api.post('/employees', payload);
      }
      navigate('/employees');
    } catch (error) {
      window.alert(error.response?.data?.message || 'Unable to save employee.');
    }
  };

  if (loading) return <div className="panel">Loading employee form...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{editing ? 'Edit Employee' : 'Add Employee'}</h1>
      </div>

      <form className="panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label>Employee ID</label>
            <input name="employeeId" value={form.employeeId} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Full Name</label>
            <input name="fullName" value={form.fullName} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Department</label>
            <select name="department" value={form.department} onChange={handleChange}>
              <option value="Development">Development</option>
              <option value="Design">Design</option>
              <option value="QA">QA</option>
              <option value="HR">HR</option>
              <option value="Sales">Sales</option>
            </select>
          </div>
          <div className="field">
            <label>Role</label>
            <input name="role" value={form.role} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Joining Date</label>
            <input type="date" name="joiningDate" value={form.joiningDate} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
          <div className="field full-width">
            <label>Skills</label>
            <input name="skills" value={form.skills} onChange={handleChange} placeholder="React, Node, Design" />
          </div>

          {form.status === 'On Leave' && (
            <>
              <div className="field">
                <label>Leave Start</label>
                <input type="date" name="leaveStart" value={form.leaveStart} onChange={handleChange} required={form.status === 'On Leave'} />
              </div>
              <div className="field">
                <label>Leave End</label>
                <input type="date" name="leaveEnd" value={form.leaveEnd} onChange={handleChange} required={form.status === 'On Leave'} />
              </div>
            </>
          )}

          <div className="field full-width" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="outline-btn" onClick={() => navigate('/employees')}>Cancel</button>
            <button type="submit" className="primary-btn">{editing ? 'Save Changes' : 'Create Employee'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default EmployeeFormPage;
