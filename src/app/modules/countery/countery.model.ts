import mongoose, { Schema } from "mongoose";
import { ICountry } from "./countery.interface";


const CountrySchema = new Schema<ICountry>(
  {
    countryName: {
      type: String,
      required: true,
      trim: true,
    },
    cityName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Country = mongoose.model<ICountry>("Country", CountrySchema);
export default Country;