import jwt from 'jsonwebtoken';

// Generate Access Token
export const generateAccessToken = (userId, role = 'user') => {
  const payload = {
    userId,
    role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h', // Access token expires in 1 hour
  });

  return token;
};

// Generate Refresh Token
export const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    type: 'refresh',
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d', // Refresh token expires in 7 days
  });

  return token;
};

// Generate both tokens
export const generateTokens = (userId, role = 'user') => {
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId);

  return {
    accessToken,
    refreshToken,
  };
};

// Verify Access Token
export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    }
    throw error;
  }
};

// Verify Refresh Token
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

// Refresh Access Token using Refresh Token
export const refreshAccessToken = (refreshToken) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken(decoded.userId);
    return newAccessToken;
  } catch (error) {
    throw new Error('Failed to refresh access token: ' + error.message);
  }
};

// Decode token without verification (for inspection)
export const decodeToken = (token) => {
  return jwt.decode(token);
};