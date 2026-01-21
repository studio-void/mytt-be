import { registerAs } from '@nestjs/config';

export default registerAs('user', () => {
  const passwordSaltRounds = process.env.PASSWORD_SALT_ROUNDS;
  if (!passwordSaltRounds) {
    throw new Error('PASSWORD_SALT_ROUNDS is not set');
  }

  return { auth: { passwordSaltRounds } };
});
