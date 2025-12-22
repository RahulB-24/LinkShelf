const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.message);

    // Log stack trace in development
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.message
        });
    }

    if (err.code === '23505') {
        // PostgreSQL unique constraint violation
        return res.status(409).json({
            error: 'Duplicate entry',
            details: err.detail
        });
    }

    if (err.code === '23503') {
        // PostgreSQL foreign key violation
        return res.status(400).json({
            error: 'Invalid reference',
            details: err.detail
        });
    }

    // Default error response
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
};

module.exports = errorHandler;
