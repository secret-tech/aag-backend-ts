import * as Joi from 'joi';
import { User } from '../user';

/**
 * Validate creation of the new user
 *
 * @param user
 * @returns {ValidationResult<User>}
 */
export function validateUser(user: User) {
  const schema = Joi.object().keys({
    email: Joi.string().email({ minDomainAtoms: 2 }).required(),
    firstName: Joi.string().min(2).required(),
    lastName: Joi.string().min(2).required(),
    gender: Joi.string().valid(['male', 'female', 'other']).required(),
    role: Joi.string().valid([User.ROLE_USER, User.ROLE_ADVISOR, User.ROLE_ADMIN]).required(),
    picture: Joi.string().uri({ scheme: ['http', 'https'] }),
    pictures: Joi.array(),
    services: Joi.object({
      facebook: Joi.string().required(),
      oneSignal: Joi.string()
    }).required(),
    birthday: Joi.date(),
    createdAt: Joi.date().required(),
    updatedAt: Joi.date(),
    age:  Joi.number(),
    id: Joi.any(),
    _id: Joi.any(),
    bio: Joi.string(),
    tags: Joi.array(),
    conversations: Joi.array().items(Joi.string())
  });

  return Joi.validate(user, schema);
}
