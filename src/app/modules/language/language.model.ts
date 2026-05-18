import mongoose from 'mongoose';
import { ILanguage } from './language.interface';

const languageSchema = new mongoose.Schema<ILanguage>({
  languageName: { type: String, required: true },
});

const Language = mongoose.model<ILanguage>('Language', languageSchema);
export default Language;
