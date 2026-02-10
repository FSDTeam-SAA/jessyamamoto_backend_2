import mongoose from 'mongoose';
import { IBookmark } from './bookmark.interface';

const bookmarkSchema = new mongoose.Schema<IBookmark>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    bookmarkserviceProvider: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true },
);

const Bookmark = mongoose.model<IBookmark>('Bookmark', bookmarkSchema);
export default Bookmark;
