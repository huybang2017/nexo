# Environment Variables Setup

This document explains how to configure environment variables for the Nexo server.

## Quick Start

1. Copy the example file (if exists) or create a `.env` file in the server directory
2. Set all required environment variables
3. Never commit `.env` file to git!

## Required Environment Variables

### Database
- `SPRING_DATASOURCE_URL` - Database connection URL
- `SPRING_DATASOURCE_USERNAME` - Database username
- `SPRING_DATASOURCE_PASSWORD` - Database password

### Google OAuth2
- `GOOGLE_CLIENT_ID` - Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- `GOOGLE_CLIENT_SECRET` - Get from Google Cloud Console

### Email (Gmail SMTP)
- `MAIL_USERNAME` - Your Gmail address
- `MAIL_PASSWORD` - Gmail App Password (not your regular password)

### JWT
- `JWT_SECRET` - Secret key for JWT tokens (minimum 256 bits)
- `JWT_ACCESS_EXPIRATION` - Access token expiration in milliseconds
- `JWT_REFRESH_EXPIRATION` - Refresh token expiration in milliseconds

### Stripe (Payment)
- `STRIPE_SECRET_KEY` - Get from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
- `STRIPE_PUBLISHABLE_KEY` - Get from Stripe Dashboard
- `STRIPE_WEBHOOK_SECRET` - Get from Stripe Dashboard webhooks

### Other
See `application.yml` for all available environment variables with their defaults.

## Setting Environment Variables

### Option 1: Using .env file (Recommended for local development)
Create a `.env` file in the server directory:
```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
# ... etc
```

Note: Spring Boot doesn't natively support `.env` files. You may need to use a library like `spring-dotenv` or set them manually.

### Option 2: Export in shell
```bash
export GOOGLE_CLIENT_ID=your-client-id
export GOOGLE_CLIENT_SECRET=your-client-secret
```

### Option 3: System environment variables
Set them in your system's environment variable settings.

### Option 4: Docker Compose
Add them to `docker-compose.yml`:
```yaml
services:
  server:
    environment:
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
```

## Security Notes

⚠️ **IMPORTANT:**
- Never commit secrets to git
- Use different credentials for development and production
- Rotate secrets regularly
- Use secret management services in production (AWS Secrets Manager, HashiCorp Vault, etc.)

