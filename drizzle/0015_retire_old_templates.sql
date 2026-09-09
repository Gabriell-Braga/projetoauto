-- Os cinco templates anteriores ao Figma sairam do codigo.
--
-- `getTemplate` cai no padrao quando nao acha o id, entao a revenda nao ficaria
-- fora do ar. Mas ela amanheceria com outro desenho e o painel mostraria uma
-- escolha que nao existe mais na lista: o campo diria "template-2-dark" e a
-- tela nao teria esse cartao para marcar.
UPDATE `tenants`
SET `template_id` = 'vitrine'
WHERE `template_id` NOT IN ('vitrine', 'showroom', 'marketplace');
