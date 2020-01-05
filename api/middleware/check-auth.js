// here is the middleware made to check the user's token
// it can be used to protect routes

const tokenValidation = require("../helpers/token.js").token_validation;

/**
 * In order to proceed with authorization, the front end should send the token by the headers, following the pattern:
 * Authorization: Bear <token>
 */

module.exports = ((req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
// console.log("token:::", token);
    const decodedToken  = tokenValidation(token);
    req.userData        = decodedToken;
// console.log("userData", req.userData);
    next();
  } catch(err) {
    // console.trace("Error: ", err.message);   // too big message. It's better without it due to avoid polluting the screen.
    // return res.status(401).json({
    return res.status(200).json({
      error: "ECA01: Auth has failed. Middleware"
    }) ;
  }
});