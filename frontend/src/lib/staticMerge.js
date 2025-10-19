// Merge server and local static designs. Server items take precedence by id.
export function mergeStaticDesigns(server, local, limit = 100) {
  const localArr = Array.isArray(local) ? local : [];
  if (Array.isArray(server)) {
    // If server is empty but local exists, prefer local (legacy behaviour)
    if (server.length === 0 && localArr.length > 0) return localArr.slice(0, limit);
    const byId = new Map();
    server.forEach(item => { if (item && item.id) byId.set(item.id, item); });
    localArr.forEach(item => { if (item && item.id && !byId.has(item.id)) byId.set(item.id, item); });
    return Array.from(byId.values()).slice(0, limit);
  }
  return localArr.slice(0, limit);
}

export default mergeStaticDesigns;
