import mongoose, { Schema } from 'mongoose';
import { ICity, ICountry } from './countery.interface';

const CitySchema = new Schema<ICity>(
  {
    cityName: {
      type: String,
      required: true,
      trim: true,
    },
    neighborhoods: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
  },
  { _id: false },
);

const CountrySchema = new Schema<ICountry>(
  {
    countryName: {
      type: String,
      required: true,
      trim: true,
    },
    cities: {
      type: [CitySchema],
      default: [],
    },
    image: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

export const Country = mongoose.model<ICountry>('Country', CountrySchema);
export default Country;
