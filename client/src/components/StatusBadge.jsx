function StatusBadge({ value, type = 'status' }) {
  const normalized = typeof value === 'string' ? value.toLowerCase() : '';
  const className = normalized.split(' ').join('-');

  return <span className={`badge ${className}`}>{value}</span>;
}

export default StatusBadge;
