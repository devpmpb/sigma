-- Popular RamoAtividade com dados básicos (mapeamento dos ENUMs)

INSERT INTO "RamoAtividade" ("nome", "descricao", "categoria", "ativo", "createdAt", "updatedAt") VALUES
  ('Agricultura Geral', 'Atividades agrícolas diversas', 'AGRICULTURA', true, NOW(), NOW()),
  ('Pecuária Geral', 'Atividades pecuárias diversas', 'PECUARIA', true, NOW(), NOW()),
  ('Agricultura e Pecuária', 'Atividades mistas', 'AGRICULTURA_PECUARIA', true, NOW(), NOW()),
  ('Silvicultura', 'Produção florestal', 'SILVICULTURA', true, NOW(), NOW()),
  ('Aquicultura', 'Criação de organismos aquáticos', 'AQUICULTURA', true, NOW(), NOW()),
  ('Hortifrúti', 'Produção de hortaliças e frutas', 'HORTIFRUTI', true, NOW(), NOW()),
  ('Avicultura', 'Criação de aves', 'AVICULTURA', true, NOW(), NOW()),
  ('Suinocultura', 'Criação de suínos', 'SUINOCULTURA', true, NOW(), NOW()),
  ('Outras Atividades', 'Outras atividades produtivas', 'OUTROS', true, NOW(), NOW())
ON CONFLICT (nome) DO NOTHING;

-- Verificar
SELECT
    'Ramos de atividade básicos inseridos:' as mensagem,
    COUNT(*) as total
FROM "RamoAtividade";

-- Listar todos
SELECT id, nome, categoria, ativo FROM "RamoAtividade" ORDER BY categoria, nome;
