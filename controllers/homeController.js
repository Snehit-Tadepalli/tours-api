const homePage = (req, res) => {
  res.status(200).send({
    message: `Welcome to the Tours Api`,
    status: `Success`,
    'requested-at': req.requestTime,
  });
};

module.exports = homePage;
