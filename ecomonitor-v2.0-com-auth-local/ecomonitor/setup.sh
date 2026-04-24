#!/bin/bash

# =====================================================
# EcoMonitor - Script de Setup Rápido
# =====================================================

set -e  # Parar em caso de erro

echo "🌍 EcoMonitor - Configuração Inicial"
echo "===================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para printar com cor
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 1. Verificar Node.js
echo "1. Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_status "Node.js instalado: $NODE_VERSION"
else
    print_error "Node.js não encontrado. Instale Node.js 18+ primeiro."
    exit 1
fi

# 2. Verificar/Instalar pnpm
echo ""
echo "2. Verificando pnpm..."
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm -v)
    print_status "pnpm instalado: $PNPM_VERSION"
else
    print_warning "pnpm não encontrado. Instalando..."
    npm install -g pnpm
    print_status "pnpm instalado com sucesso!"
fi

# 3. Verificar MySQL
echo ""
echo "3. Verificando MySQL..."
if command -v mysql &> /dev/null; then
    print_status "MySQL instalado"
else
    print_warning "MySQL não encontrado. Você precisará instalar MySQL 8.0+"
fi

# 4. Criar .env.local se não existir
echo ""
echo "4. Configurando variáveis de ambiente..."
if [ ! -f .env.local ]; then
    print_warning ".env.local não encontrado. Criando a partir do .env.example..."
    cp .env.example .env.local
    print_status ".env.local criado!"
    echo ""
    print_warning "IMPORTANTE: Edite o arquivo .env.local e configure:"
    echo "   - DATABASE_URL"
    echo "   - JWT_SECRET (gere um aleatório)"
    echo "   - OPENWEATHER_API_KEY (registre em openweathermap.org)"
    echo "   - NASA_FIRMS_API_KEY (registre em firms.modaps.eosdis.nasa.gov)"
else
    print_status ".env.local já existe"
fi

# 5. Instalar dependências
echo ""
echo "5. Instalando dependências..."
pnpm install
print_status "Dependências instaladas!"

# 6. Verificar banco de dados
echo ""
echo "6. Configurando banco de dados..."
read -p "Deseja executar as migrações do banco agora? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    print_warning "Executando migrações..."
    pnpm db:push
    print_status "Migrações concluídas!"
else
    print_warning "Lembre-se de executar 'pnpm db:push' antes de iniciar o servidor"
fi

# 7. Resumo
echo ""
echo "============================================"
echo "✅ Configuração Inicial Concluída!"
echo "============================================"
echo ""
echo "📋 Próximos Passos:"
echo ""
echo "1. Configure as variáveis em .env.local:"
echo "   ${YELLOW}nano .env.local${NC}"
echo ""
echo "2. Execute as migrações (se ainda não fez):"
echo "   ${YELLOW}pnpm db:push${NC}"
echo ""
echo "3. Inicie o servidor de desenvolvimento:"
echo "   ${YELLOW}pnpm dev${NC}"
echo ""
echo "4. Acesse a aplicação:"
echo "   ${YELLOW}http://localhost:3000${NC}"
echo ""
echo "============================================"
echo ""
echo "📚 Documentação Adicional:"
echo "   - README_INSTALACAO.md - Guia de instalação completo"
echo "   - GUIA_IMPLEMENTACAO.md - Guia de melhorias"
echo "   - ANALISE_E_MELHORIAS.md - Análise completa"
echo "   - API_REFERENCE.md - Referência da API"
echo ""
echo "🆘 Suporte:"
echo "   - Issues no GitHub"
echo "   - Documentação em /docs"
echo ""
echo "🌍 Desenvolvido com ❤️ para proteger o ambiente"
echo ""
