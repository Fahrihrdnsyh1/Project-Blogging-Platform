const MIN_JWT_SECRET_LENGTH = 32;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long`,
    );
  }

  return secret;
}

module.exports = { getJwtSecret, MIN_JWT_SECRET_LENGTH };
