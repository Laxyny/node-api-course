const { z } = require('zod');

const livreCreateSchema = z.object({
  titre: z.string().min(1, 'Le titre est obligatoire'),
  auteur: z.string().min(1, "L'auteur est obligatoire"),
  annee: z.number().int().optional(),
  genre: z.string().optional(),
  disponible: z.boolean().default(true),
});

const livreUpdateSchema = livreCreateSchema.partial();

module.exports = { livreCreateSchema, livreUpdateSchema };
