import axios from 'axios';

export const getLocationFromZip = async (zip: string) => {
  try {
    const response = await axios.get(
      'https://nominatim.openstreetmap.org/search',
      {
        params: {
          q: zip, // 🔥 search by query
          format: 'json',
          limit: 1,
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'nestjs-app',
        },
      },
    );

    if (!response.data.length) return null;

    const result = response.data[0];

    return {
      lat: Number(result.lat),
      lng: Number(result.lon),
      location: result.display_name,
    };
  } catch (error) {
    console.log(error);
    return null;
  }
};
