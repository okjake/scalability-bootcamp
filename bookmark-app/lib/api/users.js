const users = require('../db/users');

module.exports = function(app) {
  app.post('/api/users', function(req, res, next) {
    if (!req.body.email) {
      return res.sendStatus(401);
    }

    users.create(req.body, (err) => {
      if (err) { return next(err); }
      res.sendStatus(201);
    });
  });
};

