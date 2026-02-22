import jwt from 'jsonwebtoken';

export function verifyToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.user;
  } catch {
    return null;
  }
}

export function requireAuth(request) {
  const user = verifyToken(request);
  if (!user) {
    return { error: { msg: 'No token, authorization denied' }, status: 401 };
  }
  return { user };
}

export function requireAdmin(request) {
  const result = requireAuth(request);
  if (result.error) return result;

  if (result.user.role !== 'admin') {
    return { error: { msg: 'Admin resource. Access denied.' }, status: 403 };
  }
  return result;
}
