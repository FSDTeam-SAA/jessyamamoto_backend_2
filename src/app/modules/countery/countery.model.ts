import mongoose, { Schema } from 'mongoose';
import { ICountry } from './countery.interface';

const CountrySchema = new Schema<ICountry>(
  {
    countryName: {
      type: String,
      trim: true,
    },
    cityName: [
      {
        type: String,
        trim: true,
      },
    ],
    neighborhoods: [
      {
        type: String,
        trim: true,
      },
    ],
    image: String,
  },
  { timestamps: true },
);

const Country = mongoose.model<ICountry>('Country', CountrySchema);
export default Country;
