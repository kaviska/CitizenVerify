// In-memory store (replace with a real DB in production)
const store = new Map();

const create = (data) => {
  store.set(data.requestId, data);
  return data;
};

const getById = (requestId) => store.get(requestId) || null;

const updateStatus = (requestId, update) => {
  const existing = store.get(requestId);
  if (!existing) return null;
  const updated = { ...existing, ...update };
  store.set(requestId, updated);
  return updated;
};

const deleteById = (requestId) => {
  store.delete(requestId);
};

module.exports = { create, getById, updateStatus, deleteById };
