module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
    cookie: {
      // Админка проксируется под префиксом /dashboard, а дефолт Strapi — /admin,
      // из-за чего браузер не отдаёт refresh-куку и сессия рвётся каждые 30 минут.
      path: env('ADMIN_COOKIE_PATH', '/dashboard/admin'),
    },
    sessions: {
      accessTokenLifespan: 60 * 60, // 1 час вместо 30 мин
      idleSessionLifespan: 8 * 60 * 60, // 8 часов простоя вместо 2
      maxSessionLifespan: 7 * 24 * 60 * 60, // неделя вместо суток
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
