import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    findCareUser: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    findJobUser: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

const Category = mongoose.model('Category', CategorySchema);
export default Category;
