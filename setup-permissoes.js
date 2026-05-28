// setup-permissoes.js
// 🚀 Script automático para configurar sistema de permissões (Versão Corrigida)
const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

const log = (msg, color = RESET) => console.log(`${color}${msg}${RESET}`);
const success = (msg) => log(`✅ ${msg}`, GREEN);
const error = (msg) => log(`❌ ${msg}`, RED);
const info = (msg) => log(`ℹ️  ${msg}`, CYAN);

// Função segura para escrever arquivos
const writeFile = (filePath, content, name) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    success('Criado: ' + name);
    return true;
  } catch (e) {
    error('Falha ao criar ' + name + ': ' + e.message);
    return false;
  }
};

// 1. Configuração de permissões
const permissionsConfig = `// src/config/permissionsConfig.js
module.exports = {
  modules: {
    'obras:criar': { roles: ['master', 'admin', 'engenheiro', 'gestor'] },
    'obras:editar': { roles: ['master', 'admin', 'engenheiro', 'gestor'] },
    'obras:excluir': { roles: ['master', 'admin'] },
    'orcamentos:criar': { roles: ['master', 'admin', 'engenheiro', 'gestor'] },
    'orcamentos:editar': { roles: ['master', 'admin', 'engenheiro', 'gestor'] },
    'diario:criar': { roles: ['master', 'admin', 'engenheiro'] },
    'financeiro:notas:lancar': { roles: ['master', 'admin', 'financeiro'] },
    'financeiro:notas:editar': { roles: ['master', 'admin', 'financeiro'] },
    'financeiro:notas:excluir': { roles: ['master', 'admin'] },
    'financeiro:notas:baixar': { roles: ['master', 'admin', 'financeiro'] },
    'suprimentos:fornecedores': { roles: ['master', 'admin', 'gestor'] },
    'suprimentos:pedidos': { roles: ['master', 'admin', 'engenheiro', 'gestor'] },
    'usuarios:gerenciar': { roles: ['master', 'admin'] }
  },
  protectedRoutes: {
    'POST /obras': 'obras:criar',
    'PUT /obras/:id': 'obras:editar',
    'DELETE /obras/:id': 'obras:excluir',
    'POST /orcamentos': 'orcamentos:criar',
    'PUT /orcamentos/:id': 'orcamentos:editar',
    'DELETE /orcamentos/:id': 'orcamentos:editar',
    'POST /diarios-obras': 'diario:criar',
    'PUT /diarios-obras/:id': 'diario:criar',
    'DELETE /diarios-obras/:id': 'diario:criar',
    'POST /notas-fiscais': 'financeiro:notas:lancar',
    'PUT /notas-fiscais/:id': 'financeiro:notas:editar',
    'DELETE /notas-fiscais/:id': 'financeiro:notas:excluir',
    'POST /notas-fiscais/:id/baixa': 'financeiro:notas:baixar',
    'POST /fornecedores': 'suprimentos:fornecedores',
    'PUT /fornecedores/:id': 'suprimentos:fornecedores',
    'DELETE /fornecedores/:id': 'suprimentos:fornecedores',
    'POST /pedidos-compra': 'suprimentos:pedidos',
    'PUT /pedidos-compra/:id': 'suprimentos:pedidos',
    'DELETE /pedidos-compra/:id': 'suprimentos:pedidos',
    'POST /users': 'usuarios:gerenciar',
    'PUT /users/:id': 'usuarios:gerenciar',
    'DELETE /users/:id': 'usuarios:gerenciar',
    'POST /users/:id/permissoes': 'usuarios:gerenciar',
    'POST /users/:id/obras': 'usuarios:gerenciar'
  },
  checkAccess: function(userRole, userPermissions, requiredPermission) {
    if (userRole === 'master') return true;
    const config = module.exports.modules[requiredPermission];
    if (!config) return false;
    if (config.roles.includes(userRole)) return true;
    if (Array.isArray(userPermissions) && userPermissions.includes(requiredPermission)) return true;
    return false;
  }
};`;

