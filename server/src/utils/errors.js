// Turns a Mongoose ValidationError into one sentence that is safe to show to a user.
// Our own messages ("Phone number must be exactly 10 digits") are used as they are; a wrong type
// (text where a number was expected) becomes "age is not valid" instead of Mongoose's technical wording.
export function firstValidationMessage(err) {
  const first = Object.values(err.errors || {})[0];
  if (!first) return "Some of the information is not valid";
  return first.name === "CastError" ? `${first.path} is not valid` : first.message;
}
