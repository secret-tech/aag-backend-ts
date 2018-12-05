export class CustomError extends Error {}

export class UserRegistrationError extends Error {}

export class UserUpdateError extends Error {}

export class UserExists extends Error {}

export class UserNotFound extends Error {}

export class InvalidRoleException extends Error {}

export class AuthException extends Error {
  statusCode?: number;
}

export class ConversationNotFound extends Error {}
