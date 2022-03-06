const getFallback = (req, res) => {
  res.status(200).json({ message: "hello from the notion route" });
};

module.exports = {
  getFallback,
};
