const axios = require('axios');

const GOOGLE_TOKEN_INFO_URL = 'https://www.googleapis.com/oauth2/v1/tokeninfo';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID; // replace with your client ID

const authMiddleware = async (req, res, next) => {
  try {
    // Expect the token in Authorization header: "Bearer ACCESS_TOKEN"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No access token provided' });
    }

    const accessToken = authHeader.split(' ')[1];

    // Verify token with Google
    const response = await axios.get(`${GOOGLE_TOKEN_INFO_URL}?access_token=${accessToken}`);
    const tokenInfo = response.data;
    console.log(tokenInfo);

    // Optional: Check that the token was issued for your client
    if (
      tokenInfo.audience !== GOOGLE_CLIENT_ID &&
      tokenInfo.issued_to !== GOOGLE_CLIENT_ID
    ) {
      return res.status(403).json({ error: 'Token was not issued for this app' });
    }

    // Token is valid — attach user info to request
    req.user = {
      googleId: tokenInfo.user_id,
      email: tokenInfo.email,
      scope: tokenInfo.scope,
      expiresIn: tokenInfo.expires_in
    };

    next(); // Continue to next middleware/route handler
  } catch (err) {
    console.error('Auth Middleware Error:', err.response?.data || err.message);
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
};

module.exports = authMiddleware;