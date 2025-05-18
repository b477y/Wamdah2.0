const paginate = async ({
  page = 1,
  limit = 10,
  model,
  filter = {},
  sort = {},
}) => {
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  if (isNaN(page) || page < 1) page = parseInt(process.env.PAGE) || 1;
  if (isNaN(limit) || limit < 1) limit = parseInt(process.env.LIMIT) || 10;

  const skip = (page - 1) * limit;

  const total = await model.countDocuments(filter);

  const data = await model
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  return { data, page, limit, total };
};

export default paginate;
