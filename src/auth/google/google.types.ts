export interface GoogleProfile {
  id: string;
  displayName: string;
  emails: Array<{ value: string }>;
  photos: Array<{ value: string }>;
}

export interface GoogleOAuthPayload {
  googleId: string;
  email: string;
  name: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}
