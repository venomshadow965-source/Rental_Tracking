/**
 * Server-Side Indian Locality & City Geocoder
 */

export const INDIAN_LOCALITY_MAP = {
  'jakkur': { lat: 13.0784, lng: 77.6070 },
  '560064': { lat: 13.0784, lng: 77.6070 },
  'virupakshapura': { lat: 13.0768, lng: 77.5583 },
  '560097': { lat: 13.0768, lng: 77.5583 },
  'koramangala': { lat: 12.9345, lng: 77.6221 },
  '560034': { lat: 12.9345, lng: 77.6221 },
  'indiranagar': { lat: 12.9719, lng: 77.6412 },
  '560038': { lat: 12.9719, lng: 77.6412 },
  'hsr layout': { lat: 12.9116, lng: 77.6389 },
  '560102': { lat: 12.9116, lng: 77.6389 },
  'whitefield': { lat: 12.9698, lng: 77.7499 },
  '560066': { lat: 12.9698, lng: 77.7499 },
  'jp nagar': { lat: 12.9077, lng: 77.5855 },
  '560078': { lat: 12.9077, lng: 77.5855 },
  'btm layout': { lat: 12.9166, lng: 77.6101 },
  '560076': { lat: 12.9166, lng: 77.6101 },
  'bellandur': { lat: 12.9260, lng: 77.6762 },
  '560103': { lat: 12.9260, lng: 77.6762 },
  'electronic city': { lat: 12.8399, lng: 77.6770 },
  '560100': { lat: 12.8399, lng: 77.6770 },
  'hebbal': { lat: 13.0358, lng: 77.5970 },
  '560024': { lat: 13.0358, lng: 77.5970 },
  'malleshwaram': { lat: 13.0031, lng: 77.5643 },
  '560003': { lat: 13.0031, lng: 77.5643 },
  'jayanagar': { lat: 12.9308, lng: 77.5838 },
  '560041': { lat: 12.9308, lng: 77.5838 },
  'yelahanka': { lat: 13.1007, lng: 77.5963 },
  '560065': { lat: 13.1007, lng: 77.5963 },
  'marathahalli': { lat: 12.9569, lng: 77.7011 },
  '560037': { lat: 12.9569, lng: 77.7011 },
  'sarjapur': { lat: 12.8606, lng: 77.7864 },
  'pajaka': { lat: 13.2847, lng: 74.8016 },
  'udupi': { lat: 13.3409, lng: 74.7421 },
  '576101': { lat: 13.3409, lng: 74.7421 },

  // Mumbai
  'bandra': { lat: 19.0596, lng: 72.8295 },
  'andheri': { lat: 19.1136, lng: 72.8697 },
  'powai': { lat: 19.1176, lng: 72.9060 },
  'worli': { lat: 19.0178, lng: 72.8178 },
  'thane': { lat: 19.2183, lng: 72.9781 },

  // Delhi / NCR
  'connaught place': { lat: 28.6304, lng: 77.2177 },
  'defence colony': { lat: 28.5729, lng: 77.2323 },
  'vasant kunj': { lat: 28.5244, lng: 77.1558 },
  'gurgaon': { lat: 28.4595, lng: 77.0266 },
  'noida': { lat: 28.5355, lng: 77.3910 },

  // Hyderabad
  'hitec city': { lat: 17.4474, lng: 78.3762 },
  'gachibowli': { lat: 17.4401, lng: 78.3489 },
  'banjara hills': { lat: 17.4156, lng: 78.4354 },

  // Chennai
  'omr': { lat: 12.9430, lng: 80.2338 },
  'adyar': { lat: 13.0012, lng: 80.2565 },

  // Pune
  'hinjewadi': { lat: 18.5913, lng: 73.7389 },
  'wakad': { lat: 18.5987, lng: 73.7684 }
};

export const CITY_COORDS = {
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'noida': { lat: 28.5355, lng: 77.3910 },
  'gurugram': { lat: 28.4595, lng: 77.0266 },
  'gurgaon': { lat: 28.4595, lng: 77.0266 },
  'udupi': { lat: 13.3409, lng: 74.7421 }
};

export function resolveServerCoordinates({ address = '', city = '', pincode = '', state = '', latitude, longitude }) {
  if (latitude && longitude && Number(latitude) > 0 && Number(longitude) > 0) {
    return {
      lat: Number(Number(latitude).toFixed(4)),
      lng: Number(Number(longitude).toFixed(4))
    };
  }

  const query = `${address} ${city} ${pincode} ${state}`.toLowerCase();
  const cleanPin = (pincode || '').replace(/\D/g, '');

  if (cleanPin && INDIAN_LOCALITY_MAP[cleanPin]) {
    return INDIAN_LOCALITY_MAP[cleanPin];
  }

  for (const [key, coords] of Object.entries(INDIAN_LOCALITY_MAP)) {
    if (query.includes(key)) {
      return coords;
    }
  }

  const cleanCity = (city || '').trim().toLowerCase();
  for (const [c, coords] of Object.entries(CITY_COORDS)) {
    if (cleanCity.includes(c) || query.includes(c)) {
      return coords;
    }
  }

  return { lat: 12.9716, lng: 77.5946 };
}
