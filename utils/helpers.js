const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

const paginate = (model) => {
  return async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const results = {};

    try {
      const total = await model.countDocuments();
      
      results.pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: endIndex < total,
        hasPrev: startIndex > 0
      };

      req.pagination = results.pagination;
      req.query.limit = limit;
      req.query.skip = startIndex;
      
      next();
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Error paginating results' 
      });
    }
  };
};

module.exports = { generateToken, paginate };