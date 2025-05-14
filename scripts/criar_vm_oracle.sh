#!/bin/bash

# Script para criar automaticamente uma VM no Oracle Cloud Infrastructure (OCI)
# para hospedar o Mistral AI do CarlosDev

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== Criação de VM Oracle Cloud para CarlosDev Mistral =====${NC}"
echo "Este script criará uma VM otimizada para rodar o Mistral AI no Oracle Cloud"
echo ""

# Verifica se OCI CLI está instalado
if ! command -v oci &> /dev/null; then
    echo -e "${RED}OCI CLI não encontrado. Instalando...${NC}"
    
    # Instalar OCI CLI
    bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"
    
    # Adicionar ao PATH se necessário
    if ! command -v oci &> /dev/null; then
        echo -e "${RED}Falha ao instalar OCI CLI. Por favor, instale manualmente:${NC}"
        echo "https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm"
        exit 1
    fi
fi

# Criar diretório para configuração OCI se não existir
mkdir -p ~/.oci

# Criar o arquivo de configuração
cat > ~/.oci/config << EOL
[DEFAULT]
user=ocid1.user.oc1..aaaaaaaabxv4rfyakqntqcfyqcayrqkvsocfy3okavpsraxw7gbwbqjashaa
fingerprint=bb:e7:6a:8f:c6:55:06:69:a7:59:1c:d8:ce:f0:dc:7d
tenancy=ocid1.tenancy.oc1..aaaaaaaanci425f6sc4bmw6tmsntfhazmbclldmtinroawnzttkixm54e7qq
region=us-ashburn-1
key_file=~/.oci/oci_api_key.pem
EOL

# Criar arquivo da chave privada
echo -e "${YELLOW}Você precisa fornecer sua chave privada correspondente à chave pública configurada.${NC}"
echo "A chave privada deve ser salva em ~/.oci/oci_api_key.pem"
echo -e "${YELLOW}Por favor, configure manualmente a chave privada antes de continuar.${NC}"
echo "Pressione Enter quando estiver pronto..."
read -r

# Testar conexão com OCI
echo -e "${GREEN}Testando conexão com Oracle Cloud...${NC}"
if ! oci iam region list > /dev/null; then
    echo -e "${RED}Erro ao conectar ao Oracle Cloud. Verifique suas credenciais e tente novamente.${NC}"
    exit 1
fi

echo -e "${GREEN}Conexão com Oracle Cloud estabelecida com sucesso!${NC}"

# Obter os OCIDs necessários
echo -e "${GREEN}Obtendo informações do compartimento...${NC}"
TENANCY_OCID="ocid1.tenancy.oc1..aaaaaaaanci425f6sc4bmw6tmsntfhazmbclldmtinroawnzttkixm54e7qq"

# Listar compartimentos e deixar usuário escolher
echo "Listando compartimentos disponíveis:"
oci iam compartment list --compartment-id "$TENANCY_OCID" --all

echo -e "${YELLOW}Digite o OCID do compartimento onde deseja criar a VM:${NC}"
read -r COMPARTMENT_OCID

# Obter lista de shapes disponíveis
echo -e "${GREEN}Verificando shapes disponíveis...${NC}"
oci compute shape list --compartment-id "$COMPARTMENT_OCID" --all

# Configuração da VM
VM_NAME="CarlosDev-Mistral"
VM_SHAPE="VM.Standard.E4.Flex" # Tipo de VM recomendado
OCPUS=4                        # Número de OCPUs
MEMORY=24                      # GB de memória
BOOT_VOLUME_SIZE=100           # GB de armazenamento

echo -e "${YELLOW}Deseja usar a configuração recomendada?${NC}"
echo "Nome: $VM_NAME"
echo "Shape: $VM_SHAPE"
echo "OCPUs: $OCPUS"
echo "Memória: $MEMORY GB"
echo "Armazenamento: $BOOT_VOLUME_SIZE GB"
echo "Digite 'sim' para confirmar ou 'não' para personalizar:"
read -r CONFIRMA

if [[ "$CONFIRMA" != "sim" ]]; then
    echo "Digite o nome da VM:"
    read -r VM_NAME
    
    echo "Digite o shape (ex: VM.Standard.E4.Flex):"
    read -r VM_SHAPE
    
    echo "Digite o número de OCPUs:"
    read -r OCPUS
    
    echo "Digite a quantidade de memória (GB):"
    read -r MEMORY
    
    echo "Digite o tamanho do volume de boot (GB):"
    read -r BOOT_VOLUME_SIZE
