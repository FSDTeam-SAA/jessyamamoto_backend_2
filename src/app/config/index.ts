import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const frontendUrl = process.env.FRONTEND_URL || '';
const isLocalFrontend =
  frontendUrl.includes('localhost') ||
  frontendUrl.includes('127.0.0.1') ||
  frontendUrl.trim() === '';

/**
 * Stripe Checkout redirect targets. On a phone, localhost:3000 never loads.
 * When FRONTEND_URL is local/empty, use app deep links (register in Flutter + manifest).
 */
const stripeCheckoutUrls = {
  successUrl:
    process.env.STRIPE_CHECKOUT_SUCCESS_URL ||
    (isLocalFrontend
      ? 'jessyamamoto://payment-success'
      : `${frontendUrl}/payment-success`),
  cancelUrl:
    process.env.STRIPE_CHECKOUT_CANCEL_URL ||
    (isLocalFrontend
      ? 'jessyamamoto://payment-cancel'
      : `${frontendUrl}/payment-cancel`),
  bookingSuccessUrl:
    process.env.STRIPE_BOOKING_SUCCESS_URL ||
    (isLocalFrontend
      ? 'jessyamamoto://booking-success?session_id={CHECKOUT_SESSION_ID}'
      : `${frontendUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}`),
  bookingCancelUrl:
    process.env.STRIPE_BOOKING_CANCEL_URL ||
    (isLocalFrontend
      ? 'jessyamamoto://booking-cancel'
      : `${frontendUrl}/booking-cancel`),
};

export default {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI, // Ensure this is set in .env
  bcryptSaltRounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES || '30d',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES || '90d',
  },
  cloudinary: {
    name: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  email: {
    expires: process.env.EMAIL_EXPIRES,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    address: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
    admin: process.env.ADMIN_EMAIL,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    /**
     * When true, booking Checkout collects payment on the platform account only (no Connect transfer).
     * In development, defaults to true unless BOOKING_PLATFORM_ONLY_CHECKOUT=false (Connect transfers).
     * In production, defaults to false unless BOOKING_PLATFORM_ONLY_CHECKOUT=true.
     */
    bookingPlatformOnlyCheckout:
      process.env.NODE_ENV === 'production'
        ? process.env.BOOKING_PLATFORM_ONLY_CHECKOUT === 'true'
        : process.env.BOOKING_PLATFORM_ONLY_CHECKOUT !== 'false',
  },
  frontendUrl: process.env.FRONTEND_URL,
  stripeCheckoutUrls,
  rateLimit: {
    window: process.env.RATE_LIMIT_WINDOW,
    max: process.env.RATE_LIMIT_MAX,
    delay: process.env.RATE_LIMIT_DELAY,
  },
};
