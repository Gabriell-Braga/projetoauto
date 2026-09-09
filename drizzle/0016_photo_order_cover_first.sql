-- A capa passa a ser a PRIMEIRA foto, e as posicoes ficam densas.
--
-- Ate aqui definir a capa so acendia `is_cover` e deixava a foto onde estava:
-- o card do estoque mostrava uma imagem e a galeria da ficha abria em outra.
-- E apagar uma foto do meio deixava buraco na numeracao, que o envio seguinte
-- reusava — duas fotos com a mesma posicao saem na ordem que o banco escolher.
--
-- O codigo novo mantem as duas invariantes a cada mudanca. Isto aqui conserta
-- o que ja esta gravado, sem esperar que alguem reabra cada veiculo.
--
-- A nova ordem e calculada numa tabela auxiliar, e nao direto no UPDATE. Nao e
-- capricho: um UPDATE com subconsulta correlacionada le a propria tabela ENQUANTO
-- a altera, entao uma foto ja renumerada volta a ser contada e duas terminam com
-- a mesma posicao. Foi o que aconteceu no primeiro teste desta migracao.
DROP TABLE IF EXISTS `__ordem_fotos`;
--> statement-breakpoint
CREATE TABLE `__ordem_fotos` (
  `id` text PRIMARY KEY NOT NULL,
  `pos` integer NOT NULL
);
--> statement-breakpoint
-- A capa vai para a frente; o resto mantem a ordem relativa. `created_at` e
-- depois `id` desempatam as posicoes repetidas que os buracos criaram.
INSERT INTO `__ordem_fotos` (`id`, `pos`)
SELECT
  `id`,
  ROW_NUMBER() OVER (
    PARTITION BY `vehicle_id`
    ORDER BY `is_cover` DESC, `position` ASC, `created_at` ASC, `id` ASC
  ) - 1
FROM `vehicle_photos`;
--> statement-breakpoint
UPDATE `vehicle_photos`
SET `position` = (
  SELECT `pos` FROM `__ordem_fotos` WHERE `__ordem_fotos`.`id` = `vehicle_photos`.`id`
);
--> statement-breakpoint
-- A marca de capa passa a sair da posicao, e nao o contrario.
UPDATE `vehicle_photos`
SET `is_cover` = CASE WHEN `position` = 0 THEN 1 ELSE 0 END;
--> statement-breakpoint
-- O card do estoque le `cover_photo_key`; alinha com a foto que ficou na
-- frente, senao a lista continua mostrando a imagem antiga.
UPDATE `vehicles`
SET `cover_photo_key` = (
  SELECT json_extract(`foto`.`variants`, '$.card')
  FROM `vehicle_photos` AS `foto`
  WHERE `foto`.`vehicle_id` = `vehicles`.`id`
    AND `foto`.`position` = 0
)
WHERE EXISTS (
  SELECT 1 FROM `vehicle_photos` AS `foto` WHERE `foto`.`vehicle_id` = `vehicles`.`id`
);
--> statement-breakpoint
DROP TABLE `__ordem_fotos`;