fi

# Obter a lista de imagens disponíveis (Ubuntu 22.04 ou Oracle Linux 8)
echo -e "${GREEN}Buscando imagens disponíveis...${NC}"
oci compute image list --compartment-id "$COMPARTMENT_OCID" --operating-system "Canonical Ubuntu" --operating-system-version "22.04" --all

echo -e "${YELLOW}Digite o OCID da imagem que deseja usar:${NC}"
read -r IMAGE_OCID

# Obter as VCNs disponíveis
echo -e "${GREEN}Buscando Virtual Cloud Networks (VCNs)...${NC}"
oci network vcn list --compartment-id "$COMPARTMENT_OCID" --all

echo -e "${YELLOW}Digite o OCID da VCN que deseja usar:${NC}"
read -r VCN_OCID

# Obter as subnets disponíveis
echo -e "${GREEN}Buscando subnets disponíveis...${NC}"
oci network subnet list --compartment-id "$COMPARTMENT_OCID" --vcn-id "$VCN_OCID" --all

echo -e "${YELLOW}Digite o OCID da subnet que deseja usar:${NC}"
read -r SUBNET_OCID

# Gerar par de chaves SSH se necessário
if [ ! -f ~/.ssh/id_rsa_oracle ]; then
    echo -e "${GREEN}Gerando par de chaves SSH para acesso à VM...${NC}"
    ssh-keygen -t rsa -b 2048 -f ~/.ssh/id_rsa_oracle -N ""
fi

SSH_PUBLIC_KEY=$(cat ~/.ssh/id_rsa_oracle.pub)

# Criar a instância
echo -e "${GREEN}Criando instância VM no Oracle Cloud...${NC}"
echo "Essa operação pode levar alguns minutos..."

INSTANCE_DETAILS=$(oci compute instance launch \
    --availability-domain "$(oci iam availability-domain list --compartment-id "$COMPARTMENT_OCID" | jq -r '.data[0].name')" \
    --compartment-id "$COMPARTMENT_OCID" \
    --shape "$VM_SHAPE" \
    --shape-config "{\"ocpus\": $OCPUS, \"memoryInGBs\": $MEMORY}" \
    --display-name "$VM_NAME" \
    --image-id "$IMAGE_OCID" \
    --subnet-id "$SUBNET_OCID" \
    --boot-volume-size-in-gbs "$BOOT_VOLUME_SIZE" \
    --ssh-authorized-keys-file ~/.ssh/id_rsa_oracle.pub \
    --wait-for-state RUNNING)

# Extrair informações da instância
INSTANCE_ID=$(echo "$INSTANCE_DETAILS" | jq -r '.data.id')
INSTANCE_STATE=$(echo "$INSTANCE_DETAILS" | jq -r '.data."lifecycle-state"')

