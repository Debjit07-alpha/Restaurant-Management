const GEOAPIFY_URL = "https://api.geoapify.com/v1/geocode/reverse";
const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const BIGDATA_URL = "https://api.big-data-cloud.net/data/reverse-geocode-client";

// Provider chain (all called server-side; no secret in frontend code):
// Geoapify (server key) -> Google (server key, if configured) ->
// Nominatim -> BigDataCloud (keyless fallbacks).
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
      err.httpStatus = res.status;
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

// Geoapify returns features[].properties by default and flat result
// objects with format=json. Both shapes are supported here.
const geoProps = (feature) =>
  (feature && (feature.properties || feature)) || {};

// Prefer the most street-precise Geoapify feature: the first result
// carrying a street name; otherwise the top-ranked feature. Never
// invents values: missing properties stay empty for manual entry.
const selectGeoapifyFeature = (features) => {
  if (!Array.isArray(features) || features.length === 0) return null;
  return (
    features.find((f) => String(geoProps(f).street || "").trim() !== "") ||
    features[0]
  );
};

// Street-precise Geoapify result types. Anything broader (locality,
// city, postcode-only, administrative, ...) is flagged low-confidence
// so the frontend asks the customer to verify instead of trusting it.
const GEOAPIFY_STREET_TYPES = new Set(["amenity", "building", "street"]);

const mapGeoapify = (feature) => {
  const p = geoProps(feature);
  const resultType = String(p.result_type || "").toLowerCase();
  const streetConfidence =
    p.rank && p.rank.confidence_street_level != null
      ? Number(p.rank.confidence_street_level)
      : p.rank && p.rank.confidence != null
        ? Number(p.rank.confidence)
        : null;
  const distance = p.distance != null ? Number(p.distance) : null;
  const lowConfidence =
    !GEOAPIFY_STREET_TYPES.has(resultType) ||
    (streetConfidence != null && streetConfidence < 0.5) ||
    (distance != null && distance > 500);
  const street = firstPresent(p.street);
  const area = firstPresent(
    p.suburb,
    p.neighbourhood,
    p.quarter,
    p.district,
    p.hamlet,
    p.locality
  );
  return {
    houseNumber: firstPresent(p.housenumber),
    street,
    area: area && area !== street ? area : "",
    landmark: "",
    city: firstPresent(
      p.city,
      p.town,
      p.village,
      p.municipality,
      p.county
    ),
    state: firstPresent(p.state),
    postcode: firstPresent(p.postcode).replace(/\s+/g, ""),
    country: firstPresent(p.country),
    displayName: firstPresent(p.formatted),
    lowConfidence,
    provider: "geoapify"
  };
};

const reverseWithGeoapify = async (lat, lng, key) => {
  let data;
  try {
    data = await fetchJson(
      `${GEOAPIFY_URL}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&format=json&apiKey=${encodeURIComponent(key)}`
    );
  } catch (error) {
    // 401/403 means the server key is invalid: final, not transient.
    if (error.httpStatus === 401 || error.httpStatus === 403) {
      const err = new Error(`Geoapify: ${error.message}`);
      err.status = 502;
      err.userMessage =
        "Unable to resolve your location right now. Please enter the address manually.";
      throw err;
    }
    throw error;
  }
  const feature = selectGeoapifyFeature(data.results || data.features);
  if (!feature) {
    const err = new Error("No address found");
    err.status = 502;
    err.userMessage =
      "Location detected, but the address could not be resolved.";
    throw err;
  }
  return mapGeoapify(feature);
};

// Preferred Google result types, most precise first. Broad entities
// (country / state / city / postal_code alone) are never preferred.
const GOOGLE_PRECISE_TYPES = new Set([
  "street_address",
  "premise",
  "subpremise"
]);
const GOOGLE_ROUTE_TYPES = new Set([
  "route",
  "establishment",
  "point_of_interest"
]);
const GOOGLE_AREA_TYPES = new Set([
  "neighborhood",
  "sublocality",
  "sublocality_level_1"
]);

const hasComponent = (result, type) =>
  (result.address_components || []).some(
    (c) => Array.isArray(c.types) && c.types.includes(type)
  );

// Select the best Google result: precise street/premise addresses beat
// routes/places, which beat neighbourhoods; broad entities lose.
// Results with their own postal code win ties; earliest wins the rest.
const selectGoogleResult = (results) => {
  let best = null;
  let bestScore = -1;
  for (const result of results) {
    const types = Array.isArray(result.types) ? result.types : [];
    let score = 0;
    if (types.some((t) => GOOGLE_PRECISE_TYPES.has(t))) score += 3;
    else if (types.some((t) => GOOGLE_ROUTE_TYPES.has(t))) score += 2;
    else if (types.some((t) => GOOGLE_AREA_TYPES.has(t))) score += 1;
    if (hasComponent(result, "postal_code")) score += 1;
    if (score > bestScore) {
      best = result;
      bestScore = score;
    }
  }
  return best || results[0];
};

const googleComponent = (result, ...types) => {
  const found = (result.address_components || []).find(
    (c) => Array.isArray(c.types) && types.some((t) => c.types.includes(t))
  );
  return found ? String(found.long_name || "").trim() : "";
};

