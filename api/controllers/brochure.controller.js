import Brochure from '../models/brochure.model.js';

export const createBrochure = async (req, res, next) => {
  try {
    const { title, category, cloudinaryUrl, originalFileName } = req.body;

    if (!title || !category || !cloudinaryUrl || !originalFileName) {
      const error = new Error('Title, category, cloudinaryUrl, and originalFileName are required');
      error.statusCode = 400;
      return next(error);
    }

    const newBrochure = new Brochure({
      title,
      category,
      cloudinaryUrl,
      originalFileName,
      uploadedBy: req.user.id,
      vectorized: false,
    });

    const savedBrochure = await newBrochure.save();

    res.status(201).json({
      id: savedBrochure._id,
      title: savedBrochure.title,
      category: savedBrochure.category,
      cloudinaryUrl: savedBrochure.cloudinaryUrl,
      vectorized: savedBrochure.vectorized,
    });
  } catch (error) {
    next(error);
  }
};
