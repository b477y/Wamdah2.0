const successResponse = ({ res, status, message, data } = {}) => {
  return res.status(status).json({ success: true, message, data });
};

export default successResponse;
