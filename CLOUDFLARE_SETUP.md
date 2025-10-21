# Configuração do Cloudflare Pages

## ⚠️ IMPORTANTE: Configurar Build Settings

O projeto precisa ser buildado antes do deploy. Configure as seguintes opções no **Cloudflare Pages Dashboard**:

### Passo a Passo:

1. **Acesse o Dashboard do Cloudflare Pages**
   - Vá para: https://dash.cloudflare.com/
   - Navegue até: **Workers & Pages** > Seu projeto

2. **Configure as Build Settings**
   - Clique em **Settings** > **Builds & deployments**
   - Ou durante o setup inicial do projeto

3. **Preencha os campos:**

   ```
   Framework preset: Vite
   Build command: npm run build
   Build output directory: dist
   Root directory: / (deixe vazio ou use /)
   ```

4. **Environment variables (opcional)**
   - Não precisa configurar nenhuma variável por enquanto

5. **Salve e faça um novo deploy**
   - Vá em **Deployments** > **View details** do último deploy
   - Clique em **Retry deployment**

## Verificação

Após o deploy, verifique se aparece no log:

```
✓ 2525 modules transformed.
✓ built in Xs
```

Se você ver `No build command specified. Skipping build step.`, a configuração não está correta.

## Arquivos de Configuração Incluídos

- `public/_headers` - Headers HTTP para MIME types corretos
- `public/_redirects` - Suporte para SPA (React Router)
- `wrangler.toml` - Configuração adicional do Cloudflare
- `vite.config.ts` - Configuração do build do Vite

## Problemas Comuns

### Erro: "Failed to load module script... MIME type"
- **Causa**: Servidor retornando `application/octet-stream` em vez de `text/javascript`
- **Solução**: Os arquivos `_headers` e `wrangler.toml` já estão configurados corretamente

### Páginas em branco ou 404 nas rotas
- **Causa**: Falta configuração de SPA
- **Solução**: O arquivo `_redirects` já está configurado

### Build não executa
- **Causa**: Build command não configurado no Cloudflare Pages
- **Solução**: Siga o passo a passo acima