// Google result -> normalized address. House number is passed through
// only when Google actually returns street_number (never invented);
// the frontend still leaves Flat empty unless the user hasn't typed one.
const mapGoogle = (result, allResults) => {
  const street = googleComponent(
    result,
    "route",
    "neighborhood",
    "sublocality_level_1",
    "sublocality",
    "locality"
  );
  const area = googleComponent(
    result,
    "sublocality_level_1",
    "sublocality",
    "neighborhood",
    "locality"
  );
  let postcode = googleComponent(result, "postal_code");
  if (!postcode) {
    // Postal codes often live on a sibling result: take the first one
    // from a non-broad result instead of leaving it blank.
    for (const candidate of allResults) {
      const types = Array.isArray(candidate.types) ? candidate.types : [];
      if (types.includes("country") || types.includes("administrative_area_level_1")) {
        continue;
      }
      postcode = googleComponent(candidate, "postal_code");
      if (postcode) break;
    }
  }
  return {
    houseNumber: googleComponent(result, "street_number"),
    street,
    area: area && area !== street ? area : "",
    landmark: googleComponent(
      result,
      "point_of_interest",
      "establishment",
      "premise"
    ),
    city: googleComponent(
      result,
      "locality",
      "postal_town",
      "administrative_area_level_2"
    ),
    state: googleComponent(result, "administrative_area_level_1"),
    postcode: postcode.replace(/\s+/g, ""),
    country: googleComponent(result, "country"),
    displayName: result.formatted_address
      ? String(result.formatted_address)
      : "",
    provider: "google"
  };
};

const reverseWithGoogle = async (lat, lng, key) => {
  const data = await fetchJson(
    `${GOOGLE_GEOCODE_URL}?latlng=${encodeURIComponent(lat)},${encodeURIComponent(lng)}&key=${encodeURIComponent(key)}&language=en`
  );
  // Status first: auth/quota problems must not be misreported as
  // "no address found" just because results is empty.
  if (data.status === "ZERO_RESULTS") {
    const err = new Error("No address found");
    err.status = 502;
    err.userMessage =
      "Location detected, but the address could not be resolved.";
    throw err;
  }
  if (data.status !== "OK") {
    const err = new Error(`Google Geocoding: ${data.status}`);
    err.status = 502;
    err.userMessage =
      "Unable to resolve your location right now. Please enter the address manually.";
    throw err;
  }
  if (!Array.isArray(data.results) || data.results.length === 0) {
    const err = new Error("No address found");
    err.status = 502;
    err.userMessage =
      "Location detected, but the address could not be resolved.";
    throw err;
  }
  const best = selectGoogleResult(data.results);
  return mapGoogle(best, data.results);
};

// =====================================
// GET /api/location/autocomplete?text=...
// Authenticated address search for checkout autofill (no GPS needed).
// Proxied through the backend so the Geoapify key stays server-side.
// =====================================
const autocompleteAddress = async (req, res) => {
  try {
    const text = String(req.query.text || "").trim();
    if (text.length < 3 || text.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Type at least 3 characters to search"
      });
    }
    const key = process.env.GEOAPIFY_API_KEY;
    if (!key) {
      return res.status(503).json({
        success: false,
        message: "Address search is not configured. Please enter your address manually."
      });
    }
    let data;
    try {
      data = await fetchJson(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&format=json&limit=5&lang=en&apiKey=${encodeURIComponent(key)}`
      );
    } catch (error) {
      if (error.httpStatus === 401 || error.httpStatus === 403) {
        return res.status(502).json({
          success: false,
          message: "Unable to search addresses right now. Please enter your address manually."
        });
      }
      throw error;
    }
    const features = data.results || data.features || [];
    const suggestions = features.slice(0, 5).map((feature, index) => ({
      id: String(
        geoProps(feature).place_id ||
          feature.place_id ||
          `${text}-${index}`
      ),
      ...mapGeoapify(feature)
    }));
    return res.status(200).json({
      success: true,
      count: suggestions.length,
      suggestions
    });
  } catch (error) {
    if (error.name === "AbortError") {
      return res.status(504).json({
        success: false,
        message: "Address search timed out. Please try again."
      });
    }
    console.error("Autocomplete error:", error.message);
    return res.status(502).json({
      success: false,
      message: "Unable to search addresses right now. Please enter your address manually."
    });
  }
};

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

    // Primary: Geoapify Reverse Geocoding API (server-side key, never
    // exposed to the frontend). Then Google (if configured), then the
    // keyless fallback chain. Auth/quota/empty failures are final and
    // reported honestly; transient network errors try the next provider.
    const failNow = (error) => {
      console.error("Reverse geocode error:", error.message);
      return res.status(error.status || 502).json({
        success: false,
        message:
          error.userMessage ||
          (error.name === "AbortError"
            ? "Address lookup timed out. Please enter it manually."
            : "Location detected, but we couldn't find the address. Please enter it manually.")
      });
    };

    const geoapifyKey = process.env.GEOAPIFY_API_KEY;
    if (geoapifyKey) {
      try {
        const address = await reverseWithGeoapify(lat, lng, geoapifyKey);
        return res.status(200).json({ success: true, address });
      } catch (geoapifyError) {
        if (geoapifyError.userMessage || geoapifyError.name === "AbortError") {
          return failNow(geoapifyError);
        }
        console.error(
          "Geoapify transient error, trying fallback:",
          geoapifyError.message
        );
      }
    }

    const googleKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleKey) {
      try {
        const address = await reverseWithGoogle(lat, lng, googleKey);
        return res.status(200).json({ success: true, address });
      } catch (googleError) {
        // Auth/quota/empty failures are final: report them honestly.
        if (googleError.userMessage || googleError.name === "AbortError") {
          return failNow(googleError);
        }
        console.error(
          "Google geocode transient error, trying fallback:",
          googleError.message
        );
      }
    }

    await waitForRateLimit();

    // Fallback chain: OpenStreetMap Nominatim, then BigDataCloud.
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
        error.userMessage ||
        "Location detected, but we couldn't find the address. Please enter it manually."
    });
  }
};

module.exports = {
  reverseGeocode,
  autocompleteAddress
};
