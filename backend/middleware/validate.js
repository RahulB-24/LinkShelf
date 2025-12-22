const { validationResult } = require('express-validator');

// Middleware to check validation results with friendly messages
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Get the first error and create a user-friendly message
        const firstError = errors.array()[0];
        let friendlyMessage = firstError.msg;

        // Map common validation errors to friendlier messages
        if (firstError.path === 'email') {
            if (firstError.msg.includes('email')) {
                friendlyMessage = 'Please enter a valid email address.';
            }
        } else if (firstError.path === 'password') {
            if (firstError.msg.includes('8 characters')) {
                friendlyMessage = 'Password must be at least 8 characters long.';
            } else if (firstError.msg.includes('required') || firstError.msg.includes('empty')) {
                friendlyMessage = 'Please enter your password.';
            }
        }

        return res.status(400).json({
            error: friendlyMessage
        });
    }

    next();
};

module.exports = validate;
