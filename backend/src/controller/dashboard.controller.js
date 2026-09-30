const service = require('./dashboard.service');
const { dashboardQuerySchema } = require('./dashboard.schema');

async function index(req, res, next) {
  try {
    const query = dashboardQuerySchema.parse(req.query);
    const data = await service.obterDashboard(req.user, query);
    res.json({ data });
  } catch (err) {
    next(err); // o error handler global converte ZodError em VALIDATION_ERROR
  }
}

module.exports = { index };
