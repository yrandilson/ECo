# 🌿 EcoMonitor v2.0 - Autenticação Local

## ✨ O que mudou?

Antes você precisava configurar OAuth do Manus para testar. **Agora não mais!**

- ✅ Login/Cadastro com email e senha
- ✅ Teste local em 5 minutos
- ✅ Apenas 2 variáveis de ambiente
- ✅ OAuth é opcional

---

## ⚡ Início Rápido

```bash
# 1. Instalar
pnpm install

# 2. Configurar .env (só 2 linhas!)
DATABASE_URL="mysql://root:senha@localhost:3306/ecomonitor"
JWT_SECRET="gere-um-aleatorio"

# 3. Criar banco
pnpm db:push

# 4. Rodar
pnpm dev

# 5. Acessar
http://localhost:3000/register
```

**Pronto!** Crie sua conta e comece a usar.

---

## 📚 Documentação

- **`INICIO_RAPIDO.md`** - Setup em 5 minutos
- **`RESUMO_EXECUTIVO.md`** - Visão geral completa
- **`GUIA_INSTALACAO_ATUALIZADO.md`** - Instalação detalhada
- **`MELHORIAS_IMPLEMENTADAS.md`** - Detalhes técnicos
- **`CHECKLIST_IMPLEMENTACAO.md`** - Próximos passos
- **`VISAO_VISUAL.md`** - Diagramas e fluxos

---

## 🔐 Segurança

- Senhas: bcrypt (10 rounds)
- Sessões: JWT em cookie HTTP-only
- Validação: server-side + client-side
- Email único: sem duplicatas

---

## 📦 Arquivos Importantes

### Novos
- `server/auth-local.ts` - Sistema de autenticação
- `client/src/pages/Login.tsx` - Tela de login
- `client/src/pages/Register.tsx` - Tela de cadastro
- `drizzle/0002_add_local_auth.sql` - Migration

### Modificados
- `server/db.ts` - Funções de usuário
- `server/_core/context.ts` - Suporte dual auth
- `drizzle/schema.ts` - Schema atualizado
- `package.json` - Novas dependências

---

## 🎯 Features

- ✅ Dashboard interativo
- ✅ Mapa em tempo real (Leaflet)
- ✅ Simuladores físicos
- ✅ Machine Learning (previsão)
- ✅ Validação por satélite (NASA)
- ✅ Gamificação (pontos, badges)
- ✅ Alertas por geolocalização
- ✅ **Autenticação local** ← NOVO!

---

## 🐛 Suporte

Problemas? Consulte:
1. `GUIA_INSTALACAO_ATUALIZADO.md`
2. Seção de troubleshooting
3. Abra uma issue no GitHub

---

## 📄 Licença

MIT License

---

**Desenvolvido com ❤️ para proteger o meio ambiente**

**Versão:** 2.0.0 | **Data:** 01/02/2025
