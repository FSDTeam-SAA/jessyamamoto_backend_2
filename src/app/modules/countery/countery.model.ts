import mongoose, { Schema } from 'mongoose';
import { ICountry } from './countery.interface';

const CountrySchema = new Schema<ICountry>(
  {
    countryName: {
      type: String,
      trim: true,
    },
    cityName: [{
      type: String,
      trim: true,
    }],
  },
  { timestamps: true },
);

const Country = mongoose.model<ICountry>('Country', CountrySchema);
export default Country;
