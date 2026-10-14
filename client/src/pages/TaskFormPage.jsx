import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';

const defaultForm = {
  title: '',
  description: '',
  assignedEmployee: '',
  department: 'Development',
  priority: 'Medium',
  startDate: '',
  dueDate: ''
};

function TaskFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState(defaultForm);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const employeeResponse = await api.get('/employees', { params: { page: 1, limit: 500 } });
        setEmployees(employeeResponse.data.data);

        if (editing) {
          const taskResponse = await api.get(`/tasks/${id}`);
          const task = taskResponse.data.data;
          setForm({
            title: task.title,
            description: task.description,
            assignedEmployee: task.assignedEmployee?._id || task.assignedEmployee || '',
            department: task.department,
            priority: task.priority,
            startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
          });
        }
      } catch (error) {
        window.alert(error.response?.data?.message || 'Unable to load task form.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [editing, id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editing) {
        await api.put(`/tasks/${id}`, form);
      } else {
        await api.post('/tasks', form);
      }
      navigate('/tasks');
    } catch (error) {
      window.alert(error.response?.data?.message || 'Unable to save task.');
    }
  };

  if (loading) return <div className="panel">Loading task form...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{editing ? 'Edit Task' : 'Add Task'}</h1>
      </div>

      <form className="panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field full-width">
            <label>Title</label>
            <input name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div className="field full-width">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Assigned Employee</label>
            <select name="assignedEmployee" value={form.assignedEmployee} onChange={handleChange} required>
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>{employee.fullName} ({employee.employeeId})</option>
              ))}
            </select>
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
            <label>Priority</label>
            <select name="priority" value={form.priority} onChange={handleChange}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div className="field">
            <label>Start Date</label>
            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Due Date</label>
            <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} required />
          </div>

          <div className="field full-width" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="outline-btn" onClick={() => navigate('/tasks')}>Cancel</button>
            <button type="submit" className="primary-btn">{editing ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default TaskFormPage;
