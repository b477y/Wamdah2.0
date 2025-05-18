import { Categories, Amenities } from "./enums";

const categoryMap = Object.fromEntries(
  Object.entries(Categories).flatMap(([catKey, subcategories]) =>
    Object.entries(subcategories).map(([subKey, label]) => [
      label.toLowerCase(),
      { category: catKey, type: subKey },
    ])
  )
);

const amenitiesMap = Object.fromEntries(
  Object.entries(Amenities).map(([key, label]) => [label.toLowerCase(), key])
);

const convertLabelsToKeys = (data) => ({
  ...data,
  ...(categoryMap[data.type?.toLowerCase()] || {}),
  amenities:
    data.amenities?.map((a) => amenitiesMap[a.toLowerCase()] || a) || [],
});

export default convertLabelsToKeys;