if [ "$INSTANCE_STATE" == "RUNNING" ]; then
    echo -e "${GREEN}VM criada com sucesso!${NC}"
    
    # Obter IP público
    PUBLIC_IP=$(oci compute instance list-vnics --instance-id "$INSTANCE_ID" | jq -r '.data[0]."public-ip"')
    
    # Configurar regras de firewall para permitir acesso às portas necessárias
    echo -e "${GREEN}Configurando regras de firewall...${NC}"
    
    # Obter o Security List ID
    SECURITY_LIST_ID=$(oci network subnet get --subnet-id "$SUBNET_OCID" | jq -r '.data."security-list-ids"[0]')
    
    # Adicionar regras para as portas necessárias (22, 80, 443, 8000)
    oci network security-list update --security-list-id "$SECURITY_LIST_ID" --ingress-security-rules '[
        {
            "source": "0.0.0.0/0",
            "protocol": "6", 
            "isStateless": false,
            "tcpOptions": {
                "destinationPortRange": {
                    "max": 22,
                    "min": 22
                }
            },
            "description": "SSH"
        },
        {
            "source": "0.0.0.0/0",
            "protocol": "6", 
            "isStateless": false,
            "tcpOptions": {
                "destinationPortRange": {
                    "max": 80,
                    "min": 80
                }
            },
            "description": "HTTP"
        },
        {
            "source": "0.0.0.0/0",
            "protocol": "6", 
            "isStateless": false,
            "tcpOptions": {
                "destinationPortRange": {
                    "max": 443,
                    "min": 443
                }
            },
            "description": "HTTPS"
        },
        {
            "source": "0.0.0.0/0",
            "protocol": "6", 
            "isStateless": false,
            "tcpOptions": {
                "destinationPortRange": {
                    "max": 8000,
                    "min": 8000
                }
            },
            "description": "Mistral API"
        }
    ]' --force
    
    echo -e "${GREEN}===== VM Oracle Cloud Criada com Sucesso! =====${NC}"
    echo ""
    echo "Informações da VM:"
    echo "Nome: $VM_NAME"
    echo "ID: $INSTANCE_ID"
    echo "IP Público: $PUBLIC_IP"
    echo "Estado: $INSTANCE_STATE"
    
    # Pergunta se o usuário deseja configurar automaticamente a VM
    echo ""
    echo -e "${YELLOW}Deseja configurar automaticamente a VM? (sim/não)${NC}"
    echo "Isso irá:"
    echo "1. Transferir os scripts de configuração para a VM"
    echo "2. Instalar e configurar o Docker, Cloudflare Tunnel e Mistral AI"
    echo "3. Deixar o sistema pronto para uso"
    read -r CONFIG_AUTO
    
    if [[ "$CONFIG_AUTO" == "sim" ]]; then
        echo -e "${GREEN}Iniciando configuração automática...${NC}"
        
        # Esperar a VM estar completamente inicializada
        echo "Aguardando VM inicializar completamente (30 segundos)..."
        sleep 30
        
        # Criar diretório temporário para os arquivos
        TEMP_DIR=$(mktemp -d)
        
        # Copiar os scripts necessários para o diretório temporário
        echo "Preparando arquivos para transferência..."
        cp scripts/oracle_setup.sh "$TEMP_DIR/"
        cp scripts/docker-compose.yml "$TEMP_DIR/"
        cp scripts/cloudflared-config.yml "$TEMP_DIR/"
        cp scripts/install-cloudflared-service.sh "$TEMP_DIR/"
        mkdir -p "$TEMP_DIR/api"
        cp scripts/api/package.json "$TEMP_DIR/api/"
        cp scripts/api/index.js "$TEMP_DIR/api/"
        cp scripts/api/.env.example "$TEMP_DIR/api/.env"
        
        # Criar um script para executar automaticamente todos os passos na VM
        cat > "$TEMP_DIR/setup_completo.sh" << 'EOFSETUP'
#!/bin/bash

# Script de configuração completa para VM Oracle Cloud - CarlosDev
# Este script executa automaticamente todos os passos necessários

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== Configuração Automatizada CarlosDev =====${NC}"

# 1. Executar script principal de configuração
echo -e "${GREEN}Executando configuração principal...${NC}"
sudo bash oracle_setup.sh

