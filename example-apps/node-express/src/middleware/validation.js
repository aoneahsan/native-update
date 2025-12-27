import Joi from 'joi';
import semver from 'semver';

/**
 * Validate update creation request
 */
export function validateUpdate(req, res, next) {
  const schema = Joi.object({
    appId: Joi.string().required().pattern(/^[a-zA-Z0-9._-]+$/),
    platform: Joi.string().required().valid('ios', 'android', 'web'),
    version: Joi.string().required().custom((value, helpers) => {
      if (!semver.valid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
    channel: Joi.string().default('production').valid('production', 'staging', 'development', 'beta'),
    minAppVersion: Joi.string().custom((value, helpers) => {
      if (value && !semver.valid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
    maxAppVersion: Joi.string().custom((value, helpers) => {
      if (value && !semver.valid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
    description: Joi.string().max(500),
    releaseNotes: Joi.string().max(5000),
    mandatory: Joi.boolean().default(false),
    rolloutPercentage: Joi.number().min(0).max(100).default(100),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      details: error.details.map(d => d.message),
    });
  }

  req.body = value;
  next();
}