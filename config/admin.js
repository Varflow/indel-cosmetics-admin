module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
    cookie: {
      // Админка проксируется под префиксом /dashboard, а дефолт Strapi — /admin,
      // из-за чего браузер не отдаёт refresh-куку и сессия рвётся каждые 30 минут.
      path: env('ADMIN_COOKIE_PATH', '/dashboard/admin'),
    },
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
});