// 2. Middleware de verificação
const checkPermissionMiddleware = `// src/middleware/checkPermission.js
const permissionsConfig = require('../config/permissionsConfig');

module.exports = async function(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

    const routePath = req.route ? req.route.path : req.path;
    const routeKey = req.method + ' ' + routePath;
    const requiredPermission = permissionsConfig.protectedRoutes[routeKey];
    if (!requiredPermission) return next();

    const supabase = req.app.get('supabase');
    if (!supabase) return next();

    const resultUser = await supabase.from('usuarios').select('role').eq('id', userId).single();
    const user = resultUser.data;
    const userError = resultUser.error;

    if (userError || !user) return res.status(401).json({ error: 'Usuário não encontrado' });

    const resultPerms = await supabase.from('permissoes_usuario').select('tela').eq('usuario_id', userId);
    const perms = resultPerms.data;
    const userPermissions = perms ? perms.map(p => p.tela) : [];
    
    const hasAccess = permissionsConfig.checkAccess(user.role, userPermissions, requiredPermission);

    if (!hasAccess) {
      console.warn('[🚫] Acesso negado: usuário ' + userId + ' tentou acessar ' + routeKey);
      return res.status(403).json({ error: 'Acesso negado: permissão insuficiente' });
    }

    next();
  } catch (err) {
    console.error('Erro no middleware de permissão:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};`;

// ========== EXECUÇÃO ==========
console.log('\n' + '='.repeat(60));
log('🚀 CONFIGURADOR AUTOMÁTICO DE PERMISSÕES', CYAN);
console.log('='.repeat(60) + '\n');

const root = process.cwd();

// Criar pastas
['src/config', 'src/middleware'].forEach(dir => {
  if (!fs.existsSync(path.join(root, dir))) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
    success('Pasta criada: ' + dir);
  }
});

// Criar arquivos
writeFile(path.join(root, 'src/config/permissionsConfig.js'), permissionsConfig, 'permissionsConfig.js');
writeFile(path.join(root, 'src/middleware/checkPermission.js'), checkPermissionMiddleware, 'checkPermission.js');

// Modificar server.js com segurança
const serverPath = path.join(root, 'server.js');
if (fs.existsSync(serverPath)) {
  let content = fs.readFileSync(serverPath, 'utf8');
  let changed = false;

  // Backup
  const backup = serverPath + '.backup.' + Date.now();
  fs.copyFileSync(serverPath, backup);
  success('Backup salvo: ' + path.basename(backup));

  // 1. Inserir import do middleware
  if (!content.includes("require('./src/middleware/checkPermission')")) {
    const insertPos = content.lastIndexOf("require('");
    if (insertPos !== -1) {
      const endLine = content.indexOf('\n', insertPos);
      const newImport = "\n// 🔐 Middleware de permissões\nconst checkPermission = require('./src/middleware/checkPermission');\n";
      content = content.slice(0, endLine + 1) + newImport + content.slice(endLine + 1);
      changed = true;
      success('Import do middleware adicionado');
    }
  }

  // 2. Disponibilizar supabase para o middleware
  if (!content.includes("app.set('supabase', supabase)")) {
    const insertPos = content.indexOf('const supabase = createClient(');
    if (insertPos !== -1) {
      const endLine = content.indexOf(';', insertPos);
      const newConfig = "\n// 🔐 Disponibiliza supabase para verificação de permissões\napp.set('supabase', supabase);\n";
      content = content.slice(0, endLine + 1) + newConfig + content.slice(endLine + 1);
      changed = true;
      success('Configuração do supabase para middleware adicionada');
    }
  }

  // 3. Aplicar middleware em rotas críticas (exemplo seguro)
  const routesToProtect = [
    { from: "app.post('/notas-fiscais', upload.fields(", to: "app.post('/notas-fiscais', checkPermission, upload.fields(" },
    { from: "app.post('/obras', async", to: "app.post('/obras', checkPermission, async" },
    { from: "app.post('/users', async", to: "app.post('/users', checkPermission, async" },
    { from: "app.post('/pedidos-compra', async", to: "app.post('/pedidos-compra', checkPermission, async" }
  ];

  routesToProtect.forEach(r => {
    if (content.includes(r.from)) {
      content = content.split(r.from).join(r.to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(serverPath, content, 'utf8');
    success('server.js atualizado com sucesso!');
  } else {
    info('server.js já está configurado ou não encontrou os padrões esperados (seguro)');
  }
} else {
  error('server.js não encontrado na pasta atual!');
}

console.log('\n' + '='.repeat(60));
log('✅ CONFIGURAÇÃO CONCLUÍDA!', GREEN);
console.log('='.repeat(60) + '\n');
log('📌 PRÓXIMOS PASSOS:', CYAN);
console.log('1. Reinicie o backend: pare (Ctrl+C) e execute node server.js');
console.log('2. No login do frontend, salve as permissões no localStorage:');
console.log('   localStorage.setItem("user", JSON.stringify({');
console.log('     ...dadosUsuario,');
console.log('     permissions: ["financeiro:notas:lancar", "obras:criar"],');
console.log('     authorizedObras: ["1", "5"]');
console.log('   }));');
console.log('\n💡 Dica: Edite src/config/permissionsConfig.js para ajustar regras.');
console.log('='.repeat(60) + '\n');