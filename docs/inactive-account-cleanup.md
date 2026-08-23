# Limpeza de contas inativas

O Worker executa `cleanupInactiveAccounts(env)` uma vez ao dia pelo Cron Trigger
declarado em `wrangler.jsonc` (`17 3 * * *`, às 03:17 UTC). A rotina considera apenas
contas não administrativas com `last_active_at` conhecido e anterior a 180 dias.

Cada execução processa no máximo 100 contas. Para cada conta elegível, um `DB.batch`
remove `sessions`, `user_preferences`, `play_sessions` e `play_stats` antes de remover
`users`. As tabelas de jogos e `community_games` não possuem autoria ligada a `user_id`
no schema atual e, portanto, conteúdo público não é removido.

`last_active_at` é renovado no login e, em sessões autenticadas, no máximo uma vez por
dia. A migration inicializa contas existentes com a data da implantação, iniciando um novo período
seguro de 180 dias. Visitantes existem somente na memória da aba e nunca
participam da rotina.

Para alterar o agendamento, edite `triggers.crons` sem remover os bindings existentes.
Os logs contêm somente `scanned`, `deleted` e `failed`; nenhum token ou dado pessoal.
