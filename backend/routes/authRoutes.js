// routes/authRoutes.js

const router = require('express').Router();
const passport = require('passport');

// Auth with Google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'] // What we want to retrieve from the user's Google account
}));

// Callback route for Google to redirect to
router.get('/google/callback', passport.authenticate('google'), (req, res) => {
    // Successful authentication, redirect to a page that displays the token.
    // In a real app, you might redirect to a frontend application page.
    res.send(`
        <h1>Authentication Successful!</h1>
        <p>Welcome, ${req.user.displayName}</p>
        <p>Your JWT Token is:</p>
        <pre>${req.user.token}</pre>
        <p>You can now use this token to access protected API routes.</p>
        <p>For example, try accessing <a href="/api/profile">/api/profile</a> with this token in the Authorization header (Bearer TOKEN).</p>
    `);
});

// Auth logout
router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});


module.exports = router;
