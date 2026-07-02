# Igreja Bíblica Batista de Pacatuba — App PWA

App oficial da IBB Pacatuba. React + Firebase + GitHub Actions + PWA.

---

## Stack

| Camada       | Tecnologia                          |
|-------------|--------------------------------------|
| Frontend    | React 18                            |
| Banco dados | Firebase Firestore                  |
| Auth        | Firebase Authentication             |
| Fotos       | Firebase Storage (futuro)           |
| Hospedagem  | Firebase Hosting                    |
| CI/CD       | GitHub Actions (deploy automático)  |
| PWA         | Service Worker + Web App Manifest   |

---

## Perfis de acesso

| Perfil       | Permissões                                           |
|-------------|------------------------------------------------------|
| **Membro**  | Ver eventos, ler Bíblia, pedidos de oração, notícias |
| **Líder**   | Tudo do membro + criar eventos, publicar avisos      |
| **Admin**   | Tudo do líder + gerenciar membros e perfis           |

---

## Configuração inicial (passo a passo)

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/ibb-pacatuba.git
cd ibb-pacatuba
npm install
```

### 2. Criar projeto no Firebase

1. Acesse [https://console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **Adicionar projeto** → nome: `ibb-pacatuba`
3. Desative o Google Analytics (opcional) → **Criar projeto**

### 3. Ativar Authentication

1. No menu lateral: **Authentication** → **Começar**
2. Na aba **Sign-in method**, ative **E-mail/senha**
3. Salve

### 4. Criar banco Firestore

1. No menu lateral: **Firestore Database** → **Criar banco de dados**
2. Escolha **Modo de produção** → selecione região `us-east1` ou `southamerica-east1`
3. Clique em **Criar**

### 5. Aplicar as regras de segurança

1. No Firestore → aba **Regras**
2. Copie o conteúdo do arquivo `firestore.rules` e cole no editor
3. Clique em **Publicar**

### 6. Obter as credenciais do app

1. No Firebase: **Configurações do projeto** (ícone de engrenagem) → **Geral**
2. Role até **Seus apps** → clique em **</>** (Adicionar app Web)
3. Nome: `ibb-pwa` → **Registrar app**
4. Copie o objeto `firebaseConfig`

### 7. Configurar variáveis de ambiente locais

```bash
cp .env.example .env.local
```

Abra `.env.local` e preencha com os valores do `firebaseConfig`:

```
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=ibb-pacatuba.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=ibb-pacatuba
REACT_APP_FIREBASE_STORAGE_BUCKET=ibb-pacatuba.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 8. Criar o primeiro admin manualmente

Após subir o app, cadastre-se normalmente pelo app.
Depois, no **Firestore Console**:

1. Vá em **users** → clique no documento do seu usuário
2. Edite o campo `role` de `"membro"` para `"admin"`
3. Salve

A partir daí, você pode promover outros usuários pela **Área de Liderança** dentro do próprio app.

### 9. Testar localmente

```bash
npm start
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## Deploy automático com GitHub Actions

### 1. Instalar Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 2. Inicializar Firebase Hosting no projeto

```bash
firebase init hosting
```

- Use projeto existente: `ibb-pacatuba`
- Public directory: `build`
- Configure as single-page app: **Yes**
- Set up automatic builds with GitHub: **No** (o GitHub Actions já faz isso)

### 3. Gerar token de deploy

```bash
firebase login:ci
```

Copie o token gerado (começa com `1//`).

### 4. Adicionar Secrets no GitHub

No seu repositório GitHub:
**Settings → Secrets and variables → Actions → New repository secret**

Adicione estes secrets (um a um):

| Secret | Valor |
|--------|-------|
| `FIREBASE_TOKEN` | Token gerado no passo anterior |
| `REACT_APP_FIREBASE_API_KEY` | Valor do `.env.local` |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Valor do `.env.local` |
| `REACT_APP_FIREBASE_PROJECT_ID` | Valor do `.env.local` |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Valor do `.env.local` |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Valor do `.env.local` |
| `REACT_APP_FIREBASE_APP_ID` | Valor do `.env.local` |

### 5. Fazer o primeiro push

```bash
git add .
git commit -m "feat: setup inicial IBB Pacatuba app"
git push origin main
```

O GitHub Actions irá automaticamente:
1. Instalar dependências
2. Fazer o build de produção
3. Fazer o deploy no Firebase Hosting

Acompanhe em: **GitHub → Actions → Deploy IBB Pacatuba**

Após o deploy, o app estará em:
`https://ibb-pacatuba.web.app`

---

## Instalar como PWA (celular)

**Android (Chrome):**
1. Acesse o link no Chrome
2. Toque no banner "Adicionar à tela inicial" ou menu → "Instalar app"

**iPhone (Safari):**
1. Acesse o link no Safari
2. Toque em Compartilhar → "Adicionar à Tela de Início"

---

## Adicionar ícones PWA

Coloque os ícones na pasta `public/icons/`:
- `icon-192.png` (192×192 px)
- `icon-512.png` (512×512 px)

Use o logo da igreja nestas dimensões.

---

## Estrutura do projeto

```
src/
├── App.js                  # App principal + todas as telas
├── index.js                # Entrada React + AuthProvider
├── index.css               # Estilos globais
├── contexts/
│   └── AuthContext.js      # Estado de autenticação global
└── services/
    ├── firebase.js         # Inicialização Firebase
    ├── authService.js      # Login, cadastro, logout
    └── firestoreService.js # CRUD de eventos, avisos, orações
```

---

## Coleções do Firestore

| Coleção       | Descrição                              |
|--------------|----------------------------------------|
| `users`      | Perfis de membros (nome, role, etc.)  |
| `events`     | Eventos do calendário                 |
| `news`       | Avisos e comunicados                  |
| `prayers`    | Pedidos de oração                     |
| `devotionals`| Devocionais diários                   |
| `ministries` | Ministérios (futuro: gerenciar pelo app) |

---

## Suporte

Dúvidas sobre o app: fale com o desenvolvedor.
Dúvidas sobre Firebase: [firebase.google.com/docs](https://firebase.google.com/docs)
