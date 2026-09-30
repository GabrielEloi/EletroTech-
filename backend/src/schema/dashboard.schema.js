const { z } = require('zod');

// GET /menu?mes=YYYY-MM  (mes é opcional; string vazia = sem filtro)
const dashboardQuerySchema = z.object({
  mes: z
    .string()
    .trim()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Mês inválido, use o formato YYYY-MM')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

module.exports = { dashboardQuerySchema };
