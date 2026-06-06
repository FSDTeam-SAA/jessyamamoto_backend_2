// export interface ICountry {
//   countryName: string;
//   cityName: string[];
//   neighborhoods: string[];
//   image?: string;
// }

export interface ICity {
  cityName: string;
  neighborhoods: string[];
}

export interface ICountry {
  countryName: string;
  cities: ICity[];
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}