# 2. Criar diretório e transferir arquivos
echo -e "${GREEN}Configurando diretórios...${NC}"
sudo mkdir -p /opt/carlosdev-mistral
sudo mkdir -p /opt/carlosdev-mistral/api
sudo cp docker-compose.yml /opt/carlosdev-mistral/
sudo cp -r api/* /opt/carlosdev-mistral/api/

# 3. Configurar Cloudflare Tunnel
echo -e "${YELLOW}Deseja configurar o Cloudflare Tunnel agora? (sim/não)${NC}"
read -r CONFIG_TUNNEL

if [[ "$CONFIG_TUNNEL" == "sim" ]]; then
    echo -e "${GREEN}Iniciando login no Cloudflare...${NC}"
    echo -e "${YELLOW}Siga as instruções no navegador que será aberto...${NC}"
    cloudflared tunnel login
    
    # Criar o túnel
    echo -e "${GREEN}Criando túnel Cloudflare...${NC}"
    TUNNEL_ID=$(cloudflared tunnel create mistral-carlosdev | grep -oP 'ID: \K[a-z0-9-]+')
    
    if [ -n "$TUNNEL_ID" ]; then
        echo -e "${GREEN}Túnel criado com sucesso. ID: $TUNNEL_ID${NC}"
        
        # Configurar arquivo de configuração do túnel
        sudo mkdir -p /etc/cloudflared
        sudo cp cloudflared-config.yml /etc/cloudflared/config.yml
        
        # Substituir o ID do túnel no arquivo
        sudo sed -i "s/YOUR_TUNNEL_ID/$TUNNEL_ID/g" /etc/cloudflared/config.yml
        
        # Mover o arquivo de credenciais
        sudo cp ~/.cloudflared/$TUNNEL_ID.json /etc/cloudflared/
        
        # Instalar como serviço
        echo -e "${GREEN}Instalando Cloudflare Tunnel como serviço...${NC}"
        sudo cloudflared service install
        
        # Iniciar o serviço
        sudo systemctl enable cloudflared
        sudo systemctl start cloudflared
        
        echo -e "${GREEN}Cloudflare Tunnel configurado com sucesso!${NC}"
        echo "Seu túnel ID é: $TUNNEL_ID"
        echo "Acesse o dashboard do Cloudflare para configurar os domínios"
    else
        echo -e "${RED}Falha ao criar túnel. Por favor, configure manualmente.${NC}"
    fi
else
    echo "Você pode configurar o Cloudflare Tunnel posteriormente."
fi

# 4. Iniciar os serviços Docker
echo -e "${GREEN}Iniciando serviços Docker...${NC}"
cd /opt/carlosdev-mistral
sudo docker-compose up -d

echo -e "${GREEN}===== Configuração Completa! =====${NC}"
echo ""
echo "Mistral API está rodando em: http://localhost:8000"
echo "Verifique o status com: sudo docker-compose ps"
echo ""
if [[ "$CONFIG_TUNNEL" == "sim" && -n "$TUNNEL_ID" ]]; then
    echo "Acesse o Cloudflare Zero Trust Dashboard para configurar:"
    echo "- mistral.SEU-DOMINIO.com -> http://localhost:8000"
    echo ""
    echo "Após configurar, use este endereço nas configurações do CarlosDev"
fi
EOFSETUP
        
        # Dar permissão de execução ao script
        chmod +x "$TEMP_DIR/setup_completo.sh"
        
        # Determinar o usuário da VM (ubuntu ou opc, dependendo da imagem)
        SSH_USER="ubuntu"  # Ubuntu é o padrão
        
        # Transferir arquivos para a VM
        echo "Transferindo arquivos para a VM..."
        scp -i ~/.ssh/id_rsa_oracle -o StrictHostKeyChecking=no -r "$TEMP_DIR"/* "$SSH_USER@$PUBLIC_IP:~/"
        
        # Executar o script de configuração na VM
        echo -e "${GREEN}Iniciando configuração remota da VM...${NC}"
        echo "Este processo pode levar alguns minutos. Por favor, aguarde..."
        
        ssh -i ~/.ssh/id_rsa_oracle -o StrictHostKeyChecking=no "$SSH_USER@$PUBLIC_IP" "chmod +x setup_completo.sh && ./setup_completo.sh"
        
        # Limpar o diretório temporário
        rm -rf "$TEMP_DIR"
        
        echo -e "${GREEN}===== Configuração Automática Concluída! =====${NC}"
        echo ""
        echo "Sua VM Oracle Cloud foi configurada com sucesso!"
        echo "IP da VM: $PUBLIC_IP"
        echo ""
        echo "Para conectar via SSH:"
        echo "ssh -i ~/.ssh/id_rsa_oracle $SSH_USER@$PUBLIC_IP"
        echo ""
        echo "Acesse o CarlosDev e configure o Mistral para usar sua VM através do Cloudflare Tunnel"
    else
        echo ""
        echo "Para conectar via SSH:"
        echo "ssh -i ~/.ssh/id_rsa_oracle ubuntu@$PUBLIC_IP"
        echo ""
        echo "Próximos passos:"
        echo "1. Copie o script oracle_setup.sh para a VM:"
        echo "   scp -i ~/.ssh/id_rsa_oracle scripts/oracle_setup.sh ubuntu@$PUBLIC_IP:~/"
        echo ""
        echo "2. Conecte-se à VM via SSH e execute o script de setup:"
        echo "   ssh -i ~/.ssh/id_rsa_oracle ubuntu@$PUBLIC_IP"
        echo "   sudo bash oracle_setup.sh"
        echo ""
        echo "3. Configure o Cloudflare Tunnel seguindo o guia CLOUDFLARE_TUNNEL.md"
        echo ""
        echo "4. No CarlosDev, configure a URL do Mistral Cloud para apontar para sua instância"
    fi
    
    echo -e "${GREEN}===== Processo Concluído =====${NC}"
else
    echo -e "${RED}Erro ao criar VM. Estado: $INSTANCE_STATE${NC}"
    echo "Detalhes:"
    echo "$INSTANCE_DETAILS" | jq '.'
    exit 1
fi