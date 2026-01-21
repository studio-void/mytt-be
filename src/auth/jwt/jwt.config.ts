import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) {
    throw new Error('JWT_SECRET is not set');
  }

  return { jwt: { secretKey } };
});
