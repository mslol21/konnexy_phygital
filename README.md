# Konnexy Tag

Página de estabelecimento acessada por NFC ou QR Code, com painel de gestão em Next.js e dados no Supabase.

## Desenvolvimento

Use Node.js 22 ou superior.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Configure as variáveis do projeto:

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Origem HTTPS permanente, sem caminho. Usada nas placas e na recuperação de senha. |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública do projeto. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` também é aceita. |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave exclusiva do servidor. Nunca use prefixo `NEXT_PUBLIC_`. |
| `GEMINI_API_KEY` | Opcional. Sem ela, o link direto para avaliar continua disponível. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Opcional. Contato comercial da Konnexy na home, com país e DDD. |

Sem configuração válida, o sistema apresenta indisponibilidade. Não há login de demonstração, senha fixa, gravação local ou retorno fictício de sucesso.

## Banco e implantação

A versão corrigida depende de `supabase/migrations/20261024165249_production_integrity.sql`. Aplique a migração antes de promover o novo aplicativo. Ela restringe acesso direto às tabelas, cria as funções de gravação/contagem, o limitador persistente e o bucket público de imagens. Não exclui estabelecimentos.

Em um projeto já vinculado ao CLI, confira o histórico antes de aplicar:

```sh
npx supabase migration list
npx supabase db push --dry-run
npm run db:migrate
```

Não reaplique o seed `004_seed_initial_tenants.sql` em produção: ele atualiza exemplos. Caso o banco antigo tenha sido montado manualmente, reconcilie o histórico com os SQLs existentes antes de executar `db push`. A integração do Supabase também pode aplicar diretamente a nova migração.

Depois de migrar:

1. Configure as variáveis no ambiente de destino e gere um novo build. Valores `NEXT_PUBLIC_*` são incorporados no build.
2. No Supabase Auth, configure a Site URL e permita `https://SEU-DOMINIO/auth/callback` em Redirect URLs.
3. Crie a conta administrativa pelo painel Auth usando e-mail e senha reais. Confira a identidade antes de promover, no SQL Editor, **somente o UUID dessa conta**:

   ```sql
   update public.profiles set role = 'super_admin' where id = 'UUID-DA-CONTA-VERIFICADA';
   ```

4. Entre em `/login`. O papel é consultado no banco; metadados de cadastro e campos enviados pelo navegador não podem conceder administração.
5. Para acesso de lojista, crie sua conta no Auth e informe o mesmo e-mail ao cadastrar o estabelecimento. E-mail vazio significa gestão exclusiva pelo administrador. Para vincular posteriormente, um administrador do banco deve atualizar `owner_id` e `owner_email` com a conta verificada.
6. Teste cadastro, edição, upload e recarregamento em dois navegadores. Verifique que um lojista não acessa dados de outro.
7. Abra a página pública, confirme o Google Place ID e o WhatsApp, e teste uma placa antes da impressão em lote. Trocar o domínio permanente exige manter o domínio anterior redirecionando; trocar o slug não quebra as novas placas `/t/UUID`.

## Comportamento

- Dados e módulos são gravados juntos por uma função transacional, após autenticação e verificação de proprietário. Lojistas não podem alterar plano, cobrança ou situação da assinatura.
- Imagens JPG/PNG/WebP de até 4 MB são verificadas pelo servidor e armazenadas no Supabase. As imagens da página são públicas.
- Todas as pessoas podem acessar o Google, independentemente da opinião. A assistência opcional apenas revisa o relato escrito pelo cliente, sem publicação automática.
- Os indicadores mostram eventos registrados nos últimos 30 dias. Cliques no Google **não são avaliações publicadas**, e acessos não representam visitantes únicos. Os eventos podem ser afetados por bloqueadores e automação.
- Abrir o WhatsApp não comprova envio. Pix oferece cópia da chave; não gera QR de pagamento a partir de uma chave bruta.
- Exemplos continuam em `/r/barbearia-premium` e nas outras rotas existentes, identificados como fictícios. Seus dados são fixtures locais explícitas, independentes de Supabase, sessão e migrações; esses endereços são reservados. Nenhum cliente real recebe dados de demonstração como fallback. Suas ações ficam desativadas e não entram nas métricas ou mensalidades.
- Placas novas usam `/t/UUID?src=nfc` ou `?src=qr`. A rota consulta o slug atual sem cache permanente. Exportação bloqueada enquanto não houver domínio configurado.

## Validação

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Os testes executam as migrações em PostgreSQL via PGlite, com estruturas mínimas de Auth/Storage emuladas, e verificam RLS entre contas, permissões, metadados forjados, transações, contadores e métricas. Os testes de aplicação verificam login, respostas públicas, dados privados, URLs e falhas de gravação. `npm run rls:verify` executa somente a suíte de banco.

Esses testes não substituem a validação no Supabase hospedado, do envio de e-mail, da IA externa ou da leitura de uma tag NFC física. O scanner por expressões regulares é uma checagem complementar limitada.
