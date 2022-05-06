export class AuthTokenError extends Error {
  constructor() {
    super('Error with authentication token.'); // calls the parent class, in this case the class 'Error'
  }
}