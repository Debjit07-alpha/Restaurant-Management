const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const BIGDATA_URL = "https://api.big-data-cloud.net/data/reverse-geocode-client";

// Keyless providers used through this backend proxy (no secret in
// frontend code). Nominatim primary, BigDataCloud fallback.
const USER_AGENT = "TastyBites/1.0 (checkout reverse-geocode)";

const UPSTREAM_TIMEOUT_MS = 8000;
// Nominatim usage policy asks for at most 1 request/second.
const MIN_UPSTREAM_GAP_MS = 1100;
let lastUpstreamAt = 0;

const waitForRateLimit = async () => {
  const wait = MIN_UPSTREAM_GAP_MS - (Date.now() - lastUpstreamAt);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastUpstreamAt = Date.now();
};

const fetchJson = async (url, headers = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) {
      const err = new Error(`Geocoder responded with status ${res.status}`);
      err.status = 502;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
};

const firstPresent = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
};

// Nominatim addressdetails -> stable address fields.
// Never invents values: missing keys stay empty for manual entry.
const mapNominatim = (data) => {
  const addr = (data && data.address) || {};
  const street = firstPresent(
    addr.road,
    addr.footway,
    addr.street,
    addr.path,
    addr.neighbourhood,
    addr.suburb,
    addr.hamlet,
    addr.locality,
    addr.quarter
  );
  const area = firstPresent(
    addr.neighbourhood,
    addr.suburb,
    addr.hamlet,
    addr.locality,
    addr.quarter
  );
  return {
    houseNumber: firstPresent(addr.house_number),
    street,
    // Area only when it adds information beyond the street line.
    area: area && area !== street ? area : "",
    landmark: firstPresent(
      addr.amenity,
      addr.building,
      addr.tourism,
      addr.shop,
      addr.leisure,
      addr.office
    ),
    city: firstPresent(
      addr.city,
      addr.town,
      addr.village,
      addr.municipality,
      addr.city_district
    ),
    state: firstPresent(addr.state),
    postcode: firstPresent(addr.postcode),
    country: firstPresent(addr.country),
    displayName: data && data.display_name ? String(data.display_name) : "",
    provider: "nominatim"
  };
};

const mapBigData = (data) => ({
  houseNumber: "",
  street: firstPresent(data.locality),
  area: "",
  landmark: "",
  city: firstPresent(data.city, data.locality),
  state: firstPresent(data.principalSubdivision),
  postcode: firstPresent(data.postcode),
  country: firstPresent(data.countryName),
  displayName: "",
  provider: "bigdatacloud"
});

// =====================================
// GET /api/location/reverse?lat=..&lng=..
// Authenticated one-shot reverse geocode for checkout autofill.
// Coordinates are used transiently and never stored.
// =====================================
const reverseGeocode = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng ?? req.query.lon);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates"
      });
    }

    await waitForRateLimit();

    // Primary: OpenStreetMap Nominatim (keyless, detailed address).
    try {
      const data = await fetchJson(
        `${NOMINATIM_URL}?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1`,
        { "User-Agent": USER_AGENT, Accept: "application/json" }
      );
      if (!data || !data.address) {
        throw new Error("No address found");
      }
      return res.status(200).json({
        success: true,
        address: mapNominatim(data)
      });
    } catch (primaryError) {
      // Fallback: BigDataCloud client API (keyless).
      try {
        const data = await fetchJson(
          `${BIGDATA_URL}?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&localityLanguage=en`
        );
        if (!data || (!data.city && !data.locality)) {
          throw new Error("No address found");
        }
        return res.status(200).json({
          success: true,
          address: mapBigData(data)
        });
      } catch {
        throw primaryError;
      }
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return res.status(504).json({
        success: false,
        message: "Address lookup timed out. Please enter it manually."
      });
    }
    console.error("Reverse geocode error:", error.message);
    return res.status(502).json({
      success: false,
      message:
        "Location detected, but we couldn't find the address. Please enter it manually."
    });
  }
};

module.exports = {
  reverseGeocode
};
