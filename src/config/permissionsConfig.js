// src/config/permissionsConfig.js
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
};